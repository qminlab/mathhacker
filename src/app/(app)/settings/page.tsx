// src/app/(app)/settings/page.tsx
"use client"

import { useState } from "react"

export default function SettingsPage() {
  const [dailyCount, setDailyCount] = useState(20)
  const [timePerProblem, setTimePerProblem] = useState(5)
  const [gradingMode, setGradingMode] = useState<"instant" | "batch">("instant")

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">설정</h1>

      <div className="space-y-4 bg-white border rounded-lg p-4">
        <div>
          <label className="block text-sm font-semibold mb-1">데일리 출제 문항 수</label>
          <input
            type="number"
            min={1}
            max={200}
            className="border rounded px-3 py-1 text-sm w-32"
            value={dailyCount}
            onChange={(e) => setDailyCount(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">문제당 제한 시간 (분)</label>
          <input
            type="number"
            min={1}
            max={30}
            className="border rounded px-3 py-1 text-sm w-32"
            value={timePerProblem}
            onChange={(e) => setTimePerProblem(Number(e.target.value))}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            최소 1분, 최대 30분. 나중에 실제 타이머 로직에 연결.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">채점 방식</label>
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="instant"
                checked={gradingMode === "instant"}
                onChange={() => setGradingMode("instant")}
              />
              문제당 즉시 채점
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="batch"
                checked={gradingMode === "batch"}
                onChange={() => setGradingMode("batch")}
              />
              한 번에 채점
            </label>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-500">
        지금은 상태만 들고 있는 UI이고, 나중에 Supabase의 user 설정 테이블과 연결해서 저장/로드할
        예정.
      </p>
    </div>
  )
}
