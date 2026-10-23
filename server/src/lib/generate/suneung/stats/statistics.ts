// 확률과 통계 · 통계 (12확통03-01~07): 확률분포, 이항분포, 정규분포, 표본평균, 추정
import { isShortOk, mc, normalTableFigure, NORMAL_TABLE, q, Q, roots, short, signed, term, tuples } from "../kit"
import type { SuTemplate } from "../types"
import { decChoice, decMc, F, fracMc, ncdf as phi, r4, sol as lines, T, tableFigure, zt , polish } from "./helpers"

const UNIT = "통계"
const S = "확률과 통계" as const
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const Z_STEPS = [-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3]
const ZPOS = [0.5, 1, 1.5, 2, 2.5, 3]
const sgnZ = (z: number) => (z < 0 ? `- ${z === -1 ? "" : zt(-z)}` : `+ ${z === 1 ? "" : zt(z)}`)
/** 표에 보일 z: 필요한 값 + 채워서 4개 */
function tableFor(...zs: number[]) {
  const s = new Set(zs.filter((z) => Math.abs(z) > 1e-9).map((z) => Math.abs(z).toFixed(1)))
  for (const k of ["1.0", "1.5", "2.0", "0.5", "2.5", "3.0"]) {
    if (s.size >= 4) break
    s.add(k)
  }
  return normalTableFigure([...s].sort((a, b) => Number(a) - Number(b)))
}
/** 실수 TeX (소수 그대로, 불필요한 0 제거) */
const num = (x: number) => {
  const v = Math.round(x * 10000) / 10000
  return String(v)
}
/** 확률분포표 그림 (합계 칸 포함) */
const distFig = (vs: number[], ps: string[]) => tableFigure([["X", ...vs.map(String), "합계"], ["P(X = x)", ...ps, "1"]], 110, 64)
const numC = (x: number) => ({ tex: num(x), value: r4(x) })
/** 계수 c1, c2 인 a, b 일차식 */
const lin2 = (c1: number, c2: number) => {
  const parts: string[] = []
  if (c1) parts.push(term(c1, "a", true))
  if (c2) parts.push(parts.length ? term(c2, "b") : term(c2, "b", true))
  return parts.join("")
}
/** 표준화 확률을 표 값으로 풀어 쓴 해설 한 줄과 값 */
function zProb(z1: number | null, z2: number | null): { tex: string; value: number } {
  // P(z1 ≤ Z ≤ z2), null 은 무한대
  const Tt = (z: number) => `P(0 \\le Z \\le ${zt(Math.abs(z))})`
  if (z1 === null && z2 !== null) {
    const v = F(z2)
    return { tex: z2 >= 0 ? `0.5 + ${Tt(z2)} = 0.5 + ${T(z2).toFixed(4)} = ${v.toFixed(4)}` : `0.5 - ${Tt(z2)} = 0.5 - ${T(z2).toFixed(4)} = ${v.toFixed(4)}`, value: v }
  }
  if (z2 === null && z1 !== null) {
    const v = r4(1 - F(z1))
    return { tex: z1 <= 0 ? `0.5 + ${Tt(z1)} = 0.5 + ${T(z1).toFixed(4)} = ${v.toFixed(4)}` : `0.5 - ${Tt(z1)} = 0.5 - ${T(z1).toFixed(4)} = ${v.toFixed(4)}`, value: v }
  }
  const a = z1!
  const b = z2!
  const v = r4(F(b) - F(a))
  if (a < 0 && b > 0) return { tex: `${Tt(a)} + ${Tt(b)} = ${T(a).toFixed(4)} + ${T(b).toFixed(4)} = ${v.toFixed(4)}`, value: v }
  if (a >= 0) return { tex: `${Tt(b)} - ${Tt(a)} = ${T(b).toFixed(4)} - ${T(a).toFixed(4)} = ${v.toFixed(4)}`, value: v }
  return { tex: `${Tt(a)} - ${Tt(b)} = ${T(a).toFixed(4)} - ${T(b).toFixed(4)} = ${v.toFixed(4)}`, value: v }
}
/** 검산용: 표에서 z 를 거꾸로 찾고, 꼬리 확률로 구간 확률을 계산 */
function tableTail(z: number) {
  // P(Z ≥ z)
  const key = Math.abs(z).toFixed(1)
  const t = Math.abs(z) < 1e-9 ? 0 : NORMAL_TABLE[key]
  if (t === undefined) return NaN
  return z >= 0 ? 0.5 - t : 0.5 + t
}
function tableBetween(z1: number, z2: number) {
  return r4(1 - tableTail(-z1) - tableTail(z2))
}
/** 수치로 구한 z 를 표의 칸(0.5 간격)으로 맞춘다 (차이가 크면 NaN) */
const snap = (z: number) => (Math.abs(Math.round(z * 2) / 2 - z) < 1e-6 ? Math.round(z * 2) / 2 : NaN)
const wrongsFor = (z1: number | null, z2: number | null, ans: number) => {
  const ws: number[] = [r4(1 - ans)]
  for (const z of [z1, z2]) if (z !== null) ws.push(T(z), r4(0.5 + T(z)), r4(0.5 - T(z)))
  if (z1 !== null && z2 !== null) ws.push(r4(T(z1) + T(z2)), r4(Math.abs(T(z2) - T(z1))))
  return ws
}

// ═════════════════ 1단계 ═════════════════

const VALSETS = [
  [0, 1, 2, 3],
  [1, 2, 3, 4],
  [-1, 0, 1, 2],
  [2, 4, 6, 8],
  [1, 3, 5, 7],
]
const distUnknown: SuTemplate<{ vs: number[]; ks: number[]; ask: number; j: number }> = {
  id: "s1-dist-unknown",
  subject: S,
  unit: UNIT,
  standard: "12확통03-02",
  level: 1,
  count: 60,
  params: (r) => {
    const vs = r.pick(VALSETS)
    const ks = vs.map(() => r.int(1, 4))
    const ask = r.int(0, 2)
    const j = r.int(1, 3)
    if (new Set(ks).size === 1) return null
    return { vs, ks, ask, j }
  },
  build: ({ vs, ks, ask, j }, r) => {
    const K = ks.reduce((a, b) => a + b, 0)
    const a = q(1, K)
    const pTex = ks.map((k) => (k === 1 ? "a" : `${k}a`))
    const figure = distFig(vs, ks.map((k) => (k === 1 ? "a" : `${k}a`)))
    const E = q(vs.reduce((s, v, i) => s + v * ks[i], 0), K)
    let ans: Q
    let what: string
    let sol: string[]
    const first = `확률의 총합은 $1$ 이므로 $${pTex.join(" + ")} = ${K}a = 1$, 즉 $a = ${a.tex()}$`
    if (ask === 0) {
      ans = a
      what = `상수 $a$ 의 값은?`
      sol = [`확률의 총합은 $1$ 이므로 $${pTex.join(" + ")} = 1$`, `$${K}a = 1$ 이므로 $a = ${a.tex()}$`]
    } else if (ask === 1) {
      ans = E
      what = `$E(X)$ 의 값은?`
      sol = [first, `$E(X) = ${vs.map((v, i) => `${v < 0 ? `(${v})` : v} \\times ${q(ks[i], K).tex()}`).join(" + ")}$`, `$= ${E.tex()}$`]
    } else {
      ans = q(ks.slice(j).reduce((s, k) => s + k, 0), K)
      what = `$P(X \\ge ${vs[j]})$ 의 값은?`
      sol = [first, `$P(X \\ge ${vs[j]}) = ${ks.slice(j).length > 1 ? `${ks.slice(j).map((k) => q(k, K).tex()).join(" + ")} = ` : ""}${ans.tex()}$`]
    }
    const prob = ask !== 1
    return {
      text: `확률변수 $X$ 의 확률분포가 다음 표와 같을 때, ${what}`,
      figure,
      ...fracMc(r, ans, [q(1, K + 1), q(1, K - 1), E.add(q(1, K)), E.sub(q(1, K)), q(ks.slice(j + 1).reduce((s, k) => s + k, 0), K), a.mul(2), q(1).sub(ans)], prob),
      solution: lines(...sol),
      score: 2,
    }
  },
  // 확률의 합 = 1 을 수치로 풀어 a 를 얻은 뒤 직접 계산
  verify: ({ vs, ks, ask, j }) => {
    const [a] = roots((x) => ks.reduce((s, k) => s + k * x, 0) - 1, 0, 1, 1000)
    if (ask === 0) return a
    if (ask === 1) return vs.reduce((s, v, i) => s + v * ks[i] * a, 0)
    return vs.reduce((s, v, i) => s + (v >= vs[j] ? ks[i] * a : 0), 0)
  },
}

const linearTrans: SuTemplate<{ m: number; sd: number; a: number; b: number; ask: number }> = {
  id: "s1-linear",
  subject: S,
  unit: UNIT,
  standard: "12확통03-02",
  level: 1,
  count: 60,
  params: (r) => {
    const m = r.int(-5, 12)
    const sd = r.int(1, 6)
    const a = r.pick([-3, -2, 2, 3, 4, 5])
    const b = r.int(-9, 9)
    const ask = r.int(0, 3)
    const v = linVal(m, sd, a, b, ask)
    if (!isShortOk(v)) return null
    return { m, sd, a, b, ask }
  },
  build: ({ m, sd, a, b, ask }) => {
    const v = sd * sd
    const Y = `${term(a, "X", true)} ${signed(b)}`
    const ans = linVal(m, sd, a, b, ask)
    const pa = a < 0 ? `(${a})` : String(a)
    const given = ask === 2 ? `$E(X) = ${m},\\ \\sigma(X) = ${sd}$` : `$E(X) = ${m},\\ V(X) = ${v}$`
    const what = [`E(${Y})`, `V(${Y})`, `\\sigma(${Y})`, `E(X^{2})`][ask]
    const sol = [
      [`$E(aX + b) = aE(X) + b$ 이므로`, `$E(${Y}) = ${pa} \\times ${m < 0 ? `(${m})` : m} ${signed(b)} = ${ans}$`],
      [`$V(aX + b) = a^{2}V(X)$ 이므로`, `$V(${Y}) = ${pa}^{2} \\times ${v} = ${ans}$`],
      [`$\\sigma(aX + b) = |a|\\sigma(X)$ 이므로`, `$\\sigma(${Y}) = ${Math.abs(a)} \\times ${sd} = ${ans}$`],
      [`$V(X) = E(X^{2}) - \\{E(X)\\}^{2}$ 이므로`, `$E(X^{2}) = V(X) + \\{E(X)\\}^{2} = ${v} + ${m < 0 ? `(${m})` : m}^{2} = ${ans}$`],
    ][ask]
    return {
      text: `확률변수 $X$ 에 대하여 ${given} 일 때, $${what}$ 의 값을 구하시오.`,
      ...short(ans),
      solution: lines(...sol),
      score: 2,
    }
  },
  // X = m ± sd (확률 1/2씩) 인 분포를 실제로 만들어 Y 의 평균·분산을 직접 계산
  verify: ({ m, sd, a, b, ask }) => {
    const xs = [m - sd, m + sd]
    if (ask === 3) return xs.reduce((s, x) => s + (x * x) / 2, 0)
    const ys = xs.map((x) => a * x + b)
    const ey = (ys[0] + ys[1]) / 2
    const vy = ys.reduce((s, y) => s + ((y - ey) ** 2) / 2, 0)
    return [ey, vy, Math.sqrt(vy)][ask]
  },
}
function linVal(m: number, sd: number, a: number, b: number, ask: number) {
  return [a * m + b, a * a * sd * sd, Math.abs(a) * sd, sd * sd + m * m][ask]
}

