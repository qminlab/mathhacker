// POST /api/ingest/{id}/start — 업로드한 PDF 처리 시작 (실패한 세션의 재시도도 이것으로)
// 처리는 응답을 보낸 뒤 after()에서 이어서 하고, 앱은 ingest_sessions를 읽어 진행률을 보여 준다.
import { after } from "next/server"
import { requireUser, HttpError } from "@/lib/auth"
import { handler, json, preflight } from "@/lib/http"
import { runIngest } from "@/lib/pipeline/engine"
import { productionDeps, UPLOAD_BUCKET } from "@/lib/pipeline/supabaseRepo"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"
// OCR은 페이지당 몇 초씩 걸린다. 끝나지 못해도 다시 시작하면 남은 페이지부터 이어서 한다.
export const maxDuration = 300

const MAX_BYTES = 50 * 1024 * 1024

export const OPTIONS = preflight

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { user } = await requireUser(req)
  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id)) throw new HttpError(400, "잘못된 세션입니다.")

  const admin = getSupabaseAdmin()
  const { data: session } = await admin
    .from("ingest_sessions")
    .select("id, user_id, status, original_file_path, updated_at")
    .eq("id", id)
    .maybeSingle()
  if (!session || session.user_id !== user.id) throw new HttpError(404, "세션을 찾을 수 없습니다.")
  // 처리 중인데 6분 넘게 소식이 없으면(함수 시간 초과 등) 멈춘 것으로 보고 다시 시작한다
  const stale = Date.now() - new Date(session.updated_at as string).getTime() > 6 * 60_000
  if (session.status === "processing" && !stale) return json({ ok: true, status: "processing" })
  if (session.status === "done") return json({ ok: true, status: "done" })

  // 실제로 올라간 파일인지, PDF인지, 크기는 괜찮은지 확인
  const path = session.original_file_path as string
  const head = await admin.storage.from(UPLOAD_BUCKET).download(path)
  if (head.error || !head.data) throw new HttpError(400, "업로드된 파일을 찾지 못했습니다. 다시 올려 주세요.")
  if (head.data.size > MAX_BYTES) throw new HttpError(413, "PDF는 50MB 이하만 올릴 수 있습니다.")
  const signature = new TextDecoder().decode(new Uint8Array(await head.data.slice(0, 5).arrayBuffer()))
  if (signature !== "%PDF-") {
    await admin.from("ingest_sessions").update({ status: "failed", error: "PDF 파일이 아닙니다." }).eq("id", id)
    throw new HttpError(400, "PDF 파일만 올릴 수 있습니다.")
  }

  await admin
    .from("ingest_sessions")
    .update({ status: "processing", error: null, updated_at: new Date().toISOString() })
    .eq("id", id)
  after(() => runIngest(id, productionDeps()))

  return json({ ok: true, status: "processing" })
})
