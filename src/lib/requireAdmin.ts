// src/lib/requireAdmin.ts
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/server"

/** admin 페이지 맨 위에서 호출. 비로그인은 /login, 일반 사용자는 404. */
export async function requireAdmin() {
  const { user, role } = await getCurrentUser()
  if (!user) redirect("/login")
  if (role !== "admin") notFound()
  return user
}
