// src/app/practice/workbooks/[workbookId]/problems/[problemId]/page.tsx

import Image from "next/image"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AnswerForm } from "./AnswerForm"

type RouteParams = {
  workbookId: string
  problemId: string
}

type Props = {
  params: Promise<RouteParams>
}

export default async function PracticeProblemPage({ params }: Props) {
  // ✅ Turbopack / Next 16용: params 먼저 await
  const { workbookId, problemId } = await params

  const workbookIdNum = Number(workbookId)
  if (Number.isNaN(workbookIdNum)) {
    return notFound()
  }

  const supabase = await createClient()

  const { data: problem, error } = await supabase
    .from("problems")
    .select("*")
    .eq("id", problemId)
    .eq("workbook_id", workbookIdNum)
    .single()

  if (error || !problem) {
    console.error("problem fetch error:", error)
    return notFound()
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* 상단 제목 + 메타 정보 */}
        <header className="mb-6 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl md:text-2xl font-semibold">
              워크북 #{workbookIdNum} – 문제 {problem.workbook_number ?? ""}
            </h1>
            {problem.score != null && (
              <span className="inline-flex items-center rounded-full bg-slate-800 text-white text-xs px-3 py-1">
                {problem.score}점
              </span>
            )}
          </div>

          <div className="text-xs md:text-sm text-slate-500 flex flex-wrap gap-3">
            {problem.unit && <span>단원: {problem.unit}</span>}
            {problem.chapter_title && <span>챕터: {problem.chapter_title}</span>}
            {problem.source && <span>출처: {problem.source}</span>}
          </div>
        </header>

        {/* 메인 2컬럼 레이아웃 */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          {/* 왼쪽 패널: 타이머 + 컨트롤 + 답 입력 */}
          <section className="space-y-4">
            {/* 타이머 카드 */}
            <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">타이머</h2>
                {/* TODO: 나중에 설정에서 온 제한 시간 표시 */}
                <span className="text-[11px] text-slate-500">
                  (나중에 설정값 반영)
                </span>
              </div>

              {/* TODO: 지금은 더미 숫자, 나중에 클라이언트 컴포넌트로 교체 */}
              <div className="text-3xl font-mono text-center tracking-widest py-2">
                05:00
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-md bg-red-100 text-red-700 text-xs py-2 hover:bg-red-200 transition"
                >
                  포기하기
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-md bg-amber-100 text-amber-800 text-xs py-2 hover:bg-amber-200 transition"
                >
                  힌트 보기
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-md bg-slate-100 text-slate-700 text-xs py-2 hover:bg-slate-200 transition"
                >
                  + 1분
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-md bg-slate-900 text-white text-xs py-2 hover:bg-slate-800 transition"
                >
                  바로 채점
                </button>
              </div>
            </div>

            {/* 답 입력 카드 (attempts에 기록되는 폼) */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold mb-3">내 답 입력</h2>
              <p className="text-[11px] text-slate-500 mb-2">
                (지금은 기본 텍스트 입력 / 나중에 객관식, 서술형 타입별로 분리 가능)
              </p>
              <AnswerForm problemId={problem.id} />
            </div>
          </section>

          {/* 오른쪽 패널: 문제 이미지 + 넓은 풀이 공간 */}
          <section className="bg-white rounded-xl shadow-sm border p-4 md:p-6 flex flex-col gap-4">
            {/* 문제 이미지 + 간단 텍스트 */}
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-500">
                문제 이미지 (좌상단 고정) / 나머지 영역은 풀이 용도
              </div>

              <div className="relative w-full border border-slate-200 rounded-lg bg-slate-50 overflow-hidden min-h-[260px] md:min-h-[360px] flex">
                {problem.full_image_url ? (
                  <div className="relative p-3 md:p-4">
                    <Image
                      src={problem.full_image_url}
                      alt={problem.header_text || `문제 ${problem.workbook_number}`}
                      width={600}
                      height={800}
                      className="w-auto max-w-[70%] max-h-[90%] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                    아직 이미지가 연결되지 않은 문제입니다.
                  </div>
                )}

                {/* 우측·하단 풀이 영역 안내 (나중에 그림판으로 교체) */}
                <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-3">
                  <div className="bg-white/80 border border-dashed border-slate-300 rounded-md px-3 py-1 text-[10px] text-slate-500">
                    나중에 이 영역 전체에 그림판/필기 기능 붙일 예정 ✍️
                  </div>
                </div>
              </div>
            </div>

            {/* (옵션) 텍스트 기반 문제 내용 미리보기 */}
            {problem.raw_text && (
              <div className="mt-2">
                <h3 className="text-xs font-semibold text-slate-600 mb-1">
                  텍스트 OCR 내용 (디버그/접근성 용)
                </h3>
                <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">
                  {problem.raw_text}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
