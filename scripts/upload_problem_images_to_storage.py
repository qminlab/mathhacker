# scripts/upload_problem_images_to_storage.py

import os
import sys
from pathlib import Path
from typing import Any, Dict, List

from supabase import create_client, Client
from dotenv import load_dotenv

# 프로젝트 루트 기준
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"

print("ENV PATH:", env_path)
load_dotenv(env_path)


def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("[ERROR] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정해주세요.")
        sys.exit(1)
    return create_client(url, key)


def build_public_url(bucket: str, storage_path: str) -> str:
    """
    get_public_url() 대신 안전하게 직접 URL 구성.
    버킷이 public인 전제.
    """
    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    # https://xxxxx.supabase.co/storage/v1/object/public/{bucket}/{path}
    return f"{base}/storage/v1/object/public/{bucket}/{storage_path}"


def main():
    supabase = get_supabase_client()

    # 1) 아직 full_image_url 이 NULL인 문제들 가져오기
    #    extra 안에 image_file 이 있다고 가정. (없으면 그냥 스킵)
    resp = (
        supabase.table("problems")
        .select("id, extra, workbook_id, source")
        .is_("full_image_url", None)
        .execute()
    )

    problems: List[Dict[str, Any]] = resp.data or []

    if not problems:
        print("[INFO] 업로드할 이미지가 없습니다. (full_image_url이 모두 채워져 있음)")
        return

    print(f"[INFO] 업로드 대상 문제 수: {len(problems)}")

    bucket_name = "problems"  # Supabase Storage에서 만든 버킷 이름

    for p in problems:
        pid = p["id"]
        extra = p.get("extra") or {}
        image_file = extra.get("image_file")

        if not image_file:
            print(f"[WARN] problem {pid} 에 image_file 정보가 없습니다. 스킵.")
            continue

        # 로컬 이미지 실제 경로
        # image_file 값이 "work/xxx.png" 같이 전체 상대경로면 그대로 쓰고,
        # 그냥 파일명만 있다면 work 밑이라고 가정할 수도 있음.
        local_path = BASE_DIR / image_file
        if not local_path.exists():
            # 혹시 work/ 를 앞에 붙여야 하는 경우까지 한 번 더 시도
            alt_path = BASE_DIR / "work" / image_file
            if alt_path.exists():
                local_path = alt_path
            else:
                print(f"[WARN] 로컬 이미지 파일을 찾을 수 없습니다: {local_path}")
                continue

        workbook_id = p.get("workbook_id")
        file_name = os.path.basename(str(local_path))

        # Storage 안에서의 경로 설계
        storage_path = f"workbooks/{workbook_id}/{file_name}"

        print(f"[INFO] 업로드: {local_path} -> {bucket_name}/{storage_path}")

        with open(local_path, "rb") as f:
            file_obj = f.read()

        storage = supabase.storage.from_(bucket_name)

        # supabase-py 문서 기준: file, path, file_options
        upload_resp = storage.upload(
            file=file_obj,
            path=storage_path,
            file_options={"cache-control": "3600", "upsert": "false"},
        )

        # 업로드 에러 단순 체크 (에러 포맷은 버전에 따라 다를 수 있어서 그냥 프린트 위주)
        if isinstance(upload_resp, dict) and upload_resp.get("error"):
            print(f"[ERROR] 업로드 실패: problem {pid}, error={upload_resp}")
            continue

        # public URL 생성 (버킷이 public이어야 함)
        public_url = build_public_url(bucket_name, storage_path)

        # DB 업데이트
        supabase.table("problems") \
            .update({"full_image_url": public_url}) \
            .eq("id", pid) \
            .execute()

        print(f"[OK] problem {pid} -> full_image_url 업데이트 완료: {public_url}")

    print("[DONE] 모든 이미지 업로드 및 full_image_url 업데이트 완료")


if __name__ == "__main__":
    main()
