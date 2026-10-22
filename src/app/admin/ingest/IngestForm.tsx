'use client'

import { useState } from 'react'

export function IngestForm() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setStatus('파일을 선택하세요.')
      return
    }

    setStatus('업로드 중...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)

      const res = await fetch('/api/ingest/pdf', {
        method: 'POST',
        body: formData,
      })

      // ✅ 응답은 한 번만 읽기
      const text = await res.text()

      let json: { error?: string; ingest_session_id?: number } = {}
      try {
        json = JSON.parse(text)
      } catch {
        // JSON이 아니면 그대로 보여주기
        setStatus(`응답이 JSON이 아님:\n${text}`)
        return
      }

      if (!res.ok) {
        setStatus(`에러: ${json.error ?? '알 수 없는 에러'}`)
        return
      }

      setStatus(
        `✅ 업로드 완료` +
          `\ningest_session_id=${json.ingest_session_id}` +
          `\n이제 scripts/ingest_session_run.py --session-id ${json.ingest_session_id} 로 처리하세요.`
      )
    } catch (err: unknown) {
      console.error('upload error', err)
      setStatus(`요청 중 에러 발생: ${String(err)}`)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin · PDF 업로드 (ingest 테스트)</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="문제지 이름"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            setFile(f)
          }}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
        >
          업로드
        </button>
      </form>
      {status && (
        <pre className="mt-3 text-sm whitespace-pre-wrap text-gray-700">
          {status}
        </pre>
      )}
    </div>
  )
}