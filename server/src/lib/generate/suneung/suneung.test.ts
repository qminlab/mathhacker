// 수능 문제 은행 검증: 모든 문제의 정답을 독립 계산(verify)과 맞춰 본다
import { describe, expect, it } from "vitest"
import { mathjax } from "mathjax-full/js/mathjax.js"
import { TeX } from "mathjax-full/js/input/tex.js"
import { SVG } from "mathjax-full/js/output/svg.js"
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js"
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js"
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js"
import { buildSuneung, TEMPLATES } from "./index"
import { SUBJECT_UNITS, type Level } from "./types"

const only = process.env.SU_ONLY // 예: SU_ONLY=대수 npx vitest run src/lib/generate/suneung
const templates = only ? TEMPLATES.filter((t) => t.subject === only || t.id.startsWith(only)) : TEMPLATES
const books = buildSuneung(templates)
const all = books.flatMap((b) => b.problems)

const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)
const doc = mathjax.document("", { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: "none" }) })
const texOk = (src: string) => {
  const out = adaptor.outerHTML(doc.convert(src, { display: false }))
  return !(out.includes("merror") || out.includes("data-mjx-error"))
}
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b))
const where = (p: (typeof all)[number]) => `[${p.template.subject}/${p.template.id} #${p.k}] ${p.text.slice(0, 80)}`

