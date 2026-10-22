// src/app/(app)/practice/page.tsx
import Link from "next/link"

export default function PracticeHomePage() {
  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">문제 풀기</h1>
      <p className="text-xs text-gray-500">
        데일리 모드 또는 문제집 순서대로 모드를 선택해서 풉니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link
          href="/practice/daily"
          className="border rounded-lg bg-white p-4 hover:shadow-sm transition flex flex-col"
        >
          <h2 className="text-sm font-semibold mb-1">데일리 모드</h2>
          <p className="text-xs text-gray-500">
            아직 안 푼 문제 중에서 설정된 개수만큼 골라서 출제.
          </p>
        </Link>

        <Link
          href="/practice/sequence"
          className="border rounded-lg bg-white p-4 hover:shadow-sm transition flex flex-col"
        >
          <h2 className="text-sm font-semibold mb-1">순서대로 모드</h2>
          <p className="text-xs text-gray-500">
            선택한 문제집에서 안 푼 문제를 순서대로 출제.
          </p>
        </Link>
      </div>
    </div>
  )
}
