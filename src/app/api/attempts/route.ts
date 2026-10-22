// app/api/attempts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse("로그인이 필요합니다.", { status: 401 })
  }

  try {
    const body = await req.json()

    const problemId = typeof body.problemId === "string" ? body.problemId : undefined
    const userAnswer = typeof body.userAnswer === "string" ? body.userAnswer.trim() : undefined
    const timeSpentSec = Number(body.timeSpentSec ?? 0)

    if (!problemId || !userAnswer) {
      return new NextResponse("problemId, userAnswer는 필수입니다.", { status: 400 })
    }
    if (userAnswer.length > 500) {
      return new NextResponse("답이 너무 깁니다.", { status: 400 })
    }

    const { data, error } = await supabase
      .from("attempts")
      .insert({
        problem_id: problemId,
        user_id: user.id,
        time_spent_sec: Number.isFinite(timeSpentSec) ? Math.max(0, Math.round(timeSpentSec)) : 0,
        result: "pending", // 정답 매칭 전
        user_answer: userAnswer,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[attempts.insert] error:", error)
      return new NextResponse("DB insert 실패", { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err: unknown) {
    console.error("[attempts] POST error:", err)
    return new NextResponse("서버 에러", { status: 500 })
  }
}
