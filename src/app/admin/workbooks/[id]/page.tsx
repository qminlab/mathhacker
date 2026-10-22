import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Workbook = {
  id: number
  title: string
  unit: string | null
  chapter: string | null
}

type Problem = {
  id: string
  workbook_number: number | null
  page: number | null
  score: number | null
  header_text: string | null
  full_image_url: string | null
  raw_text: string | null
}

export const dynamic = 'force-dynamic'

export default async function WorkbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()

  const { id } = await params
  const workbookId = Number(id)

  if (Number.isNaN(workbookId)) {
    return notFound()
  }

  // 1) workbook 정보 가져오기
  const { data: wbData, error: wbError } = await supabase
    .from('workbooks')
    .select('id, title, unit, chapter')
    .eq('id', workbookId)
    .single()

  if (wbError) {
    console.error('workbook fetch error', wbError)
    // 없는 경우 404
    if (wbError.code === 'PGRST116') {
      return notFound()
    }
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Admin · Workbook</h1>
        <p className="text-red-500 text-sm">
          워크북 정보를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    )
  }

  if (!wbData) {
    return notFound()
  }

  const workbook = wbData as Workbook

  // 2) 해당 workbook의 problems 가져오기
  const { data: problemsData, error: problemsError } = await supabase
    .from('problems')
    .select(
      'id, workbook_number, page, score, header_text, full_image_url, raw_text'
    )
    .eq('workbook_id', workbookId)
    .order('workbook_number', { ascending: true })

  if (problemsError) {
    console.error('problems fetch error', problemsError)
  }

  const problems = (problemsData || []) as Problem[]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">📖 {workbook.title}</h1>
          <p className="text-sm text-gray-600">
            {workbook.unit && <span>{workbook.unit}</span>}
            {workbook.chapter && <span> · {workbook.chapter}</span>}
          </p>
        </div>
        <Link
          href="/admin/workbooks"
          className="text-sm text-blue-600 hover:underline"
        >
          ← 워크북 목록으로
        </Link>
      </div>

      {problems.length === 0 ? (
        <p className="text-gray-500">이 워크북에 등록된 문제가 없습니다.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {problems.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-3 flex gap-3 hover:bg-gray-50 transition"
            >
              <div className="w-28 h-28 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                {p.full_image_url ? (
                  <img
                    src={p.full_image_url}
                    alt={p.header_text || `문제 ${p.workbook_number}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">이미지 없음</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span>
                    Q{p.workbook_number ?? '–'}
                    {p.score != null && <> · {p.score}점</>}
                  </span>
                  {p.page != null && (
                    <span className="text-xs text-gray-400">
                      (p.{p.page})
                    </span>
                  )}
                </div>
                {p.header_text && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {p.header_text}
                  </div>
                )}
                {p.raw_text && (
                  <div className="text-xs text-gray-600 mt-1 line-clamp-3">
                    {p.raw_text}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
