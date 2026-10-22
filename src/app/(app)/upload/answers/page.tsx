// src/app/(app)/upload/answers/page.tsx
"use client"

import { FormEvent, useState } from "react"

export default function UploadAnswersPage() {
  const [status, setStatus] = useState<string | null>(null)
  const [selectedWorkbookId, setSelectedWorkbookId] = useState("")
  const [mode, setMode] = useState<"quick" | "solution">("quick")
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      setStatus("답지 PDF 파일을 선택하세요.")
      return
    }
    setStatus("나중에 /api/ingest/answers 같은 걸로 붙일 자리")
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">답지 넣기</h1>
      <p className="text-xs text-gray-500">
        같은 문제집을 기준으로 빠른정답 / 해설 PDF를 올려서 정답 DB를 채웁니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg bg-white border rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium mb-1">문제집 선택</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={selectedWorkbookId}
            onChange={(e) => setSelectedWorkbookId(e.target.value)}
          >
            <option value="">(나중에 Supabase workbooks에서 불러오기)</option>
          </select>
          <p className="text-[11px] text-gray-500 mt-1">
            유저가 업로드한 문제집만 드롭다운에 나오게 할 예정.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">답지 종류</label>
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="quick"
                checked={mode === "quick"}
                onChange={() => setMode("quick")}
              />
              빠른정답
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="solution"
                checked={mode === "solution"}
                onChange={() => setMode("solution")}
              />
              해설지
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">답지 PDF 파일</label>
          <input
            type="file"
            accept="application/pdf"
            className="text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700"
        >
          업로드
        </button>

        {status && <p className="text-xs text-gray-500 mt-2 whitespace-pre-line">{status}</p>}
      </form>
    </div>
  )
}
