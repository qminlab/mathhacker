// src/app/(app)/layout.tsx
import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 바 */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold">
            📘 Math Hacker
          </Link>

          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-blue-600">
              메인
            </Link>
            <Link href="/upload/problems" className="hover:text-blue-600">
              문제 넣기
            </Link>
            <Link href="/upload/answers" className="hover:text-blue-600">
              답지 넣기
            </Link>
            <Link href="/practice" className="hover:text-blue-600">
              문제 풀기
            </Link>
            <Link href="/stats" className="hover:text-blue-600">
              통계
            </Link>
            <Link href="/settings" className="hover:text-blue-600">
              설정
            </Link>
            <Link href="/me" className="hover:text-blue-600">
              내 정보
            </Link>
          </nav>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}