const BP = [q(1, 2), q(1, 3), q(2, 3), q(1, 4), q(3, 4), q(1, 5), q(2, 5), q(3, 5), q(4, 5), q(1, 6), q(5, 6)]
const binomMean: SuTemplate<{ n: number; ip: number; ask: number }> = {
  id: "s1-binom-mean",
  subject: S,
  unit: UNIT,
  standard: "12확통03-03",
  level: 1,
  count: 60,
  params: (r) => {
    const ip = r.int(0, BP.length - 1)
    const p = BP[ip]
    const n = p.d * p.d * r.int(1, 12)
    const ask = r.int(0, 3)
    if (n > 300) return null
    const v = binomVal(n, p, ask)
    if (!Number.isInteger(v) || !isShortOk(v)) return null
    return { n, ip, ask }
  },
  build: ({ n, ip, ask }) => {
    const p = BP[ip]
    const E = p.mul(n)
    const V = E.mul(q(1).sub(p))
    const ans = binomVal(n, p, ask)
    const what = [`E(X)`, `V(X)`, `\\sigma(X)`, `E(X^{2})`][ask]
    return {
      text: `확률변수 $X$ 가 이항분포 $\\mathrm{B}\\left(${n}, ${p.tex()}\\right)$ 를 따를 때, $${what}$ 의 값을 구하시오.`,
      ...short(ans),
      solution: lines(
        `이항분포 $\\mathrm{B}(n, p)$ 에서 $E(X) = np,\\ V(X) = np(1 - p)$ 이다.`,
        `$E(X) = ${n} \\times ${p.tex()} = ${E.tex()},\\ V(X) = ${n} \\times ${p.tex()} \\times ${q(1).sub(p).tex()} = ${V.tex()}$`,
        ask === 2 ? `따라서 $\\sigma(X) = \\sqrt{${V.tex()}} = ${ans}$` : ask === 3 ? `따라서 $E(X^{2}) = V(X) + \\{E(X)\\}^{2} = ${V.tex()} + ${E.tex()}^{2} = ${ans}$` : ``
      ),
      score: 2,
    }
  },
  // 확률질량함수를 직접 더해서 평균·분산을 계산
  verify: ({ n, ip, ask }) => {
    const p = BP[ip].value
    let pk = (1 - p) ** n
    let e = 0
    let e2 = 0
    for (let k = 0; k <= n; k++) {
      e += k * pk
      e2 += k * k * pk
      pk = (pk * (n - k) * p) / ((k + 1) * (1 - p))
    }
    const v = e2 - e * e
    return [e, v, Math.sqrt(v), e2][ask]
  },
}
function binomVal(n: number, p: Q, ask: number) {
  const E = p.mul(n)
  const V = E.mul(q(1).sub(p))
  if (ask === 0) return E.value
  if (ask === 1) return V.value
  if (ask === 2) return V.isInt && Number.isInteger(Math.sqrt(V.value)) ? Math.sqrt(V.value) : NaN
  return V.add(E.mul(E)).value
}

const normalStd: SuTemplate<{ m: number; s: number; z1: number | null; z2: number | null }> = {
  id: "s1-normal-std",
  subject: S,
  unit: UNIT,
  standard: "12확통03-04",
  level: 1,
  count: 54,
  params: (r) => {
    const m = r.int(2, 20) * 5
    const s = r.pick([2, 4, 6, 8, 10, 3, 5, 2, 4])
    const kind = r.int(0, 2)
    let z1: number | null = r.pick(Z_STEPS)
    let z2: number | null = r.pick(Z_STEPS)
    if (kind === 0) z1 = null
    else if (kind === 1) z2 = null
    else if (z1 >= z2) return null
    if (z1 !== null && z2 !== null && Math.abs(z1) === Math.abs(z2) && z1 > 0) return null
    if ((z1 !== null && !Number.isInteger(m + z1 * s)) || (z2 !== null && !Number.isInteger(m + z2 * s))) return null
    return { m, s, z1, z2 }
  },
  build: ({ m, s, z1, z2 }, r) => {
    const x1 = z1 === null ? null : m + z1 * s
    const x2 = z2 === null ? null : m + z2 * s
    const ask = x1 === null ? `P(X \\le ${x2})` : x2 === null ? `P(X \\ge ${x1})` : `P(${x1} \\le X \\le ${x2})`
    const zAsk = x1 === null ? `P(Z \\le ${zt(z2!)})` : x2 === null ? `P(Z \\ge ${zt(z1!)})` : `P(${zt(z1!)} \\le Z \\le ${zt(z2!)})`
    const pr = zProb(z1, z2)
    return {
      text: `확률변수 $X$ 가 정규분포 $\\mathrm{N}(${m}, ${s}^{2})$ 을 따를 때, $${ask}$ 의 값을 오른쪽 표준정규분포표를 이용하여 구한 것은?`,
      figure: tableFor(...[z1, z2].filter((z): z is number => z !== null)),
      ...decMc(r, pr.value, wrongsFor(z1, z2, pr.value)),
      solution: lines(
        `$Z = \\frac{X - ${m}}{${s}}$ 로 놓으면 $Z$ 는 표준정규분포 $\\mathrm{N}(0, 1)$ 을 따른다.`,
        `${x1 !== null ? `$X = ${x1}$ 일 때 $Z = \\frac{${x1} - ${m}}{${s}} = ${zt(z1!)}$` : ""}${x1 !== null && x2 !== null ? ", " : ""}${x2 !== null ? `$X = ${x2}$ 일 때 $Z = \\frac{${x2} - ${m}}{${s}} = ${zt(z2!)}$` : ""}`,
        `$${ask} = ${zAsk}$`,
        `$= ${pr.tex}$`
      ),
      score: 3,
    }
  },
  verify: ({ m, s, z1, z2 }) => {
    const a = z1 === null ? -Infinity : (m + z1 * s - m) / s
    const b = z2 === null ? Infinity : (m + z2 * s - m) / s
    const ta = a === -Infinity ? 0 : tableTail(-a)
    const tb = b === Infinity ? 0 : tableTail(b)
    return r4(1 - ta - tb)
  },
}

// ═════════════════ 2단계 ═════════════════

const binomFind: SuTemplate<{ n: number; ip: number; c: number; d: number; ask: number }> = {
  id: "s2-binom-find",
  subject: S,
  unit: UNIT,
  standard: "12확통03-03",
  level: 2,
  count: 60,
  params: (r) => {
    const ip = r.int(0, BP.length - 1)
    const p = BP[ip]
    const n = p.d * r.int(2, 30)
    const ask = r.int(0, 2)
    const lin = r.chance(0.4)
    const c = lin ? r.pick([2, 3, -2]) : 1
    const d = lin ? r.int(-5, 5) : 0
    const E = p.mul(n)
    const V = E.mul(q(1).sub(p))
    if (!V.isInt && !lin) {
      // 분수 분산도 허용
    }
    if (n > 200) return null
    if (ask === 2 && p.n !== 1) return null
    const ans = ask === 0 ? n : ask === 1 ? E.mul(E).add(V).value : n + p.d
    if (!Number.isInteger(ans) || !isShortOk(ans)) return null
    return { n, ip, c, d, ask }
  },
  build: ({ n, ip, c, d, ask }) => {
    const p = BP[ip]
    const E = p.mul(n)
    const V = E.mul(q(1).sub(p))
    const lin = c !== 1 || d !== 0
    const Y = `${term(c, "X", true)} ${signed(d)}`
    const EY = E.mul(c).add(d)
    const VY = V.mul(c * c)
    const given = lin ? `$E(${Y}) = ${EY.tex()},\\ V(${Y}) = ${VY.tex()}$` : `$E(X) = ${E.tex()},\\ V(X) = ${V.tex()}$`
    const what = [`n`, `E(X^{2})`, `n + \\frac{1}{p}`][ask]
    const ans = ask === 0 ? n : ask === 1 ? E.mul(E).add(V).value : n + p.d
    const pc = c < 0 ? `(${c})` : String(c)
    return {
      text: `확률변수 $X$ 가 이항분포 $\\mathrm{B}(n, p)$ 를 따르고 ${given} 일 때, $${what}$ 의 값을 구하시오. (단, $0 < p < 1$)`,
      ...short(ans),
      solution: lines(
        `이항분포 $\\mathrm{B}(n, p)$ 에서 $E(X) = np,\\ V(X) = np(1 - p)$ 이다.`,
        lin && `$E(${Y}) = ${pc}E(X) ${signed(d)} = ${EY.tex()}$ 에서 $E(X) = ${E.tex()}$, $V(${Y}) = ${pc}^{2}V(X) = ${VY.tex()}$ 에서 $V(X) = ${V.tex()}$`,
        `$np = ${E.tex()},\\ np(1 - p) = ${V.tex()}$ 이므로 두 식을 나누면 $1 - p = ${V.div(E).tex()}$, 즉 $p = ${p.tex()}$`,
        `$n = ${E.tex()} \\div ${p.tex()} = ${n}$`,
        ask === 0 ? `` : ask === 1 ? `$E(X^{2}) = V(X) + \\{E(X)\\}^{2} = ${V.tex()} + ${E.mul(E).tex()} = ${ans}$` : ask === 2 ? `따라서 $n + \\frac{1}{p} = ${n} + ${p.d} = ${ans}$` : ``
      ),
      score: 3,
    }
  },
  // n, p 후보(분모 6 이하)를 모두 대입해 평균·분산이 맞는 것을 찾는다
  verify: ({ n, ip, ask }) => {
    const p0 = BP[ip]
    const E = p0.value * n
    const V = E * (1 - p0.value)
    const found: [number, number][] = []
    for (let d = 2; d <= 6; d++)
      for (let k = 1; k < d; k++) {
        const p = k / d
        for (let nn = 1; nn <= 400; nn++) if (Math.abs(nn * p - E) < 1e-9 && Math.abs(nn * p * (1 - p) - V) < 1e-9) found.push([nn, p])
      }
    const uniq = [...new Map(found.map(([a, b]) => [`${a}/${b.toFixed(9)}`, [a, b] as [number, number]])).values()]
    if (uniq.length !== 1) return NaN
    const [nn, p] = uniq[0]
    if (ask === 0) return nn
    if (ask === 1) return nn * p * (1 - p) + (nn * p) ** 2
    return nn + 1 / p
  },
}

