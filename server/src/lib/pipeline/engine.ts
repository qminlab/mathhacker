// 업로드 처리 엔진: 문제지 PDF → 문제 DB, 답지 PDF → 정답
//
// DB·Storage·OCR·PDF 렌더링은 deps로 받아서, 같은 로직을 실제 Supabase로도
// 테스트용 메모리 저장소로도 돌릴 수 있게 했다.

import { grade } from "../grading"
import { parseAnswerKey } from "./answers"
import { extractProblems, paddedBox, type Box } from "./extract"
import type { MathpixResult } from "./mathpix-types"

export const MAX_PAGES = 40

export type IngestKind = "problems" | "answers"
export type IngestStatus = "uploaded" | "processing" | "done" | "failed"

export type IngestSession = {
  id: number
  kind: IngestKind
  user_id: string | null
  workbook_id: number | null
  title: string | null
  unit: string | null
  chapter: string | null
  original_file_path: string | null
  page_count: number
  processed_pages: number
  problem_count: number
  status: IngestStatus
}

export type SessionPatch = Partial<
  Pick<IngestSession, "workbook_id" | "page_count" | "processed_pages" | "problem_count" | "status">
> & { error?: string | null; result?: Record<string, unknown> | null }

export type NewProblem = {
  workbook_id: number
  source: string | null
  workbook_number: number
  page: number
  source_page: number
  source_column: number
  header_text: string
  raw_text: string
  body_text: string
  score: number | null
  unit: string | null
  chapter_title: string | null
  page_width: number
  page_height: number
  col_x_min: number
  col_x_max: number
  y_min: number
  y_max: number
  image_path: string
}

export type PendingAttempt = { id: number; user_answer: string; answer: string | null }

export interface IngestRepo {
  getSession(id: number): Promise<IngestSession>
  updateSession(id: number, patch: SessionPatch): Promise<void>
  downloadOriginal(path: string): Promise<Uint8Array>
  createWorkbook(w: {
    title: string
    unit: string | null
    chapter: string | null
    owner_id: string | null
    total_pages: number
  }): Promise<number>
  setWorkbookTotals(workbookId: number, totals: { total_problems: number }): Promise<void>
  deleteProblemsOnPage(workbookId: number, page: number): Promise<void>
  insertProblems(rows: NewProblem[]): Promise<void>
  uploadProblemImage(path: string, png: Buffer): Promise<void>
  listProblems(workbookId: number): Promise<{ id: string; workbook_number: number | null; answer_source: string | null }[]>
  setAnswers(updates: { id: string; answer: string }[]): Promise<void>
  pendingAttempts(workbookId: number): Promise<PendingAttempt[]>
  setAttemptResults(updates: { id: number; result: "correct" | "wrong" }[]): Promise<void>
}

export type PdfDoc = {
  pageCount: number
  render(page: number): Promise<{ png: Buffer; width: number; height: number }>
  close(): Promise<void>
}

export type EngineDeps = {
  repo: IngestRepo
  openPdf(bytes: Uint8Array): Promise<PdfDoc>
  ocr(png: Buffer, opts: { lineData: boolean }): Promise<MathpixResult>
  crop(png: Buffer, box: Box): Promise<Buffer>
  /** 이미지 파일 이름 충돌 방지용 (테스트에서 고정값으로 바꾼다) */
  randomId?: () => string
}

export class IngestError extends Error {}

function friendlyError(e: unknown) {
  if (e instanceof IngestError) return e.message
  const msg = e instanceof Error ? e.message : String(e)
  if (/MATHPIX_APP_ID|MATHPIX_APP_KEY/.test(msg)) return "서버에 Mathpix 키가 설정되어 있지 않습니다."
  if (/Mathpix/i.test(msg)) return `OCR 처리 중 오류가 발생했습니다 (${msg}). 다시 시도해 주세요.`
  if (/Invalid PDF|PasswordException|password/i.test(msg)) return "PDF를 열 수 없습니다. 암호가 걸려 있지 않은지 확인해 주세요."
  return "처리 중 오류가 발생했습니다. 다시 시도해 주세요."
}

export async function runIngest(sessionId: number, deps: EngineDeps): Promise<void> {
  const { repo } = deps
  const session = await repo.getSession(sessionId)
  if (session.status === "done") return

  await repo.updateSession(sessionId, { status: "processing", error: null })

  let pdf: PdfDoc | null = null
  try {
    if (!session.original_file_path) throw new IngestError("업로드된 파일이 없습니다.")
    pdf = await deps.openPdf(await repo.downloadOriginal(session.original_file_path))
    const pageCount = Math.min(pdf.pageCount, MAX_PAGES)

    if (session.kind === "answers") {
      await runAnswers(session, pdf, pageCount, deps)
    } else {
      await runProblems(session, pdf, pageCount, deps)
    }
  } catch (e) {
    console.error(`[ingest ${sessionId}] failed`, e)
    await repo.updateSession(sessionId, { status: "failed", error: friendlyError(e) })
  } finally {
    await pdf?.close().catch(() => {})
  }
}

