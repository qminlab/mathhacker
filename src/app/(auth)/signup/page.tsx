// src/app/signup/page.tsx
"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setInfoMsg(null)

    if (!email || !password || !passwordConfirm || !nickname) {
      setErrorMsg("모든 필드를 입력해 주세요.")
      return
    }
    if (password !== passwordConfirm) {
      setErrorMsg("비밀번호가 서로 다릅니다.")
      return
    }

    setLoading(true)
    try {
      // 1) Supabase auth.users 에 계정 생성
      // 닉네임은 user metadata로 넘기고, DB 트리거가 profiles에 넣는다 (supabase/schema.sql)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname: nickname.trim() } },
      })

      if (error) {
        setErrorMsg(error.message)
        return
      }

      // 이메일 인증을 껐다면 바로 세션이 생기므로 대시보드로,
      // 켜져 있다면 메일 확인 안내 후 로그인 화면으로
      if (data.session) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 세션 쿠키 반영을 위해 의도적으로 전체 이동
        window.location.assign("/dashboard")
        return
      }
      setInfoMsg("회원가입이 완료되었습니다. 메일함에서 인증 후 로그인해 주세요.")
      setTimeout(() => {
        router.push("/login")
      }, 1500)
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
        <h1 className="text-xl font-semibold text-center">회원가입</h1>

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
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">비밀번호 확인</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">닉네임</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 수학해커"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 whitespace-pre-wrap">{errorMsg}</p>
          )}
          {infoMsg && (
            <p className="text-xs text-emerald-600 whitespace-pre-wrap">{infoMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="text-xs text-center text-slate-500">
          이미 계정이 있나요?{" "}
          <a href="/login" className="text-slate-900 underline">
            로그인 하기
          </a>
        </div>
      </div>
    </div>
  )
}