const distEV: SuTemplate<{ vs: number[]; cnt: number[]; D: number; u: [number, number]; ask: number }> = {
  id: "s2-dist-ev",
  subject: S,
  unit: UNIT,
  standard: "12확통03-02",
  level: 2,
  count: 70,
  params: (r) => {
    const vs = r.pick(VALSETS)
    const D = r.pick([6, 8, 10, 12])
    const cnt = [r.int(0, D), r.int(0, D), r.int(0, D)]
    const last = D - cnt.reduce((a, b) => a + b, 0)
    if (last < 0) return null
    const all = [...cnt, last]
    if (all.filter((c) => c === 0).length > 0) return null
    const i = r.int(0, 3)
    let j = r.int(0, 3)
    if (j === i) j = (i + 1) % 4
    const u: [number, number] = i < j ? [i, j] : [j, i]
    const ask = r.int(0, 2)
    return { vs, cnt: all, D, u, ask }
  },
  build: ({ vs, cnt, D, u, ask }, r) => {
    const P = cnt.map((c) => q(c, D))
    const E = vs.reduce((s, v, i) => s.add(P[i].mul(v)), q(0))
    const E2 = vs.reduce((s, v, i) => s.add(P[i].mul(v * v)), q(0))
    const V = E2.sub(E.mul(E))
    const names = ["a", "b"]
    const figure = distFig(vs, P.map((p, i) => (i === u[0] ? "a" : i === u[1] ? "b" : p.toString())))
    const known = [0, 1, 2, 3].filter((i) => !u.includes(i))
    const restP = known.reduce((s, i) => s.add(P[i]), q(0))
    const restE = known.reduce((s, i) => s.add(P[i].mul(vs[i])), q(0))
    const ans = ask === 0 ? V : ask === 1 ? E2 : V.mul(4)
    const what = [`V(X)`, `E(X^{2})`, `V(2X + 1)`][ask]
    const vt = (v: number) => (v < 0 ? `(${v})` : String(v))
    return {
      text: `확률변수 $X$ 의 확률분포가 다음 표와 같다. $E(X) = ${E.tex()}$ 일 때, $${what}$ 의 값은?`,
      figure,
      ...fracMc(r, ans, [E2, V, E2.sub(E), V.mul(2), V.add(q(1)), E.mul(E), V.mul(4).add(q(1))], false),
      solution: lines(
        `확률의 합이 $1$ 이므로 $a + b = 1 - ${restP.tex()} = ${P[u[0]].add(P[u[1]]).tex()}$`,
        vs[u[0]] === 0 && vs[u[1]] === 0
          ? `$E(X) = ${E.tex()}$`
          : `$E(X) = ${lin2(vs[u[0]], vs[u[1]])} ${restE.n < 0 ? "-" : "+"} ${restE.n < 0 ? restE.neg().tex() : restE.tex()} = ${E.tex()}$ 에서 $${lin2(vs[u[0]], vs[u[1]])} = ${E.sub(restE).tex()}$`,
        `두 식을 연립하면 $${names[0]} = ${P[u[0]].tex()},\\ ${names[1]} = ${P[u[1]].tex()}$`,
        `$E(X^{2}) = ${vs.map((v, i) => `${vt(v)}^{2} \\times ${P[i].tex()}`).join(" + ")} = ${E2.tex()}$`,
        ask === 1 ? `따라서 $E(X^{2}) = ${E2.tex()}$` : `$V(X) = E(X^{2}) - \\{E(X)\\}^{2} = ${E2.tex()} - \\left(${E.tex()}\\right)^{2} = ${V.tex()}$`,
        ask === 2 && `따라서 $V(2X + 1) = 2^{2}V(X) = ${ans.tex()}$`
      ),
      score: 3,
    }
  },
  // 분모 D 인 a, b 후보를 모두 대입해 조건을 만족시키는 것을 찾는다
  verify: ({ vs, cnt, D, u, ask }) => {
    const known = [0, 1, 2, 3].filter((i) => !u.includes(i))
    const E = vs.reduce((s, v, i) => s + (v * cnt[i]) / D, 0)
    const sols: number[][] = []
    for (let a = 0; a <= D * 4; a++)
      for (let b = 0; b <= D * 4; b++) {
        const p = [0, 0, 0, 0]
        known.forEach((i) => (p[i] = cnt[i] / D))
        p[u[0]] = a / (D * 4)
        p[u[1]] = b / (D * 4)
        const s = p.reduce((x, y) => x + y, 0)
        const e = p.reduce((x, y, i) => x + y * vs[i], 0)
        if (Math.abs(s - 1) < 1e-9 && Math.abs(e - E) < 1e-9) sols.push(p)
      }
    if (sols.length !== 1) return NaN
    const p = sols[0]
    const e = p.reduce((x, y, i) => x + y * vs[i], 0)
    const e2 = p.reduce((x, y, i) => x + y * vs[i] * vs[i], 0)
    return [e2 - e * e, e2, 4 * (e2 - e * e)][ask]
  },
}

const normalSym: SuTemplate<{ m: number; s: number; h: number; kind: number; z1: number | null; z2: number | null }> = {
  id: "s2-normal-sym",
  subject: S,
  unit: UNIT,
  standard: "12확통03-04",
  level: 2,
  count: 70,
  params: (r) => {
    const m = r.int(4, 30) * 2
    const s = r.pick([2, 4, 6, 8, 3, 5, 2, 4])
    const h = r.int(1, 10)
    const kind = r.int(0, 2)
    let z1: number | null = r.pick(Z_STEPS)
    let z2: number | null = r.pick(Z_STEPS)
    const k = r.int(0, 2)
    if (k === 0) z1 = null
    else if (k === 1) z2 = null
    else if (z1 >= z2) return null
    if ((z1 !== null && !Number.isInteger(m + z1 * s)) || (z2 !== null && !Number.isInteger(m + z2 * s))) return null
    return { m, s, h, kind, z1, z2 }
  },
  build: ({ m, s, h, kind, z1, z2 }, r) => {
    const a = m - h
    const b = m + h
    const cond = [`P(X \\le ${a}) = P(X \\ge ${b})`, `f(${a}) = f(${b})`, `P(X \\le ${a}) + P(X \\le ${b}) = 1`][kind]
    const x1 = z1 === null ? null : m + z1 * s
    const x2 = z2 === null ? null : m + z2 * s
    const ask = x1 === null ? `P(X \\le ${x2})` : x2 === null ? `P(X \\ge ${x1})` : `P(${x1} \\le X \\le ${x2})`
    const zAsk = x1 === null ? `P(Z \\le ${zt(z2!)})` : x2 === null ? `P(Z \\ge ${zt(z1!)})` : `P(${zt(z1!)} \\le Z \\le ${zt(z2!)})`
    const pr = zProb(z1, z2)
    const why = [
      `$P(X \\le ${a}) = P(X \\ge ${b})$ 이므로 정규분포 곡선은 직선 $x = \\frac{${a} + ${b}}{2}$ 에 대하여 대칭이다.`,
      `확률밀도함수의 그래프는 직선 $x = m$ 에 대하여 대칭이고 $f(${a}) = f(${b})$ 이므로 $m = \\frac{${a} + ${b}}{2}$ 이다.`,
      `$P(X \\le ${b}) = 1 - P(X \\le ${a})$ 이므로 $P(X \\ge ${b}) = P(X \\le ${a})$ 이고, 정규분포 곡선은 직선 $x = \\frac{${a} + ${b}}{2}$ 에 대하여 대칭이다.`,
    ][kind]
    return {
      text: `정규분포 $\\mathrm{N}(m, ${s}^{2})$ 을 따르는 확률변수 $X$ ${kind === 1 ? "의 확률밀도함수 $f(x)$ 가" : "가"} $${cond}$ 를 만족시킬 때, $${ask}$ 의 값을 오른쪽 표준정규분포표를 이용하여 구한 것은?`,
      figure: tableFor(...[z1, z2].filter((z): z is number => z !== null)),
      ...decMc(r, pr.value, wrongsFor(z1, z2, pr.value)),
      solution: lines(why, `따라서 $m = ${m}$ 이고, $Z = \\frac{X - ${m}}{${s}}$ 은 표준정규분포를 따른다.`, `$${ask} = ${zAsk}$`, `$= ${pr.tex}$`),
      score: 3,
    }
  },
  // 대칭 조건을 m 에 대한 방정식으로 보고 수치로 풀어 m 을 구한 뒤 표 값으로 계산
  verify: ({ m, s, h, z1, z2 }) => {
    const a = m - h
    const b = m + h
    const g = (mm: number) => phi((a - mm) / s) - (1 - phi((b - mm) / s))
    const rs = roots(g, 0, 200, 800)
    if (rs.length !== 1) return NaN
    const mm = Math.round(rs[0] * 1000) / 1000
    const za = z1 === null ? null : snap((m + z1 * s - mm) / s)
    const zb = z2 === null ? null : snap((m + z2 * s - mm) / s)
    const ta = za === null ? 0 : tableTail(-za)
    const tb = zb === null ? 0 : tableTail(zb)
    return r4(1 - ta - tb)
  },
}

