// 실제 서버 구현: 읽기는 Supabase(RLS)로 바로, 업로드·채점처럼 서버가 해야 하는 일은 API로
import { File as ExpoFile } from "expo-file-system"
import { Platform } from "react-native"
import type { Backend, UploadInput } from "./backend"
import { env } from "./env"
import { supabase } from "./supabase"
import {
  DEFAULT_SETTINGS,
  type Attempt,
  type IngestSession,
  type PracticeSession,
  type Problem,
  type ProblemWithStatus,
  type Settings,
  type Stats,
  type WorkbookSummary,
  type WrongItem,
} from "./types"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new ApiError(500, friendly(res.error.message))
  return res.data
}

function friendly(message: string) {
  if (/JWT|token|not authenticated/i.test(message)) return "로그인이 만료되었습니다. 다시 로그인해 주세요."
  if (/Failed to fetch|Network request failed/i.test(message)) return "인터넷 연결을 확인해 주세요."
  return message
}

async function token() {
  const { data } = await supabase.auth.getSession()
  const t = data.session?.access_token
  if (!t) throw new ApiError(401, "로그인이 필요합니다.")
  return t
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!env.apiUrl) throw new ApiError(0, "서버 주소(EXPO_PUBLIC_API_URL)가 설정되어 있지 않습니다.")
  let res: Response
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await token()}`,
        ...(init.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError(0, "서버에 연결할 수 없습니다. 인터넷 연결이나 서버 주소를 확인해 주세요.")
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new ApiError(res.status, body.error ?? `요청 실패 (${res.status})`)
  return body
}

async function userId() {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new ApiError(401, "로그인이 필요합니다.")
  return id
}

const PROBLEM_COLUMNS =
  "id, workbook_id, workbook_number, page, score, unit, raw_text, image_path, answer, answer_source, hint"

async function fileBody(file: UploadInput["file"]): Promise<ArrayBuffer | File> {
  if (Platform.OS === "web" && file.file) return file.file
  return new ExpoFile(file.uri).arrayBuffer()
}

export const supabaseBackend: Backend = {
  async profile() {
    const id = await userId()
    const { data: auth } = await supabase.auth.getUser()
    const row = check(await supabase.from("profiles").select("id, nickname, role").eq("id", id).maybeSingle())
    return {
      id,
      email: auth.user?.email ?? null,
      nickname: row?.nickname ?? null,
      role: (row?.role as "user" | "admin") ?? "user",
    }
  },

  async updateNickname(nickname) {
    const id = await userId()
    check(await supabase.from("profiles").upsert({ id, nickname: nickname.trim() }, { onConflict: "id" }))
  },

  async deleteAccount() {
    await api("/api/account", { method: "DELETE" })
    await supabase.auth.signOut({ scope: "local" })
  },

  async settings() {
    const id = await userId()
    const row = check(
      await supabase
        .from("user_settings")
        .select("daily_count, time_per_problem_sec, grading_mode, stylus_only")
        .eq("user_id", id)
        .maybeSingle()
    )
    return { ...DEFAULT_SETTINGS, ...(row ?? {}) } as Settings
  },

  async saveSettings(s) {
    const id = await userId()
    check(
      await supabase
        .from("user_settings")
        .upsert({ user_id: id, ...s, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    )
  },

  async workbooks() {
    return check(await supabase.rpc("my_workbooks")) as WorkbookSummary[]
  },

  async workbook(id) {
    const [list, problems] = await Promise.all([
      supabase.rpc("my_workbooks"),
      supabase.rpc("workbook_problems", { p_workbook_id: id }),
    ])
    const workbook = (check(list) as WorkbookSummary[]).find((w) => w.id === id)
    if (!workbook) throw new ApiError(404, "문제집을 찾을 수 없습니다.")
    return { workbook, problems: check(problems) as ProblemWithStatus[] }
  },

  async renameWorkbook(id, title) {
    check(await supabase.from("workbooks").update({ title: title.trim() }).eq("id", id))
  },

  async deleteWorkbook(id) {
    await api(`/api/workbooks/${id}`, { method: "DELETE" })
  },

  async saveAnswers(workbookId, answers) {
    return api(`/api/workbooks/${workbookId}/answers`, { method: "PUT", body: JSON.stringify({ answers }) })
  },

  async ingests() {
    return check(
      await supabase
        .from("ingest_sessions")
        .select("id, kind, workbook_id, title, status, page_count, processed_pages, problem_count, error, result, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
    ) as IngestSession[]
  },

  async upload(input, onProgress) {
    const created = await api<{ sessionId: number; upload: { bucket: string; path: string; token: string } }>(
      "/api/ingest",
      {
        method: "POST",
        body: JSON.stringify({
          kind: input.kind,
          title: input.title,
          unit: input.unit,
          chapter: input.chapter,
          workbookId: input.workbookId,
        }),
      }
    )
    onProgress?.("uploading")
    const body = await fileBody(input.file)
    const up = await supabase.storage
      .from(created.upload.bucket)
      .uploadToSignedUrl(created.upload.path, created.upload.token, body, { contentType: "application/pdf", upsert: true })
    if (up.error) throw new ApiError(500, `파일을 올리지 못했습니다: ${up.error.message}`)
    onProgress?.("starting")
    await api(`/api/ingest/${created.sessionId}/start`, { method: "POST" })
    return created.sessionId
  },

  async retryIngest(id) {
    await api(`/api/ingest/${id}/start`, { method: "POST" })
  },

  async startDaily() {
    return check(await supabase.rpc("start_daily")) as PracticeSession
  },

  async startSession(mode, workbookId, limit = 20) {
    const problems = check(
      await supabase.rpc("practice_problems", { p_mode: mode, p_workbook_id: workbookId ?? null, p_limit: limit })
    ) as Problem[]
    if (!problems.length) return null
    const id = await userId()
    return check(
      await supabase
        .from("practice_sessions")
        .insert({ user_id: id, mode, workbook_id: workbookId ?? null, problem_ids: problems.map((p) => p.id) })
        .select("*")
        .single()
    ) as PracticeSession
  },

  async startWith(mode, problemIds, workbookId) {
    const id = await userId()
    return check(
      await supabase
        .from("practice_sessions")
        .insert({ user_id: id, mode, workbook_id: workbookId ?? null, problem_ids: problemIds })
        .select("*")
        .single()
    ) as PracticeSession
  },

  async sessionBundle(id) {
    const session = check(await supabase.from("practice_sessions").select("*").eq("id", id).single()) as PracticeSession
    const ids = session.problem_ids
    const [problems, attempts] = await Promise.all([
      ids.length
        ? supabase.from("problems").select(PROBLEM_COLUMNS).in("id", ids)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("attempts")
        .select("id, problem_id, user_answer, result, time_spent_sec, hint_used, created_at")
        .eq("session_id", id)
        .order("created_at"),
    ])
    const order = new Map(ids.map((pid, i) => [pid, i]))
    const sorted = (check(problems) as Problem[]).sort((a, b) => order.get(a.id)! - order.get(b.id)!)
    return { session, problems: sorted, attempts: check(attempts) as Attempt[] }
  },

  async finishSession(id) {
    check(await supabase.from("practice_sessions").update({ finished_at: new Date().toISOString() }).eq("id", id))
  },

  async submit(input) {
    return api("/api/attempts", { method: "POST", body: JSON.stringify(input) })
  },

  async wrongNotes() {
    const [problems, books] = await Promise.all([
      supabase.rpc("practice_problems", { p_mode: "wrong", p_workbook_id: null, p_limit: 100 }),
      supabase.rpc("my_workbooks"),
    ])
    const titles = new Map((check(books) as WorkbookSummary[]).map((w) => [w.id, w.title]))
    return (check(problems) as Problem[]).map(
      (p): WrongItem => ({ ...p, workbook_title: titles.get(p.workbook_id) ?? "문제집", last_wrong_at: null })
    )
  },

  async stats(days) {
    return check(await supabase.rpc("my_stats", { p_days: days })) as Stats
  },

  async imageSources(paths) {
    const unique = [...new Set(paths.filter(Boolean))]
    if (!unique.length) return {}
    const { data, error } = await supabase.storage.from("problems").createSignedUrls(unique, 60 * 60)
    if (error) throw new ApiError(500, "문제 이미지를 불러오지 못했습니다.")
    const out: Record<string, string> = {}
    for (const d of data ?? []) if (d.path && d.signedUrl) out[d.path] = d.signedUrl
    return out
  },
}
