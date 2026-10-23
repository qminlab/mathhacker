// 체험 모드: 서버 없이 기기 안에서만 도는 예제 데이터 (EXPO_PUBLIC_DEMO=1)
// 예제 문제는 직접 만든 문제이고 실제 교재 내용이 아니다.
import type { Backend } from "./backend"
import demoGenerated from "./demoGenerated.json"
import { GEN_IMAGES } from "./demoGeneratedImages"
import { localGrade } from "./answers"
import { xpFor, type Progress } from "./progress"
import {
  DEFAULT_SETTINGS,
  type Attempt,
  type IngestSession,
  type PracticeSession,
  type Problem,
  type Result,
  type Settings,
  type WorkbookSummary,
} from "./types"

const IMAGES: Record<string, number> = {
  "demo/q1.png": require("../../assets/demo/q1.png"),
  "demo/q2.png": require("../../assets/demo/q2.png"),
  "demo/q3.png": require("../../assets/demo/q3.png"),
  "demo/q4.png": require("../../assets/demo/q4.png"),
  "demo/q5.png": require("../../assets/demo/q5.png"),
  "demo/q6.png": require("../../assets/demo/q6.png"),
}

const CHOICES = "(1) (2) (3) (4) (5)"
const mine: Problem[] = [
  { n: 1, unit: "지수함수", text: `f(x)=2^x, f(3)+f(1) ${CHOICES}`, answer: "3", score: 3 },
  { n: 2, unit: "로그함수", text: `log2 8 + log3 9 ${CHOICES}`, answer: "3", score: 3 },
  { n: 3, unit: "수열", text: "등차수열 a10", answer: "39", score: 4 },
  { n: 4, unit: "지수함수", text: `3^(x+1)=27 ${CHOICES}`, answer: "2", score: 3 },
  { n: 5, unit: "이차함수", text: `꼭짓점 ${CHOICES}`, answer: "3", score: 3 },
  { n: 6, unit: "부등식", text: "x + 9/x 최솟값", answer: "6", score: 4 },
].map((p) => ({
  id: `demo-${p.n}`,
  workbook_id: 1,
  workbook_number: p.n,
  page: 1,
  score: p.score,
  unit: p.unit,
  raw_text: p.text,
  image_path: `demo/q${p.n}.png`,
  answer: p.answer,
  answer_source: "ocr" as const,
  hint: p.n === 6 ? "산술평균과 기하평균의 관계를 떠올려 보세요." : null,
}))

// 공용(코드로 만든) 문제집 몇 개: server의 npm run export:demo 로 만든다
const publicBooks = (demoGenerated as { key: string; title: string; grade: string; unit: string; problems: { file: string; number: number; raw_text: string; answer: string; hint: string | null }[] }[]).map(
  (b, i) => ({
    id: 100 + i,
    title: b.title,
    unit: b.unit,
    grade: b.grade,
    problems: b.problems.map(
      (p): Problem => ({
        id: `gen-${b.key}-${p.number}`,
        workbook_id: 100 + i,
        workbook_number: p.number,
        page: 1,
        score: null,
        unit: b.unit,
        raw_text: p.raw_text,
        image_path: `gen/${p.file}`,
        answer: p.answer,
        answer_source: "generated",
        hint: p.hint,
      })
    ),
  })
)
const problems: Problem[] = [...mine, ...publicBooks.flatMap((b) => b.problems)]
const IMAGE_ALL: Record<string, number> = { ...IMAGES, ...GEN_IMAGES }

const state = {
  nickname: "체험생",
  settings: { ...DEFAULT_SETTINGS, daily_count: 4, grade: "h2" } as Settings,
  attempts: [] as Attempt[],
  sessions: [] as PracticeSession[],
  workbookTitle: "지수와 로그 예제 문제집",
  nextId: 1,
}

// 지난 며칠 풀이 기록 (통계 화면이 비어 보이지 않게)
;(function seed() {
  const now = Date.now()
  const past: [string, Result, number][] = [
    ["demo-1", "correct", 4],
    ["demo-2", "wrong", 3],
    ["demo-5", "correct", 2],
    ["demo-6", "gave_up", 1],
  ]
  for (const [pid, result, daysAgo] of past) {
    state.attempts.push({
      id: state.nextId++,
      problem_id: pid,
      user_answer: result === "correct" ? problems.find((p) => p.id === pid)!.answer! : "1",
      result,
      time_spent_sec: 140 + daysAgo * 20,
      hint_used: false,
      created_at: new Date(now - daysAgo * 86400_000).toISOString(),
    })
  }
})()

