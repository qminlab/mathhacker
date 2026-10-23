// 코드로 만든 공용 문제를 Supabase에 넣는다 (여러 번 돌려도 같은 결과: 같은 문제 id를 덮어쓴다)
//
//   cd server
//   npm run seed:public                  # 전체 학년
//   npm run seed:public -- --grades k,e1  # 일부 학년만
//   npm run seed:public -- --dry          # 넣지 않고 개수만 확인
//
// 필요한 환경변수 (.env.local): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// 스키마(supabase/schema.sql)를 먼저 다시 실행해 두세요 (grade 열이 필요해요).
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { buildAll, type BuiltWorkbook } from "../src/lib/generate"
import { renderProblem } from "../src/lib/generate/render"
import { GRADE_LABEL } from "../src/lib/generate/types"

const CIRCLED = ["①", "②", "③", "④", "⑤"]
const args = process.argv.slice(2)
const dry = args.includes("--dry")
const gradeArg = args[args.indexOf("--grades") + 1]
const grades = args.includes("--grades") && gradeArg ? new Set(gradeArg.split(",")) : null

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  let i = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) await fn(items[i++])
    })
  )
}

async function main() {
  const books = buildAll().filter((b) => !grades || grades.has(b.grade))
  const count = books.reduce((s, b) => s + b.problems.length, 0)
  console.log(`문제집 ${books.length}개, 문제 ${count}개`)
  if (dry) {
    for (const b of books) console.log(`  ${b.title}: ${b.problems.length}`)
    return
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요해요 (server/.env.local).")
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  let done = 0
  for (const b of books) {
    const workbookId = await upsertWorkbook(db, b)
    const rows: Record<string, unknown>[] = []
    await pool(b.problems, 6, async (p) => {
      const png = await renderProblem(p, p.number)
      const imagePath = `shared/gen/${b.key}/${p.id}.png`
      const up = await db.storage.from("problems").upload(imagePath, png, { contentType: "image/png", upsert: true })
      if (up.error) throw new Error(`이미지 업로드 실패 (${imagePath}): ${up.error.message}`)
      rows.push({
        id: p.id,
        workbook_id: workbookId,
        workbook_number: p.number,
        source: "generated",
        raw_text: p.choices ? `${p.text}\n${p.choices.map((c, i) => `${CIRCLED[i]} ${c}`).join("  ")}` : p.text,
        latex_body: p.text,
        unit: b.unit,
        chapter_title: GRADE_LABEL[b.grade],
        answer: p.answer,
        answer_source: "generated",
        hint: p.hint ?? null,
        image_path: imagePath,
        has_diagram: !!p.figure,
        meta_tags: { template: p.templateId, grade: b.grade },
      })
      done++
      if (done % 50 === 0) console.log(`  ${done}/${count}`)
    })
    const { error } = await db.from("problems").upsert(rows, { onConflict: "id" })
    if (error) throw new Error(`${b.title} 문제 저장 실패: ${error.message}`)
    console.log(`✓ ${b.title} (${rows.length}문제)`)
  }
  console.log("끝! 앱의 설정에서 학년을 고르면 오늘의 퀘스트에 섞여 나와요.")
}

async function upsertWorkbook(db: SupabaseClient, b: BuiltWorkbook): Promise<number> {
  const found = await db.from("workbooks").select("id").is("owner_id", null).eq("source_type", "generated").eq("title", b.title).maybeSingle()
  if (found.error) throw new Error(found.error.message)
  const fields = { title: b.title, unit: b.unit, chapter: GRADE_LABEL[b.grade], grade: b.grade, source_type: "generated", owner_id: null, total_problems: b.problems.length }
  if (found.data) {
    const id = (found.data as { id: number }).id
    const { error } = await db.from("workbooks").update(fields).eq("id", id)
    if (error) throw new Error(error.message)
    return id
  }
  const ins = await db.from("workbooks").insert(fields).select("id").single()
  if (ins.error) throw new Error(`${b.title} 문제집 만들기 실패: ${ins.error.message}`)
  return (ins.data as { id: number }).id
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
