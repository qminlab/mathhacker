// 로그인 상태
import type { Session } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { env } from "./env"
import { supabase } from "./supabase"

type AuthState = { session: Session | null; loading: boolean; demo: boolean }

const AuthContext = createContext<AuthState>({ session: null, loading: true, demo: false })

// 체험 모드는 로그인 없이 바로 들어간다
const DEMO_SESSION = { access_token: "demo", user: { id: "demo" } } as unknown as Session

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(
    env.demo ? { session: DEMO_SESSION, loading: false, demo: true } : { session: null, loading: true, demo: false }
  )

  useEffect(() => {
    if (env.demo) return
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setState({ session: data.session, loading: false, demo: false })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false, demo: false })
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw new Error(authMessage(error.message))
}

export async function signUp(email: string, password: string, nickname: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { nickname: nickname.trim() } },
  })
  if (error) throw new Error(authMessage(error.message))
  // 이메일 인증이 켜져 있으면 세션 없이 돌아온다
  return { needsConfirmation: !data.session }
}

export async function signOut() {
  if (env.demo) return
  await supabase.auth.signOut()
}

function authMessage(message: string) {
  if (/Invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 맞지 않습니다."
  if (/already registered|already been registered/i.test(message)) return "이미 가입된 이메일입니다. 로그인해 주세요."
  if (/Password should be at least/i.test(message)) return "비밀번호는 6자 이상이어야 합니다."
  if (/rate limit/i.test(message)) return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
  if (/Email not confirmed/i.test(message)) return "메일함에서 인증을 마친 뒤 로그인해 주세요."
  if (/fetch|network/i.test(message)) return "인터넷 연결을 확인해 주세요."
  return message
}
