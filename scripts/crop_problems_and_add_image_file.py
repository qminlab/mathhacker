#!/usr/bin/env python3
"""
페이지 전체 이미지 + problems.json을 받아서

- bbox 기준으로 문제별 이미지를 잘라서 파일로 저장하고
- 각 블록에 image_file 필드를 추가해서 새로운 JSON으로 저장하는 스크립트

사용 예시:

  (.venv) python3 scripts/crop_problems_and_add_image_file.py \
    work/page_001.png \
    work/my-workbook.mathpix_page1.problems.json \
    --out-dir work/cropped \
    --out-json work/my-workbook.mathpix_page1.problems.with_images.json

"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Any, Dict, List

from PIL import Image  # pip install pillow


BASE_DIR = Path(__file__).resolve().parent.parent


def load_problems_json(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        print(f"[ERROR] JSON 파일을 찾을 수 없습니다: {path}")
        sys.exit(1)

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("[ERROR] JSON 최상위 구조가 list가 아닙니다.")
        sys.exit(1)

    print(f"[INFO] 입력 problems.json 문제 수: {len(data)}")
    return data


def crop_and_annotate(
    page_image_path: Path,
    problems_json_path: Path,
    out_dir: Path,
    out_json_path: Path,
) -> None:
    # 출력 디렉토리 생성
    out_dir.mkdir(parents=True, exist_ok=True)

    # 페이지 이미지 열기
    if not page_image_path.exists():
        print(f"[ERROR] 페이지 이미지 파일을 찾을 수 없습니다: {page_image_path}")
        sys.exit(1)

    img = Image.open(page_image_path)
    print(f"[INFO] 페이지 이미지 로드 완료: {page_image_path} (size={img.size})")

    # JSON 로드
    blocks = load_problems_json(problems_json_path)

    # page 번호는 JSON에서 읽되, 없으면 1
    # 여러 페이지가 섞여 있을 수도 있지만, 지금은 한 페이지 기준으로 사용
    default_page = blocks[0].get("page", 1) if blocks else 1

    updated_blocks: List[Dict[str, Any]] = []

    for idx, block in enumerate(blocks):
        bbox = block.get("bbox")
        if not bbox:
            print(f"[WARN] block {idx} 에 bbox가 없습니다. 스킵.")
            updated_blocks.append(block)
            continue

        left = bbox.get("left")
        top = bbox.get("top")
        right = bbox.get("right")
        bottom = bbox.get("bottom")

        if None in (left, top, right, bottom):
            print(f"[WARN] block {idx} bbox 값이 불완전합니다. 스킵.")
            updated_blocks.append(block)
            continue

        page = block.get("page", default_page)
        column = block.get("column", 0)
        wnum = block.get("workbook_number")  # 11, 12, ...
        if wnum is None:
            # workbook_number 없으면 그냥 인덱스를 번호로 사용
            wnum = idx + 1

        # 파일명 규칙: page_001_p1_q11_c0.png 같은 느낌
        filename = f"page_{int(page):03d}_p{int(page)}_q{int(wnum)}_c{int(column)}.png"
        out_path = out_dir / filename

        # 이미지 크롭
        crop_box = (int(left), int(top), int(right), int(bottom))
        cropped = img.crop(crop_box)
        cropped.save(out_path)

        # BASE_DIR 기준 상대 경로로 저장 (importer/업로드 스크립트에서 이 기준 사용 중)
        rel_path = out_path.relative_to(BASE_DIR)
        image_file_str = str(rel_path).replace(os.sep, "/")

        # block에 image_file 필드 추가
        block["image_file"] = image_file_str

        print(f"[OK] block {idx}: {crop_box} -> {image_file_str}")

        updated_blocks.append(block)

    # 업데이트된 JSON 저장
    with out_json_path.open("w", encoding="utf-8") as f:
        json.dump(updated_blocks, f, ensure_ascii=False, indent=2)

    print(f"[DONE] image_file 필드가 추가된 JSON 저장 완료 → {out_json_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("page_image", help="페이지 전체 이미지 경로 (예: work/page_001.png)")
    parser.add_argument("problems_json", help="문제 bbox 정보가 들어 있는 problems.json 경로")
    parser.add_argument(
        "--out-dir",
        help="문제별 크롭 이미지를 저장할 디렉토리 (기본: work/cropped)",
        default="work/cropped",  # 🔥 여기 crops → cropped
    )
    parser.add_argument(
        "--out-json",
        help="image_file이 추가된 JSON을 저장할 경로 (생략 시, 입력 JSON 옆에 *.with_images.json 으로 저장)",
        default=None,
    )
    args = parser.parse_args()

    page_image_path = (BASE_DIR / args.page_image).resolve() if not args.page_image.startswith("/") else Path(args.page_image)
    problems_json_path = (BASE_DIR / args.problems_json).resolve() if not args.problems_json.startswith("/") else Path(args.problems_json)
    out_dir = (BASE_DIR / args.out_dir).resolve() if not args.out_dir.startswith("/") else Path(args.out_dir)

    if args.out_json:
        out_json_path = (BASE_DIR / args.out_json).resolve() if not args.out_json.startswith("/") else Path(args.out_json)
    else:
        # 기본은 입력 JSON 옆에 *.with_images.json 으로 저장
        p = Path(args.problems_json)
        out_json_path = (BASE_DIR / p.with_name(p.stem + ".with_images.json")).resolve()

    crop_and_annotate(page_image_path, problems_json_path, out_dir, out_json_path)


if __name__ == "__main__":
    main()
