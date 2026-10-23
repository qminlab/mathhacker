import { describe, expect, it } from "vitest"
import { grade, normalizeAnswer } from "../grading"

describe("normalizeAnswer", () => {
  it.each([
    ["③", "3"],
    ["(3)", "3"],
    ["3번", "3"],
    ["３", "3"],
    [" 12 ", "12"],
    ["\\frac{3}{4}", "3/4"],
    ["\\( \\frac{14}{3} \\)", "14/3"],
    ["−2", "-2"],
    ["+5", "5"],
    ["X+1", "x+1"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected)
  })
})

describe("grade", () => {
  it("정답이 없으면 pending", () => {
    expect(grade("3", null)).toBe("pending")
    expect(grade("3", "")).toBe("pending")
  })

  it("객관식 표기가 달라도 같은 번호면 정답", () => {
    expect(grade("3", "③")).toBe("correct")
    expect(grade("(3)", "3")).toBe("correct")
    expect(grade("2", "③")).toBe("wrong")
  })

  it("주관식은 값이 같으면 정답", () => {
    expect(grade("0.75", "\\frac{3}{4}")).toBe("correct")
    expect(grade("12.0", "12")).toBe("correct")
    expect(grade("13", "12")).toBe("wrong")
  })

  it("빈 답은 오답", () => {
    expect(grade("  ", "3")).toBe("wrong")
  })
})
