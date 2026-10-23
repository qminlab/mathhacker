// 화면이 쓰는 데이터 기능 목록. 실제 서버(Supabase + API)와 체험 모드 두 가지로 구현한다.
import type {
  IngestSession,
  PickedFile,
  PracticeMode,
  PracticeSession,
  ProblemWithStatus,
  Profile,
  SessionBundle,
  Settings,
  Stats,
  SubmitInput,
  SubmitResult,
  WorkbookSummary,
  WrongItem,
} from "./types"

export type UploadInput = {
  kind: "problems" | "answers"
  file: PickedFile
  title?: string
  unit?: string
  chapter?: string
  workbookId?: number
}

export interface Backend {
  profile(): Promise<Profile>
  updateNickname(nickname: string): Promise<void>
  /** 계정과 모든 데이터 삭제 */
  deleteAccount(): Promise<void>
  settings(): Promise<Settings>
  saveSettings(s: Settings): Promise<void>

  workbooks(): Promise<WorkbookSummary[]>
  workbook(id: number): Promise<{ workbook: WorkbookSummary; problems: ProblemWithStatus[] }>
  renameWorkbook(id: number, title: string): Promise<void>
  deleteWorkbook(id: number): Promise<void>
  saveAnswers(workbookId: number, answers: { problemId: string; answer: string }[]): Promise<{ saved: number; regraded: number }>

  ingests(): Promise<IngestSession[]>
  upload(input: UploadInput, onProgress?: (stage: "uploading" | "starting") => void): Promise<number>
  retryIngest(id: number): Promise<void>

  startDaily(): Promise<PracticeSession>
  startSession(mode: Exclude<PracticeMode, "daily">, workbookId?: number, limit?: number): Promise<PracticeSession | null>
  /** 고른 문제들로 바로 세션 만들기 (문제 하나 다시 풀기 등) */
  startWith(mode: Exclude<PracticeMode, "daily">, problemIds: string[], workbookId?: number): Promise<PracticeSession>
  sessionBundle(id: number): Promise<SessionBundle>
  finishSession(id: number): Promise<void>
  submit(input: SubmitInput): Promise<SubmitResult>

  wrongNotes(): Promise<WrongItem[]>
  stats(days: number): Promise<Stats>

  /** 문제 이미지 경로 → 화면에 띄울 수 있는 URL(서명된 임시 주소 또는 로컬 이미지) */
  imageSources(paths: string[]): Promise<Record<string, string | number>>
}
