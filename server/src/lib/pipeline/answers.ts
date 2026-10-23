// 빠른정답(답지) OCR 텍스트 → { 문제번호: 정답 }
//
// 답지는 보통 이런 모양이다.
//   한 줄에 나열:  011 ③  012 ②  013 12
//   표:           | 011 | 012 | 013 |      또는  \begin{tabular}{|c|c|} 011 & 012 \\ ③ & ② \end{tabular}
//                 | ③   | ②   | 12  |
// 문제집에 실제로 있는 번호(knownNumbers)를 알려 주면, 그 번호만 문제 번호로 인정해서 오인식을 줄인다.

import { normalizeAnswer } from "../grading"

const NUMBER_TOKEN = /^\d{2,4}$/
// 객관식 번호, 정수, 소수, 분수, 음수
const ANSWER_TOKEN = /^(?:\(\d{1,2}\)|[①-⑩❶-❺]|[-+]?\d+(?:\.\d+)?(?:\/\d+)?|[-+]?\(\d+\)\/\(\d+\))$/

/** OCR 결과를 표 행·칸 단위로 쪼갠다 */
export function toRows(text: string): string[][] {
  let s = text
  s = s.replace(/\\(?:begin|end)\{tabular\}(?:\{[^}]*\})?/g, "\n")
  s = s.replace(/\\hline/g, "\n")
  s = s.replace(/\\\\/g, "\n")
  s = s.replace(/\\\(|\\\)|\\\[|\\\]|\$/g, " ")
  s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
  // 정답 앞뒤 표기: "011 답 ③", "011. ③", "011) ③", "011 : 12"
  s = s.replace(/정답|답/g, " ")
  return s
    .split(/\n+/)
    .map((row) =>
      row
        .split(/\s*[|&]\s*|\s+/)
        .map((c) => c.trim().replace(/^(\d{2,4})[.):]$/, "$1"))
        .filter(Boolean)
    )
    .filter((cells) => cells.length > 0 && !cells.every((c) => /^:?-{2,}:?$/.test(c)))
}

function isNumber(cell: string, known?: Set<number>) {
  if (!NUMBER_TOKEN.test(cell)) return false
  return known ? known.has(Number(cell)) : cell.length >= 3
}

function isAnswer(cell: string) {
  return ANSWER_TOKEN.test(cell)
}

export function parseAnswerKey(text: string, knownNumbers?: Iterable<number>): Map<number, string> {
  const known = knownNumbers ? new Set(knownNumbers) : undefined
  const rows = toRows(text)
  const out = new Map<number, string>()

  const put = (num: string, ans: string) => {
    const n = Number(num)
    if (!out.has(n)) out.set(n, normalizeAnswer(ans))
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const next = rows[r + 1]

    // 표: 이 행이 전부 번호이고, 다음 행이 같은 칸 수의 답이면 위아래로 짝짓는다
    if (
      next &&
      row.length >= 2 &&
      row.every((c) => isNumber(c, known)) &&
      next.length === row.length &&
      next.every(isAnswer)
    ) {
      row.forEach((num, i) => put(num, next[i]))
      r++
      continue
    }

    // 한 줄 나열: 번호 바로 다음 칸이 답
    for (let i = 0; i < row.length - 1; i++) {
      if (isNumber(row[i], known) && isAnswer(row[i + 1]) && !isNumber(row[i + 1], known)) {
        put(row[i], row[i + 1])
        i++
      }
    }
  }

  return out
}
