// DELETE /api/workbooks/{id} — 내 문제집 삭제 (문제·풀이 기록·문제 이미지까지)
import { requireUser, HttpError } from "@/lib/auth"
import { handler, json, preflight } from "@/lib/http"
import { PROBLEM_BUCKET } from "@/lib/pipeline/supabaseRepo"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

export const OPTIONS = preflight

export const DELETE = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { user, db } = await requireUser(req)
  const workbookId = Number((await ctx.params).id)
  if (!Number.isInteger(workbookId)) throw new HttpError(400, "잘못된 문제집입니다.")

  const { data: wb } = await db.from("workbooks").select("id, owner_id").eq("id", workbookId).maybeSingle()
  if (!wb || wb.owner_id !== user.id) throw new HttpError(403, "내 문제집만 지울 수 있습니다.")

  const admin = getSupabaseAdmin()
  const folder = `${user.id}/${workbookId}`
  // Storage는 폴더 단위 삭제가 없어서 목록을 받아 지운다
  for (;;) {
    const { data: files } = await admin.storage.from(PROBLEM_BUCKET).list(folder, { limit: 1000 })
    if (!files?.length) break
    await admin.storage.from(PROBLEM_BUCKET).remove(files.map((f) => `${folder}/${f.name}`))
    if (files.length < 1000) break
  }

  const { error } = await admin.from("workbooks").delete().eq("id", workbookId)
  if (error) throw new HttpError(500, "문제집을 지우지 못했습니다.")
  return json({ ok: true })
})
