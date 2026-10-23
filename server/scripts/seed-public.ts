// 코드로 만든 공용 문제를 Supabase에 넣는다 (여러 번 돌려도 같은 결과: 같은 문제 id를 덮어쓴다)
//
//   cd server
//   npm run seed:public                    # 전부 (유아~고1 + 수능 문제 은행 1만 문제)
//   npm run seed:public -- --grades k,e1   # 일부 학년만 (수능 문제 은행은 su)
//   npm run seed:public -- --dry           # 넣지 않고 개수만 확인
//   npm run seed:public -- --prune         # 지금 목록에 없는 예전 공용 문제집을 지운다
//
// 필요한 환경변수 (.env.local): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// 스키마(supabase/schema.sql)를 먼저 다시 실행해 두세요 (grade·level·solution_path 열이 필요해요).
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { buildAll } from "../src/lib/generate"
import { renderProblem, renderSolution } from "../src/lib/generate/render"
import { buildSuneung } from "../src/lib/generate/suneung"
import { LEVEL_LABEL } from "../src/lib/generate/suneung/types"
import { GRADE_LABEL } from "../src/lib/generate/types"

const CIRCLED = ["①", "②", "③", "④", "⑤"]
const args = process.argv.slice(2)
const dry = args.includes("--dry")
const prune = args.includes("--prune")
const gradeArg = args[args.indexOf("--grades") + 1]
const grades = args.includes("--grades") && gradeArg ? new Set(gradeArg.split(",")) : null

type SeedProblem = {
  id: string
  number: number
  draw: () => Promise<Buffer>
  drawSolution?: () => Promise<Buffer>
  row: Record<string, unknown>
}
type SeedBook = { key: string; title: string; grade: string; fields: Record<string, unknown>; problems: SeedProblem[] }

const rawText = (text: string, choices?: string[]) => (choices ? `${text}\n${choices.map((c, i) => `${CIRCLED[i]} ${c}`).join("  ")}` : text)

function collect(): SeedBook[] {
  const out: SeedBook[] = []
  for (const b of buildAll()) {
    out.push({
      key: b.key,
      title: b.title,
      grade: b.grade,
      fields: { unit: b.unit, chapter: GRADE_LABEL[b.grade], grade: b.grade, level: null },
      problems: b.problems.map((p) => ({
        id: p.id,
        number: p.number,
        draw: () => renderProblem(p, p.number),
        row: {
          raw_text: rawText(p.text, p.choices),
          latex_body: p.text,
          unit: b.unit,
          chapter_title: GRADE_LABEL[b.grade],
          answer: p.answer,
          hint: p.hint ?? null,
          has_diagram: !!p.figure,
          meta_tags: { template: p.templateId, grade: b.grade },
        },
      })),
    })
  }
  for (const b of buildSuneung()) {
    out.push({
      key: b.key,
      title: b.title,
      grade: "su",
      fields: { unit: `${b.subject} · ${b.unit}`, chapter: LEVEL_LABEL[b.level], grade: "su", level: b.level },
      problems: b.problems.map((p) => ({
        id: p.id,
        number: p.number,
        draw: () => renderProblem(p, p.number),
        drawSolution: () => renderSolution(p.solution, p.choices ? CIRCLED[Number(p.answer) - 1] : p.answer),
        row: {
          raw_text: rawText(p.text, p.choices),
          latex_body: p.text,
          unit: b.unit,
          chapter_title: b.subject,
          score: p.score,
          difficulty_tag: b.levelTag,
          answer: p.answer,
          hint: p.hint ?? null,
          solution: p.solution,
          has_diagram: !!p.figure,
          meta_tags: { template: p.template.id, standard: p.template.standard, subject: b.subject, level: b.level },
        },
      })),
    })
  }
  return out.filter((b) => !grades || grades.has(b.grade))
}

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  let i = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) await fn(items[i++])
    })
  )
}

async function upload(db: SupabaseClient, path: string, png: Buffer) {
  for (let attempt = 1; ; attempt++) {
    const up = await db.storage.from("problems").upload(path, png, { contentType: "image/png", upsert: true })
    if (!up.error) return
    if (attempt >= 3) throw new Error(`이미지 업로드 실패 (${path}): ${up.error.message}`)
    await new Promise((r) => setTimeout(r, 1000 * attempt))
  }
}

async function main() {
  const books = collect()
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
  const started = Date.now()
  for (const b of books) {
    const workbookId = await upsertWorkbook(db, b)
    const rows: Record<string, unknown>[] = []
    await pool(b.problems, 8, async (p) => {
      // Storage 경로는 영문·숫자만 받는다 (한글·공백 불가) → 학년 코드 폴더 + 문제 uuid
      const folder = `shared/gen/${b.grade}`
      if (/[^A-Za-z0-9/_.-]/.test(folder)) throw new Error(`Storage 경로에 쓸 수 없는 글자: ${folder}`)
      const imagePath = `${folder}/${p.id}.png`
      await upload(db, imagePath, await p.draw())
      let solutionPath: string | null = null
      if (p.drawSolution) {
        solutionPath = `${folder}/${p.id}-sol.png`
        await upload(db, solutionPath, await p.drawSolution())
      }
      rows.push({
        id: p.id,
        workbook_id: workbookId,
        workbook_number: p.number,
        source: "generated",
        answer_source: "generated",
        image_path: imagePath,
        solution_path: solutionPath,
        ...p.row,
      })
      done++
      if (done % 200 === 0) {
        const sec = (Date.now() - started) / 1000
        console.log(`  ${done}/${count} (남은 시간 약 ${Math.round(((count - done) * sec) / done / 60)}분)`)
      }
    })
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db.from("problems").upsert(rows.slice(i, i + 500), { onConflict: "id" })
      if (error) throw new Error(`${b.title} 문제 저장 실패: ${error.message}`)
    }
    console.log(`✓ ${b.title} (${rows.length}문제)`)
  }

  if (prune && !grades) {
    const keep = new Set(books.map((b) => b.title))
    const { data, error } = await db.from("workbooks").select("id, title").is("owner_id", null).eq("source_type", "generated")
    if (error) throw new Error(error.message)
    for (const w of (data ?? []) as { id: number; title: string }[]) {
      if (keep.has(w.title)) continue
      const del = await db.from("workbooks").delete().eq("id", w.id)
      if (del.error) throw new Error(del.error.message)
      console.log(`  지움: ${w.title}`)
    }
  }
  console.log("끝! 앱의 설정에서 학년(수능이면 난도도)을 고르면 오늘의 퀘스트에 섞여 나와요.")
}

async function upsertWorkbook(db: SupabaseClient, b: SeedBook): Promise<number> {
  const found = await db.from("workbooks").select("id").is("owner_id", null).eq("source_type", "generated").eq("title", b.title).maybeSingle()
  if (found.error) throw new Error(found.error.message)
  const fields = { title: b.title, source_type: "generated", owner_id: null, total_problems: b.problems.length, ...b.fields }
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
