// 체험 모드(앱 EXPO_PUBLIC_DEMO=1)에 넣을 공용 문제 몇 개를 내보낸다
//   npm run export:demo   → app/assets/demo/gen/*.png, app/src/lib/demoGenerated.json
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { buildAll } from "../src/lib/generate"
import { renderProblem, renderSolution } from "../src/lib/generate/render"
import { buildSuneung } from "../src/lib/generate/suneung"

const PICK: Record<string, number> = { "k/count": 4, "e3/muldiv": 4, "m3/quadratic": 4 }
// 수능 문제 은행에서 과목마다 몇 문제 (해설 포함)
const SU_PICK: Record<string, number> = { "su/대수/수열/2": 2, "su/미적분Ⅰ/미분/3": 2, "su/확률과 통계/확률/2": 2 }
const CIRCLED = ["①", "②", "③", "④", "⑤"]
const appDir = path.join(process.cwd(), "..", "app")

async function main() {
  const outDir = path.join(appDir, "assets", "demo", "gen")
  mkdirSync(outDir, { recursive: true })
  const books = buildAll().filter((b) => b.key in PICK)
  const json: { key: string; title: string; grade: string; unit: string; problems: Record<string, unknown>[] & { file?: string }[] }[] = []
  for (const b of books) {
    const problems = []
    for (const p of b.problems.slice(0, PICK[b.key])) {
      const file = `${b.key.replace("/", "-")}-${p.number}.png`
      writeFileSync(path.join(outDir, file), await renderProblem(p, p.number))
      problems.push({
        file,
        number: p.number,
        raw_text: p.choices ? `${p.text}\n${p.choices.map((c, i) => `${CIRCLED[i]} ${c}`).join("  ")}` : p.text,
        answer: p.answer,
        hint: p.hint ?? null,
      })
    }
    json.push({ key: b.key, title: b.title, grade: b.grade, unit: b.unit, problems })
  }
  const su = { key: "su/demo", title: "수능 · 맛보기", grade: "su", unit: "대수·미적분Ⅰ·확률과 통계", problems: [] as Record<string, unknown>[] }
  let n = 0
  for (const b of buildSuneung().filter((x) => x.key in SU_PICK)) {
    for (const p of b.problems.slice(0, SU_PICK[b.key])) {
      n++
      const file = `su-${n}.png`
      const sol = `su-${n}-sol.png`
      writeFileSync(path.join(outDir, file), await renderProblem(p, n))
      writeFileSync(path.join(outDir, sol), await renderSolution(p.solution, p.choices ? CIRCLED[Number(p.answer) - 1] : p.answer))
      su.problems.push({ file, solution: sol, number: n, raw_text: p.choices ? `${p.text}\n${p.choices.map((c, i) => `${CIRCLED[i]} ${c}`).join("  ")}` : p.text, answer: p.answer, hint: p.hint ?? null, unit: b.unit })
    }
  }
  json.push(su)
  writeFileSync(path.join(appDir, "src", "lib", "demoGenerated.json"), JSON.stringify(json, null, 1) + "\n")
  // require()는 정적 경로만 받으므로 이미지 목록 파일을 따로 만든다
  const files = json.flatMap((b) => b.problems.flatMap((p) => [p.file, (p as { solution?: string }).solution].filter(Boolean) as string[]))
  const lines = files.map((f) => `  "gen/${f}": require("../../assets/demo/gen/${f}"),`)
  writeFileSync(path.join(appDir, "src", "lib", "demoGeneratedImages.ts"), `// npm run export:demo (server) 가 만든 파일\nexport const GEN_IMAGES: Record<string, number> = {\n${lines.join("\n")}\n}\n`)
  console.log(`${json.length}개 문제집 내보냄`)
}
main()
