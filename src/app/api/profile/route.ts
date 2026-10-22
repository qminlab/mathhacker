// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return new NextResponse("인증되지 않은 요청입니다.", { status: 401 })
  }

  const { nickname } = await req.json()

  if (!nickname || typeof nickname !== "string") {
    return new NextResponse("nickname 필드는 필수입니다.", { status: 400 })
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userData.user.id,
      nickname,
      // role은 default 'user' 이므로 생략 가능
    },
    { onConflict: "id" }
  )

  if (error) {
    console.error(error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return new NextResponse("인증되지 않은 요청입니다.", { status: 401 })
  }

  const { nickname } = await req.json()

  if (!nickname || typeof nickname !== "string") {
    return new NextResponse("nickname 필드는 필수입니다.", { status: 400 })
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", userData.user.id)

  if (error) {
    console.error(error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