async function runProblems(session: IngestSession, pdf: PdfDoc, pageCount: number, deps: EngineDeps) {
  const { repo } = deps
  const rand = deps.randomId ?? (() => Math.random().toString(36).slice(2, 8))

  let workbookId = session.workbook_id
  if (!workbookId) {
    workbookId = await repo.createWorkbook({
      title: session.title?.trim() || "이름 없는 문제집",
      unit: session.unit,
      chapter: session.chapter,
      owner_id: session.user_id,
      total_pages: pageCount,
    })
    await repo.updateSession(session.id, { workbook_id: workbookId, page_count: pageCount })
  }

  const folder = session.user_id ?? "shared"
  let problemCount = session.problem_count

  for (let page = session.processed_pages + 1; page <= pageCount; page++) {
    const rendered = await pdf.render(page)
    const ocr = await deps.ocr(rendered.png, { lineData: true })
    const found = extractProblems(ocr, page)

    // 재시도할 때 같은 페이지가 두 번 들어가지 않게 먼저 지운다
    await repo.deleteProblemsOnPage(workbookId, page)

    const rows: NewProblem[] = []
    for (const p of found) {
      const box = paddedBox(p.bbox, rendered.width, rendered.height)
      const image = await deps.crop(rendered.png, box)
      const imagePath = `${folder}/${workbookId}/p${page}-c${p.column}-q${p.workbookNumber}-${rand()}.png`
      await repo.uploadProblemImage(imagePath, image)
      rows.push({
        workbook_id: workbookId,
        source: session.title,
        workbook_number: p.workbookNumber,
        page,
        source_page: page,
        source_column: p.column,
        header_text: p.headerText,
        raw_text: p.rawText,
        body_text: p.rawText,
        score: p.score,
        unit: session.unit,
        chapter_title: session.chapter,
        page_width: rendered.width,
        page_height: rendered.height,
        col_x_min: box.left,
        col_x_max: box.right,
        y_min: box.top,
        y_max: box.bottom,
        image_path: imagePath,
      })
    }
    if (rows.length) await repo.insertProblems(rows)

    problemCount += rows.length
    await repo.updateSession(session.id, { processed_pages: page, problem_count: problemCount })
  }

  await repo.setWorkbookTotals(workbookId, { total_problems: problemCount })

  if (problemCount === 0) {
    throw new IngestError("문제 번호를 찾지 못했습니다. 문제 번호가 011처럼 숫자만 적힌 문제지인지 확인해 주세요.")
  }
  await repo.updateSession(session.id, {
    status: "done",
    result: { problems: problemCount, pages: pageCount, truncated: pdf.pageCount > pageCount },
  })
}

async function runAnswers(session: IngestSession, pdf: PdfDoc, pageCount: number, deps: EngineDeps) {
  const { repo } = deps
  if (!session.workbook_id) throw new IngestError("답지를 연결할 문제집이 없습니다.")
  await repo.updateSession(session.id, { page_count: pageCount })

  const problems = await repo.listProblems(session.workbook_id)
  const known = new Set(problems.map((p) => p.workbook_number).filter((n): n is number => n != null))

  const texts: string[] = []
  for (let page = session.processed_pages + 1; page <= pageCount; page++) {
    const rendered = await pdf.render(page)
    const ocr = await deps.ocr(rendered.png, { lineData: false })
    texts.push(ocr.text ?? "")
    await repo.updateSession(session.id, { processed_pages: page })
  }

  const key = parseAnswerKey(texts.join("\n"), known)
  const updates = problems
    .filter((p) => p.workbook_number != null && key.has(p.workbook_number) && p.answer_source !== "manual")
    .map((p) => ({ id: p.id, answer: key.get(p.workbook_number!)! }))
  if (updates.length) await repo.setAnswers(updates)

  const regraded = await regradePending(session.workbook_id, repo)
  const missing = [...known].filter((n) => !key.has(n)).sort((a, b) => a - b)

  if (key.size === 0) {
    throw new IngestError("답지에서 정답을 찾지 못했습니다. 문제 번호와 정답이 함께 적힌 빠른정답 페이지인지 확인해 주세요.")
  }
  await repo.updateSession(session.id, {
    status: "done",
    problem_count: updates.length,
    result: { matched: updates.length, missing, regraded },
  })
}

/** 정답이 생긴 문제의 '채점 대기' 풀이를 다시 채점한다 */
export async function regradePending(workbookId: number, repo: IngestRepo): Promise<number> {
  const pending = await repo.pendingAttempts(workbookId)
  const updates = pending
    .map((a) => ({ id: a.id, result: grade(a.user_answer, a.answer) }))
    .filter((u): u is { id: number; result: "correct" | "wrong" } => u.result !== "pending")
  if (updates.length) await repo.setAttemptResults(updates)
  return updates.length
}
