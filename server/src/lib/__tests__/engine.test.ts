import { describe, expect, it } from "vitest"
import {
  runIngest,
  type EngineDeps,
  type IngestRepo,
  type IngestSession,
  type NewProblem,
  type PdfDoc,
  type SessionPatch,
} from "../pipeline/engine"
import type { MathpixResult } from "../pipeline/mathpix-types"

const rect = (l: number, t: number, r: number, b: number): [number, number][] => [
  [l, t], [r, t], [r, b], [l, b],
]

// 페이지마다 문제 번호 두 개짜리 OCR 결과
function pageOcr(first: number): MathpixResult {
  return {
    image_width: 1000,
    image_height: 1400,
    line_data: [
      { type: "text", text: String(first).padStart(3, "0"), cnt: rect(40, 100, 100, 140), conversion_output: true },
      { type: "text", text: "본문 [3점]", cnt: rect(40, 160, 900, 200), conversion_output: true },
      { type: "text", text: String(first + 1).padStart(3, "0"), cnt: rect(40, 700, 100, 740), conversion_output: true },
    ],
  }
}

function memoryRepo(session: Partial<IngestSession>) {
  const state = {
    session: {
      id: 1, kind: "problems", user_id: "u1", workbook_id: null, title: "테스트 문제집", unit: "지수", chapter: null,
      original_file_path: "sessions/1/original.pdf", page_count: 0, processed_pages: 0, problem_count: 0,
      status: "uploaded", ...session,
    } as IngestSession & { error?: string | null; result?: unknown },
    workbooks: [] as { id: number; total_problems?: number }[],
    problems: [] as (NewProblem & { id: string; answer?: string | null; answer_source?: string | null })[],
    images: new Map<string, Buffer>(),
    attempts: [] as { id: number; problem_id: string; user_answer: string; result: string }[],
  }
  const repo: IngestRepo = {
    async getSession() { return { ...state.session } },
    async updateSession(_id, patch: SessionPatch) { Object.assign(state.session, patch) },
    async downloadOriginal() { return new Uint8Array([37, 80, 68, 70]) },
    async createWorkbook() { const id = state.workbooks.length + 10; state.workbooks.push({ id }); return id },
    async setWorkbookTotals(id, t) { Object.assign(state.workbooks.find((w) => w.id === id)!, t) },
    async deleteWorkbook(id) { state.workbooks = state.workbooks.filter((w) => w.id !== id) },
    async deleteProblemsOnPage(wb, page) {
      state.problems = state.problems.filter((p) => !(p.workbook_id === wb && p.page === page))
    },
    async insertProblems(rows) {
      rows.forEach((r) => state.problems.push({ ...r, id: `p${state.problems.length + 1}-${r.workbook_number}` }))
    },
    async uploadProblemImage(path, png) { state.images.set(path, png) },
    async listProblems(wb) {
      return state.problems.filter((p) => p.workbook_id === wb).map((p) => ({
        id: p.id, workbook_number: p.workbook_number, answer_source: p.answer_source ?? null,
      }))
    },
    async setAnswers(updates) {
      updates.forEach((u) => Object.assign(state.problems.find((p) => p.id === u.id)!, { answer: u.answer, answer_source: "ocr" }))
    },
    async attemptsForProblems(ids) {
      return state.attempts.filter((a) => ids.includes(a.problem_id) && a.result !== "gave_up").map((a) => ({
        id: a.id, user_answer: a.user_answer, result: a.result, answer: state.problems.find((p) => p.id === a.problem_id)?.answer ?? null,
      }))
    },
    async setAttemptResults(updates) {
      updates.forEach((u) => (state.attempts.find((a) => a.id === u.id)!.result = u.result))
    },
  }
  return { state, repo }
}

function deps(
  repo: IngestRepo,
  opts: { pages: number; ocr: (page: number) => MathpixResult; failOnPage?: number; stopAfterPages?: number }
): EngineDeps {
  let current = 0
  let rendered = 0
  const pdf: PdfDoc = {
    pageCount: opts.pages,
    async render(page) { current = page; rendered++; return { png: Buffer.from(`page${page}`), width: 1000, height: 1400 } },
    async close() {},
  }
  return {
    repo,
    openPdf: async () => pdf,
    ocr: async () => {
      if (opts.failOnPage === current) throw new Error("Mathpix 503")
      return opts.ocr(current)
    },
    crop: async (png, box) => Buffer.from(`${png.toString()}:${box.top}-${box.bottom}`),
    // stopAfterPages만큼 그린 뒤에는 시간이 다 된 것으로 본다
    get deadline() {
      return opts.stopAfterPages !== undefined && rendered >= opts.stopAfterPages ? 0 : undefined
    },
  }
}

