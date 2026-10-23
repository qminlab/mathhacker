import { describe, expect, it } from "vitest"
import { mathjax } from "mathjax-full/js/mathjax.js"
import { TeX } from "mathjax-full/js/input/tex.js"
import { SVG } from "mathjax-full/js/output/svg.js"
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js"
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js"
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js"
import { grade, normalizeAnswer } from "../grading"
import { buildAll } from "./index"
import { GRADES } from "./types"

const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)
const doc = mathjax.document("", { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: "none" }) })

const books = buildAll()
const all = books.flatMap((b) => b.problems.map((p) => ({ ...p, book: b.title })))

describe("공용 문제 생성기", () => {
  it("모든 학년에 문제집이 있다", () => {
    for (const g of GRADES) expect(books.some((b) => b.grade === g && b.problems.length >= 10)).toBe(true)
  })

  it("문제 id는 겹치지 않는다", () => {
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length)
  })

  it("객관식은 보기 5개가 서로 다르고 정답 번호가 1~5", () => {
    for (const p of all.filter((p) => p.choices)) {
      expect(p.choices, `${p.book} ${p.text}`).toHaveLength(5)
      expect(new Set(p.choices).size, `${p.book} ${p.text} ${p.choices}`).toBe(5)
      expect(["1", "2", "3", "4", "5"]).toContain(p.answer)
    }
  })

  it("주관식 정답은 숫자이고 자기 자신으로 채점하면 정답", () => {
    for (const p of all.filter((p) => !p.choices)) {
      expect(p.answer, `${p.book} ${p.text}`).toMatch(/^-?\d+(\.\d+)?(\/\d+)?$/)
      expect(normalizeAnswer(p.answer)).not.toBe("")
      expect(grade(p.answer, p.answer)).toBe("correct")
    }
  })

  it("수식이 모두 MathJax로 그려진다 (문법 오류 없음)", () => {
    for (const p of all) {
      for (const s of [p.text, ...(p.choices ?? []), p.hint ?? ""]) {
        expect(s.split("$").length % 2, `$ 짝: ${s}`).toBe(1)
        for (const m of s.matchAll(/\$([^$]+)\$/g)) {
          const out = adaptor.outerHTML(doc.convert(m[1], { display: false }))
          expect(out.includes("merror") || out.includes("data-mjx-error"), `${p.book}: ${m[1]}`).toBe(false)
        }
      }
    }
  }, 60_000)

  it("NaN·undefined가 문제에 새지 않는다", () => {
    for (const p of all) expect(`${p.text}${p.choices?.join("") ?? ""}${p.answer}`, p.text).not.toMatch(/NaN|undefined|Infinity/)
  })
})
