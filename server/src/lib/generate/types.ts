// 코드로 만드는 공용 문제 (저작권 걱정 없는 오리지널 문제)

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

export type Figure = { svg: string; width: number; height: number; align?: "left" | "center" }

export type GeneratedProblem = {
  /** 본문. 수식은 $...$ (TeX), 줄바꿈은 \n */
  text: string
  /** 객관식이면 보기 5개 (answer는 1~5) */
  choices?: string[]
  /** 주관식이면 숫자/분수 문자열, 객관식이면 "1"~"5" */
  answer: string
  hint?: string
  figure?: Figure
}

export type Rng = {
  int: (min: number, max: number) => number
  pick: <T>(xs: readonly T[]) => T
  shuffle: <T>(xs: T[]) => T[]
  chance: (p: number) => boolean
}

export type Template = {
  /** 이 단원 안에서 바뀌지 않는 이름 (문제 id를 만드는 데 쓴다) */
  id: string
  make: (r: Rng) => GeneratedProblem
}

export type Unit = {
  grade: Grade
  /** 단원 이름 (문제집 제목, 단원별 통계에 쓰인다) */
  unit: string
  slug: string
  templates: Template[]
  /** 템플릿마다 만들 문제 수 */
  perTemplate?: number
}