const wait = (ms = 180) => new Promise((r) => setTimeout(r, ms))

function latest(pid: string) {
  return [...state.attempts].reverse().find((a) => a.problem_id === pid) ?? null
}

function counts(list: Problem[]) {
  const results = list.map((p) => latest(p.id)?.result ?? null)
  return {
    total: list.length,
    with_answer: list.filter((p) => p.answer).length,
    solved: results.filter(Boolean).length,
    correct: results.filter((r) => r === "correct").length,
    wrong: results.filter((r) => r === "wrong" || r === "gave_up").length,
  }
}

function summary(id = 1): WorkbookSummary {
  const pub = publicBooks.find((b) => b.id === id)
  if (pub)
    return { id, title: pub.title, unit: pub.unit, chapter: null, is_mine: false, created_at: new Date(Date.now() - 30 * 86400_000).toISOString(), grade: pub.grade, ...counts(pub.problems) }
  return {
    id: 1,
    title: state.workbookTitle,
    unit: "지수함수와 로그함수",
    chapter: "기본 다지기",
    is_mine: true,
    created_at: new Date(Date.now() - 7 * 86400_000).toISOString(),
    grade: null,
    ...counts(mine),
  }
}

/** 오늘의 세트 후보: 내 문제 + 고른 학년의 공용 문제 */
function pool() {
  return problems.filter((p) => p.workbook_id === 1 || publicBooks.find((b) => b.id === p.workbook_id)?.grade === state.settings.grade)
}

function newSession(mode: PracticeSession["mode"], ids: string[]): PracticeSession {
  const s: PracticeSession = {
    id: state.nextId++,
    mode,
    workbook_id: 1,
    problem_ids: ids,
    day: new Date().toISOString().slice(0, 10),
    finished_at: null,
  }
  state.sessions.push(s)
  return s
}

