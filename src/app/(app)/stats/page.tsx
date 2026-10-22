// src/app/(app)/stats/page.tsx
export default function StatsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">통계</h1>
      <p className="text-xs text-gray-500">
        문제지별 진행률, 일간/주간 정답률, 취약 태그 통계 등을 보여줄 화면.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg bg-white p-4">
          <h2 className="text-sm font-semibold mb-1">오늘 정답률</h2>
          <p className="text-2xl font-bold">- %</p>
        </div>
        <div className="border rounded-lg bg-white p-4">
          <h2 className="text-sm font-semibold mb-1">이번 주 정답률</h2>
          <p className="text-2xl font-bold">- %</p>
        </div>
        <div className="border rounded-lg bg-white p-4">
          <h2 className="text-sm font-semibold mb-1">가장 취약한 태그</h2>
          <p className="text-sm text-gray-600">아직 데이터 없음</p>
        </div>
      </div>

      <div className="border rounded-lg bg-white p-4 mt-4 h-64 flex items-center justify-center text-xs text-gray-400">
        나중에 여기에 그래프(일간/주간 정답률)를 넣자.
      </div>
    </div>
  )
}
