// PUT /api/workbooks/{id}/answers — 정답 직접 입력·수정 (내 문제집만)
// body: { answers: [{ problemId, answer }] }  answer가 빈 문자열이면 정답을 지운다.
// 저장한 뒤 그 문제들의 풀이를 다시 채점한다.
import { requireUser, HttpError } from "@/lib/auth"
import { normalizeAnswer } from "@/lib/grading"
import { handler, json, preflight } from "@/lib/http"
import { regradeProblems } from "@/lib/pipeline/engine"
import { supabaseRepo } from "@/lib/pipeline/supabaseRepo"

export const runtime = "nodejs"

export const OPTIONS = preflight

export const PUT = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { user, db } = await requireUser(req)
  const workbookId = Number((await ctx.params).id)
  if (!Number.isInteger(workbookId)) throw new HttpError(400, "잘못된 문제집입니다.")

  const { data: wb } = await db.from("workbooks").select("id, owner_id").eq("id", workbookId).maybeSingle()
  if (!wb || wb.owner_id !== user.id) throw new HttpError(403, "내 문제집의 정답만 고칠 수 있습니다.")

  const body = (await req.json().catch(() => ({}))) as { answers?: { problemId?: unknown; answer?: unknown }[] }
  const items = (body.answers ?? [])
    .filter((a) => typeof a.problemId === "string" && typeof a.answer === "string")
    .slice(0, 500) as { problemId: string; answer: string }[]
  if (!items.length) throw new HttpError(400, "바꿀 정답이 없습니다.")

  // RLS(문제집 주인만 update)가 걸린 사용자 클라이언트로 저장한다
  const savedIds: string[] = []
  for (let i = 0; i < items.length; i += 20) {
    const results = await Promise.all(
      items.slice(i, i + 20).map((a) => {
        const answer = normalizeAnswer(a.answer)
        return db
          .from("problems")
          .update({ answer: answer || null, answer_source: answer ? "manual" : null })
          .eq("id", a.problemId)
          .eq("workbook_id", workbookId)
          .select("id")
      })
    )
    for (const r of results) {
      if (r.error) throw new HttpError(500, "정답을 저장하지 못했습니다.")
      for (const row of r.data ?? []) savedIds.push(row.id as string)
    }
  }

  // 정답이 바뀐 문제는 이미 채점된 풀이까지 다시 채점한다 (정답을 지우면 '채점 대기'로)
  const regraded = await regradeProblems(savedIds, supabaseRepo())
  return json({ saved: savedIds.length, regraded })
})
