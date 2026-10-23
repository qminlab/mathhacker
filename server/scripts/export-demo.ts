// 체험 모드(앱 EXPO_PUBLIC_DEMO=1)에 넣을 공용 문제 몇 개를 내보낸다
//   npm run export:demo   → app/assets/demo/gen/*.png, app/src/lib/demoGenerated.json
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { buildAll } from "../src/lib/generate"
import { renderProblem } from "../src/lib/generate/render"

const PICK: Record<string, number> = { "k/count": 4, "e3/muldiv": 4, "m3/quadratic": 4, "h2/sequence": 4 }
const CIRCLED = ["①", "②", "③", "④", "⑤"]
const appDir = path.join(process.cwd(), "..", "app")

async function main() {
  const outDir = path.join(appDir, "assets", "demo", "gen")
  mkdirSync(outDir, { recursive: true })
  const books = buildAll().filter((b) => b.key in PICK)
  const json = []
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
  writeFileSync(path.join(appDir, "src", "lib", "demoGenerated.json"), JSON.stringify(json, null, 1) + "\n")
  // require()는 정적 경로만 받으므로 이미지 목록 파일을 따로 만든다
  const lines = json.flatMap((b) => b.problems.map((p) => `  "gen/${p.file}": require("../../assets/demo/gen/${p.file}"),`))
  writeFileSync(path.join(appDir, "src", "lib", "demoGeneratedImages.ts"), `// npm run export:demo (server) 가 만든 파일\nexport const GEN_IMAGES: Record<string, number> = {\n${lines.join("\n")}\n}\n`)
  console.log(`${json.length}개 문제집 내보냄`)
}
main()
