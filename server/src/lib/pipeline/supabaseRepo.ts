// IngestRepo의 Supabase 구현 (service role)
import "server-only"
import sharp from "sharp"
import { getSupabaseAdmin } from "../supabaseAdmin"
import type { EngineDeps, IngestRepo, IngestSession } from "./engine"
import { ocrPage } from "./mathpix"
import { openPdf } from "./render"

export const UPLOAD_BUCKET = "uploads"
export const PROBLEM_BUCKET = "problems"

function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`)
  return res.data
}

export function supabaseRepo(): IngestRepo {
  const db = getSupabaseAdmin()

  return {
    async getSession(id) {
      return must(
        await db.from("ingest_sessions").select("*").eq("id", id).single(),
        "ingest_sessions 조회"
      ) as IngestSession
    },

    async updateSession(id, patch) {
      must(
        await db.from("ingest_sessions").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id),
        "ingest_sessions 갱신"
      )
    },

    async downloadOriginal(path) {
      const blob = must(await db.storage.from(UPLOAD_BUCKET).download(path), "원본 다운로드")
      if (!blob) throw new Error("원본 다운로드: 파일이 비어 있습니다.")
      return new Uint8Array(await blob.arrayBuffer())
    },

    async createWorkbook(w) {
      const row = must(
        await db.from("workbooks").insert({ ...w, source_type: "pdf" }).select("id").single(),
        "workbooks 생성"
      ) as { id: number }
      return row.id
    },

    async setWorkbookTotals(workbookId, totals) {
      must(await db.from("workbooks").update(totals).eq("id", workbookId), "workbooks 갱신")
    },

    async deleteWorkbook(workbookId) {
      must(await db.from("workbooks").delete().eq("id", workbookId), "빈 문제집 삭제")
    },

    async deleteProblemsOnPage(workbookId, page) {
      must(await db.from("problems").delete().eq("workbook_id", workbookId).eq("page", page), "problems 삭제")
    },

    async insertProblems(rows) {
      must(await db.from("problems").insert(rows), "problems 저장")
    },

    async uploadProblemImage(path, png) {
      must(
        await db.storage.from(PROBLEM_BUCKET).upload(path, png, { contentType: "image/png", upsert: true }),
        "문제 이미지 업로드"
      )
    },

    async listProblems(workbookId) {
      return must(
        await db.from("problems").select("id, workbook_number, answer_source").eq("workbook_id", workbookId),
        "problems 조회"
      ) as { id: string; workbook_number: number | null; answer_source: string | null }[]
    },

    async setAnswers(updates) {
      // 문제마다 정답이 달라 한 번에 update할 수 없으니 묶어서 병렬로 보낸다
      for (let i = 0; i < updates.length; i += 20) {
        await Promise.all(
          updates.slice(i, i + 20).map(async (u) =>
            must(
              await db.from("problems").update({ answer: u.answer, answer_source: "ocr" }).eq("id", u.id),
              "정답 저장"
            )
          )
        )
      }
    },

    async attemptsForProblems(problemIds) {
      const out: { id: number; user_answer: string; result: string; answer: string | null }[] = []
      // in() 목록이 너무 길지 않게 나눠서, 한 번에 최대 1000행씩
      for (let i = 0; i < problemIds.length; i += 100) {
        const chunk = problemIds.slice(i, i + 100)
        for (let from = 0; ; from += 1000) {
          const rows = must(
            await db
              .from("attempts")
              .select("id, user_answer, result, problems!inner(answer)")
              .in("problem_id", chunk)
              .neq("result", "gave_up")
              .order("id")
              .range(from, from + 999),
            "풀이 기록 조회"
          ) as unknown as { id: number; user_answer: string; result: string; problems: { answer: string | null } }[]
          for (const r of rows) out.push({ id: r.id, user_answer: r.user_answer, result: r.result, answer: r.problems.answer })
          if (rows.length < 1000) break
        }
      }
      return out
    },

    async setAttemptResults(updates) {
      for (const result of ["correct", "wrong", "pending"] as const) {
        const ids = updates.filter((u) => u.result === result).map((u) => u.id)
        if (ids.length) must(await db.from("attempts").update({ result }).in("id", ids), "재채점 저장")
      }
    },
  }
}

export async function cropPng(png: Buffer, box: { left: number; top: number; right: number; bottom: number }) {
  const region = await sharp(png)
    .extract({ left: box.left, top: box.top, width: box.right - box.left, height: box.bottom - box.top })
    .toBuffer()
  // 단 아래쪽 빈 공간 등 흰 여백을 잘라내고 고르게 16px 여백을 다시 준다
  const trimmed = await sharp(region)
    .trim({ background: "#ffffff", threshold: 12 })
    .toBuffer()
    .catch(() => region) // 전부 흰색이면 trim이 실패한다
  return sharp(trimmed)
    .extend({ top: 16, bottom: 16, left: 16, right: 16, background: "#ffffff" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer()
}

export function productionDeps(deadline?: number): EngineDeps {
  return { repo: supabaseRepo(), openPdf, ocr: ocrPage, crop: cropPng, deadline }
}
