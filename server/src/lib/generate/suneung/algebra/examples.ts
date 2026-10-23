// 예시 템플릿 (다른 템플릿을 쓸 때 이 모양을 따른다)
import { ints, intChoice, lines, q, qChoice, short, term, texPoly } from "../kit"
import type { SuTemplate } from "../types"
import { mcBal } from "./helpers"

/** 기초: 로그의 성질로 계산 (객관식) */
const logSum: SuTemplate<{ b: number; m: number; k: number }> = {
  id: "ex-log-sum",
  subject: "대수",
  unit: "지수함수와 로그함수",
  standard: "12대수01-04",
  level: 1,
  count: 20,
  params: (r) => {
    const b = r.pick([2, 3, 5])
    const m = r.int(2, 6)
    const k = r.int(1, m - 1)
    if (b ** m > 1e5) return null
    return { b, m, k }
  },
  build: ({ b, m, k }, r) => {
    const ans = m - k
    return {
      text: `$\\log_{${b}} ${b ** m} - \\log_{${b}} ${b ** k}$ 의 값은?`,
      ...mcBal(r, intChoice(ans), ints(m + k, m * k, ans + 1, ans - 1, m), undefined),
      solution: lines(
        `로그의 성질 $\\log_a x - \\log_a y = \\log_a \\frac{x}{y}$ 를 이용하면`,
        `$\\log_{${b}} ${b ** m} - \\log_{${b}} ${b ** k} = \\log_{${b}} \\frac{${b ** m}}{${b ** k}} = \\log_{${b}} ${b ** (m - k)} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ b, m, k }) => Math.log(b ** m) / Math.log(b) - Math.log(b ** k) / Math.log(b),
}

/** 수능 기본: 등차수열 조건에서 항 구하기 (단답형) */
const arithTerm: SuTemplate<{ a: number; d: number; i: number; j: number; n: number }> = {
  id: "ex-arith-term",
  subject: "대수",
  unit: "수열",
  standard: "12대수03-02",
  level: 2,
  count: 20,
  params: (r) => {
    const a = r.int(-10, 20)
    const d = r.pick([-3, -2, 2, 3, 4, 5])
    const i = r.int(2, 5)
    const j = i + r.int(2, 6)
    const n = r.int(j + 1, j + 10)
    const an = a + (n - 1) * d
    if (an < 1 || an > 999) return null
    return { a, d, i, j, n }
  },
  build: ({ a, d, i, j, n }) => {
    const ai = a + (i - 1) * d
    const aj = a + (j - 1) * d
    const an = a + (n - 1) * d
    return {
      text: `등차수열 $\\{a_n\\}$ 에 대하여 $a_{${i}} = ${ai},\\ a_{${j}} = ${aj}$ 일 때, $a_{${n}}$ 의 값을 구하시오.`,
      ...short(an),
      solution: lines(
        `공차를 $d$ 라 하면 $a_{${j}} - a_{${i}} = ${j - i}d$ 이므로 $${j - i}d = ${aj - ai}$, 즉 $d = ${d}$`,
        `따라서 $a_{${n}} = a_{${j}}${term(n - j, "d")} = ${aj} + ${n - j === 1 ? (d < 0 ? `(${d})` : d) : `${n - j} \\times ${d < 0 ? `(${d})` : d}`} = ${an}$`
      ),
      score: 3,
    }
  },
  // 직접 수열을 만들어서 n번째 항을 읽는다
  verify: ({ a, d, n }) => {
    let x = a
    for (let k = 1; k < n; k++) x += d
    return x
  },
}

/**
 * 고난도: 거듭제곱근 (수능 빈출 4점 유형)
 * 2 이상 M 이하의 자연수 n에 대하여 (n-a)(n-b)의 n제곱근 중 음의 실수가 존재하도록 하는 n의 값의 합
 */
const negRoot: SuTemplate<{ a: number; b: number; M: number }> = {
  id: "ex-neg-nth-root",
  subject: "대수",
  unit: "지수함수와 로그함수",
  standard: "12대수01-01",
  level: 4,
  count: 20,
  params: (r) => {
    const a = r.int(2, 6)
    const b = a + r.int(2, 6)
    const M = r.int(b + 2, b + 8)
    const ns = sumNs(a, b, M)
    if (ns < 1 || ns > 999) return null
    return { a, b, M }
  },
  build: ({ a, b, M }) => {
    const poly = texPoly([1, -(a + b), a * b], "n")
    const odd: number[] = []
    const even: number[] = []
    for (let n = 2; n <= M; n++) {
      const g = (n - a) * (n - b)
      if (n % 2 === 1 && g < 0) odd.push(n)
      if (n % 2 === 0 && g > 0) even.push(n)
    }
    const ans = sumNs(a, b, M)
    return {
      text: `$2$ 이상 $${M}$ 이하의 자연수 $n$ 에 대하여 $${poly}$ 의 $n$ 제곱근 중 음의 실수가 존재하도록 하는 모든 $n$ 의 값의 합을 구하시오.`,
      ...short(ans),
      solution: lines(
        `실수 $c$ 의 $n$ 제곱근 중 음의 실수가 있으려면`,
        `$n$ 이 홀수일 때는 $c < 0$, $n$ 이 짝수일 때는 $c > 0$ 이어야 한다.`,
        `$${poly} = (n - ${a})(n - ${b})$ 은 $${a} < n < ${b}$ 일 때 음수, $n < ${a}$ 또는 $n > ${b}$ 일 때 양수이다.`,
        `홀수 $n$ 중 $${a} < n < ${b}$ 인 것: ${odd.length ? odd.map((n) => `$${n}$`).join(", ") : "없음"}`,
        `짝수 $n$ 중 $n < ${a}$ 또는 $n > ${b}$ 인 것: ${even.length ? even.map((n) => `$${n}$`).join(", ") : "없음"}`,
        `따라서 구하는 합은 $${[...odd, ...even].sort((x, y) => x - y).join(" + ")} = ${ans}$`
      ),
      score: 4,
    }
  },
  // 음의 실수 x = -|c|^(1/n) 을 실제로 n제곱해서 c가 되는지 확인
  verify: ({ a, b, M }) => {
    let s = 0
    for (let n = 2; n <= M; n++) {
      const c = (n - a) * (n - b)
      if (c === 0) continue
      const x = -Math.pow(Math.abs(c), 1 / n)
      if (Math.abs(Math.pow(x, n) - c) < 1e-6 * Math.abs(c)) s += n
    }
    return s
  },
}

function sumNs(a: number, b: number, M: number) {
  let s = 0
  for (let n = 2; n <= M; n++) {
    const g = (n - a) * (n - b)
    if ((n % 2 === 1 && g < 0) || (n % 2 === 0 && g > 0)) s += n
  }
  return s
}

/** 기초: 분수 보기 예 (qChoice) — 등비수열 */
const geoRatio: SuTemplate<{ a: number; rN: number; rD: number; k: number }> = {
  id: "ex-geo-ratio",
  subject: "대수",
  unit: "수열",
  standard: "12대수03-03",
  level: 1,
  count: 20,
  params: (r) => {
    const rN = r.pick([1, 2, 3])
    const rD = r.pick([2, 3, 4])
    if (rN >= rD) return null
    return { a: r.int(1, 9) * rD ** 3, rN, rD, k: r.int(3, 4) }
  },
  build: ({ a, rN, rD, k }, r) => {
    const ratio = q(rN, rD)
    const ak = ratio.pow(k - 1).mul(a)
    const ans = ak
    return {
      text: `첫째항이 $${a}$ 이고 공비가 $${ratio.tex()}$ 인 등비수열 $\\{a_n\\}$ 에 대하여 $a_{${k}}$ 의 값은?`,
      ...mcBal(r, qChoice(ans), [qChoice(ratio.pow(k).mul(a)), qChoice(ratio.pow(k - 2).mul(a)), qChoice(ans.mul(2)), qChoice(ans.div(2))]),
      solution: lines(`$a_n = ${a} \\times \\left(${ratio.tex()}\\right)^{n-1}$ 이므로`, `$a_{${k}} = ${a} \\times \\left(${ratio.tex()}\\right)^{${k - 1}} = ${ans.tex()}$`),
      score: 2,
    }
  },
  verify: ({ a, rN, rD, k }) => a * Math.pow(rN / rD, k - 1),
}

export const EXAMPLES: SuTemplate[] = [logSum, arithTerm, geoRatio, negRoot]