describe("수능 문제 은행", () => {
  it("템플릿 id가 겹치지 않고 단원·성취기준이 올바르다", () => {
    const ids = templates.map((t) => `${t.subject}/${t.id}`)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of templates) {
      expect(SUBJECT_UNITS[t.subject], t.id).toContain(t.unit)
      const code = t.subject === "대수" ? "12대수" : t.subject === "미적분Ⅰ" ? "12미적Ⅰ-" : "12확통"
      expect(t.standard.startsWith(code), `${t.id} ${t.standard}`).toBe(true)
      expect([1, 2, 3, 4]).toContain(t.level)
    }
  })

  it("모든 템플릿이 정해진 개수만큼 서로 다른 문제를 만든다", () => {
    for (const t of templates) {
      const n = all.filter((p) => p.template === t).length
      expect(n, `${t.subject}/${t.id}: ${n}/${t.count}`).toBe(t.count)
    }
  })

  it("정답이 독립 계산(verify)과 같다", () => {
    for (const p of all) {
      const v = p.template.verify(p.params)
      expect(Number.isFinite(v), `verify가 수가 아님 ${where(p)}`).toBe(true)
      expect(near(v, p.value), `${where(p)}\n정답 ${p.value}, 검산 ${v}`).toBe(true)
    }
  }, 600_000)

  it("객관식: 보기 5개, 값이 모두 다르고 작은 순, 정답 번호의 값이 정답", () => {
    for (const p of all.filter((x) => x.choices)) {
      expect(p.choices, where(p)).toHaveLength(5)
      expect(p.choiceValues, where(p)).toHaveLength(5)
      const vs = p.choiceValues!
      for (let i = 1; i < 5; i++) expect(vs[i] > vs[i - 1] && !near(vs[i], vs[i - 1]), `보기 순서/중복 ${where(p)} ${vs}`).toBe(true)
      expect(["1", "2", "3", "4", "5"]).toContain(p.answer)
      expect(near(vs[Number(p.answer) - 1], p.value), `정답 보기 값 ${where(p)}`).toBe(true)
      expect(new Set(p.choices).size, where(p)).toBe(5)
    }
  })

  it("단답형: 정답은 1~999 자연수", () => {
    for (const p of all.filter((x) => !x.choices)) {
      expect(Number.isInteger(p.value) && p.value >= 1 && p.value <= 999, `${where(p)} → ${p.value}`).toBe(true)
      expect(p.answer, where(p)).toBe(String(p.value))
    }
  })

  it("해설이 있고, 배점이 난도에 맞다", () => {
    const allowed: Record<Level, number[]> = { 1: [2, 3], 2: [2, 3], 3: [3, 4], 4: [4] }
    for (const p of all) {
      expect(p.solution.split("\n").filter((l) => l.trim()).length >= 2, `해설이 너무 짧음 ${where(p)}`).toBe(true)
      expect(allowed[p.template.level], `배점 ${where(p)}`).toContain(p.score)
    }
  })

  it("문장에 NaN·undefined·null·[object 가 없다", () => {
    for (const p of all) {
      for (const s of [p.text, ...(p.choices ?? []), p.solution, p.hint ?? ""])
        expect(s, where(p)).not.toMatch(/NaN|undefined|null|Infinity|\[object|[+-] -\d|\+ \+|\$\s*\$/)
    }
  })

  it("숫자 뒤 조사가 맞다 (예: 9를, 1을, 6으로, 4였을)", () => {
    // 숫자를 읽었을 때 마지막 소리의 받침: 0영 1일 2이 3삼 4사 5오 6육 7칠 8팔 9구, 10십 100백 1000천 10000만
    const lastSound = (num: string) => {
      const d = num.replace(/\D/g, "")
      if (!d || /^0+$/.test(d)) return { batchim: true, rieul: false }
      const nz = d.replace(/0+$/, "")
      const zeros = d.length - nz.length
      if (zeros > 0) return { batchim: true, rieul: false }
      const last = nz[nz.length - 1]
      return { batchim: "013678".includes(last), rieul: "178".includes(last) }
    }
    const pairs: [string, string][] = [["을", "를"], ["은", "는"], ["이", "가"], ["과", "와"], ["이었", "였"], ["이라", "라"]]
    const bad: string[] = []
    for (const p of all) {
      for (const s of [p.text, p.solution, ...(p.choices ?? [])]) {
        // "$...9$ 를" 처럼 숫자로 끝나는 수식 바로 뒤의 조사
        for (const m of s.matchAll(/(\d+(?:\.\d+)?)(?:\)|\\right\))?\$\s?(으로|로|을|를|은|는|이었|였|이라|라|이|가|과|와)(?=[\s,.)]|$)/g)) {
          // "(t > 0)$ 로" 처럼 괄호 안 조건 뒤의 조사는 앞 글자(t)에 붙으므로 건너뛴다
          const before = s.slice(Math.max(0, (m.index ?? 0) - 20), (m.index ?? 0) + m[1].length + 8)
          if (/(>|<|\\ne|\\ge|\\le|\\geq|\\leq)\s*-?\d+(?:\.\d+)?\s*(\)|\\right\))\$/.test(before)) continue
          const { batchim, rieul } = lastSound(m[1])
          const j = m[2]
          let ok = true
          if (j === "으로") ok = batchim && !rieul
          else if (j === "로") ok = !batchim || rieul
          else for (const [withB, without] of pairs) {
            if (j === withB) ok = batchim
            if (j === without) ok = !batchim
          }
          if (!ok) bad.push(`${where(p)} → "${m[0]}"`)
        }
      }
    }
    expect(bad.slice(0, 20), `조사 오류 ${bad.length}개`).toEqual([])
  })

  it("해설 문장이 마침표로 끊긴 뒤 '='로 이어지지 않고, 정의되지 않은 조합 기호가 없다", () => {
    for (const p of all) {
      const ls = p.solution.split("\n")
      for (let i = 1; i < ls.length; i++)
        expect(/\.\s*$/.test(ls[i - 1]) && /^\s*\$?\s*=/.test(ls[i]), `해설 줄 끊김 ${where(p)}: ${ls[i - 1]} / ${ls[i]}`).toBe(false)
      for (const s of [p.text, p.solution])
        for (const m of s.matchAll(/_\{?(\d+)\}?\\mathrm\{[CPH]\}_\{?(\d+)\}?/g)) {
          const kind = m[0].includes("H") ? "H" : "CP"
          if (kind === "CP") expect(Number(m[2]) <= Number(m[1]), `${where(p)}: ${m[0]}`).toBe(true)
        }
    }
  })

  it("단답형은 '구하시오.', 객관식은 '?'로 끝난다", () => {
    for (const p of all) {
      const last = p.text.trim().split("\n").pop()!.replace(/\s*\(단,[^)]*\)\s*$/, "").trim()
      if (p.choices) expect(/구하시오\.$/.test(last), `객관식인데 '구하시오' ${where(p)}`).toBe(false)
      else expect(/\?$/.test(last), `단답형인데 '?'로 끝남 ${where(p)}`).toBe(false)
    }
  })

  it("서술격 조사 '이다'가 '가다'로 바뀌지 않았다", () => {
    for (const p of all)
      for (const s of [p.text, p.solution, ...(p.choices ?? [])])
        expect(s, where(p)).not.toMatch(/\$\s?가(다|고|므로|며|면|지만|어야)(?![가-힣])/)
  })

  it("수식($...$) 안에 한글이 없다 (그림에서 글자가 빠진다)", () => {
    for (const p of all)
      for (const s of [p.text, ...(p.choices ?? []), p.solution, p.hint ?? ""])
        for (const m of s.matchAll(/\$([^$]+)\$/g)) expect(/[가-힣]/.test(m[1]), `${where(p)}: ${m[1]}`).toBe(false)
  })

  it("수식이 모두 MathJax로 그려진다", () => {
    const cache = new Set<string>()
    for (const p of all) {
      for (const s of [p.text, ...(p.choices ?? []), p.solution, p.hint ?? ""]) {
        expect(s.split("$").length % 2, `$ 짝이 안 맞음 ${where(p)}: ${s}`).toBe(1)
        for (const m of s.matchAll(/\$([^$]+)\$/g)) {
          if (cache.has(m[1])) continue
          expect(texOk(m[1]), `TeX 오류 ${where(p)}: ${m[1]}`).toBe(true)
          cache.add(m[1])
        }
      }
    }
  }, 600_000)

  it("문제 문장이 은행 전체에서 겹치지 않는다", () => {
    const keys = all.map((p) => p.text + (p.choices ?? []).join("") + (p.figure?.svg ?? ""))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it.skipIf(!!only)("합계 1만 문제 이상, 과목·난도 분포", () => {
    const total = all.length
    const by = (f: (p: (typeof all)[number]) => string) => {
      const m: Record<string, number> = {}
      for (const p of all) m[f(p)] = (m[f(p)] ?? 0) + 1
      return m
    }
    console.log("과목별", by((p) => p.template.subject))
    console.log("난도별", by((p) => String(p.template.level)))
    console.log("단원·난도별", by((p) => `${p.template.unit}/${p.template.level}`))
    expect(total).toBeGreaterThanOrEqual(10000)
  })
})
