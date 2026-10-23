// DELETE /api/account — 계정과 내 데이터 전부 삭제 (앱스토어 심사 요건: 앱 안에서 계정 삭제)
import { requireUser, HttpError } from "@/lib/auth"
import { handler, json, preflight } from "@/lib/http"
import { PROBLEM_BUCKET, UPLOAD_BUCKET } from "@/lib/pipeline/supabaseRepo"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"
export const maxDuration = 60

export const OPTIONS = preflight

async function removeFolder(bucket: string, folder: string) {
  const storage = getSupabaseAdmin().storage.from(bucket)
  for (;;) {
    const { data } = await storage.list(folder, { limit: 1000 })
    if (!data?.length) return
    const files = data.filter((f) => f.id).map((f) => `${folder}/${f.name}`)
    const dirs = data.filter((f) => !f.id).map((f) => `${folder}/${f.name}`)
    for (const d of dirs) await removeFolder(bucket, d)
    if (files.length) await storage.remove(files)
    if (data.length < 1000) return
  }
}

export const DELETE = handler(async (req: Request) => {
  const { user } = await requireUser(req)
  const admin = getSupabaseAdmin()

  // 1) 잘라 둔 문제 이미지 (경로 첫 폴더 = 내 id)
  await removeFolder(PROBLEM_BUCKET, user.id)

  // 2) 올린 원본 PDF
  const { data: sessions } = await admin.from("ingest_sessions").select("id").eq("user_id", user.id)
  for (const s of sessions ?? []) await removeFolder(UPLOAD_BUCKET, `sessions/${s.id}`)
  await admin.from("ingest_sessions").delete().eq("user_id", user.id)

  // 3) 내 문제집 (문제·풀이 기록은 외래키로 함께 지워진다)
  const { error: wbError } = await admin.from("workbooks").delete().eq("owner_id", user.id)
  if (wbError) throw new HttpError(500, "문제집을 지우지 못했습니다.")

  // 4) 계정 (profiles·설정·풀이 세션·풀이 기록도 함께)
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) throw new HttpError(500, "계정을 지우지 못했습니다. 잠시 후 다시 시도해 주세요.")

  return json({ ok: true })
})
