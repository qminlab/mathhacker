import { describe, expect, it } from "vitest"
import { parseAnswerKey } from "../pipeline/answers"

const asObject = (m: Map<number, string>) => Object.fromEntries(m)

describe("parseAnswerKey", () => {
  it("한 줄 나열형", () => {
    const text = "SET 02 빠른정답\n011 ③ 012 (2) 013 12 014 \\( \\frac{3}{4} \\)"
    expect(asObject(parseAnswerKey(text))).toEqual({ 11: "3", 12: "2", 13: "12", 14: "3/4" })
  })

  it("마크다운 표 (번호 행 + 답 행)", () => {
    const text = "| 011 | 012 | 013 |\n|---|---|---|\n| ③ | ② | 12 |"
    // 구분선 행이 있어도 번호 행 다음 답 행을 짝지어야 한다
    const out = asObject(parseAnswerKey(text))
    expect(out).toEqual({ 11: "3", 12: "2", 13: "12" })
  })

  it("LaTeX tabular", () => {
    const text = "\\begin{tabular}{|c|c|c|}\\hline 011 & 012 & 013 \\\\ \\hline ⑤ & ① & 7 \\\\ \\hline\\end{tabular}"
    expect(asObject(parseAnswerKey(text))).toEqual({ 11: "5", 12: "1", 13: "7" })
  })

  it("알려준 번호만 문제 번호로 인정", () => {
    const text = "2016 학년도 011 ③ 012 ②"
    expect(asObject(parseAnswerKey(text, [11, 12]))).toEqual({ 11: "3", 12: "2" })
  })

  it("번호 뒤 구두점", () => {
    expect(asObject(parseAnswerKey("011. ④  012) 5  013: (1)"))).toEqual({ 11: "4", 12: "5", 13: "1" })
  })

  it("같은 번호가 두 번 나오면 처음 것", () => {
    expect(asObject(parseAnswerKey("011 ③ 011 ①"))).toEqual({ 11: "3" })
  })
})
