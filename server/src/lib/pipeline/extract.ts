// Mathpix 한 페이지 결과 → 문제별 영역·텍스트
//
// 규칙 (이전 Python 파이프라인과 동일):
// - Mathpix가 type "column"으로 잡은 영역을 단(column)으로 쓴다. 없으면 페이지 전체가 한 단.
// - type이 text/page_info인 줄 중 "011", "0003"처럼 숫자 3~4자리만 있는 줄을 문제 번호로 본다.
//   ("SET 02", "유형 01", "짝기출 007"처럼 다른 글자가 섞인 줄은 제외)
// - 한 문제의 영역 = 그 단에서 이 번호 줄의 top부터 다음 번호 줄의 top(없으면 단의 bottom)까지.

import type { MathpixLine, MathpixResult } from "./mathpix-types"

const PROBLEM_NUMBER_RE = /^(\d{3,4})$/
const SCORE_RE = /\[(\d+)\s*점\]/

export type Box = { left: number; top: number; right: number; bottom: number }

export type FlatLine = Box & {
  type: string
  text: string
  xCenter: number
  yCenter: number
  column: number
}

export type Column = Box & { index: number }

export type ExtractedProblem = {
  page: number
  column: number
  workbookNumber: number
  headerText: string
  rawText: string
  score: number | null
  pageWidth: number
  pageHeight: number
  bbox: Box
}

function boxOf(line: MathpixLine): Box | null {
  const cnt = line.cnt
  if (!cnt || cnt.length < 3) return null
  const xs = cnt.map((p) => p[0])
  const ys = cnt.map((p) => p[1])
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) }
}

export function detectColumns(data: MathpixResult): Column[] {
  const boxes: Box[] = []
  for (const line of data.line_data ?? []) {
    if (line.type !== "column") continue
    const b = boxOf(line)
    if (b) boxes.push(b)
  }
  if (boxes.length === 0) {
    boxes.push({ left: 0, top: 0, right: data.image_width, bottom: data.image_height })
  }
  return boxes
    .sort((a, b) => a.left - b.left)
    .map((b, index) => ({ ...b, index }))
}

export function flattenLines(data: MathpixResult, columns: Column[]): FlatLine[] {
  const out: FlatLine[] = []
  for (const line of data.line_data ?? []) {
    if (!line.conversion_output) continue
    const b = boxOf(line)
    if (!b) continue
    const xCenter = (b.left + b.right) / 2
    const yCenter = (b.top + b.bottom) / 2
    let col = columns.find((c) => c.left <= xCenter && xCenter <= c.right)
    if (!col) {
      col = columns.reduce((best, c) =>
        Math.abs((c.left + c.right) / 2 - xCenter) < Math.abs((best.left + best.right) / 2 - xCenter) ? c : best
      )
    }
    out.push({
      ...b,
      type: line.type,
      text: (line.text ?? "").replace(/\s+/g, " ").trim(),
      xCenter,
      yCenter,
      column: col.index,
    })
  }
  return out
}

export function parseProblemNumber(text: string): number | null {
  const m = PROBLEM_NUMBER_RE.exec(text.replace(/\s+/g, ""))
  return m ? Number(m[1]) : null
}

export function parseScore(text: string): number | null {
  const m = SCORE_RE.exec(text)
  return m ? Number(m[1]) : null
}

/** 단 하나 안에서 문제 번호 줄이 단의 왼쪽 가장자리 근처에 있는지 (본문 속 숫자 오인식 방지) */
function nearColumnLeft(line: FlatLine, col: Column) {
  const width = Math.max(1, col.right - col.left)
  return line.left - col.left <= width * 0.35
}

export function extractProblems(data: MathpixResult, page: number): ExtractedProblem[] {
  const columns = detectColumns(data)
  const lines = flattenLines(data, columns)

  const headers = lines
    .filter((ln) => ln.type === "text" || ln.type === "page_info")
    .map((ln) => ({ ln, number: parseProblemNumber(ln.text) }))
    .filter((h): h is { ln: FlatLine; number: number } =>
      h.number !== null && nearColumnLeft(h.ln, columns[h.ln.column])
    )

  const problems: ExtractedProblem[] = []

  for (const col of columns) {
    const colHeaders = headers
      .filter((h) => h.ln.column === col.index)
      .sort((a, b) => a.ln.yCenter - b.ln.yCenter)

    colHeaders.forEach((h, i) => {
      const top = h.ln.top
      const bottom = i + 1 < colHeaders.length ? colHeaders[i + 1].ln.top : Math.max(col.bottom, top + 1)

      const body = lines
        .filter(
          (ln) =>
            ln.column === col.index &&
            ln.top >= top &&
            ln.top < bottom &&
            ln !== h.ln &&
            (ln.type === "text" || ln.type === "math" || ln.type === "page_info")
        )
        .sort((a, b) => a.yCenter - b.yCenter)
        .map((ln) => ln.text)
        .join(" ")
        .trim()

      problems.push({
        page,
        column: col.index,
        workbookNumber: h.number,
        headerText: h.ln.text,
        rawText: body,
        score: parseScore(body),
        pageWidth: data.image_width,
        pageHeight: data.image_height,
        bbox: {
          left: Math.round(col.left),
          top: Math.round(top),
          right: Math.round(col.right),
          bottom: Math.round(bottom),
        },
      })
    })
  }

  return problems
}

/** crop할 영역: 약간의 여백을 두고 페이지 안으로 자른다 */
export function paddedBox(b: Box, pageWidth: number, pageHeight: number, pad = 12): Box {
  const left = Math.max(0, Math.floor(b.left - pad))
  const top = Math.max(0, Math.floor(b.top - pad))
  const right = Math.min(pageWidth, Math.ceil(b.right + pad))
  const bottom = Math.min(pageHeight, Math.ceil(b.bottom))
  return { left, top, right: Math.max(right, left + 1), bottom: Math.max(bottom, top + 1) }
}
