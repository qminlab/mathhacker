# scripts/extract_problems_from_json.py
#
# Mathpix JSON(한 페이지) -> 문제별 메타정보(.problems.json) 추출
#
# - 여러 교재 패턴 대응 (MAPL 0001, 0002..., 이투스 011, 012...)
# - "문제 번호"는 type이 text 이든 page_info 이든 모두 후보로 본다
# - 번호 형식은 "011", "0003" 처럼 "숫자 3~4자리만 있는 라인"만 인정
#   (SET 02, 2016년 같은 건 자동으로 필터됨)

import json
import sys
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional


PROB_NUM_RE = re.compile(r"^\s*(\d{3,4})\s*$")  # 011, 0003, 0123 같은 것만 허용


def load_mathpix_json(path: str) -> Dict[str, Any]:
  with open(path, "r", encoding="utf-8") as f:
    return json.load(f)


def flatten_lines(data: Dict[str, Any]) -> List[Dict[str, Any]]:
  """Mathpix line_data 를 평탄화 + 좌표 정보 추가."""
  flat = []
  line_data = data.get("line_data", [])
  for line in line_data:
    if not line.get("conversion_output", False):
      continue

    text = (line.get("text") or "").replace("\n", " ").strip()
    cnt = line.get("cnt") or []
    if len(cnt) != 4:
      continue

    xs = [p[0] for p in cnt]
    ys = [p[1] for p in cnt]
    x_center = sum(xs) / 4.0
    y_center = sum(ys) / 4.0

    flat.append(
      {
        "id": line.get("id"),
        "type": line.get("type"),
        "text": text,
        "left": min(xs),
        "right": max(xs),
        "top": min(ys),
        "bottom": max(ys),
        "x_center": x_center,
        "y_center": y_center,
        "parent_id": line.get("parent_id"),
      }
    )

  print(f"[DEBUG] 추출된 라인 수: {len(flat)}")
  return flat


