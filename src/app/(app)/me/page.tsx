// src/app/me/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./ProfileForm"

export default async function MePage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    // 로그인 안 되어 있으면 로그인 페이지로
    redirect("/login")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nickname, role")
    .eq("id", userData.user.id)
    .maybeSingle()

  if (error) {
    console.error(error)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-lg mx-auto py-10 px-4">
        <h1 className="text-xl font-semibold mb-4">내 정보</h1>

        <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
          <div className="text-sm">
            <div className="text-xs text-slate-500 mb-1">이메일</div>
            <div className="font-mono text-sm">{userData.user.email}</div>
          </div>

          <div className="text-sm">
            <div className="text-xs text-slate-500 mb-1">권한</div>
            <div className="inline-flex px-2 py-1 rounded bg-slate-900 text-white text-xs">
              {profile?.role ?? "user"}
            </div>
          </div>

          <ProfileForm initialNickname={profile?.nickname ?? ""} />
        </div>
      </div>
    </div>
  )
}
