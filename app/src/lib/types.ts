// 앱 전체에서 쓰는 데이터 모양 (supabase/schema.sql과 맞춘다)

export type Result = "pending" | "correct" | "wrong" | "gave_up"
export type GradingMode = "instant" | "batch"
export type PracticeMode = "daily" | "sequence" | "wrong"

export type Profile = { id: string; email: string | null; nickname: string | null; role: "user" | "admin" }

export type Settings = {
  daily_count: number
  time_per_problem_sec: number
  grading_mode: GradingMode
  stylus_only: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  daily_count: 10,
  time_per_problem_sec: 300,
  grading_mode: "instant",
  stylus_only: false,
}

export type WorkbookSummary = {
  id: number
  title: string
  unit: string | null
  chapter: string | null
  is_mine: boolean
  created_at: string
  total: number
  with_answer: number
  solved: number
  correct: number
  wrong: number
}

export type Problem = {
  id: string
  workbook_id: number
  workbook_number: number | null
  page: number | null
  score: number | null
  unit: string | null
  raw_text: string | null
  image_path: string | null
  answer: string | null
  answer_source: "ocr" | "manual" | null
  hint: string | null
}

export type ProblemWithStatus = Problem & { last_result: Result | null }

export type IngestSession = {
  id: number
  kind: "problems" | "answers"
  workbook_id: number | null
  title: string | null
  status: "uploaded" | "processing" | "done" | "failed"
  page_count: number
  processed_pages: number
  problem_count: number
  error: string | null
  result: { problems?: number; matched?: number; missing?: number[]; truncated?: boolean } | null
  created_at: string
}

export type PracticeSession = {
  id: number
  mode: PracticeMode
  workbook_id: number | null
  problem_ids: string[]
  day: string
  finished_at: string | null
}

export type Attempt = {
  id: number
  problem_id: string
  user_answer: string
  result: Result
  time_spent_sec: number
  hint_used: boolean
  created_at: string
}

export type SessionBundle = {
  session: PracticeSession
  problems: Problem[]
  attempts: Attempt[]
}

export type Stroke = { color: string; width: number; points: number[] } // [x0,y0,x1,y1,...] 캔버스 비율(0~1)

export type SubmitInput = {
  problemId: string
  answer: string
  gaveUp?: boolean
  hintUsed?: boolean
  timeSpentSec: number
  sessionId?: number
  strokes?: Stroke[]
}

export type SubmitResult = { id: number; result: Result; correctAnswer: string | null }

export type WrongItem = Problem & { workbook_title: string; last_wrong_at: string | null }

export type Stats = {
  daily: { day: string; total: number; correct: number }[]
  by_unit: { unit: string; total: number; correct: number }[]
  totals: { total: number; correct: number; wrong: number; time_sec: number }
}

export type PickedFile = { name: string; size?: number; uri: string; file?: File }
