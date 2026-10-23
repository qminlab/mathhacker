import { describe, expect, it } from "vitest"
import { extractProblems, paddedBox, parseProblemNumber } from "../pipeline/extract"
import type { MathpixResult } from "../pipeline/mathpix-types"

// 2단 레이아웃 페이지를 흉내 낸 합성 데이터 (실제 교재 내용 아님)
const rect = (l: number, t: number, r: number, b: number): [number, number][] => [
  [l, t], [r, t], [r, b], [l, b],
]

const page: MathpixResult = {
  image_width: 2000,
  image_height: 3000,
  line_data: [
    { type: "page_info", text: "SET", cnt: rect(100, 50, 200, 100), conversion_output: true },
    { type: "page_info", text: "02", cnt: rect(210, 50, 260, 100), conversion_output: true },
    { type: "column", text: "", cnt: rect(80, 200, 980, 2900), conversion_output: false },
    { type: "text", text: "\n\n001", cnt: rect(100, 220, 180, 270), conversion_output: true },
    { type: "page_info", text: "유형 01", cnt: rect(200, 220, 320, 270), conversion_output: true },
    { type: "text", text: "첫 번째 문제 본문 [3점]", cnt: rect(100, 300, 900, 360), conversion_output: true },
    { type: "text", text: "(1) 1 (2) 2", cnt: rect(100, 380, 900, 430), conversion_output: true },
    { type: "text", text: "002", cnt: rect(100, 1500, 180, 1550), conversion_output: true },
    { type: "math", text: "x^2 = 4", cnt: rect(100, 1600, 600, 1660), conversion_output: true },
    { type: "column", text: "", cnt: rect(1020, 200, 1920, 2900), conversion_output: false },
    { type: "text", text: "003", cnt: rect(1040, 220, 1120, 270), conversion_output: true },
    { type: "text", text: "세 번째 문제 [4점]", cnt: rect(1040, 300, 1800, 360), conversion_output: true },
    // 본문 오른쪽에 있는 세 자리 숫자는 문제 번호가 아니다
    { type: "text", text: "250", cnt: rect(1700, 500, 1780, 540), conversion_output: true },
  ],
}

describe("parseProblemNumber", () => {
  it("숫자 3~4자리만 있는 줄", () => {
    expect(parseProblemNumber("\n\n011")).toBe(11)
    expect(parseProblemNumber("0003")).toBe(3)
    expect(parseProblemNumber("유형 01")).toBeNull()
    expect(parseProblemNumber("짝기출 007")).toBeNull()
    expect(parseProblemNumber("02")).toBeNull()
  })
})

describe("extractProblems", () => {
  const problems = extractProblems(page, 3)

  it("단마다 위에서 아래로 문제를 찾는다", () => {
    expect(problems.map((p) => [p.column, p.workbookNumber])).toEqual([
      [0, 1],
      [0, 2],
      [1, 3],
    ])
  })

  it("영역은 다음 번호 줄 위까지, 마지막은 단 아래까지", () => {
    expect(problems[0].bbox).toEqual({ left: 80, top: 220, right: 980, bottom: 1500 })
    expect(problems[1].bbox.bottom).toBe(2900)
    expect(problems[2].bbox.left).toBe(1020)
  })

  it("본문·배점·페이지를 채운다", () => {
    expect(problems[0].rawText).toContain("첫 번째 문제 본문")
    expect(problems[0].rawText).not.toContain("001")
    expect(problems[0].score).toBe(3)
    expect(problems[2].score).toBe(4)
    expect(problems[1].rawText).toContain("x^2 = 4")
    expect(problems.every((p) => p.page === 3)).toBe(true)
  })

  it("단이 없으면 페이지 전체를 한 단으로", () => {
    const single = extractProblems(
      {
        image_width: 1000,
        image_height: 1400,
        line_data: [
          { type: "text", text: "101", cnt: rect(40, 100, 100, 140), conversion_output: true },
          { type: "text", text: "102", cnt: rect(40, 700, 100, 740), conversion_output: true },
        ],
      },
      1
    )
    expect(single.map((p) => p.workbookNumber)).toEqual([101, 102])
    expect(single[1].bbox).toEqual({ left: 0, top: 700, right: 1000, bottom: 1400 })
  })
})

describe("paddedBox", () => {
  it("여백을 주되 페이지 밖으로 나가지 않는다", () => {
    expect(paddedBox({ left: 5, top: 5, right: 995, bottom: 1400 }, 1000, 1400)).toEqual({
      left: 0, top: 0, right: 1000, bottom: 1400,
    })
  })
})
