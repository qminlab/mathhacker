// 검수용: 템플릿마다 문제 몇 개를 마크다운으로 (정답·해설은 문제와 떨어진 별도 파일)
//   node --import tsx scripts/dump-suneung.ts <출력폴더> [템플릿당 개수] [과목]
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { generateTemplate, TEMPLATES } from "../src/lib/generate/suneung"
import { LEVEL_LABEL } from "../src/lib/generate/suneung/types"

const CIRCLED = ["①", "②", "③", "④", "⑤"]
const out = process.argv[2] ?? "dump"
const each = Number(process.argv[3] ?? 3)
const subject = process.argv[4]
mkdirSync(out, { recursive: true })
// MIN_LEVEL=3 이면 3·4단계만, PICK_AT=0.37,0.71 이면 그 위치의 문제 (처음 검수와 다른 문제)
const minLevel = Number(process.env.MIN_LEVEL ?? 1)
const pickAt = process.env.PICK_AT?.split(",").map(Number)
const ts = TEMPLATES.filter((t) => (!subject || t.subject === subject) && t.level >= minLevel)
let q = ""
let a = ""
let n = 0
for (const t of ts) {
  const all = generateTemplate(t)
  // 앞·중간·끝에서 고르게
  const pick = pickAt ? [...new Set(pickAt.map((f) => Math.floor(f * (all.length - 1))))].map((i) => all[i]) : [...new Set(Array.from({ length: each }, (_, i) => Math.floor((i * (all.length - 1)) / Math.max(1, each - 1))))].map((i) => all[i]).filter(Boolean)
  for (const p of pick) {
    n++
    const id = `${t.id}#${p.k}`
    q += `### Q${n} (${id}, ${t.subject} · ${t.unit} · ${LEVEL_LABEL[t.level]} · ${p.score}점)\n${p.text}\n`
    if (p.choices) q += p.choices.map((c, i) => `${CIRCLED[i]} ${c}`).join("   ") + "\n"
    if (p.figure) {
      const cells = [...p.figure.svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1])
      q += `(그림 안의 글자: ${cells.join(" | ")})\n`
    }
    q += "\n"
    a += `### Q${n} (${id})\n정답: ${p.choices ? `${CIRCLED[Number(p.answer) - 1]} (${p.choices[Number(p.answer) - 1]})` : p.answer}\n해설:\n${p.solution}\n\n`
  }
}
const tag = (subject ? "-" + subject : "") + (process.env.TAG ? "-" + process.env.TAG : "")
writeFileSync(path.join(out, `questions${tag}.md`), q)
writeFileSync(path.join(out, `answers${tag}.md`), a)
console.log(`${n}문제`)
