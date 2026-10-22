# scripts/import_problems_to_supabase.py
#
# 사용법:
#   (.venv) python3 scripts/import_problems_to_supabase.py \
#     work/my-workbook.mathpix_page1.problems.json \
#     --source "내 문제집 SET 01"
#
# 역할:
#   - *.problems.json 읽어서
#   - Supabase `workbooks` 에 1줄 생성
#   - Supabase `problems` 테이블에 여러 row insert (workbook_id 포함)

import os
import sys
import json
import argparse
import re
from typing import Any, Dict, List, Optional

from supabase import create_client, Client  # pip install supabase-py
from dotenv import load_dotenv  # pip install python-dotenv


# 프로젝트 루트 기준으로 .env 로딩 (기존 로직 유지)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, ".env")

print("ENV PATH:", env_path)   # 디버그용
load_dotenv(env_path)


def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("[ERROR] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정해주세요.")
        sys.exit(1)

    return create_client(url, key)


def load_problems_json(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        print("[ERROR] problems.json 형식이 list가 아닙니다.")
        sys.exit(1)
    return data


def parse_score_from_text(text: str) -> Optional[int]:
    """
    raw_text 안에서 [3점], [4점] 같은 패턴 찾아서 score 추출.
    못 찾으면 None.
    """
    m = re.search(r"\[(\d+)점\]", text)
    if not m:
        return None
    try:
        return int(m.group(1))
    except ValueError:
        return None


def create_workbook(
    supabase: Client,
    source: str,
    unit: Optional[str],
    chapter: Optional[str],
    source_type: str,
    problems: List[Dict[str, Any]],
    owner_id: Optional[str] = None,
) -> int:
    """
    workbooks 테이블에 1줄 생성하고 id(bigint)를 반환.
    """

    # JSON 안에 page 필드가 있으면 페이지 수 추정
    pages = {p.get("page") for p in problems if p.get("page") is not None}
    total_pages = len(pages) if pages else 0
    total_problems = len(problems)

    payload = {
        "title": source,           # 문제집/세트 이름
        "unit": unit,
        "chapter": chapter,
        "source_type": source_type,  # 'pdf' | 'images' 정도로 사용
        "owner_id": owner_id,
        "total_problems": total_problems,
        "total_pages": total_pages,
    }

    print(f"[INFO] workbooks insert payload: {payload}")

    # 🔴 여기서 .select("id") 삭제
    resp = supabase.table("workbooks").insert(payload).execute()

    if not resp.data:
        print("[ERROR] workbooks insert 결과에 id가 없습니다.")
        print(resp)
        sys.exit(1)

    workbook_id = resp.data[0]["id"]
    print(f"[OK] workbooks row 생성 완료. id={workbook_id}")
    return workbook_id

def build_rows(
    problems: List[Dict[str, Any]],
    source: str,
    default_unit: Optional[str] = None,
    default_chapter: Optional[str] = None,
    workbook_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []

    for p in problems:
        page = p.get("page", 1)
        col = p.get("column", 0)
        wnum = p.get("workbook_number")
        header_text = p.get("header_text")
        raw_text = p.get("raw_text", "")
        bbox = p.get("bbox", {})
        page_width = p.get("page_width")
        page_height = p.get("page_height")

        score = parse_score_from_text(raw_text)

        row = {
            # 새로 추가된 연결 컬럼
            "workbook_id": workbook_id,

            # 필수 비슷하게 쓸 것들 (기존 그대로)
            "source": source,                  # 예: "내 문제집 SET 01"
            "workbook_number": wnum,          # 11, 12, 13, 14 ...
            "page": page,                     # OCR 기준 page (지금은 1)
            "source_page": page,              # 나중에 실제 교재 페이지랑 다르면 바꾸자
            "source_column": col,             # 0 또는 1

            # 내용 관련
            "header_text": header_text,
            "raw_text": raw_text,
            "body_text": raw_text,            # 지금은 일단 raw_text 그대로 복붙

            # 점수
            "score": score,

            # 단원/챕터 (알고 있으면 기본값으로 박음)
            "unit": default_unit,             # 예: "지수함수와 로그함수"
            "chapter_title": default_chapter, # 예: "핵심문제"

            # 페이지/좌표 메타
            "page_width": int(page_width) if page_width is not None else None,
            "page_height": int(page_height) if page_height is not None else None,
            "col_x_min": bbox.get("left"),
            "col_x_max": bbox.get("right"),
            "y_min": bbox.get("top"),
            "y_max": bbox.get("bottom"),

            # 이미지 / 태그 (지금은 최소만)
            "full_image_url": None,     # 곧 Storage 올린 뒤 업데이트 예정
            "has_diagram": p.get("has_diagram"),  # JSON에 있다면 활용
            "latex_body": p.get("latex_body"),

            "source_unit": default_unit,
            "difficulty_tag": None,
            "ability_tag": None,
            "meta_tags": None,

            # OCR 원본, 추가 메타
            "ocr_json": p,  # JSON 한 블록 전체를 그대로 보관
            "extra": {
                "image_file": p.get("image_file"),
                "column": col,
            },
        }

        rows.append(row)

    return rows



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("problems_json", help="*.mathpix_page1.problems.json 파일 경로")
    parser.add_argument(
        "--source",
        required=True,
        help='예: "내 문제집 SET 01" 같은 교재/세트 이름',
    )
    parser.add_argument("--unit", help='예: "지수함수와 로그함수"', default=None)
    parser.add_argument("--chapter", help='예: "핵심문제"', default=None)
    parser.add_argument(
        "--source-type",
        help="원본 타입 (예: pdf, images 등)",
        default="pdf",
    )
    parser.add_argument(
        "--owner-id",
        help="workbooks.owner_id 로 넣을 auth.users.id (없으면 NULL)",
        default=None,
    )
    args = parser.parse_args()

    if not os.path.exists(args.problems_json):
        print(f"[ERROR] 파일을 찾을 수 없습니다: {args.problems_json}")
        sys.exit(1)

    problems = load_problems_json(args.problems_json)
    print(f"[INFO] problems.json 문제 수: {len(problems)}")

    supabase = get_supabase_client()

    # 1) workbooks row 생성 (새로 추가된 단계)
    workbook_id = create_workbook(
        supabase=supabase,
        source=args.source,
        unit=args.unit,
        chapter=args.chapter,
        source_type=args.source_type,
        problems=problems,
        owner_id=args.owner_id,
    )

    # 2) problems row 생성 (기존 로직 + workbook_id 추가)
    rows = build_rows(problems, args.source, args.unit, args.chapter, workbook_id)
    print(f"[INFO] Supabase에 넣을 row 수: {len(rows)}")

    # 3) insert
    resp = supabase.table("problems").insert(rows).execute()

    # 에러 체크 (기존 방식 유지)
    if getattr(resp, "error", None):
        print("[ERROR] insert 에러:", resp.error)
        sys.exit(1)

    print("[OK] problems 테이블에 insert 완료!")
    # print(resp.data)  # 필요하면 주석 해제해서 확인


if __name__ == "__main__":
    main()
