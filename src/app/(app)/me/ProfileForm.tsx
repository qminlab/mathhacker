// src/app/me/ProfileForm.tsx
"use client"

import { FormEvent, useState } from "react"

type Props = {
  initialNickname: string
}

export function ProfileForm({ initialNickname }: Props) {
  const [nickname, setNickname] = useState(initialNickname)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setErrorMsg(null)

    if (!nickname.trim()) {
      setErrorMsg("닉네임을 입력해 주세요.")
      return
    }

    setSaving(true)
    try {
      const resp = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      })

      if (!resp.ok) {
        const text = await resp.text()
        setErrorMsg(`저장 실패: ${text}`)
        return
      }

      setMsg("닉네임이 저장되었습니다.")
    } catch (err: unknown) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">닉네임</label>
        <input
          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
      {msg && <p className="text-xs text-emerald-600">{msg}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center rounded-md bg-slate-900 text-white text-xs px-4 py-2 hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? "저장 중..." : "닉네임 저장"}
      </button>
    </form>
  )
}
