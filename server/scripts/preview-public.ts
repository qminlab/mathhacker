// 생성 문제를 PNG로 몇 장 그려 본다: npx tsx scripts/preview-public.ts <출력폴더> [문제집당 장수]
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { buildAll } from "../src/lib/generate"
import { renderProblem } from "../src/lib/generate/render"

const out = process.argv[2] ?? "preview"
const each = Number(process.argv[3] ?? 2)
mkdirSync(out, { recursive: true })
async function main() {
  const books = buildAll()
  let total = 0
  for (const b of books) {
    for (const p of b.problems.slice(0, each)) {
      const png = await renderProblem(p, p.number)
      writeFileSync(path.join(out, `${b.key.replace("/", "_")}_${p.number}.png`), png)
    }
    total += b.problems.length
  }
  console.log(`${books.length}개 문제집, 문제 ${total}개`)
}
main()
