# scripts/ocr_import.py

import os
import sys
import json
import base64
from pathlib import Path

import requests
from dotenv import load_dotenv
from pdf2image import convert_from_path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def get_env_or_die(name: str) -> str:
    value = os.getenv(name)
    if not value:
        print(f"환경변수 {name} 가 설정되지 않았습니다.")
        sys.exit(1)
    return value


MATHPIX_APP_ID = get_env_or_die("MATHPIX_APP_ID")
MATHPIX_APP_KEY = get_env_or_die("MATHPIX_APP_KEY")


def pdf_to_images(pdf_path: Path, dpi: int = 300) -> list[Path]:
    """PDF를 페이지별 PNG 이미지로 변환하고, 파일 경로 리스트를 반환."""
    out_dir = pdf_path.with_suffix("")  # 예: 2to3.pdf -> 2to3/
    out_dir.mkdir(exist_ok=True)

    print(f"[1] PDF -> 이미지 변환 중... ({pdf_path})")
    pages = convert_from_path(str(pdf_path), dpi=dpi)

    image_paths: list[Path] = []
    for i, page_img in enumerate(pages, start=1):
        img_path = out_dir / f"page_{i:03}.png"
        page_img.save(img_path, "PNG")
        image_paths.append(img_path)
        print(f"  - 저장: {img_path}")

    return image_paths


def call_mathpix(image_path: Path) -> dict:
    """이미지 1장을 Mathpix OCR에 보내고, JSON 응답을 dict로 반환."""
    print(f"[2] Mathpix OCR 호출 중... ({image_path.name})")

    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode()

    headers = {
        "app_id": MATHPIX_APP_ID,
        "app_key": MATHPIX_APP_KEY,
        "Content-type": "application/json",
    }

    payload = {
        "src": f"data:image/png;base64,{image_data}",
        # 어떤 형식으로 받을지: 텍스트 / LaTeX / markdown 등
        "formats": ["text", "latex_styled", "markdown"],
        # 나중에 문제 구분할 때 쓰려고 라인 정보 포함
        "include_line_data": True,
    }

    resp = requests.post("https://api.mathpix.com/v3/text", headers=headers, data=json.dumps(payload))
    resp.raise_for_status()

    data = resp.json()
    print("[2] Mathpix 응답 수신 완료")
    return data


def main():
    if len(sys.argv) < 2:
        print("사용법: python3 scripts/ocr_import.py <pdf파일경로>")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        sys.exit(1)

    # 1) PDF -> 이미지
    image_paths = pdf_to_images(pdf_path)

    # 일단은 1페이지만 테스트
    first_page_img = image_paths[0]

    # 2) Mathpix OCR 호출
    ocr_result = call_mathpix(first_page_img)

    # 3) JSON으로 저장
    out_json = pdf_path.with_suffix(".mathpix_page1.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(ocr_result, f, ensure_ascii=False, indent=2)

    print(f"[3] OCR 결과 저장 완료 → {out_json}")


if __name__ == "__main__":
    main()
