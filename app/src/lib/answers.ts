// 화면에 보여 줄 답 다루기 (실제 채점은 서버가 한다)

const CIRCLED = ["①", "②", "③", "④", "⑤"]

/** 본문에 (1)~(5) 또는 ①~⑤ 보기가 있으면 객관식 */
export function isChoiceProblem(rawText: string | null | undefined) {
  if (!rawText) return false
  const t = rawText.replace(/\s+/g, "")
  const paren = ["(1)", "(2)", "(3)", "(4)", "(5)"].filter((c) => t.includes(c)).length
  const circled = CIRCLED.filter((c) => t.includes(c)).length
  return paren >= 4 || circled >= 4
}

/** "3" → "③" (객관식일 때) */
export function displayAnswer(answer: string | null | undefined, choice: boolean) {
  if (!answer) return ""
  if (choice && /^[1-5]$/.test(answer)) return CIRCLED[Number(answer) - 1]
  return answer
}

export const choiceLabels = CIRCLED

/** 체험 모드용 간단 채점 (서버 grading.ts와 같은 규칙의 축약판) */
export function localGrade(user: string, key: string | null): "correct" | "wrong" | "pending" {
  if (!key) return "pending"
  const norm = (s: string) =>
    s
      .trim()
      .replace(/[①-⑤]/g, (c) => String(CIRCLED.indexOf(c) + 1))
      .replace(/^\((\d)\)$/, "$1")
      .replace(/\s+/g, "")
      .toLowerCase()
  const a = norm(user)
  const b = norm(key)
  if (!a) return "wrong"
  if (a === b) return "correct"
  const num = (s: string) => {
    const f = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(s)
    if (f) return Number(f[1]) / Number(f[2])
    return /^-?\d+(?:\.\d+)?$/.test(s) ? Number(s) : NaN
  }
  return Math.abs(num(a) - num(b)) < 1e-9 ? "correct" : "wrong"
}

export function formatDuration(sec: number) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, "0")}`
}

export function formatMinutes(sec: number) {
  const m = Math.round(sec / 60)
  if (m < 60) return `${m}분`
  return `${Math.floor(m / 60)}시간 ${m % 60}분`
}
