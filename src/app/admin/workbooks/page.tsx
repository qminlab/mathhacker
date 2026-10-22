// app/admin/workbooks/page.tsx
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'
import Link from 'next/link'

type Workbook = {
  id: number
  title: string
  unit: string | null
  chapter: string | null
  source_type: string
  total_problems: number | null
  total_pages: number | null
  created_at: string
}

export const dynamic = 'force-dynamic' // 최신 데이터 매번 가져오게

export default async function AdminWorkbooksPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workbooks')
    .select('id, title, unit, chapter, source_type, total_problems, total_pages, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Admin · Workbooks</h1>
        <p className="text-red-500">워크북 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    )
  }

  const workbooks = (data || []) as Workbook[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📚 Admin · Workbooks</h1>
      <p className="text-sm text-gray-500 mb-6">
        Python 파이프라인으로 Supabase에 쌓인 교재(workbooks)들을 한눈에 보는 페이지
      </p>

      {workbooks.length === 0 ? (
        <p className="text-gray-500">아직 등록된 워크북이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {workbooks.map((wb) => (
            <li
              key={wb.id}
              className="border rounded-lg px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">
                  <Link
                    href={`/admin/workbooks/${wb.id}`}
                    className="hover:underline"
                  >
                    {wb.title}
                  </Link>
                </div>
                <div className="text-sm text-gray-600">
                  {wb.unit && <span>{wb.unit}</span>}
                  {wb.chapter && <span> · {wb.chapter}</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  source_type: {wb.source_type} · problems: {wb.total_problems ?? 0}{' '}
                  · pages: {wb.total_pages ?? 0}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(wb.created_at).toLocaleString('ko-KR')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

