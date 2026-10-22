// src/app/(app)/upload/problems/page.tsx
"use client"

import { FormEvent, useState } from "react"

export default function UploadProblemsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [unit, setUnit] = useState("")
  const [chapter, setChapter] = useState("")
  const [status, setStatus] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      setStatus("PDF 파일을 선택해주세요.")
      return
    }

    setStatus("업로드 중...")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)
    formData.append("unit", unit)
    formData.append("chapter", chapter)

    try {
      const res = await fetch("/api/ingest/pdf", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text()
        setStatus(`업로드 실패: ${text.slice(0, 200)}...`)
        return
      }

      const json = await res.json().catch(() => null)
      setStatus(`업로드 완료! ingest_session_id=${json?.ingest_session_id ?? "?"}`)
    } catch (err) {
      console.error(err)
      setStatus("요청 중 에러가 발생했습니다.")
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">문제 넣기 (문제지 PDF)</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">문제지 이름</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 내 문제집 SET 01"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">단원</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="예: 지수함수와 로그함수"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">챕터 / 소단원</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="예: 핵심문제"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">문제지 PDF 파일</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
            required
          />
          <p className="text-[11px] text-gray-500">
            * 한 번 업로드하면 자동으로 문제 단위까지 쪼개어 DB에 저장됩니다.
          </p>
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          업로드 시작
        </button>
      </form>

      {status && (
        <div className="rounded-md bg-slate-900 text-slate-50 text-xs px-3 py-2 whitespace-pre-wrap">
          {status}
        </div>
      )}
    </div>
  )
}