def detect_columns(data: Dict[str, Any], flat_lines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  """
  Mathpix 에서 type == 'column' 으로 잡힌 영역이 있으면 그걸 컬럼으로 사용.
  없으면 페이지 전체를 하나의 컬럼으로 본다.
  """
  page_width = data.get("image_width")
  page_height = data.get("image_height")

  column_boxes = []
  for line in data.get("line_data", []):
    if line.get("type") != "column":
      continue
    cnt = line.get("cnt") or []
    if len(cnt) != 4:
      continue
    xs = [p[0] for p in cnt]
    ys = [p[1] for p in cnt]
    column_boxes.append(
      {
        "left": min(xs),
        "right": max(xs),
        "top": min(ys),
        "bottom": max(ys),
      }
    )

  # 컬럼이 하나도 없으면 전체 페이지를 하나의 컬럼으로 간주
  if not column_boxes:
    column_boxes = [
      {"left": 0, "right": page_width, "top": 0, "bottom": page_height}
    ]

  # x 기준으로 정렬해서 컬럼 index 부여
  column_boxes.sort(key=lambda c: c["left"])
  for idx, col in enumerate(column_boxes):
    col["index"] = idx

  # 각 line 에 column index 부여
  for line in flat_lines:
    x = line["x_center"]
    assigned = None
    for col in column_boxes:
      if col["left"] <= x <= col["right"]:
        assigned = col["index"]
        break
    if assigned is None:
      # 범위 벗어나면 가장 가까운 컬럼에 붙이기
      closest = min(
        column_boxes,
        key=lambda c: abs((c["left"] + c["right"]) / 2.0 - x),
      )
      assigned = closest["index"]
    line["column"] = assigned

  return column_boxes


def detect_problem_headers(
  flat_lines: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
  """
  문제 번호 헤더 찾기.
  - type 이 text 또는 page_info 인 라인 중에서
  - 텍스트가 "011", "0003" 처럼 숫자 3~4자리만 있을 때만 인식
  """
  headers = []

  for ln in flat_lines:
    if ln["type"] not in ("text", "page_info"):
      continue

    raw = (ln["text"] or "").strip()
    # Mathpix 가 "\n\n011" 이런 식으로 주는 경우가 있어서 공백 제거
    clean = raw.replace(" ", "")
    m = PROB_NUM_RE.match(clean)
    if not m:
      continue

    digits = m.group(1)
    number = int(digits)  # 0001 -> 1, 011 -> 11 등

    headers.append(
      {
        "number": number,
        "column": ln["column"],
        "x_center": ln["x_center"],
        "y_center": ln["y_center"],
        "top": ln["top"],
        "bottom": ln["bottom"],
        "raw_text": raw,
      }
    )

  headers.sort(key=lambda h: (h["column"], h["y_center"]))

  print("\n[DEBUG] 찾은 문제번호 헤더:")
  for h in headers:
    print(f"  - 번호 {h['number']} / col={h['column']} / y={h['y_center']}")
  return headers


def build_problems(
  data: Dict[str, Any],
  flat_lines: List[Dict[str, Any]],
  columns: List[Dict[str, Any]],
  headers: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
  page_height = data.get("image_height")
  page_width = data.get("image_width")

  # 컬럼별로 헤더 묶기
  headers_by_col: Dict[int, List[Dict[str, Any]]] = {}
  for h in headers:
    headers_by_col.setdefault(h["column"], []).append(h)

  problems: List[Dict[str, Any]] = []

  for col in columns:
    cidx = col["index"]
    col_headers = headers_by_col.get(cidx, [])
    if not col_headers:
      continue

    # y 기준 정렬 (이미 되어 있지만 혹시 몰라서)
    col_headers.sort(key=lambda h: h["y_center"])

    col_left = col["left"]
    col_right = col["right"]

    for i, h in enumerate(col_headers):
      y_min = h["top"]
      if i + 1 < len(col_headers):
        y_max = col_headers[i + 1]["top"]
      else:
        y_max = page_height

      # 이 컬럼 + y 범위 안의 라인들만 모아서 텍스트 구성
      lines_in_block = [
        ln
        for ln in flat_lines
        if ln["column"] == cidx and (y_min <= ln["top"] < y_max)
        and ln["type"] in ("text", "math", "page_info")
      ]
      lines_in_block.sort(key=lambda ln: ln["y_center"])

      body_text = " ".join(ln["text"] for ln in lines_in_block).strip()

      problems.append(
        {
          "page": 1,  # Mathpix 결과가 페이지별이므로 여기선 1로 둠
          "page_width": page_width,
          "page_height": page_height,
          "column": cidx,
          "workbook_number": h["number"],
          "header_text": h["raw_text"],
          "raw_text": body_text,
          "bbox": {
            "left": int(col_left),
            "top": int(y_min),
            "right": int(col_right),
            "bottom": int(y_max),
          },
        }
      )

  return problems


def main():
  if len(sys.argv) < 2:
    print("Usage: python3 scripts/extract_problems_from_json.py <mathpix_page.json>")
    sys.exit(1)

  in_path = sys.argv[1]
  if not os.path.exists(in_path):
    print(f"File not found: {in_path}")
    sys.exit(1)

  data = load_mathpix_json(in_path)
  flat_lines = flatten_lines(data)
  columns = detect_columns(data, flat_lines)
  headers = detect_problem_headers(flat_lines)
  problems = build_problems(data, flat_lines, columns, headers)

  # 디버그 출력
  print("\n=== 추출된 문제들 미리보기 ===")
  for pb in problems:
    preview = (pb["raw_text"] or "")[:80]
    print(
      f"[컬럼 {pb['column']}] [문제번호 {pb['workbook_number']}] "
      f"y_range = [{pb['bbox']['top']}, {pb['bbox']['bottom']})"
    )
    print(f"본문 미리보기: {preview}...\n")

  out_path = Path(in_path).with_suffix(".problems.json")
  with open(out_path, "w", encoding="utf-8") as f:
    json.dump(problems, f, ensure_ascii=False, indent=2)

  print(
    f"[OK] {len(problems)}개 문제를 {out_path.name} 로 저장했습니다."
  )


if __name__ == "__main__":
  main()
