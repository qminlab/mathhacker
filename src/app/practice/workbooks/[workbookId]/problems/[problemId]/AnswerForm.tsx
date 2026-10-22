// app/practice/workbooks/[workbookId]/problems/[problemId]/AnswerForm.tsx
"use client"

import { useState } from "react"

type Props = {
  problemId: string
}

export function AnswerForm({ problemId }: Props) {
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // 페이지를 연 시각부터 제출까지 걸린 시간을 기록
  const [startedAt] = useState(() => Date.now())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) {
      setStatus("답을 입력해 주세요.")
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemId,
          userAnswer: answer.trim(),
          timeSpentSec: Math.round((Date.now() - startedAt) / 1000),
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        setStatus(`저장 실패: ${text}`)
        return
      }

      const data = await res.json()
      setStatus(`저장 완료! attempt_id=${data.id}`)
    } catch (err: unknown) {
      console.error(err)
      setStatus("요청 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          정답 입력
        </label>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="예: 3, 2/3, 3x+2 ..."
        />
        <p className="text-xs text-gray-400">
          지금은 단순 텍스트만 입력(객관식이면 1~5 중 하나).
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "저장 중..." : "답 제출"}
      </button>

      {status && (
        <p className="text-xs text-gray-600 whitespace-pre-line">
          {status}
        </p>
      )}
    </form>
  )
}