const sampleMean: SuTemplate<{ kind: number; m: number; s: number; n: number; z: number; vs: number[]; cnt: number[] }> = {
  id: "s2-sample-mean",
  subject: S,
  unit: UNIT,
  standard: "12확통03-06",
  level: 2,
  count: 80,
  params: (r) => {
    const kind = r.int(0, 2)
    if (kind === 2) {
      const vs = r.pick([
        [1, 2, 3],
        [0, 2, 4],
        [1, 3, 5],
        [2, 4, 6],
        [0, 1, 2],
      ])
      const D = r.pick([4, 5, 6, 8, 10])
      const c0 = r.int(1, D - 2)
      const c1 = r.int(1, D - c0 - 1)
      const cnt = [c0, c1, D - c0 - c1]
      const n = r.int(2, 4)
      return { kind, m: 0, s: 0, n, z: 0, vs, cnt }
    }
    const k = r.int(2, 10)
    const n = k * k
    const s = k * r.int(1, 4)
    const m = r.int(10, 100)
    const z = r.pick(Z_STEPS)
    return { kind, m, s, n, z, vs: [], cnt: [] }
  },
  build: ({ kind, m, s, n, z, vs, cnt }, r) => {
    if (kind === 2) {
      const D = cnt.reduce((a, b) => a + b, 0)
      const P = cnt.map((c) => q(c, D))
      const E = vs.reduce((acc, v, i) => acc.add(P[i].mul(v)), q(0))
      const E2 = vs.reduce((acc, v, i) => acc.add(P[i].mul(v * v)), q(0))
      const V = E2.sub(E.mul(E))
      const ans = V.div(n)
      return {
        text: `모집단의 확률분포가 다음 표와 같다. 이 모집단에서 임의추출한 크기가 $${n}$ 인 표본의 표본평균을 $\\overline{X}$ 라 할 때, $V(\\overline{X})$ 의 값은?`,
        figure: distFig(vs, P.map((p) => p.toString())),
        ...fracMc(r, ans, [V, V.div(n * n), E2.div(n), V.div(n - 1), V.mul(n)], false),
        solution: lines(
          `모평균 $m = ${vs.map((v, i) => `${v} \\times ${P[i].tex()}`).join(" + ")} = ${E.tex()}$`,
          `$E(X^{2}) = ${vs.map((v, i) => `${v}^{2} \\times ${P[i].tex()}`).join(" + ")} = ${E2.tex()}$ 이므로 모분산 $\\sigma^{2} = ${E2.tex()} - \\left(${E.tex()}\\right)^{2} = ${V.tex()}$`,
          `따라서 $V(\\overline{X}) = \\frac{\\sigma^{2}}{${n}} = ${ans.tex()}$`
        ),
        score: 3,
      }
    }
    const k = Math.sqrt(n)
    const se = s / k
    if (kind === 0) {
      return {
        text: `정규분포 $\\mathrm{N}(${m}, ${s}^{2})$ 을 따르는 모집단에서 크기가 $${n}$ 인 표본을 임의추출하여 구한 표본평균을 $\\overline{X}$ 라 할 때, $E(\\overline{X}) + \\sigma(\\overline{X})$ 의 값${isShortOk(m + se) && Number.isInteger(se) ? "을 구하시오." : "은?"}`,
        ...(Number.isInteger(m + se) ? short(m + se) : mc(r, { tex: num(m + se), value: m + se }, [{ tex: num(m + s), value: m + s }, { tex: num(m + se * se), value: m + se * se }, { tex: num(m + s / n), value: m + s / n }])),
        solution: lines(`$E(\\overline{X}) = m = ${m}$`, `$\\sigma(\\overline{X}) = \\frac{\\sigma}{\\sqrt{n}} = \\frac{${s}}{\\sqrt{${n}}} = ${num(se)}$`, `따라서 $E(\\overline{X}) + \\sigma(\\overline{X}) = ${num(m + se)}$`),
        score: 2,
      }
    }
    const c = m + z * se
    const ask = z > 0 ? `P(\\overline{X} \\ge ${num(c)})` : `P(\\overline{X} \\le ${num(c)})`
    const pr = z > 0 ? zProb(z, null) : zProb(null, z)
    return {
      text: `정규분포 $\\mathrm{N}(${m}, ${s}^{2})$ 을 따르는 모집단에서 크기가 $${n}$ 인 표본을 임의추출하여 구한 표본평균을 $\\overline{X}$ 라 할 때, $${ask}$ 의 값을 오른쪽 표준정규분포표를 이용하여 구한 것은?`,
      figure: tableFor(z),
      ...decMc(r, pr.value, [r4(1 - pr.value), T(z), r4(0.5 + T(z) === pr.value ? 0.5 - T(z) : 0.5 + T(z)), ...(inTableZ(z * k) ? [r4(z * k > 0 ? 0.5 - T(z * k) : 0.5 - T(z * k))] : [])]),
      solution: lines(
        `$\\overline{X}$ 는 정규분포 $\\mathrm{N}\\left(${m}, \\frac{${s}^{2}}{${n}}\\right)$, 즉 $\\mathrm{N}(${m}, ${num(se)}^{2})$ 을 따른다.`,
        `$Z = \\frac{\\overline{X} - ${m}}{${num(se)}}$ 로 놓으면 $\\overline{X} = ${num(c)}$ 일 때 $Z = ${zt(z)}$`,
        `$${ask} = P(Z ${z > 0 ? "\\ge" : "\\le"} ${zt(z)}) = ${pr.tex}$`
      ),
      score: 3,
    }
  },
  verify: ({ kind, m, s, n, z, vs, cnt }) => {
    if (kind === 2) {
      // 크기 n 인 표본(복원추출)을 모두 나열해 표본평균의 분산을 직접 계산
      const D = cnt.reduce((a, b) => a + b, 0)
      const idx = [0, 1, 2]
      let e = 0
      let e2 = 0
      for (const t of tuples(idx, n)) {
        const w = t.reduce((acc, i) => acc * (cnt[i] / D), 1)
        const xb = t.reduce((acc, i) => acc + vs[i], 0) / n
        e += w * xb
        e2 += w * xb * xb
      }
      return e2 - e * e
    }
    const se = Math.sqrt((s * s) / n)
    if (kind === 0) return m + se
    const c = m + z * se
    const zz = snap((c - m) / se)
    return z > 0 ? tableTail(zz) : tableTail(-zz)
  },
}
const inTableZ = (z: number) => Math.abs(z) > 0 && Math.abs(z) <= 3 && Number.isInteger(Math.abs(z) * 2)

// ═════════════════ 3단계 ═════════════════