describe("문제지 처리", () => {
  it("페이지마다 문제를 찾아 이미지·행을 만들고 완료한다", async () => {
    const { state, repo } = memoryRepo({})
    await runIngest(1, deps(repo, { pages: 2, ocr: (p) => pageOcr(p * 10) }))

    expect(state.session.status).toBe("done")
    expect(state.session.workbook_id).toBe(10)
    expect(state.session.processed_pages).toBe(2)
    expect(state.problems.map((p) => [p.page, p.workbook_number])).toEqual([[1, 10], [1, 11], [2, 20], [2, 21]])
    expect(state.problems[0].score).toBe(3)
    expect(state.problems[0].unit).toBe("지수")
    expect([...state.images.keys()][0]).toBe("u1/10/p1-c0-q10-0.png")
    expect(state.workbooks[0].total_problems).toBe(4)
  })

  it("중간에 실패하면 failed로 남고, 다시 돌리면 남은 페이지부터 이어서 한다", async () => {
    const { state, repo } = memoryRepo({})
    await runIngest(1, deps(repo, { pages: 3, ocr: (p) => pageOcr(p * 10), failOnPage: 2 }))
    expect(state.session.status).toBe("failed")
    expect(state.session.error).toContain("OCR")
    expect(state.session.processed_pages).toBe(1)

    await runIngest(1, deps(repo, { pages: 3, ocr: (p) => pageOcr(p * 10) }))
    expect(state.session.status).toBe("done")
    expect(state.problems.map((p) => p.workbook_number)).toEqual([10, 11, 20, 21, 30, 31])
    expect(state.workbooks).toHaveLength(1)
  })

  it("문제 번호를 하나도 못 찾으면 이유와 함께 실패하고 빈 문제집은 지운다", async () => {
    const { state, repo } = memoryRepo({})
    await runIngest(1, deps(repo, { pages: 1, ocr: () => ({ image_width: 10, image_height: 10, line_data: [] }) }))
    expect(state.session.status).toBe("failed")
    expect(state.session.error).toContain("문제 번호를 찾지 못했습니다")
    expect(state.workbooks).toHaveLength(0)
    expect(state.session.workbook_id).toBeNull()
  })

  it("시간이 다 되면 멈추고(paused), 다음 실행이 남은 페이지부터 이어서 한다", async () => {
    const { state, repo } = memoryRepo({})
    const first = await runIngest(1, deps(repo, { pages: 3, ocr: (p) => pageOcr(p * 10), stopAfterPages: 1 }))
    expect(first).toBe("paused")
    expect(state.session.status).toBe("processing")
    expect(state.session.processed_pages).toBe(1)

    const second = await runIngest(1, deps(repo, { pages: 3, ocr: (p) => pageOcr(p * 10) }))
    expect(second).toBe("done")
    expect(state.problems.map((p) => p.workbook_number)).toEqual([10, 11, 20, 21, 30, 31])
  })
})

describe("답지 처리", () => {
  it("번호별 정답을 넣고, 직접 고친 정답은 덮어쓰지 않으며, 대기 중 풀이를 다시 채점한다", async () => {
    const { state, repo } = memoryRepo({ kind: "answers", workbook_id: 10 })
    state.workbooks.push({ id: 10 })
    await repo.insertProblems(
      [11, 12, 13].map((n) => ({ workbook_id: 10, workbook_number: n, page: 1 }) as NewProblem)
    )
    state.problems[2].answer = "5"
    state.problems[2].answer_source = "manual"
    state.attempts.push(
      { id: 1, problem_id: state.problems[0].id, user_answer: "3", result: "pending" },
      { id: 2, problem_id: state.problems[1].id, user_answer: "1", result: "pending" }
    )

    await runIngest(
      1,
      deps(repo, { pages: 1, ocr: () => ({ image_width: 1, image_height: 1, text: "011 ③ 012 ② 013 ①" }) })
    )

    expect(state.session.status).toBe("done")
    expect(state.problems.map((p) => p.answer)).toEqual(["3", "2", "5"])
    expect(state.attempts.map((a) => a.result)).toEqual(["correct", "wrong"])
    expect(state.session.result).toEqual({ matched: 2, missing: [], regraded: 2 })
  })

  it("중간에 끊겨도 이미 읽은 페이지 텍스트로 이어서 정답을 만든다", async () => {
    const { state, repo } = memoryRepo({ kind: "answers", workbook_id: 10 })
    state.workbooks.push({ id: 10 })
    await repo.insertProblems([11, 12].map((n) => ({ workbook_id: 10, workbook_number: n, page: 1 }) as NewProblem))
    const texts = ["011 ③", "012 12"]
    const ocr = (p: number) => ({ image_width: 1, image_height: 1, text: texts[p - 1] })

    expect(await runIngest(1, deps(repo, { pages: 2, ocr, stopAfterPages: 1 }))).toBe("paused")
    expect(state.session.page_texts).toEqual(["011 ③"])
    expect(await runIngest(1, deps(repo, { pages: 2, ocr }))).toBe("done")
    expect(state.problems.map((p) => p.answer)).toEqual(["3", "12"])
  })

  it("정답이 바뀌면 이미 채점된 풀이도 다시 채점한다", async () => {
    const { state, repo } = memoryRepo({ kind: "answers", workbook_id: 10 })
    await repo.insertProblems([{ workbook_id: 10, workbook_number: 11, page: 1 } as NewProblem])
    state.problems[0].answer = "1"
    state.attempts.push({ id: 1, problem_id: state.problems[0].id, user_answer: "3", result: "wrong" })
    await runIngest(1, deps(repo, { pages: 1, ocr: () => ({ image_width: 1, image_height: 1, text: "011 ③" }) }))
    expect(state.attempts[0].result).toBe("correct")
  })

  it("정답을 못 찾으면 실패", async () => {
    const { state, repo } = memoryRepo({ kind: "answers", workbook_id: 10 })
    await runIngest(1, deps(repo, { pages: 1, ocr: () => ({ image_width: 1, image_height: 1, text: "해설" }) }))
    expect(state.session.status).toBe("failed")
  })
})
