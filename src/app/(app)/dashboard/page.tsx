// src/app/(app)/dashboard/page.tsx
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { count: attemptCount }] = await Promise.all([
    supabase.from("profiles").select("nickname, role").eq("id", user.id).maybeSingle(),
    supabase.from("attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ])

  const displayName = profile?.nickname ? `${profile.nickname}님` : "사용자님"
  const isAdmin = profile?.role === "admin"

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold mb-2">안녕하세요, {displayName}</h1>
        <p className="text-sm text-gray-600">
          오늘도 수학 한 판 가보자고 💪
        </p>
      </section>

      {/* 내 정보 요약 */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">권한 수준</h2>
          <p className="text-sm text-gray-700">{isAdmin ? "관리자" : "일반 사용자"}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">푼 문제</h2>
          <p className="text-sm text-gray-700">{(attemptCount ?? 0).toLocaleString()}개</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">오늘 데일리 설정</h2>
          <p className="text-sm text-gray-700">20문제 · 5분/문제 · 즉시 채점</p>
        </div>
      </section>

      {/* 주요 메뉴 카드 */}
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="문제 넣기"
          description="새 문제지 PDF를 업로드해서 문제를 인식합니다."
          href="/upload/problems"
        />
        <DashboardCard
          title="답지 넣기"
          description="이미 올려둔 문제지의 빠른정답 PDF를 업로드합니다."
          href="/upload/answers"
        />
        <DashboardCard
          title="문제 풀기"
          description="데일리 또는 특정 문제지 순서대로 풀기."
          href="/practice"
        />
        <DashboardCard
          title="내 정보"
          description="닉네임, 비밀번호, 권한 등을 관리합니다."
          href="/me"
        />
        <DashboardCard
          title="설정"
          description="데일리 문제 수, 제한 시간, 채점 방식을 조정합니다."
          href="/settings"
        />
        <DashboardCard
          title="통계"
          description="문제지별 진행률과 취약 영역을 확인합니다."
          href="/stats"
        />
        {isAdmin && (
          <DashboardCard
            title="관리자 · 문제집"
            description="파이프라인으로 들어온 문제집과 문제를 확인합니다."
            href="/admin/workbooks"
          />
        )}
      </section>
    </div>
  )
}

type CardProps = {
  title: string
  description: string
  href: string
}

function DashboardCard({ title, description, href }: CardProps) {
  return (
    <Link href={href} className="block rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-gray-600">{description}</p>
    </Link>
  )
}

