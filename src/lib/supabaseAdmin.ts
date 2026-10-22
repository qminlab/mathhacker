// lib/supabaseAdmin.ts
// ⚠ service role 키를 쓰는 클라이언트. RLS를 건너뛰므로 서버 코드에서,
//   요청자 인증·권한을 먼저 확인한 뒤에만 사용한다.
import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let admin: SupabaseClient | null = null

export function getSupabaseAdmin() {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.')
    }
    admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  }
  return admin
}
