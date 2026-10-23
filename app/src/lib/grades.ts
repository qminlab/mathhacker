// 학년 (서버 server/src/lib/generate/types.ts 의 GRADES와 같은 값)
export const GRADES = ["k", "e1", "e2", "e3", "e4", "e5", "e6", "m1", "m2", "m3", "h1", "h2", "h3", "su"] as const
export type Grade = (typeof GRADES)[number]

export const GRADE_LABEL: Record<Grade, string> = {
  k: "유아",
  e1: "초1",
  e2: "초2",
  e3: "초3",
  e4: "초4",
  e5: "초5",
  e6: "초6",
  m1: "중1",
  m2: "중2",
  m3: "중3",
  h1: "고1",
  h2: "고2",
  h3: "고3",
  su: "수능",
}

/** 수능 문제 은행 난도 */
export const LEVELS = [1, 2, 3, 4] as const
export const LEVEL_LABEL: Record<(typeof LEVELS)[number], string> = { 1: "기초", 2: "수능 기본", 3: "수능 4점", 4: "고난도" }

export const GRADE_GROUPS: { label: string; grades: Grade[] }[] = [
  { label: "유아", grades: ["k"] },
  { label: "초등", grades: ["e1", "e2", "e3", "e4", "e5", "e6"] },
  { label: "중등", grades: ["m1", "m2", "m3"] },
  // 2028 수능 범위(대수·미적분Ⅰ·확률과 통계)는 '수능' 하나로
  { label: "고등", grades: ["h1", "su"] },
]

export const gradeOrder = (g: string | null | undefined) => (g ? GRADES.indexOf(g as Grade) : -1)