export const demoBackend: Backend = {
  async profile() {
    await wait()
    return { id: "demo", email: "demo@squoo.app", nickname: state.nickname, role: "user" }
  },
  async updateNickname(n) {
    state.nickname = n
  },
  async deleteAccount() {
    throw new Error("체험 모드에는 지울 계정이 없어요.")
  },
  async settings() {
    return { ...state.settings }
  },
  async saveSettings(s) {
    state.settings = { ...s }
  },
  async workbooks() {
    await wait()
    return [summary(), ...publicBooks.map((b) => summary(b.id))]
  },
  async workbook(id) {
    await wait()
    return {
      workbook: summary(id),
      problems: problems.filter((p) => p.workbook_id === id).map((p) => ({ ...p, last_result: latest(p.id)?.result ?? null })),
    }
  },
  async renameWorkbook(_id, title) {
    state.workbookTitle = title
  },
  async deleteWorkbook() {
    throw new Error("체험 모드에서는 문제집을 지울 수 없습니다.")
  },
  async saveAnswers(_wb, answers) {
    for (const a of answers) {
      const p = problems.find((x) => x.id === a.problemId)
      if (p) {
        p.answer = a.answer || null
        p.answer_source = a.answer ? "manual" : null
      }
    }
    return { saved: answers.length, regraded: 0 }
  },
  async ingests(): Promise<IngestSession[]> {
    return []
  },
  async upload() {
    throw new Error("체험 모드에서는 업로드할 수 없습니다. 서버를 연결하면 쓸 수 있어요.")
  },
  async retryIngest() {},
  async startDaily() {
    const today = new Date().toISOString().slice(0, 10)
    const existing = state.sessions.find((s) => s.mode === "daily" && s.day === today)
    if (existing && existing.problem_ids.length) return existing
    const unsolved = pool().filter((p) => !latest(p.id)).map((p) => p.id)
    return newSession("daily", unsolved.slice(0, state.settings.daily_count))
  },
  async startSession(mode, workbookId) {
    const inBook = workbookId ? problems.filter((p) => p.workbook_id === workbookId) : problems
    const ids =
      mode === "wrong"
        ? inBook.filter((p) => ["wrong", "gave_up"].includes(latest(p.id)?.result ?? "")).map((p) => p.id)
        : inBook.filter((p) => !latest(p.id)).map((p) => p.id)
    return ids.length ? newSession(mode, ids) : null
  },
  async startWith(mode, ids) {
    return newSession(mode, ids)
  },
  async sessionBundle(id) {
    await wait()
    const session = state.sessions.find((s) => s.id === id)
    if (!session) throw new Error("풀이 세션을 찾을 수 없습니다.")
    return {
      session,
      problems: session.problem_ids.map((pid) => problems.find((p) => p.id === pid)!),
      attempts: state.attempts.filter((a) => (a as Attempt & { session_id?: number }).session_id === id),
    }
  },
  async finishSession(id) {
    const s = state.sessions.find((x) => x.id === id)
    if (s) s.finished_at = new Date().toISOString()
  },
  async submit(input) {
    await wait(260)
    const p = problems.find((x) => x.id === input.problemId)!
    const result: Result = input.gaveUp ? "gave_up" : localGrade(input.answer, p.answer)
    const attempt = {
      id: state.nextId++,
      problem_id: p.id,
      user_answer: input.answer,
      result,
      time_spent_sec: input.timeSpentSec,
      hint_used: !!input.hintUsed,
      created_at: new Date().toISOString(),
      session_id: input.sessionId,
    }
    state.attempts.push(attempt)
    return { id: attempt.id, result, correctAnswer: p.answer }
  },
  async wrongNotes() {
    await wait()
    return problems
      .filter((p) => ["wrong", "gave_up"].includes(latest(p.id)?.result ?? ""))
      .map((p) => ({ ...p, workbook_title: summary(p.workbook_id ?? 1).title, last_wrong_at: latest(p.id)!.created_at }))
  },
  async progress(): Promise<Progress> {
    const scored = state.attempts.filter((a) => a.result !== "pending")
    const kst = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 10)
    const today = kst(new Date().toISOString())
    const days = new Set(scored.map((a) => kst(a.created_at)))
    const dayBefore = (d: string) => new Date(new Date(`${d}T00:00:00Z`).getTime() - 86400_000).toISOString().slice(0, 10)
    // 오늘(또는 어제)부터 거꾸로 이어진 날 수
    let streak = 0
    let cursor = days.has(today) ? today : dayBefore(today)
    while (days.has(cursor)) {
      streak++
      cursor = dayBefore(cursor)
    }
    const sorted = [...days].sort()
    let best = 0
    let run = 0
    let prev = ""
    for (const d of sorted) {
      run = prev && dayBefore(d) === prev ? run + 1 : 1
      best = Math.max(best, run)
      prev = d
    }
    const week = Array.from({ length: 7 }, (_, i) => {
      let d = today
      for (let k = 0; k < 6 - i; k++) d = dayBefore(d)
      return { day: d, active: days.has(d) }
    })
    const correctIds = new Set(scored.filter((a) => a.result === "correct").map((a) => a.problem_id))
    const wrongIds = new Set(scored.filter((a) => a.result === "wrong" || a.result === "gave_up").map((a) => a.problem_id))
    return {
      xp: scored.reduce((s, a) => s + xpFor(a.result, a.hint_used), 0),
      solved: scored.length,
      correct: scored.filter((a) => a.result === "correct").length,
      streak,
      best_streak: best,
      active_today: days.has(today),
      today_solved: scored.filter((a) => kst(a.created_at) === today).length,
      week,
      perfect_sets: 0,
      comebacks: [...wrongIds].filter((id) => correctIds.has(id)).length,
      no_hint_correct: scored.filter((a) => a.result === "correct" && !a.hint_used).length,
      days_active: days.size,
    }
  },
  async stats(days) {
    await wait()
    const scored = state.attempts.filter((a) => a.result !== "pending")
    const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10)
    const daily = Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400_000).toISOString().slice(0, 10)
      const list = scored.filter((a) => dayKey(a.created_at) === d)
      return { day: d, total: list.length, correct: list.filter((a) => a.result === "correct").length }
    })
    const units = new Map<string, { total: number; correct: number }>()
    for (const a of scored) {
      const u = problems.find((p) => p.id === a.problem_id)?.unit ?? "미분류"
      const v = units.get(u) ?? { total: 0, correct: 0 }
      v.total++
      if (a.result === "correct") v.correct++
      units.set(u, v)
    }
    return {
      daily,
      by_unit: [...units].map(([unit, v]) => ({ unit, ...v })).sort((a, b) => a.correct / a.total - b.correct / b.total),
      totals: {
        total: scored.length,
        correct: scored.filter((a) => a.result === "correct").length,
        wrong: scored.filter((a) => a.result === "wrong" || a.result === "gave_up").length,
        time_sec: scored.reduce((s, a) => s + a.time_spent_sec, 0),
      },
    }
  },
  async imageSources(paths) {
    const out: Record<string, number> = {}
    for (const p of paths) if (IMAGE_ALL[p]) out[p] = IMAGE_ALL[p]
    return out
  },
}
