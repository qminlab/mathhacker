// POST /api/ingest/{id}/start — 업로드한 PDF 처리 시작 (실패했거나 멈춘 세션의 재시도도 이것으로)
// 처리는 응답을 보낸 뒤 이어서 하고, 앱은 ingest_sessions를 읽어 진행률을 보여 준다.
import { requireUser, HttpError } from "@/lib/auth"
import { handler, json, preflight } from "@/lib/http"
import { scheduleIngest } from "@/lib/pipeline/runner"
import { UPLOAD_BUCKET } from "@/lib/pipeline/supabaseRepo"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"
// OCR은 페이지당 몇 초씩 걸린다. 시간이 모자라면 엔진이 멈추고 /continue로 이어 간다.
export const maxDuration = 300

const MAX_BYTES = 50 * 1024 * 1024
/** 처리 중인데 이만큼 소식이 없으면 멈춘 것으로 보고 다시 시작을 허락한다 */
const STALE_MS = 6 * 60_000

export const OPTIONS = preflight

async function checkUploadedPdf(path: string) {
  const admin = getSupabaseAdmin()
  const slash = path.lastIndexOf("/")
  const { data: files } = await admin.storage
    .from(UPLOAD_BUCKET)
    .list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 1 })
  const file = files?.find((f) => f.name === path.slice(slash + 1))
  if (!file) throw new HttpError(400, "업로드된 파일을 찾지 못했습니다. 다시 올려 주세요.")
  const size = Number((file.metadata as { size?: number } | null)?.size ?? 0)
  if (size > MAX_BYTES) throw new HttpError(413, "PDF는 50MB 이하만 올릴 수 있습니다.")

  // 앞 5바이트만 받아서 PDF인지 확인
  const signed = await admin.storage.from(UPLOAD_BUCKET).createSignedUrl(path, 60)
  if (signed.error || !signed.data) throw new HttpError(500, "업로드한 파일을 확인하지 못했습니다.")
  const res = await fetch(signed.data.signedUrl, { headers: { Range: "bytes=0-4" } })
  const head = new TextDecoder().decode(new Uint8Array(await res.arrayBuffer()).slice(0, 5))
  return head === "%PDF-"
}

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
  if (session.status === "done") return json({ ok: true, status: "done" })

  if (session.status !== "processing") {
    const isPdf = await checkUploadedPdf(session.original_file_path as string)
    if (!isPdf) {
      await admin.from("ingest_sessions").update({ status: "failed", error: "PDF 파일이 아닙니다." }).eq("id", id)
      throw new HttpError(400, "PDF 파일만 올릴 수 있습니다.")
    }
  }

  // 동시에 두 번 눌려도 한 번만 시작되게: 조건이 맞을 때만 processing으로 바꾸고, 바뀐 경우에만 실행한다
  const now = new Date().toISOString()
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString()
  const claim = admin
    .from("ingest_sessions")
    .update({ status: "processing", error: null, updated_at: now })
    .eq("id", id)
  const { data: claimed } = await (session.status === "processing"
    ? claim.eq("status", "processing").lt("updated_at", staleBefore)
    : claim.in("status", ["uploaded", "failed"])
  ).select("id")

  if (!claimed?.length) return json({ ok: true, status: "processing" })

  scheduleIngest(id, new URL(req.url).origin)
  return json({ ok: true, status: "processing" })
})
