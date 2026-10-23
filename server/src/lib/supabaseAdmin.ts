// lib/supabaseAdmin.ts
// ⚠ service role 키를 쓰는 클라이언트. RLS를 건너뛰므로 서버 코드에서,
//   요청자 인증·권한을 먼저 확인한 뒤에만 사용한다.
import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let admin: SupabaseClient | null = null

export function supabaseUrl() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error("SUPABASE_URL 환경변수가 없습니다.")
  return url
}

export function getSupabaseAdmin() {
  if (!admin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.")
    admin = createClient(supabaseUrl(), serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return admin
}