const ciMean: SuTemplate<{ kind: number; s: number; k: number; xbar: number; conf: 95 | 99 }> = {
  id: "s3-ci-mean",
  subject: S,
  unit: UNIT,
  standard: "12확통03-07",
  level: 3,
  count: 70,
  params: (r) => {
    const kind = r.int(0, 2)
    const conf = kind === 2 ? 95 : r.pick([95, 99] as const)
    const k = r.int(2, 20)
    const s = r.int(1, 10) * r.pick([1, 2, 5])
    const xbar = r.int(20, 300)
    const e = ((conf === 95 ? 1.96 : 2.58) * s) / k
    if (Math.abs(Math.round(e * 10000) - e * 10000) > 1e-6) return null
    // σ/√n 이 유한소수(소수 둘째 자리까지)여야 다른 신뢰도의 구간 길이도 정확히 떨어진다
    if ((s * 100) % k !== 0) return null
    if (kind === 0 && k * k + xbar > 999) return null
    if (kind === 1 && k * k > 999) return null
    return { kind, s, k, xbar, conf }
  },
  build: ({ kind, s, k, xbar, conf }, r) => {
    const z = conf === 95 ? 1.96 : 2.58
    const zs = conf === 95 ? `P(|Z| \\le 1.96) = 0.95` : `P(|Z| \\le 2.58) = 0.99`
    const n = k * k
    const e = r4((z * s) / k)
    const note = `(단, $Z$ 가 표준정규분포를 따르는 확률변수일 때, $${zs}$ 로 계산한다.)`
    if (kind === 0) {
      const lo = r4(xbar - e)
      const hi = r4(xbar + e)
      return {
        text: `정규분포 $\\mathrm{N}(m, ${s}^{2})$ 을 따르는 모집단에서 크기가 $n$ 인 표본을 임의추출하여 구한 표본평균이 $\\overline{x}$ 일 때, 이를 이용하여 구한 모평균 $m$ 에 대한 신뢰도 $${conf}\\%$ 의 신뢰구간이 $${num(lo)} \\le m \\le ${num(hi)}$ 이다. $n + \\overline{x}$ 의 값을 구하시오. ${note}`,
        ...short(n + xbar),
        solution: lines(
          `신뢰구간은 $\\overline{x} - ${z} \\times \\frac{${s}}{\\sqrt{n}} \\le m \\le \\overline{x} + ${z} \\times \\frac{${s}}{\\sqrt{n}}$ 이다.`,
          `양 끝의 평균이 $\\overline{x}$ 이므로 $\\overline{x} = \\frac{${num(lo)} + ${num(hi)}}{2} = ${xbar}$`,
          `구간의 길이의 절반에서 $${z} \\times \\frac{${s}}{\\sqrt{n}} = ${num(e)}$, 즉 $\\sqrt{n} = ${k}$, $n = ${n}$`,
          `따라서 $n + \\overline{x} = ${n} + ${xbar} = ${n + xbar}$`
        ),
        score: 3,
      }
    }
    if (kind === 1) {
      const L = r4(2 * e)
      return {
        text: `정규분포 $\\mathrm{N}(m, ${s}^{2})$ 을 따르는 모집단에서 크기가 $n$ 인 표본을 임의추출하여 모평균 $m$ 에 대한 신뢰도 $${conf}\\%$ 의 신뢰구간을 구할 때, 신뢰구간의 길이가 $${num(L)}$ 이하가 되도록 하는 자연수 $n$ 의 최솟값을 구하시오. ${note}`,
        ...short(n),
        solution: lines(
          `신뢰구간의 길이는 $2 \\times ${z} \\times \\frac{${s}}{\\sqrt{n}}$ 이다.`,
          `$2 \\times ${z} \\times \\frac{${s}}{\\sqrt{n}} \\le ${num(L)}$ 에서 $\\sqrt{n} \\ge \\frac{${num(2 * z * s)}}{${num(L)}} = ${k}$`,
          `따라서 $n \\ge ${n}$ 이므로 $n$ 의 최솟값은 $${n}$`
        ),
        score: 3,
      }
    }
    // 같은 표본으로 95% → 99% 신뢰구간 길이
    const L95 = r4(2 * e)
    const se = s / k
    const L99 = r4(2 * 2.58 * se)
    return {
      text: `정규분포 $\\mathrm{N}(m, \\sigma^{2})$ 을 따르는 모집단에서 크기가 $${n}$ 인 표본을 임의추출하여 구한 모평균 $m$ 에 대한 신뢰도 $95\\%$ 의 신뢰구간이 $a \\le m \\le b$ 이고, 같은 표본으로 구한 신뢰도 $99\\%$ 의 신뢰구간이 $c \\le m \\le d$ 이다. $b - a = ${num(L95)}$ 일 때, $d - c$ 의 값은? (단, $Z$ 가 표준정규분포를 따르는 확률변수일 때, $P(|Z| \\le 1.96) = 0.95$, $P(|Z| \\le 2.58) = 0.99$ 로 계산한다.)`,
      ...mc(r, numC(L99), [numC(r4(L99 / 2)), numC(r4(L95 * 1.5)), numC(r4(2 * 2.58 * s)), numC(r4(L95 + 0.62 * 2 * se)), numC(r4(L95 + 2)), numC(r4(2.58 * se))], (j) => numC(r4(L99 + (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 0.5))),
      solution: lines(
        `같은 표본으로 구한 신뢰구간이므로 $\\frac{\\sigma}{\\sqrt{${n}}}$ 은 같고, 곱하는 수만 $1.96$ 에서 $2.58$ 로 바뀐다.`,
        `$b - a = 2 \\times 1.96 \\times \\frac{\\sigma}{\\sqrt{${n}}} = ${num(L95)}$ 에서 $\\frac{\\sigma}{${k}} = ${num(se)}$, 즉 $\\sigma = ${s}$`,
        `$d - c = 2 \\times 2.58 \\times \\frac{\\sigma}{\\sqrt{${n}}} = 2 \\times 2.58 \\times ${num(se)}$`,
        `$= ${num(L99)}$`
      ),
      score: 3,
    }
  },
  // 가능한 n(1~2500)과 x̄ 를 대입해 신뢰구간이 맞는지 직접 확인한다
  verify: ({ kind, s, k, xbar, conf }) => {
    const z = conf === 95 ? 1.96 : 2.58
    const e = r4((z * s) / k)
    if (kind === 0) {
      const lo = r4(xbar - e)
      const hi = r4(xbar + e)
      for (let n = 1; n <= 2500; n++) {
        const half = (z * s) / Math.sqrt(n)
        const xb = (lo + hi) / 2
        if (Math.abs(xb - half - lo) < 1e-6) return n + xb
      }
      return NaN
    }
    if (kind === 1) {
      const L = r4(2 * e)
      for (let n = 1; n <= 5000; n++) if ((2 * z * s) / Math.sqrt(n) <= L + 1e-9) return n
      return NaN
    }
    const L95 = r4(2 * e)
    const sigmaOverRootN = L95 / (2 * 1.96)
    return r4(2 * 2.58 * sigmaOverRootN)
  },
}

const PHATS = [0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9]
const propCI: SuTemplate<{ ph: number; n: number; kind: number; conf: 95 | 99 }> = {
  id: "s3-prop-ci",
  subject: S,
  unit: UNIT,
  standard: "12확통03-07",
  level: 3,
  count: 60,
  params: (r) => {
    const ph = r.pick(PHATS)
    const n = r.pick([100, 144, 225, 256, 400, 576, 625, 900, 1600, 2500])
    const conf = r.pick([95, 99] as const)
    const kind = r.int(0, 2)
    const se = Math.sqrt((ph * (1 - ph)) / n)
    if (Math.abs(Math.round(se * 1e5) - se * 1e5) > 1e-6) return null
    if (!Number.isInteger(Math.round(ph * n * 1e6) / 1e6)) return null
    const zz = conf === 95 ? 1.96 : 2.58
    if (Math.abs(Math.round(zz * se * 1e4) - zz * se * 1e4) > 1e-6) return null
    return { ph, n, kind, conf }
  },
  build: ({ ph, n, kind, conf }, r) => {
    const z = conf === 95 ? 1.96 : 2.58
    const zs = conf === 95 ? `P(|Z| \\le 1.96) = 0.95` : `P(|Z| \\le 2.58) = 0.99`
    const x = Math.round(ph * n)
    const se = Math.sqrt((ph * (1 - ph)) / n)
    const e = r4(z * se)
    const lo = r4(ph - e)
    const hi = r4(ph + e)
    const lead = `어느 도시의 시민 중에서 $${n}$ 명을 임의추출하여 조사하였더니 $${x}$ 명이 대중교통으로 출퇴근한다고 답하였다. 이 결과를 이용하여 이 도시 시민 전체에서 대중교통으로 출퇴근하는 시민의 비율 $p$ 에 대한 신뢰도 $${conf}\\%$ 의 신뢰구간을 구하면 $a \\le p \\le b$ 이다.`
    const note = `(단, 표본의 크기는 충분히 크고, $Z$ 가 표준정규분포를 따르는 확률변수일 때, $${zs}$ 로 계산한다.)`
    const what = [`b`, `b - a`, `a`][kind]
    const ans = [hi, r4(2 * e), lo][kind]
    const oz = conf === 95 ? 2.58 : 1.96
    const wr = [
      [r4(ph + oz * se), r4(ph + z * se * se * 100), r4(ph + 2 * e), r4(ph + se)],
      [r4(e), r4(2 * oz * se), r4(4 * e), r4(2 * se)],
      [r4(ph - oz * se), r4(ph - 2 * e), r4(ph - se), r4(hi)],
    ][kind]
    return {
      text: `${lead} $${what}$ 의 값은? ${note}`,
      ...mc(r, decChoice(ans), wr.filter((w) => w > 0).map((w) => decChoice(w)), (j) => decChoice(ans + (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 0.01)),
      solution: lines(
        `표본비율은 $\\hat{p} = \\frac{${x}}{${n}} = ${num(ph)}$ 이므로`,
        `신뢰구간은 $\\hat{p} - ${z}\\sqrt{\\frac{\\hat{p}(1 - \\hat{p})}{${n}}} \\le p \\le \\hat{p} + ${z}\\sqrt{\\frac{\\hat{p}(1 - \\hat{p})}{${n}}}$ 이다.`,
        `$\\sqrt{\\frac{${num(ph)} \\times ${num(1 - ph)}}{${n}}} = ${num(se)}$ 이므로 $${z} \\times ${num(se)} = ${num(e)}$`,
        kind === 1 ? `따라서 $a = ${num(lo)},\\ b = ${num(hi)}$ 이므로 $b - a = ${num(ans)}$` : `따라서 $${what} = ${num(ph)} ${kind === 0 ? "+" : "-"} ${num(e)} = ${num(ans)}$`
      ),
      score: 3,
    }
  },
  // 응답자 수에서 다시 표본비율을 만들고, 분산을 n 개 0/1 자료의 분산으로 직접 계산
  verify: ({ ph, n, kind, conf }) => {
    const z = conf === 95 ? 1.96 : 2.58
    const x = Math.round(ph * n)
    const mean = x / n
    const varData = (x * (1 - mean) ** 2 + (n - x) * mean ** 2) / n
    const e = r4(z * Math.sqrt(varData / n))
    return [r4(mean + e), r4(2 * e), r4(mean - e)][kind]
  },
}

const MS_TEX = [`m + \\sigma`, `m`, `\\sigma`, `m + 2\\sigma`, `m\\sigma`]
const normalTwoCond: SuTemplate<{ m: number; s: number; z1: number; z2: number; z3: number | null; z4: number | null; askMs: boolean; ak: number }> = {
  id: "s3-normal-two-cond",
  subject: S,
  unit: UNIT,
  standard: "12확통03-04",
  level: 3,
  count: 64,
  params: (r) => {
    const m = r.int(5, 40) * 2
    const s = r.pick([2, 4, 6, 8, 3, 5, 2, 4])
    const z1 = r.pick(Z_STEPS)
    const z2 = r.pick(Z_STEPS)
    if (Math.abs(z1 - z2) < 0.6 || Math.abs(z1) === Math.abs(z2)) return null
    if (!Number.isInteger(m + z1 * s) || !Number.isInteger(m + z2 * s)) return null
    const askMs = r.chance(0.3)
    let z3: number | null = r.pick(Z_STEPS)
    const z4: number | null = r.pick(Z_STEPS)
    if (r.chance(0.5)) z3 = null
    else if (z3 >= z4) return null
    if ((z3 !== null && !Number.isInteger(m + z3 * s)) || !Number.isInteger(m + z4 * s)) return null
    // 묻는 값: 0 m+σ, 1 m, 2 σ, 3 m+2σ, 4 mσ — 한 조건만으로 바로 나오는 조합(m+zσ 꼴)은 거른다
    const ak = r.int(0, 4)
    const val = [m + s, m, s, m + 2 * s, m * s][ak]
    if (askMs && !isShortOk(val)) return null
    if (askMs && ((ak === 0 && (z1 === 1 || z2 === 1)) || (ak === 3 && (z1 === 2 || z2 === 2)))) return null
    return { m, s, z1, z2, z3, z4, askMs, ak }
  },
  build: ({ m, s, z1, z2, z3, z4, askMs, ak }, r) => {
    const a = m + z1 * s
    const b = m + z2 * s
    const pa = F(z1)
    const pb = r4(1 - F(z2))
    const lead = `확률변수 $X$ 가 정규분포 $\\mathrm{N}(m, \\sigma^{2})$ 을 따르고 $P(X \\le ${a}) = ${pa.toFixed(4)},\\ P(X \\ge ${b}) = ${pb.toFixed(4)}$ 이다.`
    const zLine = (x: number, p: string, z: number, ge: boolean) =>
      ge
        ? `$P(X \\ge ${x}) = ${p}$ 에서 $P\\left(Z \\ge \\frac{${x} - m}{\\sigma}\\right) = ${p}$ 이고, 표에서 $\\frac{${x} - m}{\\sigma} = ${zt(z)}$`
        : `$P(X \\le ${x}) = ${p}$ 에서 $P\\left(Z \\le \\frac{${x} - m}{\\sigma}\\right) = ${p}$ 이고, 표에서 $\\frac{${x} - m}{\\sigma} = ${zt(z)}$`
    const base = [
      `$Z = \\frac{X - m}{\\sigma}$ 는 표준정규분포를 따른다.`,
      zLine(a, pa.toFixed(4), z1, false),
      zLine(b, pb.toFixed(4), z2, true),
      `즉 $${a} = m ${sgnZ(z1)}\\sigma,\\ ${b} = m ${sgnZ(z2)}\\sigma$ 를 연립하면 $\\sigma = ${s},\\ m = ${m}$`,
    ]
    const figure = tableFor(z1, z2, ...(askMs ? [] : [z3, z4].filter((z): z is number => z !== null)))
    if (askMs) {
      return {
        text: `${lead} $${MS_TEX[ak]}$ 의 값을 오른쪽 표준정규분포표를 이용하여 구하시오. (단, $\\sigma > 0$)`,
        figure,
        ...short([m + s, m, s, m + 2 * s, m * s][ak]),
        solution: lines(...base, `따라서 $${MS_TEX[ak]} = ${[`${m} + ${s}`, `${m}`, `${s}`, `${m} + 2 \\times ${s}`, `${m} \\times ${s}`][ak]}${ak === 1 || ak === 2 ? "" : ` = ${[m + s, m, s, m + 2 * s, m * s][ak]}`}$`),
        score: 3,
      }
    }
    const x3 = z3 === null ? null : m + z3 * s
    const x4 = m + z4! * s
    const ask = x3 === null ? `P(X \\le ${x4})` : `P(${x3} \\le X \\le ${x4})`
    const pr = zProb(z3, z4)
    return {
      text: `${lead} $${ask}$ 의 값을 오른쪽 표준정규분포표를 이용하여 구한 것은? (단, $\\sigma > 0$)`,
      figure,
      ...decMc(r, pr.value, wrongsFor(z3, z4, pr.value)),
      solution: lines(...base, `$${ask} = ${x3 === null ? `P(Z \\le ${zt(z4!)})` : `P(${zt(z3!)} \\le Z \\le ${zt(z4!)})`}$`, `$= ${pr.tex}$`),
      score: 4,
    }
  },
  // 표 값으로부터 z 를 거꾸로 찾아 m, σ 를 연립으로 다시 구한 뒤 계산
  verify: ({ m, s, z1, z2, z3, z4, askMs, ak }) => {
    const a = m + z1 * s
    const b = m + z2 * s
    const pa = F(z1)
    const pb = r4(1 - F(z2))
    const inv = (p: number) => {
      const cand = [0, ...ZPOS, ...ZPOS.map((x) => -x)].filter((z) => Math.abs(tableTail(-z) - p) < 1e-9 || Math.abs(1 - tableTail(z) - p) < 1e-9)
      return cand.length === 1 ? cand[0] : NaN
    }
    const za = inv(pa)
    const zb = -inv(pb) // P(X ≥ b) = pb → P(Z ≤ -zb') = pb
    const sg = (b - a) / (zb - za)
    const mm = a - za * sg
    if (askMs) return [mm + sg, mm, sg, mm + 2 * sg, mm * sg][ak]
    const zz3 = z3 === null ? null : snap((mm + z3 * sg - mm) / sg)
    const zz4 = snap((m + z4! * s - mm) / sg)
    return zz3 === null ? r4(1 - tableTail(zz4)) : tableBetween(zz3, zz4)
  },
}

const PP = [0.1, 0.2, 0.5, 0.8, 0.9, 0.4, 0.6]
const sampleProp: SuTemplate<{ p: number; n: number; z1: number | null; z2: number | null }> = {
  id: "s3-sample-prop",
  subject: S,
  unit: UNIT,
  standard: "12확통03-06",
  level: 3,
  count: 60,
  params: (r) => {
    const p = r.pick(PP)
    const n = r.pick([100, 144, 225, 400, 625, 900, 1600, 2500])
    const se = Math.sqrt((p * (1 - p)) / n)
    if (Math.abs(Math.round(se * 1e4) - se * 1e4) > 1e-6) return null
    if (Math.abs(Math.round(p * n) - p * n) > 1e-9) return null
    let z1: number | null = r.pick(Z_STEPS)
    let z2: number | null = r.pick(Z_STEPS)
    const k = r.int(0, 2)
    if (k === 0) z1 = null
    else if (k === 1) z2 = null
    else if (z1 >= z2) return null
    for (const z of [z1, z2]) if (z !== null && Math.abs(Math.round((p + z * se) * 1e4) - (p + z * se) * 1e4) > 1e-6) return null
    return { p, n, z1, z2 }
  },
  build: ({ p, n, z1, z2 }, r) => {
    const se = r4(Math.sqrt((p * (1 - p)) / n))
    const c1 = z1 === null ? null : r4(p + z1 * se)
    const c2 = z2 === null ? null : r4(p + z2 * se)
    const P = `\\hat{p}`
    const ask = c1 === null ? `P(${P} \\le ${num(c2!)})` : c2 === null ? `P(${P} \\ge ${num(c1)})` : `P(${num(c1)} \\le ${P} \\le ${num(c2)})`
    const zAsk = c1 === null ? `P(Z \\le ${zt(z2!)})` : c2 === null ? `P(Z \\ge ${zt(z1!)})` : `P(${zt(z1!)} \\le Z \\le ${zt(z2!)})`
    const pr = zProb(z1, z2)
    return {
      text: `어느 회사에서 생산하는 제품 중 $${Math.round(p * 100)}\\%$ 가 A 등급이다. 이 회사의 제품 중에서 임의추출한 $${n}$ 개의 제품 중 A 등급인 제품의 비율을 $${P}$ 이라 할 때, $${ask}$ 의 값을 오른쪽 표준정규분포표를 이용하여 구한 것은? (단, 표본의 크기는 충분히 크다.)`,
      figure: tableFor(...[z1, z2].filter((z): z is number => z !== null)),
      ...decMc(r, pr.value, wrongsFor(z1, z2, pr.value)),
      solution: lines(
        `모비율 $p = ${num(p)}$, 표본의 크기 $n = ${n}$ 이므로 $E(${P}) = ${num(p)}$, $V(${P}) = \\frac{${num(p)} \\times ${num(1 - p)}}{${n}} = ${num(se)}^{2}$`,
        `$n$ 이 충분히 크므로 $${P}$ 은 근사적으로 정규분포 $\\mathrm{N}(${num(p)}, ${num(se)}^{2})$ 을 따르고, $Z = \\frac{${P} - ${num(p)}}{${num(se)}}$ 로 표준화한다.`,
        `$${ask} = ${zAsk}$`,
        `$= ${pr.tex}$`
      ),
      score: 3,
    }
  },
  // n 개의 0/1 자료로 분산을 다시 구하고 z 를 계산해 표에서 읽는다
  verify: ({ p, n, z1, z2 }) => {
    const k = Math.round(p * n)
    const v = (k * (1 - p) ** 2 + (n - k) * p ** 2) / n / n
    const se = Math.sqrt(v)
    const c1 = z1 === null ? null : r4(p + z1 * r4(Math.sqrt((p * (1 - p)) / n)))
    const c2 = z2 === null ? null : r4(p + z2 * r4(Math.sqrt((p * (1 - p)) / n)))
    const a = c1 === null ? null : snap((c1 - p) / se)
    const b = c2 === null ? null : snap((c2 - p) / se)
    return r4(1 - (a === null ? 0 : tableTail(-a)) - (b === null ? 0 : tableTail(b)))
  },
}

// ═════════════════ 4단계 ═════════════════

const MIX = [
  { a: q(1, 2), b: q(1, 8) },
  { a: q(1, 3), b: q(1, 6) },
  { a: q(2, 3), b: q(1, 12) },
  { a: q(3, 4), b: q(1, 16) },
]
const mixDist: SuTemplate<{ vs: number[]; cnt: number[]; D: number; im: number; ask: number }> = {
  id: "s4-mix-dist",
  subject: S,
  unit: UNIT,
  standard: "12확통03-02",
  level: 4,
  count: 45,
  params: (r) => {
    const vs = r.pick([
      [1, 2, 3, 4],
      [0, 1, 2, 3],
      [2, 4, 6, 8],
    ])
    const D = r.pick([4, 5, 6, 8, 10])
    const c = [r.int(0, D), r.int(0, D), r.int(0, D)]
    const last = D - c.reduce((x, y) => x + y, 0)
    if (last < 0) return null
    const cnt = [...c, last]
    const im = r.int(0, MIX.length - 1)
    const ask = r.int(0, 1)
    const v = mixAns(vs, cnt, D, im, ask)
    if (v.n <= 0) return null
    return { vs, cnt, D, im, ask }
  },
  build: ({ vs, cnt, D, im, ask }, r) => {
    const { a, b } = MIX[im]
    const P = cnt.map((c) => q(c, D))
    const EX = vs.reduce((s, v, i) => s.add(P[i].mul(v)), q(0))
    const EX2 = vs.reduce((s, v, i) => s.add(P[i].mul(v * v)), q(0))
    const VX = EX2.sub(EX.mul(EX))
    const sv = vs.reduce((s, v) => s + v, 0)
    const sv2 = vs.reduce((s, v) => s + v * v, 0)
    const EY = a.mul(EX).add(b.mul(sv))
    const EY2 = a.mul(EX2).add(b.mul(sv2))
    const VY = EY2.sub(EY.mul(EY))
    const ans = ask === 0 ? VY : EY2
    const what = ask === 0 ? `V(Y)` : `E(Y^{2})`
    const res = ans.n + ans.d <= 999 && ans.d > 1
    const text = `두 이산확률변수 $X, Y$ 가 갖는 값이 모두 $${vs.join(", ")}$ 이고, $${vs[0]} \\le k \\le ${vs[3]}$ 인 ${vs[1] - vs[0] === 2 ? "짝수" : "정수"} $k$ 에 대하여\n$P(Y = k) = ${a.tex()}P(X = k) + ${b.tex()}$\n이다. $E(X) = ${EX.tex()},\\ V(X) = ${VX.tex()}$ 일 때, $${what}$ 의 값`
    const sol = [
      `$${vs.map((v) => `P(Y = ${v})`).join(" + ")} = ${a.tex()} \\times 1 + 4 \\times ${b.tex()} = 1$ 이므로 $Y$ 의 확률분포가 잘 정의된다.`,
      `$E(Y) = \\sum k P(Y = k) = ${a.tex()}\\sum k P(X = k) + ${b.tex()}(${vs.join(" + ")}) = ${a.tex()} \\times ${EX.tex()} + ${b.tex()} \\times ${sv} = ${EY.tex()}$`,
      `$E(X^{2}) = V(X) + \\{E(X)\\}^{2} = ${VX.tex()} + \\left(${EX.tex()}\\right)^{2} = ${EX2.tex()}$`,
      `$E(Y^{2}) = ${a.tex()}E(X^{2}) + ${b.tex()}(${vs.map((v) => `${v}^{2}`).join(" + ")}) = ${a.tex()} \\times ${EX2.tex()} + ${b.tex()} \\times ${sv2} = ${EY2.tex()}$`,
      ask === 0 ? `따라서 $V(Y) = E(Y^{2}) - \\{E(Y)\\}^{2} = ${EY2.tex()} - \\left(${EY.tex()}\\right)^{2} = ${VY.tex()}$` : `따라서 $E(Y^{2}) = ${EY2.tex()}$`,
    ]
    if (res) {
      return {
        text: `${text}을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`,
        ...short(ans.n + ans.d),
        solution: lines(...sol, `$p = ${ans.d},\\ q = ${ans.n}$ 이므로 $p + q = ${ans.n + ans.d}$`),
        score: 4,
      }
    }
    return {
      text: `${text}은?`,
      ...fracMc(r, ans, [VX, EY2, a.mul(VX), VY.add(q(1, 4)), EY.mul(EY), a.mul(VX).add(b.mul(sv2))].filter((x) => !x.eq(ans)), false),
      solution: lines(...sol),
      score: 4,
    }
  },
  // 실제 X 의 분포에서 Y 의 분포를 만들어 직접 계산
  verify: ({ vs, cnt, D, im, ask }) => {
    const { a, b } = MIX[im]
    const py = cnt.map((c) => a.value * (c / D) + b.value)
    const e = py.reduce((s, p, i) => s + p * vs[i], 0)
    const e2 = py.reduce((s, p, i) => s + p * vs[i] * vs[i], 0)
    const v = ask === 0 ? e2 - e * e : e2
    // p+q 형이면 분수로 되돌린다
    const ans = mixAns(vs, cnt, D, im, ask)
    if (ans.n + ans.d <= 999 && ans.d > 1) {
      for (let d = 2; d <= 999; d++) {
        const n = Math.round(v * d)
        if (Math.abs(n / d - v) < 1e-9) return n + d
      }
      return NaN
    }
    return v
  },
}
function mixAns(vs: number[], cnt: number[], D: number, im: number, ask: number) {
  const { a, b } = MIX[im]
  const P = cnt.map((c) => q(c, D))
  const py = P.map((p) => a.mul(p).add(b))
  const e = py.reduce((s, p, i) => s.add(p.mul(vs[i])), q(0))
  const e2 = py.reduce((s, p, i) => s.add(p.mul(vs[i] * vs[i])), q(0))
  return ask === 0 ? e2.sub(e.mul(e)) : e2
}

const normalMax: SuTemplate<{ m: number; s: number; L: number; zk: number; z1: number | null; z2: number | null; tail: boolean }> = {
  id: "s4-normal-max",
  subject: S,
  unit: UNIT,
  standard: "12확통03-04",
  level: 4,
  count: 45,
  params: (r) => {
    const m = r.int(5, 40) * 2
    const s = r.pick([2, 4, 6, 8, 3, 5, 2, 4])
    const L = r.int(1, 4) * 2
    const zk = r.pick(Z_STEPS)
    if (!Number.isInteger(m + zk * s)) return null
    let z1: number | null = r.pick(Z_STEPS)
    let z2: number | null = r.pick(Z_STEPS)
    const k = r.int(0, 2)
    if (k === 0) z1 = null
    else if (k === 1) z2 = null
    else if (z1 >= z2) return null
    if ((z1 !== null && !Number.isInteger(m + z1 * s)) || (z2 !== null && !Number.isInteger(m + z2 * s))) return null
    if ((z1 === zk && z2 === null) || (z2 === zk && z1 === null)) return null
    return { m, s, L, zk, z1, z2, tail: r.chance(0.5) }
  },
  build: ({ m, s, L, zk, z1, z2, tail }, r) => {
    const t0 = m - L / 2
    const k = m + zk * s
    const pk = tail ? r4(1 - F(zk)) : F(zk)
    const cond2 = tail ? `P(X \\ge ${k}) = ${pk.toFixed(4)}` : `P(X \\le ${k}) = ${pk.toFixed(4)}`
    const x1 = z1 === null ? null : m + z1 * s
    const x2 = z2 === null ? null : m + z2 * s
    const ask = x1 === null ? `P(X \\le ${x2})` : x2 === null ? `P(X \\ge ${x1})` : `P(${x1} \\le X \\le ${x2})`
    const zAsk = x1 === null ? `P(Z \\le ${zt(z2!)})` : x2 === null ? `P(Z \\ge ${zt(z1!)})` : `P(${zt(z1!)} \\le Z \\le ${zt(z2!)})`
    const pr = zProb(z1, z2)
    return {
      text: `정규분포 $\\mathrm{N}(m, \\sigma^{2})$ 을 따르는 확률변수 $X$ 에 대하여 함수 $g(t) = P(t \\le X \\le t + ${L})$ 은 $t = ${t0}$ 에서 최댓값을 갖는다. $${cond2}$ 일 때, $${ask}$ 의 값을 오른쪽 표준정규분포표를 이용하여 구한 것은? (단, $\\sigma > 0$)`,
      figure: tableFor(zk, ...[z1, z2].filter((z): z is number => z !== null)),
      ...decMc(r, pr.value, wrongsFor(z1, z2, pr.value)),
      solution: lines(
        `길이가 $${L}$ 로 일정한 구간 $[t, t + ${L}]$ 에서의 확률은 구간의 중점이 평균 $m$ 과 같을 때 최대이다. 정규분포 곡선이 $x = m$ 에 대하여 대칭이고 $m$ 에서 멀어질수록 낮아지기 때문이다.`,
        `따라서 $\\frac{${t0} + (${t0} + ${L})}{2} = m$, 즉 $m = ${m}$`,
        tail
          ? `$P(X \\ge ${k}) = ${pk.toFixed(4)}$ 에서 $P\\left(Z \\ge \\frac{${k} - ${m}}{\\sigma}\\right) = ${pk.toFixed(4)}$ 이고 표에서 $\\frac{${k - m}}{\\sigma} = ${zt(zk)}$ 이므로 $\\sigma = ${s}$`
          : `$P(X \\le ${k}) = ${pk.toFixed(4)}$ 에서 $P\\left(Z \\le \\frac{${k} - ${m}}{\\sigma}\\right) = ${pk.toFixed(4)}$ 이고 표에서 $\\frac{${k - m}}{\\sigma} = ${zt(zk)}$ 이므로 $\\sigma = ${s}$`,
        `$${ask} = ${zAsk}$`,
        `$= ${pr.tex}$`
      ),
      score: 4,
    }
  },
  // g(t) 를 수치로 최대화해 m 을 찾고, 표 값을 거꾸로 읽어 σ 를 찾은 뒤 계산
  verify: ({ m, s, L, zk, z1, z2, tail }) => {
    const t0 = m - L / 2
    void t0
    // 임의의 σ' 로 g(t) 의 최대 위치를 찾는다 (σ 와 무관)
    let best = -Infinity
    let arg = NaN
    for (let t = m - 60; t <= m + 60; t += 0.25) {
      const g = phi((t + L - m - 0) / 3) - phi((t - m) / 3)
      if (g > best + 1e-12) {
        best = g
        arg = t
      }
    }
    const mm = arg + L / 2
    const k = m + zk * s
    const pk = tail ? r4(1 - F(zk)) : F(zk)
    const target = tail ? 1 - pk : pk // P(Z ≤ z) = target
    const cand = [0, ...ZPOS, ...ZPOS.map((x) => -x)].filter((z) => Math.abs(1 - tableTail(z) - target) < 1e-9)
    if (cand.length !== 1) return NaN
    const sg = (k - mm) / cand[0]
    const a = z1 === null ? null : snap((m + z1 * s - mm) / sg)
    const b = z2 === null ? null : snap((m + z2 * s - mm) / sg)
    return r4(1 - (a === null ? 0 : tableTail(-a)) - (b === null ? 0 : tableTail(b)))
  },
}

const cardSample: SuTemplate<{ cnt: number[]; n: number }> = {
  id: "s4-card-sample",
  subject: S,
  unit: UNIT,
  standard: "12확통03-06",
  level: 4,
  count: 40,
  params: (r) => {
    const N = r.int(4, 10)
    const a = r.int(1, N - 2)
    const b = r.int(1, N - a - 1)
    const cnt = [a, b, N - a - b]
    const n = r.int(2, 3)
    // (E, V) 로 개수가 유일하게 정해지는지
    const key = cardKey(cnt, n)
    let same = 0
    for (let x = 0; x <= N; x++) for (let y = 0; x + y <= N; y++) if (cardKey([x, y, N - x - y], n) === key) same++
    if (same !== 1) return null
    const v = cardAns(cnt, n)
    if (v.n === 0 || v.n + v.d > 999) return null
    return { cnt, n }
  },
  build: ({ cnt, n }) => {
    const N = cnt.reduce((s, c) => s + c, 0)
    const [a, b, c] = cnt
    const E = q(a + 2 * b + 3 * c, N)
    const E2 = q(a + 4 * b + 9 * c, N)
    const V = E2.sub(E.mul(E))
    const VB = V.div(n)
    const ans = cardAns(cnt, n)
    const draws = n === 2 ? `두 번` : `세 번`
    return {
      text: `주머니에 $1, 2, 3$ 중 하나의 숫자가 적힌 카드가 모두 $${N}$ 장 들어 있다. 이 주머니에서 임의로 한 장의 카드를 꺼내어 숫자를 확인한 후 다시 넣는 시행을 ${draws} 반복할 때, 꺼낸 카드에 적힌 수의 평균을 $\\overline{X}$ 라 하자. $E(\\overline{X}) = ${E.tex()},\\ V(\\overline{X}) = ${VB.tex()}$ 일 때, $P(\\overline{X} = 2)$ 의 값이 $\\frac{q}{p}$ 이다. $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`,
      ...short(ans.n + ans.d),
      solution: lines(
        `$1, 2, 3$ 이 적힌 카드를 각각 $x, y, z$ 장이라 하고, 한 장을 꺼낼 때 나오는 수를 $X$ 라 하면 $x + y + z = ${N}$`,
        `$E(X) = E(\\overline{X}) = ${E.tex()}$ 이므로 $x + 2y + 3z = ${a + 2 * b + 3 * c}$`,
        `$V(X) = ${n}V(\\overline{X}) = ${V.tex()}$ 이므로 $E(X^{2}) = ${V.tex()} + \\left(${E.tex()}\\right)^{2} = ${E2.tex()}$, 즉 $x + 4y + 9z = ${a + 4 * b + 9 * c}$`,
        `세 식을 연립하면 $x = ${a},\\ y = ${b},\\ z = ${c}$`,
        n === 2
          ? `$\\overline{X} = 2$ 이려면 두 수의 합이 $4$, 즉 $(1, 3), (3, 1), (2, 2)$ 이므로 $P(\\overline{X} = 2) = 2 \\times \\frac{${a}}{${N}} \\times \\frac{${c}}{${N}} + \\left(\\frac{${b}}{${N}}\\right)^{2} = ${ans.tex()}$`
          : `$\\overline{X} = 2$ 이려면 세 수의 합이 $6$, 즉 $1, 2, 3$ 이 한 번씩 나오거나 ($3! = 6$ 가지 순서) $2$ 가 세 번 나와야 하므로 $P(\\overline{X} = 2) = 6 \\times \\frac{${a}}{${N}} \\times \\frac{${b}}{${N}} \\times \\frac{${c}}{${N}} + \\left(\\frac{${b}}{${N}}\\right)^{3} = ${ans.tex()}$`,
        `따라서 $p + q = ${ans.d} + ${ans.n} = ${ans.n + ans.d}$`
      ),
      score: 4,
    }
  },
  // 가능한 (x, y, z) 를 모두 대입해 조건에 맞는 것을 찾고, 카드 목록에서 복원추출을 직접 나열한다
  verify: ({ cnt, n }) => {
    const N = cnt.reduce((s, c) => s + c, 0)
    const target = cardKey(cnt, n)
    const sols: number[][] = []
    for (let x = 0; x <= N; x++) for (let y = 0; x + y <= N; y++) if (cardKey([x, y, N - x - y], n) === target) sols.push([x, y, N - x - y])
    if (sols.length !== 1) return NaN
    const cards = sols[0].flatMap((c, i) => Array(c).fill(i + 1))
    let good = 0
    let all = 0
    for (const t of tuples(range(0, N - 1), n)) {
      all++
      if (t.reduce((s, i) => s + cards[i], 0) === 2 * n) good++
    }
    const v = q(good, all)
    return v.n + v.d
  },
}
function cardKey(cnt: number[], n: number) {
  const N = cnt.reduce((s, c) => s + c, 0)
  const E = q(cnt[0] + 2 * cnt[1] + 3 * cnt[2], N)
  const E2 = q(cnt[0] + 4 * cnt[1] + 9 * cnt[2], N)
  return `${E.toString()}|${E2.sub(E.mul(E)).div(n).toString()}`
}
function cardAns(cnt: number[], n: number) {
  const N = cnt.reduce((s, c) => s + c, 0)
  const [a, b, c] = cnt
  return n === 2 ? q(2 * a * c + b * b, N * N) : q(6 * a * b * c + b * b * b, N * N * N)
}

const sampleCond: SuTemplate<{ m: number; h: number; s: number; k: number; dist: number; z: number }> = {
  id: "s4-sample-cond",
  subject: S,
  unit: UNIT,
  standard: "12확통03-06",
  level: 4,
  count: 37,
  params: (r) => {
    const m = r.int(10, 60) * 2
    const h = r.int(1, 8)
    const k = r.int(2, 6)
    const s = k * r.pick([1, 2, 2, 4, 4, 6])
    const dist = r.int(1, 3) * (s / k) // m - a
    const z = r.pick(Z_STEPS)
    if (!Number.isInteger(dist) || !Number.isInteger(m + (z * s) / k)) return null
    // 묻는 확률이 (나)의 좌변(또는 그 대칭)과 같으면 n 을 구하지 않아도 답이 나오므로 거른다
    if (Math.abs(Math.abs(z) - (dist * k) / s) < 1e-9) return null
    if (dist * k > 60) return null
    return { m, h, s, k, dist, z }
  },
  build: ({ m, h, s, k, dist, z }, r) => {
    const n = k * k
    const c = m - h
    const d = m + h
    const a = m - dist
    const b = m + k * dist
    const se = s / k
    const e = m + z * se
    const ask = z > 0 ? `P(\\overline{X} \\ge ${e})` : `P(\\overline{X} \\le ${e})`
    const pr = z > 0 ? zProb(z, null) : zProb(null, z)
    return {
      text: `정규분포 $\\mathrm{N}(m, ${s}^{2})$ 을 따르는 모집단의 확률변수를 $X$ 라 하고, 이 모집단에서 크기가 $n$ 인 표본을 임의추출하여 구한 표본평균을 $\\overline{X}$ 라 하자. 두 조건\n(가) $P(X \\le ${c}) + P(X \\le ${d}) = 1$\n(나) $P(\\overline{X} \\le ${a}) = P(X \\ge ${b})$\n를 만족시킬 때, $${ask}$ 의 값을 오른쪽 표준정규분포표를 이용하여 구한 것은?`,
      figure: tableFor(z),
      ...decMc(r, pr.value, [r4(1 - pr.value), T(z), r4(0.5 + T(z)) === pr.value ? r4(0.5 - T(z)) : r4(0.5 + T(z)), ...(inTableZ(z / k) ? [r4(0.5 - T(z / k))] : []), ...(inTableZ(z * k) ? [r4(0.5 - T(z * k))] : [])]),
      solution: lines(
        `(가)에서 $P(X \\le ${d}) = 1 - P(X \\le ${c}) = P(X \\ge ${c})$ 이므로 정규분포 곡선의 대칭성에 의하여 $m = \\frac{${c} + ${d}}{2} = ${m}$`,
        `$\\overline{X}$ 는 정규분포 $\\mathrm{N}\\left(${m}, \\frac{${s}^{2}}{n}\\right)$ 을 따르므로 (나)의 좌변은 $P\\left(Z \\le \\frac{${a} - ${m}}{${s} / \\sqrt{n}}\\right) = P\\left(Z \\le -\\frac{${dist}\\sqrt{n}}{${s}}\\right)$, 우변은 $P\\left(Z \\ge \\frac{${b} - ${m}}{${s}}\\right) = P\\left(Z \\ge ${q(b - m, s).tex()}\\right) = P\\left(Z \\le -${q(b - m, s).tex()}\\right)$`,
        `$\\frac{${dist}\\sqrt{n}}{${s}} = ${q(b - m, s).tex()}$ 이어야 하므로 $\\sqrt{n} = ${k}$, 즉 $n = ${n}$`,
        `$\\sigma(\\overline{X}) = \\frac{${s}}{${k}} = ${num(se)}$ 이므로 $${ask} = P\\left(Z ${z > 0 ? "\\ge" : "\\le"} \\frac{${e} - ${m}}{${num(se)}}\\right) = P(Z ${z > 0 ? "\\ge" : "\\le"} ${zt(z)})$`,
        `$= ${pr.tex}$`
      ),
      score: 4,
    }
  },
  // m 은 (가)를 수치로 풀어서, n 은 (나)를 1~400 대입으로 찾은 뒤 계산
  verify: ({ m, h, s, k, dist, z }) => {
    const c = m - h
    const d = m + h
    const rs = roots((mm) => phi((c - mm) / s) + phi((d - mm) / s) - 1, 0, 300, 1200)
    if (rs.length !== 1) return NaN
    const mm = Math.round(rs[0] * 1000) / 1000
    const a = m - dist
    const b = m + k * dist
    const ns: number[] = []
    for (let n = 1; n <= 400; n++) if (Math.abs(((a - mm) * Math.sqrt(n)) / s + (b - mm) / s) < 1e-6) ns.push(n)
    if (ns.length !== 1) return NaN
    const se = s / Math.sqrt(ns[0])
    const e = m + (z * s) / k
    const zz = snap((e - mm) / se)
    return z > 0 ? tableTail(zz) : r4(1 - tableTail(zz))
  },
}

export const STATISTICS: SuTemplate[] = [distUnknown, linearTrans, binomMean, normalStd, binomFind, distEV, normalSym, sampleMean, ciMean, propCI, normalTwoCond, sampleProp, mixDist, normalMax, cardSample, sampleCond].map(polish)
