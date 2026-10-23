// 앱이 보낸 `Authorization: Bearer <Supabase access token>`으로 사용자를 확인한다.
import "server-only"
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { supabaseUrl } from "./supabaseAdmin"

export type AuthedRequest = {
  user: User
  /** 요청한 사용자 권한으로 동작하는 클라이언트 (RLS 적용) */
  db: SupabaseClient
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function requireUser(req: Request): Promise<AuthedRequest> {
  const header = req.headers.get("authorization") ?? ""
  const token = /^Bearer\s+(.+)$/i.exec(header)?.[1]
  if (!token) throw new HttpError(401, "로그인이 필요합니다.")

  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) throw new Error("SUPABASE_ANON_KEY 환경변수가 없습니다.")

  const db = createClient(supabaseUrl(), anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, "로그인이 만료되었습니다. 다시 로그인해 주세요.")
  return { user: data.user, db }
}
