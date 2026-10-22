// src/app/login/page.tsx
"use client"

import { useState, FormEvent } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const supabase = createBrowserSupabaseClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
        return
      }

      // 클라이언트 라우터 대신 전체 페이지 이동으로, 방금 저장된 세션 쿠키를
      // proxy와 서버 컴포넌트가 확실히 읽게 한다.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 세션 쿠키 반영을 위해 의도적으로 전체 이동
      window.location.assign("/dashboard")
    } catch (err: unknown) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-5">
        <h1 className="text-xl font-semibold text-center">로그인</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">이메일</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">비밀번호</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 whitespace-pre-wrap">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="text-xs text-center text-slate-500 mt-3">
          계정이 없나요?{" "}
          <a href="/signup" className="text-slate-900 underline">
            회원가입 하기
          </a>
        </div>
      </div>
    </div>
  )
}
