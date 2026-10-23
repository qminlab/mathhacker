// POST /api/ingest — 업로드 세션 만들기
//
// 1) 앱이 { kind, title, unit, chapter, workbookId } 를 보내면 세션을 만들고
//    Storage에 직접 올릴 수 있는 서명된 업로드 URL을 돌려준다.
//    (서버리스 함수는 요청 본문 크기 제한이 있어서 PDF를 서버로 보내지 않는다)
// 2) 앱이 파일을 올린 뒤 POST /api/ingest/{id}/start 로 처리를 시작한다.
import { requireUser, HttpError } from "@/lib/auth"
import { handler, json, preflight } from "@/lib/http"
import { UPLOAD_BUCKET } from "@/lib/pipeline/supabaseRepo"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

const text = (v: unknown, max = 100) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null)

export const OPTIONS = preflight

export const POST = handler(async (req: Request) => {
  const { user, db } = await requireUser(req)
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const kind = body.kind === "answers" ? "answers" : "problems"
  let workbookId: number | null = null

  if (kind === "answers") {
    workbookId = Number(body.workbookId)
    if (!Number.isInteger(workbookId)) throw new HttpError(400, "답지를 연결할 문제집을 골라 주세요.")
    const { data: wb } = await db.from("workbooks").select("id, owner_id").eq("id", workbookId).maybeSingle()
    if (!wb || wb.owner_id !== user.id) throw new HttpError(403, "내 문제집에만 답지를 올릴 수 있습니다.")
  }

  const title = text(body.title)
  if (kind === "problems" && !title) throw new HttpError(400, "문제집 이름을 입력해 주세요.")

  const admin = getSupabaseAdmin()
  const { data: session, error } = await admin
    .from("ingest_sessions")
    .insert({
      user_id: user.id,
      kind,
      workbook_id: workbookId,
      title,
      unit: text(body.unit),
      chapter: text(body.chapter),
      source_type: "pdf",
      status: "uploaded",
    })
    .select("id")
    .single()
  if (error || !session) {
    console.error("ingest_sessions insert", error)
    throw new HttpError(500, "업로드 세션을 만들지 못했습니다.")
  }

  const path = `sessions/${session.id}/original.pdf`
  const signed = await admin.storage.from(UPLOAD_BUCKET).createSignedUploadUrl(path, { upsert: true })
  if (signed.error || !signed.data) {
    console.error("signed upload url", signed.error)
    throw new HttpError(500, "업로드 주소를 만들지 못했습니다.")
  }
  await admin.from("ingest_sessions").update({ original_file_path: path }).eq("id", session.id)

  return json({
    sessionId: session.id,
    upload: { bucket: UPLOAD_BUCKET, path, token: signed.data.token, signedUrl: signed.data.signedUrl },
  })
})
