// POST /api/ingest/{id}/continue — 시간 제한으로 멈춘 처리를 새 함수 호출로 이어 간다
// 서버가 자기 자신을 부르는 내부용이라, 사용자 토큰 대신 세션별 서명 토큰으로 확인한다.
import { HttpError } from "@/lib/auth"
import { handler, json } from "@/lib/http"
import { scheduleIngest, verifyContinueToken } from "@/lib/pipeline/runner"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"
export const maxDuration = 300

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id) || !verifyContinueToken(id, req.headers.get("x-ingest-token"))) {
    throw new HttpError(403, "forbidden")
  }

  // 아직 처리 중인 세션만 이어 간다 (그사이 끝났거나 실패했으면 아무것도 안 함)
  const { data: claimed } = await getSupabaseAdmin()
    .from("ingest_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "processing")
    .select("id")
  if (!claimed?.length) return json({ ok: true, skipped: true })

  scheduleIngest(id, new URL(req.url).origin)
  return json({ ok: true })
})
