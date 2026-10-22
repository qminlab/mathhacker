// src/app/page.tsx
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ✅ 로그인 되어 있으면 곧장 대시보드로
  if (user) {
    redirect("/dashboard")
  }

  // ✅ 비로그인 사용자는 랜딩 화면(로그인/회원가입 버튼) 보여주기
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">📘 Math Hacker</h1>
        <p className="text-sm text-slate-600 text-center">
          수학 PDF를 넣고 자동으로 문제를 쌓아서 푸는 연습용 MVP입니다.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full text-center bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="block w-full text-center border border-slate-300 rounded-md py-2 text-sm font-medium hover:bg-slate-50"
          >
            회원가입
          </Link>
        </div>

      </div>
    </main>
  )
}
