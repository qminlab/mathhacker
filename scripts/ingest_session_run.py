#!/usr/bin/env python3
"""
scripts/ingest_session_run.py

ingest_sessions 테이블의 특정 세션(id)을 기준으로:

1) Supabase에서 ingest_session row 읽기
2) Storage 'uploads' 버킷에서 original.pdf 다운로드
3) 기존 파이프라인 순서대로 실행
   - ocr_import.py
   - extract_problems_from_json.py
   - crop_problems_and_add_image_file.py
   - import_problems_to_supabase.py
   - upload_problem_images_to_storage.py

사용 예시:

  (.venv) python3 scripts/ingest_session_run.py \
    --session-id 2 \
    --source "내 문제집 SET 01" \
    --unit "지수함수와 로그함수" \
    --chapter "핵심문제" \
    --source-type "pdf"
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional

import requests
from supabase import create_client, Client
from dotenv import load_dotenv


# ----------------------------------------
# 공통 설정
# ----------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"

print("[INFO] BASE_DIR:", BASE_DIR)
print("[INFO] .env path:", env_path)
load_dotenv(env_path)


# ----------------------------------------
# Supabase 클라이언트 / 헬퍼
# ----------------------------------------
def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("[ERROR] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정해주세요.")
        sys.exit(1)
    return create_client(url, key)


def fetch_ingest_session(client: Client, session_id: int) -> Dict[str, Any]:
    resp = (
        client.table("ingest_sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
    )

    data = getattr(resp, "data", None)
    if not data:
        print(f"[ERROR] ingest_sessions id={session_id} 를 찾을 수 없습니다. resp={resp}")
        sys.exit(1)

    print(f"[INFO] ingest_session: {data}")
    return data


# ----------------------------------------
# Storage에서 PDF 다운로드 (uploads 버킷)
# ----------------------------------------
def download_original_pdf(storage_path: str, dest_path: Path) -> None:
    """
    Storage 'uploads' 버킷에서 원본 PDF를 로컬로 다운로드.
    - storage_path 예: "sessions/2/original.pdf"
    - dest_path 예: BASE_DIR/work/ingest/session_2/original.pdf
    """

    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        print("[ERROR] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 누락")
        sys.exit(1)

    bucket = "uploads"
    url = f"{supabase_url}/storage/v1/object/{bucket}/{storage_path}"

    print(f"[INFO] Storage에서 다운로드: {url}")
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }

    resp = requests.get(url, headers=headers)
    if not resp.ok:
        print(f"[ERROR] PDF 다운로드 실패: status={resp.status_code}, text={resp.text[:200]}")
        sys.exit(1)

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dest_path, "wb") as f:
        f.write(resp.content)

    print(f"[OK] PDF 다운로드 완료 → {dest_path}")


# ----------------------------------------
# subprocess로 기존 스크립트 실행 헬퍼
# ----------------------------------------
def run_cmd(args: list[str]) -> None:
    """
    다른 스크립트들을 순서대로 호출할 때 사용.
    에러 발생 시 바로 종료(check=True).
    """
    print("[RUN]", " ".join(args))
    subprocess.run(args, check=True)


# ----------------------------------------
# 메인 파이프라인
# ----------------------------------------
def run_pipeline_for_session(
    session_id: int,
    source: str,
    unit: Optional[str],
    chapter: Optional[str],
    source_type: str,
) -> None:
    supabase = get_supabase_client()

    # 1) ingest_sessions 에서 row 가져오기
    session = fetch_ingest_session(supabase, session_id)
    storage_path = session.get("original_file_path")
    if not storage_path:
        print(f"[ERROR] ingest_sessions.id={session_id} 에 original_file_path 가 없습니다.")
        sys.exit(1)

    # 2) Storage → 로컬 PDF 다운로드
    local_dir = BASE_DIR / "work" / "ingest" / f"session_{session_id}"
    local_pdf = local_dir / "original.pdf"

    download_original_pdf(storage_path, local_pdf)

    # ----------------------------------------
    # 3) 기존 파이프라인 순서대로 실행
    # ----------------------------------------

    # 3-1) Mathpix OCR: pdf -> mathpix_page1.json + page_001.png ...
    ocr_script = BASE_DIR / "scripts" / "ocr_import.py"
    run_cmd(["python3", str(ocr_script), str(local_pdf)])

    # local_pdf: /.../session_2/original.pdf
    mathpix_json = local_pdf.with_suffix(".mathpix_page1.json")

    # 3-2) mathpix_json -> .problems.json
    extract_script = BASE_DIR / "scripts" / "extract_problems_from_json.py"
    run_cmd(["python3", str(extract_script), str(mathpix_json)])

    problems_json = local_pdf.with_suffix(".mathpix_page1.problems.json")

    # 3-3) 페이지 이미지 + problems.json -> 문제별 crop + with_images.json
    crop_script = BASE_DIR / "scripts" / "crop_problems_and_add_image_file.py"

    # ocr_import.py 에서 생성한 페이지 이미지는
    #   local_pdf.with_suffix("") 디렉토리 안에 page_001.png 로 생성된다고 가정
    page_image_dir = local_pdf.with_suffix("")      # .../session_2/original/
    page_image = page_image_dir / "page_001.png"    # 일단 1페이지 기준

    out_dir = local_dir / "cropped"
    problems_with_images = local_pdf.with_suffix(".mathpix_page1.problems.with_images.json")

    run_cmd([
        "python3", str(crop_script),
        str(page_image),
        str(problems_json),
        "--out-dir", str(out_dir),
        "--out-json", str(problems_with_images),
    ])

    # 3-4) with_images.json -> workbooks + problems insert
    import_script = BASE_DIR / "scripts" / "import_problems_to_supabase.py"

    import_args = [
        "python3", str(import_script),
        str(problems_with_images),
        "--source", source,
        "--source-type", source_type,
    ]
    if unit:
        import_args.extend(["--unit", unit])
    if chapter:
        import_args.extend(["--chapter", chapter])
    # 업로드한 사용자를 문제집 주인으로 (RLS상 본인만 보게 됨)
    if session.get("user_id"):
        import_args.extend(["--owner-id", str(session["user_id"])])

    run_cmd(import_args)

    # 3-5) problems.extra.image_file 기준으로 Storage(problems 버킷)에 업로드
    upload_script = BASE_DIR / "scripts" / "upload_problem_images_to_storage.py"
    run_cmd(["python3", str(upload_script)])

    print("[DONE] ingest_session_run 파이프라인 완료.")


# ----------------------------------------
# CLI 진입점
# ----------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="ingest_sessions의 특정 세션을 기준으로 전체 파이프라인 실행"
    )
    parser.add_argument(
        "--session-id",
        type=int,
        required=True,
        help="ingest_sessions.id 값 (예: 2)",
    )
    parser.add_argument(
        "--source",
        required=True,
        help='예: "내 문제집 SET 01" 같은 교재/세트 이름',
    )
    parser.add_argument(
        "--unit",
        default=None,
        help='예: "지수함수와 로그함수" (옵션)',
    )
    parser.add_argument(
        "--chapter",
        default=None,
        help='예: "핵심문제" (옵션)',
    )
    parser.add_argument(
        "--source-type",
        default="pdf",
        help='예: "pdf" | "images" (기본값: pdf)',
    )

    args = parser.parse_args()

    run_pipeline_for_session(
        session_id=args.session_id,
        source=args.source,
        unit=args.unit,
        chapter=args.chapter,
        source_type=args.source_type,
    )


if __name__ == "__main__":
    main()

