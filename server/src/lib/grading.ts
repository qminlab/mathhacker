// 답 정규화와 채점
//
// 같은 답으로 보는 것:
//   객관식  ③ = (3) = 3 = 3번 = ３
//   주관식  12 = 12.0 = ＋12,  3/4 = \frac{3}{4} = 0.75,  -2 = −2
// 그 밖의 답(식·문자)은 공백·대소문자·LaTeX 괄호를 무시하고 글자로 비교한다.

const CIRCLED: Record<string, string> = {
  "①": "1", "②": "2", "③": "3", "④": "4", "⑤": "5",
  "⑥": "6", "⑦": "7", "⑧": "8", "⑨": "9", "⑩": "10",
  "❶": "1", "❷": "2", "❸": "3", "❹": "4", "❺": "5",
}

function toHalfWidth(s: string) {
  return s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
}

/** 화면·DB에 저장할 형태로 다듬는다 (예: "(3)" → "3", "\frac{3}{4}" → "3/4") */
export function normalizeAnswer(input: string | null | undefined): string {
  if (input == null) return ""
  let s = toHalfWidth(String(input)).trim()
  s = s.replace(/[①-⑩❶-❺]/g, (c) => CIRCLED[c] ?? c)
  s = s.replace(/[−–—]/g, "-")
  // LaTeX 수식 구분자와 흔한 명령
  s = s.replace(/\\\(|\\\)|\\\[|\\\]|\$/g, "")
  s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
  s = s.replace(/\\left|\\right|\\,|\\;|\\!/g, "")
  s = s.replace(/\s+/g, "")
  // "(3)", "3번", "3." 처럼 번호 표기
  s = s.replace(/^\((\d{1,2})\)$/, "$1").replace(/^(\d{1,2})번$/, "$1").replace(/^(\d+)\.$/, "$1")
  // "(3)/(4)" → "3/4" (괄호 안이 단순 숫자일 때만)
  s = s.replace(/\((-?\d+(?:\.\d+)?)\)/g, "$1")
  s = s.replace(/^\+/, "")
  return s.toLowerCase()
}

/** 숫자·분수면 값으로, 아니면 null */
export function numericValue(normalized: string): number | null {
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized)
  const frac = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(normalized)
  if (frac) {
    const den = Number(frac[2])
    return den === 0 ? null : Number(frac[1]) / den
  }
  return null
}

export type GradeResult = "correct" | "wrong" | "pending"

/** 정답이 아직 없으면 pending */
export function grade(userAnswer: string, correctAnswer: string | null | undefined): GradeResult {
  const key = normalizeAnswer(correctAnswer)
  if (!key) return "pending"
  const mine = normalizeAnswer(userAnswer)
  if (!mine) return "wrong"
  if (mine === key) return "correct"
  const a = numericValue(mine)
  const b = numericValue(key)
  if (a !== null && b !== null && Math.abs(a - b) < 1e-9) return "correct"
  return "wrong"
}
