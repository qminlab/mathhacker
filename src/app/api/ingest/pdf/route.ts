// app/api/ingest/pdf/route.ts
// 로그인한 사용자가 올린 문제지 PDF를 Storage에 저장하고 ingest_sessions에 기록한다.
// 실제 OCR·문제 분리는 scripts/ingest_session_run.py가 이 세션 id로 처리한다.
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_BYTES = 20 * 1024 * 1024 // 20MB

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return json({ error: '로그인이 필요합니다.' }, 401)
  }

  try {
    const formData = await req.formData()

    const file = formData.get('file')
    const title = (formData.get('title') ?? formData.get('source')) as string | null
    const unit = formData.get('unit') as string | null
    const chapter = formData.get('chapter') as string | null

    if (!(file instanceof File)) {
      return json({ error: 'file 필드가 없습니다.' }, 400)
    }
    if (file.size > MAX_BYTES) {
      return json({ error: 'PDF는 20MB 이하만 올릴 수 있습니다.' }, 413)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    // 확장자·MIME 대신 파일 시그니처로 PDF인지 확인
    if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return json({ error: 'PDF 파일만 올릴 수 있습니다.' }, 400)
    }

    const admin = getSupabaseAdmin()

    // 1) ingest_sessions에 row 생성
    const { data: session, error: sessionError } = await admin
      .from('ingest_sessions')
      .insert({
        user_id: user.id,
        source_type: 'pdf',
        file_count: 1,
        page_count: 0,
        status: 'uploaded',
        workbook_id: null,
        title,
        unit,
        chapter,
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      console.error('ingest_sessions insert error', sessionError)
      return json({ error: '세션 생성에 실패했습니다.' }, 500)
    }

    const sessionId = session.id as number

    // 2) Storage에 원본 PDF 업로드 (비공개 버킷)
    const storagePath = `sessions/${sessionId}/original.pdf`

    const { error: uploadError } = await admin.storage
      .from('uploads')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      console.error('storage upload error', uploadError)
      await admin.from('ingest_sessions').update({ status: 'failed' }).eq('id', sessionId)
      return json({ error: '파일 업로드에 실패했습니다.' }, 500)
    }

    // 3) 파일 경로 기록
    await admin
      .from('ingest_sessions')
      .update({ original_file_path: storagePath })
      .eq('id', sessionId)

    return json({ ok: true, ingest_session_id: sessionId }, 200)
  } catch (e) {
    console.error('ingest pdf route error', e)
    return json({ error: '서버 에러' }, 500)
  }
}
