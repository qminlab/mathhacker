// 미적분Ⅰ 템플릿 공용 도구
import type { Rng } from "../../types"
import { deriv, intChoice, isShortOk, mc, Q, q, qChoice, roots, short, texPoly, texShift } from "../kit"
import type { Level, SuProblem, SuTemplate } from "../types"

export const SUBJ = "미적분Ⅰ" as const
export const U_LIM = "함수의 극한과 연속"
export const U_DIFF = "미분"
export const U_INT = "적분"

/** 템플릿 머리 (subject·unit·standard·level·count) */
export const head = (id: string, unit: string, standard: string, level: Level, count: number) => ({
  id,
  subject: SUBJ,
  unit,
  standard,
  level,
  count,
})
export type T<P> = SuTemplate<P>

/** 수 계수 다항식 값 (최고차부터) */
export const ev = (cs: number[], x: number) => cs.reduce((a, c) => a * x + c, 0)
/** 유리수 계수 다항식 값 */
export const qev = (cs: (number | Q)[], x: number | Q) => cs.reduce<Q>((a, c) => a.mul(x).add(c), q(0))
/** 정수 계수 도함수 계수 */
export const dcs = (cs: number[]) => {
  const n = cs.length - 1
  return n === 0 ? [0] : cs.slice(0, -1).map((c, i) => c * (n - i))
}
/** 두 다항식 곱 (수 계수) */
export const mulc = (a: number[], b: number[]) => {
  const out = Array(a.length + b.length - 1).fill(0)
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] += x * y)))
  return out
}
/** 근으로 다항식: k(x-r1)(x-r2)... (수 계수) */
export const fromRoots = (k: number, rs: number[]) => rs.reduce((acc, r) => mulc(acc, [1, -r]), [k])
export const addc = (a: number[], b: number[]) => {
  const n = Math.max(a.length, b.length)
  const A = [...Array(n - a.length).fill(0), ...a]
  const B = [...Array(n - b.length).fill(0), ...b]
  return A.map((x, i) => x + B[i])
}

/** 정수 정답 객관식 */
export const mcI = (r: Rng, ans: number, wrongs: number[]) => mc(r, intChoice(ans), wrongs.filter(Number.isFinite).map(intChoice))
/** 유리수 정답 객관식 (모자란 보기는 정답 ±1, ±2 ... 로) */
export const mcQ = (r: Rng, ans: Q, wrongs: Q[]) =>
  mc(r, qChoice(ans), wrongs.map(qChoice), (k) => qChoice(ans.add((k % 2 ? 1 : -1) * Math.ceil(k / 2))))
/** 1~999 자연수면 단답형, 아니면 객관식 */
export const answerI = (r: Rng, ans: number, wrongs: number[]): Pick<SuProblem, "answer" | "value" | "choices" | "choiceValues"> =>
  isShortOk(ans) ? short(ans) : mcI(r, ans, wrongs)
export const ask = (ans: number) => (isShortOk(ans) ? "의 값을 구하시오." : "의 값은?")

/** 구간별 함수 TeX */
export const cases = (...ps: [string, string][]) => `\\begin{cases} ${ps.map(([e, c]) => `${e} & (${c})`).join(" \\\\ ")} \\end{cases}`

/** (x - a) 인수 TeX: a = 0 이면 x */
export const fac = (a: number | Q, x = "x") => (Q.of(a).n === 0 ? x : `(${texShift(a, x)})`)
/** 인수들 곱 TeX (상수 k 앞에) */
export const facs = (k: number, rs: number[], x = "x") => {
  const zs = rs.filter((r) => r === 0)
  const nz = rs.filter((r) => r !== 0)
  const body = [...zs.map(() => x), ...nz.map((r) => `(${texShift(r, x)})`)]
  // 같은 인수는 제곱으로
  const parts: string[] = []
  const seen = new Map<string, number>()
  for (const b of body) seen.set(b, (seen.get(b) ?? 0) + 1)
  for (const [b, n] of seen) parts.push(n === 1 ? b : `${b}^{${n}}`)
  const s = parts.join("")
  return k === 1 ? s : k === -1 ? `-${s}` : `${k}${s}`
}
/** a × b 표기 (음수는 괄호) */
export const times = (...xs: (number | Q)[]) => xs.map((x, i) => (i > 0 && Q.of(x).n < 0 ? `(${Q.of(x).tex()})` : Q.of(x).tex())).join(" \\times ")
export const tp = texPoly

/** 연립일차방정식 (부분 피벗 가우스 소거) — verify 전용 */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    ;[M[c], M[p]] = [M[p], M[c]]
    if (Math.abs(M[c][c]) < 1e-12) return Array(n).fill(NaN)
    for (let i = 0; i < n; i++) {
      if (i === c) continue
      const f = M[i][c] / M[c][c]
      for (let j = c; j <= n; j++) M[i][j] -= f * M[c][j]
    }
  }
  return M.map((row, i) => row[n] / row[i])
}

/**
 * 수치로 실근 개수 세기 (verify 전용): 부호가 바뀌는 근 + 중근(도함수가 0인 곳에서 함숫값이 0)
 */
export function countRoots(f: (x: number) => number, lo = -60, hi = 60, n = 6000): number[] {
  const rs = roots(f, lo, hi, n)
  const crit = roots((x) => deriv(f, x, 1e-6), lo, hi, n)
  for (const c of crit) if (Math.abs(f(c)) < 1e-6 && !rs.some((x) => Math.abs(x - c) < 1e-4)) rs.push(c)
  return rs.sort((a, b) => a - b)
}

/** 구간 [a,b]에서 |f| 적분: 부호가 바뀌는 곳에서 잘라 심프슨 (verify 전용) */
export function integrateAbs(f: (x: number) => number, a: number, b: number, n = 400) {
  const cuts = [a, ...roots(f, a, b, 4000).filter((x) => x > a + 1e-9 && x < b - 1e-9), b]
  let s = 0
  for (let i = 0; i + 1 < cuts.length; i++) s += Math.abs(simpson(f, cuts[i], cuts[i + 1], n))
  return s
}
export function simpson(f: (x: number) => number, a: number, b: number, n = 200) {
  if (n % 2) n++
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}

/** 유일한 해만 돌려준다 (없거나 여럿이면 NaN) */
export function only<X>(xs: X[]): X | undefined {
  return xs.length === 1 ? xs[0] : undefined
}
export const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
export const nz = (r: Rng, a: number, b: number) => {
  let x = 0
  while (x === 0) x = r.int(a, b)
  return x
}
/** 정수 → x 앞 계수 TeX ("2x", "-x") */
export const cx = (c: number, v = "x") => texPoly([c, 0]).replace(/x/g, v)
/** 분수 x를 TeX로 */
export const fr = (n: number, d = 1) => q(n, d).tex()

/** 해설 줄 묶기: 수식으로 끝난 줄 다음 줄이 수식으로 시작하면 마침표를 찍어 "$ $" 붙음을 막는다 */
export const lines = (...ls: (string | false | null | undefined)[]) => {
  const xs = ls.filter((l): l is string => !!l)
  return xs.map((l, i) => (l.endsWith("$") && i + 1 < xs.length && xs[i + 1].startsWith("$") ? `${l}.` : l)).join("\n")
}
