// 수능 문제 은행 미리 보기: 템플릿마다 문제·해설 PNG 몇 장
//   npm run preview:suneung -- <출력폴더> [템플릿당 장수] [과목 또는 템플릿 id 앞부분]
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { renderProblem, renderSolution } from "../src/lib/generate/render"
import { generateTemplate, TEMPLATES } from "../src/lib/generate/suneung"

const CIRCLED = ["①", "②", "③", "④", "⑤"]

async function main() {
  const out = process.argv[2] ?? "preview-su"
  const each = Number(process.argv[3] ?? 2)
  const filter = process.argv[4]
  mkdirSync(out, { recursive: true })
  const ts = TEMPLATES.filter((t) => !filter || t.subject === filter || t.id.startsWith(filter))
  for (const t of ts) {
    const items = generateTemplate({ ...t, count: Math.min(t.count, each) })
    for (const p of items) {
      const base = path.join(out, `${t.subject}_${t.level}_${t.id}_${p.k}`)
      writeFileSync(`${base}.png`, await renderProblem(p, p.k + 1))
      const label = p.choices ? CIRCLED[Number(p.answer) - 1] : p.answer
      writeFileSync(`${base}_sol.png`, await renderSolution(p.solution, label))
    }
  }
  console.log(`템플릿 ${ts.length}개 그림`)
}
main()
