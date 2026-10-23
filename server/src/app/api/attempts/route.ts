// POST /api/attempts — 풀이 제출 + 채점
// 채점은 서버에서만 한다 (앱이 결과를 직접 쓰지 못하게 attempts 쓰기는 RLS로 막혀 있다).
import { requireUser, HttpError } from "@/lib/auth"
import { grade, normalizeAnswer } from "@/lib/grading"
import { handler, json, preflight } from "@/lib/http"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

const MAX_STROKES_BYTES = 400_000

export const OPTIONS = preflight

export const POST = handler(async (req: Request) => {
  const { user, db } = await requireUser(req)
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const problemId = typeof body.problemId === "string" ? body.problemId : ""
  const gaveUp = body.gaveUp === true
  const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, 200) : ""
  const timeSpentSec = Math.max(0, Math.min(6 * 3600, Math.round(Number(body.timeSpentSec) || 0)))
  const hintUsed = body.hintUsed === true
  const sessionId = Number.isInteger(body.sessionId) ? (body.sessionId as number) : null

  if (!problemId) throw new HttpError(400, "problemId가 필요합니다.")
  if (!gaveUp && !answer) throw new HttpError(400, "답을 입력해 주세요.")

  let strokes: unknown = null
  if (body.strokes != null) {
    if (JSON.stringify(body.strokes).length > MAX_STROKES_BYTES) {
      throw new HttpError(413, "필기가 너무 큽니다. 일부를 지우고 다시 제출해 주세요.")
    }
    strokes = body.strokes
  }

  // 사용자가 볼 수 있는 문제인지 RLS로 확인하면서 정답을 가져온다
  const { data: problem } = await db.from("problems").select("id, answer").eq("id", problemId).maybeSingle()
  if (!problem) throw new HttpError(404, "문제를 찾을 수 없습니다.")

  if (sessionId !== null) {
    const { data: s } = await db.from("practice_sessions").select("id").eq("id", sessionId).maybeSingle()
    if (!s) throw new HttpError(404, "풀이 세션을 찾을 수 없습니다.")
  }

  const result = gaveUp ? "gave_up" : grade(answer, problem.answer)

  const { data: attempt, error } = await getSupabaseAdmin()
    .from("attempts")
    .insert({
      problem_id: problemId,
      user_id: user.id,
      user_answer: gaveUp ? "" : answer,
      result,
      time_spent_sec: timeSpentSec,
      hint_used: hintUsed,
      strokes,
      session_id: sessionId,
    })
    .select("id, result, created_at")
    .single()
  if (error || !attempt) {
    console.error("[attempts.insert]", error)
    throw new HttpError(500, "풀이를 저장하지 못했습니다.")
  }

  return json({
    id: attempt.id,
    result: attempt.result,
    // 정답이 등록된 문제만 정답을 알려 준다 (일괄 채점 모드면 앱이 끝날 때 보여 준다)
    correctAnswer: problem.answer ? normalizeAnswer(problem.answer) : null,
  })
})
