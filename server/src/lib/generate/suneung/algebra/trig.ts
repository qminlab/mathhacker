// 대수 · 삼각함수
import { closeTo, gcd, intChoice, ints, isShortOk, mc, q, Q, qChoice, roots, short, signed, term, texSqrt } from "../kit"
import type { Choice, SuTemplate } from "../types"
import {
  angleArg,
  autoQ,
  cosPi,
  extrema,
  piChoice,
  piFill,
  piTex,
  qFill,
  sd,
  sdAdd,
  sdChoice,
  sdDiv,
  sdFill,
  sdMul,
  sdNeg,
  sdScale,
  sdTex,
  sdVal,
  sinPi,
  sol,
  tanPi,
  zeros,
  type Sd,
} from "./helpers"

const U = "삼각함수"
const PI = Math.PI
const T = (s: string) => `\\mathrm{${s}}`
const seg = (s: string) => `\\overline{\\mathrm{${s}}}`
const tri = `삼각형 $${T("ABC")}$`
const FN: Record<string, (x: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan }
const valOf = (f: string, t: Q): Sd | null => (f === "sin" ? sinPi(t) : f === "cos" ? cosPi(t) : tanPi(t))
/** bx 의 TeX (b 는 유리수) */
const bx = (b: Q, x = "x") => (b.eq(1) ? x : b.isInt ? `${b.n}${x}` : b.n === 1 ? `\\frac{${x}}{${b.d}}` : `\\frac{${b.n}${x}}{${b.d}}`)
const fx = (f: string, arg: string) => (arg.startsWith("\\left") || arg.startsWith("\\frac") ? `\\${f}${arg}` : `\\${f} ${arg}`)
const sdEq = (x: Sd, y: Sd) => Math.abs(sdVal(x) - sdVal(y)) < 1e-12

// 삼각형 좌표: 꼭짓점 B=(0,0), C=(a,0), 각 B, C (라디안) 로 A 를 잡는다
function triFromAngles(a: number, B: number, C: number) {
  // A = t(cos B, sin B), A 는 C 에서 각 (π − C) 방향 직선 위
  // t sinB = s sinC, t cosB = a − s cosC → t = a sinC / sin(B + C)
  const t = (a * Math.sin(C)) / Math.sin(B + C)
  const A = [t * Math.cos(B), t * Math.sin(B)]
  return { A, B: [0, 0], C: [a, 0] }
}
const dist = (P: number[], Q2: number[]) => Math.hypot(P[0] - Q2[0], P[1] - Q2[1])
function circumR(P: number[], Q2: number[], R: number[]) {
  const a = dist(Q2, R)
  const b = dist(P, R)
  const c = dist(P, Q2)
  const area = Math.abs((Q2[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q2[1] - P[1])) / 2
  return (a * b * c) / (4 * area)
}

// ═════════ 1단계 ═════════

/** 호도법: 부채꼴의 넓이·호의 길이·반지름 */
const sector: SuTemplate<{ mode: "area" | "angle" | "radius" | "perim"; r: number; p: number; qd: number; l: number }> = {
  id: "trig-sector",
  subject: "대수",
  unit: U,
  standard: "12대수02-01",
  level: 1,
  count: 70,
  params: (r) => {
    const mode = r.pick(["area", "angle", "radius", "perim"] as const)
    const rad = r.int(2, 12)
    if (mode === "area") {
      const qd = r.pick([2, 3, 4, 5, 6])
      const p = r.int(1, 2 * qd - 1)
      if (gcd(p, qd) !== 1) return null
      return { mode, r: rad, p, qd, l: 0 }
    }
    if (mode === "angle") {
      const k = r.int(1, 3 * rad)
      if (gcd(k, rad) === rad) return null
      if (k / rad >= 2) return null
      return { mode, r: rad, p: k, qd: rad, l: k }
    }
    const l = r.int(2, 20)
    if ((rad * l) % 2) return null
    if (l / rad >= 2 * PI) return null
    return { mode, r: rad, p: 0, qd: 1, l }
  },
  build: ({ mode, r: rad, p, qd, l }, r) => {
    if (mode === "area") {
      const th = q(p, qd)
      const S = th.mul(rad * rad).div(2)
      return {
        text: `반지름의 길이가 $${rad}$ 이고 중심각의 크기가 $${piTex(th)}$ 인 부채꼴의 넓이는?`,
        ...mc(r, piChoice(S), [piChoice(th.mul(rad)), piChoice(S.mul(2)), piChoice(th.mul(rad).div(2)), piChoice(S.div(2))], piFill(S, q(1, 2))),
        solution: sol(
          `반지름의 길이가 $r$, 중심각의 크기가 $\\theta$ 인 부채꼴의 넓이는 $\\frac{1}{2}r^{2}\\theta$ 이다.`,
          `$\\frac{1}{2} \\times ${rad}^{2} \\times ${piTex(th)} = ${piTex(S)}$`
        ),
        score: 2,
      }
    }
    if (mode === "angle") {
      const L = q(l)
      const th = q(l, rad)
      return {
        text: `반지름의 길이가 $${rad}$ 이고 호의 길이가 $${piTex(L)}$ 인 부채꼴의 중심각의 크기는?`,
        ...mc(r, piChoice(th), [piChoice(q(rad, l)), piChoice(th.mul(2)), piChoice(th.div(2)), piChoice(q(l * rad))], piFill(th, q(1, rad))),
        solution: sol(
          `반지름의 길이가 $r$, 중심각의 크기가 $\\theta$ 인 부채꼴의 호의 길이는 $r\\theta$ 이다.`,
          `$${rad}\\theta = ${piTex(L)}$ 이므로 $\\theta = ${piTex(th)}$`
        ),
        score: 2,
      }
    }
    if (mode === "radius") {
      const S = (rad * l) / 2
      return {
        text: `호의 길이가 $${l}$ 이고 넓이가 $${S}$ 인 부채꼴의 반지름의 길이를 구하시오.`,
        ...short(rad),
        solution: sol(
          `반지름의 길이를 $r$, 호의 길이를 $l$ 이라 하면 부채꼴의 넓이는 $\\frac{1}{2}rl$ 이다.`,
          `$\\frac{1}{2} \\times r \\times ${l} = ${S}$ 이므로 $r = ${rad}$`
        ),
        score: 2,
      }
    }
    const P = 2 * rad + l
    const S = (rad * l) / 2
    return {
      text: `반지름의 길이가 $${rad}$ 이고 둘레의 길이가 $${P}$ 인 부채꼴의 넓이를 구하시오.`,
      ...short(S),
      solution: sol(
        `부채꼴의 둘레의 길이는 (반지름) $\\times 2 +$ (호의 길이) 이므로 호의 길이는 $${P} - ${2 * rad} = ${l}$`,
        `넓이는 $\\frac{1}{2} \\times ${rad} \\times ${l} = ${S}$`
      ),
      score: 2,
    }
  },
  verify: ({ mode, r: rad, p, qd, l }) => {
    if (mode === "area") {
      const th = (p / qd) * PI
      return (th / (2 * PI)) * PI * rad * rad
    }
    if (mode === "angle") return (l * PI) / rad
    if (mode === "radius") {
      const S = (rad * l) / 2
      for (let x = 1; x <= 200; x++) if (closeTo((x * x * (l / x)) / 2, S)) return x
      return NaN
    }
    const th = l / rad
    return (th / (2 * PI)) * PI * rad * rad
  },
}

/** 여러 사분면의 삼각함수 값 */
const trigValues: SuTemplate<{ fam: 4 | 6; f1: string; m1: number; f2: string; m2: number; op: "+" | "-" | "*" }> = {
  id: "trig-values",
  subject: "대수",
  unit: U,
  standard: "12대수02-02",
  level: 1,
  count: 80,
  params: (r) => {
    const fam = r.pick([4, 6, 6] as const)
    const pick = () => {
      const f = r.pick(["sin", "cos", "tan"])
      let m = r.int(-2 * fam, 4 * fam)
      if (m === 0) m = fam + 1
      return { f, m }
    }
    const a = pick()
    const b = pick()
    const v1 = valOf(a.f, q(a.m, fam))
    const v2 = valOf(b.f, q(b.m, fam))
    if (!v1 || !v2) return null
    // 적어도 하나는 제1사분면 밖의 각
    const in1 = (m: number) => m > 0 && m * 2 < fam
    if (in1(a.m) && in1(b.m)) return null
    if (sdVal(v1) === 0 && sdVal(v2) === 0) return null
    if (a.f === b.f && a.m === b.m) return null
    return { fam, f1: a.f, m1: a.m, f2: b.f, m2: b.m, op: r.pick(["+", "-", "*"] as const) }
  },
  build: ({ fam, f1, m1, f2, m2, op }, r) => {
    const t1 = q(m1, fam)
    const t2 = q(m2, fam)
    const v1 = valOf(f1, t1)!
    const v2 = valOf(f2, t2)!
    const comb = (x: Sd, y: Sd) => (op === "+" ? sdAdd(x, y) : op === "-" ? sdAdd(x, sdNeg(y)) : sdMul(x, y))
    const ans = comb(v1, v2)
    const e1 = fx(f1, angleArg(t1).trim())
    const e2 = fx(f2, angleArg(t2).trim())
    const opTex = op === "+" ? "+" : op === "-" ? "-" : "\\times"
    const swap = (f: string) => (f === "sin" ? "cos" : f === "cos" ? "sin" : "tan")
    const w1 = valOf(swap(f1), t1)
    const wrongs: Choice[] = [sdChoice(comb(sdNeg(v1), v2)), sdChoice(comb(v1, sdNeg(v2))), sdChoice(sdNeg(ans))]
    if (w1) wrongs.push(sdChoice(comb(w1, v2)))
    // 각을 줄이는 과정
    const reduce = (f: string, t: Q, v: Sd) => {
      const k = Math.floor(t.value / 2)
      const t0 = t.sub(2 * k)
      const lead = k === 0 ? "" : `${fx(f, angleArg(t).trim())} = ${fx(f, angleArg(t0).trim())} = `
      return `$${lead}${k === 0 ? `${fx(f, angleArg(t).trim())} = ` : ""}${sdTex(v)}$`
    }
    return {
      text: `$${e1} ${opTex} ${e2}$ 의 값은?`,
      ...mc(r, sdChoice(ans), wrongs, sdFill(ans)),
      solution: sol(
        `일반각을 $2n\\pi + \\alpha \\ (0 \\le \\alpha < 2\\pi)$ 꼴로 바꾸고, 각이 속한 사분면에서의 부호를 생각한다.`,
        `${reduce(f1, t1, v1)}, ${reduce(f2, t2, v2)}`,
        `따라서 구하는 값은 $${op === "*" ? `${sdTex(v1)} \\times ${sdTex(v2).startsWith("-") ? `\\left(${sdTex(v2)}\\right)` : sdTex(v2)}` : `${sdTex(v1)} ${op} ${sdTex(v2).startsWith("-") ? `\\left(${sdTex(v2)}\\right)` : sdTex(v2)}`} = ${sdTex(ans)}$`
      ),
      score: 2,
    }
  },
  verify: ({ fam, f1, m1, f2, m2, op }) => {
    const a = FN[f1]((m1 / fam) * PI)
    const b = FN[f2]((m2 / fam) * PI)
    return op === "+" ? a + b : op === "-" ? a - b : a * b
  },
}

/** sin²θ + cos²θ = 1 과 사분면 */
const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
]
const QUAD_TEX = ["0 < \\theta < \\frac{\\pi}{2}", "\\frac{\\pi}{2} < \\theta < \\pi", "\\pi < \\theta < \\frac{3}{2}\\pi", "\\frac{3}{2}\\pi < \\theta < 2\\pi"]
const QUAD_RANGE = [
  [0, PI / 2],
  [PI / 2, PI],
  [PI, (3 * PI) / 2],
  [(3 * PI) / 2, 2 * PI],
]
const trigPyth: SuTemplate<{ ti: number; sw: boolean; qd: number; given: string; ask: string }> = {
  id: "trig-pythagorean",
  subject: "대수",
  unit: U,
  standard: "12대수02-02",
  level: 1,
  count: 70,
  params: (r) => {
    const given = r.pick(["sin", "cos", "tan"])
    const ask = r.pick(["sin", "cos", "tan", "sum", "prod"].filter((x) => x !== given))
    return { ti: r.int(0, TRIPLES.length - 1), sw: r.chance(0.5), qd: r.pick([1, 2, 2, 3, 3, 4, 4]), given, ask }
  },
  build: ({ ti, sw, qd, given, ask }, r) => {
    const [x, y, h] = TRIPLES[ti]
    const [a, b] = sw ? [y, x] : [x, y]
    const ss = qd <= 2 ? 1 : -1
    const cs = qd === 1 || qd === 4 ? 1 : -1
    const S = q(ss * a, h)
    const C = q(cs * b, h)
    const Tn = S.div(C)
    const vals: Record<string, Q> = { sin: S, cos: C, tan: Tn, sum: S.add(C), prod: S.mul(C) }
    const ans = vals[ask]
    const name: Record<string, string> = { sin: "\\sin\\theta", cos: "\\cos\\theta", tan: "\\tan\\theta", sum: "\\sin\\theta + \\cos\\theta", prod: "\\sin\\theta\\cos\\theta" }
    const wrongs = [ans.neg(), q(ss * b, h), q(cs * a, h), S.sub(C), ans.n !== 0 ? q(1).div(ans) : q(2)]
    const other = given === "sin" ? "cos" : "sin"
    const step =
      given === "tan"
        ? `$\\tan\\theta = ${Tn.tex()}$ 이므로 $\\sin\\theta = ${Tn.tex()} \\cos\\theta$ 를 $\\sin^{2}\\theta + \\cos^{2}\\theta = 1$ 에 대입하면 $\\cos^{2}\\theta = ${C.mul(C).tex()}$`
        : `$\\sin^{2}\\theta + \\cos^{2}\\theta = 1$ 에서 $\\${other}^{2}\\theta = 1 - \\left(${vals[given].tex()}\\right)^{2} = ${vals[other].mul(vals[other]).tex()}$`
    return {
      text: `$${QUAD_TEX[qd - 1]}$ 인 $\\theta$ 에 대하여 $${name[given]} = ${vals[given].tex()}$ 일 때, $${name[ask]}$ 의 값은?`,
      ...mc(r, qChoice(ans), wrongs.map(qChoice), qFill(ans)),
      solution: sol(
        step,
        `$\\theta$ 는 제${qd}사분면의 각이므로 $\\sin\\theta ${ss > 0 ? ">" : "<"} 0$, $\\cos\\theta ${cs > 0 ? ">" : "<"} 0$ 이다. 따라서 $\\sin\\theta = ${S.tex()}$, $\\cos\\theta = ${C.tex()}$`,
        ask === "tan" ? `이때 $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta} = ${Tn.tex()}$` : ask === "sin" || ask === "cos" ? `구하는 값은 $${name[ask]} = ${ans.tex()}$` : `구하는 값은 $${name[ask]} = ${ask === "sum" ? `${S.tex()} ${signed(C)}` : `${S.tex()} \\times ${C.n < 0 ? `\\left(${C.tex()}\\right)` : C.tex()}`} = ${ans.tex()}$`
      ),
      score: 2,
    }
  },
  // 주어진 사분면에서 방정식을 수치로 풀어 θ 를 구한다
  verify: ({ ti, sw, qd, given, ask }) => {
    const [x, y, h] = TRIPLES[ti]
    const [a, b] = sw ? [y, x] : [x, y]
    const ss = qd <= 2 ? 1 : -1
    const cs = qd === 1 || qd === 4 ? 1 : -1
    const g = given === "sin" ? (ss * a) / h : given === "cos" ? (cs * b) / h : (ss * a) / (cs * b)
    const [lo, hi] = QUAD_RANGE[qd - 1]
    const rs = roots((t) => FN[given](t) - g, lo + 1e-9, hi - 1e-9, 2000)
    if (rs.length !== 1) return NaN
    const t = rs[0]
    const v: Record<string, number> = { sin: Math.sin(t), cos: Math.cos(t), tan: Math.tan(t), sum: Math.sin(t) + Math.cos(t), prod: Math.sin(t) * Math.cos(t) }
    return v[ask]
  },
}

/** 삼각함수의 주기와 최대·최소 */
const BS = [q(1), q(2), q(3), q(4), q(1, 2), q(1, 3)]
const PH = [q(0), q(1, 6), q(1, 4), q(1, 3), q(1, 2)]
const periodMax: SuTemplate<{ f: string; a: number; bi: number; c: number; ph: number; ask: "prod" | "period" | "max" }> = {
  id: "trig-period-max",
  subject: "대수",
  unit: U,
  standard: "12대수02-02",
  level: 1,
  count: 60,
  params: (r) => {
    const f = r.pick(["sin", "cos", "cos", "sin", "tan"])
    const ask = f === "tan" ? "period" : r.pick(["prod", "period", "max"] as const)
    const a = r.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])
    const c = f === "tan" ? 0 : r.int(-4, 4)
    if (ask === "max" && a > 0 && r.chance(0.7)) return null
    if (ask === "prod" && Math.abs(a) === Math.abs(c)) return null
    return { f, a, bi: r.int(0, BS.length - 1), c, ph: r.chance(0.4) ? r.int(1, PH.length - 1) : 0, ask }
  },
  build: ({ f, a, bi, c, ph, ask }, r) => {
    const b = BS[bi]
    const phase = PH[ph]
    const arg = phase.n === 0 ? bx(b) : `\\left(${bx(b)} - ${piTex(phase)}\\right)`
    const ftex = `${term(a, fx(f, arg), true)}${c ? ` ${signed(c)}` : ""}`
    const A = Math.abs(a)
    const M = c + A
    const m = c - A
    const per = (f === "tan" ? q(1) : q(2)).div(b)
    if (ask === "period") {
      const wrong = f === "tan" ? [q(2).div(b), q(1).mul(b), q(1, 2).div(b)] : [q(1).div(b), q(2).mul(b), q(4).div(b)]
      return {
        text: `함수 $y = ${ftex}$ 의 주기는?`,
        ...mc(r, piChoice(per), wrong.map(piChoice), piFill(per, q(1, 2))),
        solution: sol(
          f === "tan" ? `함수 $y = a\\tan(bx + c) + d$ 의 주기는 $\\frac{\\pi}{|b|}$ 이다.` : `함수 $y = a\\${f}(bx + c) + d$ 의 주기는 $\\frac{2\\pi}{|b|}$ 이다.`,
          `$b = ${b.tex()}$ 이므로 주기는 $${f === "tan" ? "\\pi" : "2\\pi"} \\div ${b.tex()} = ${piTex(per)}$`
        ),
        score: 2,
      }
    }
    if (ask === "max") {
      return {
        text: `함수 $y = ${ftex}$ 의 최댓값은?`,
        ...mc(r, intChoice(M), ints(c + a, m, c, A, -M)),
        solution: sol(
          `$-1 \\le \\${f} ${phase.n === 0 ? bx(b) : "(\\cdots)"} \\le 1$ 이므로 $${-A} \\le ${term(a, `\\${f}(\\cdots)`, true)} \\le ${A}$`,
          `따라서 $${m} \\le y \\le ${M}$ 이고 최댓값은 $${M}$`
        ),
        score: 2,
      }
    }
    return {
      text: `함수 $y = ${ftex}$ 의 최댓값을 $M$, 최솟값을 $m$ 이라 할 때, $Mm$ 의 값은?`,
      ...mc(r, intChoice(M * m), ints(c * c + A * A, -(M * m), M + m, M * m + 1, M * m - 1)),
      solution: sol(
        `$-1 \\le \\${f}(\\cdots) \\le 1$ 이므로 $${term(a, `\\${f}(\\cdots)`, true)}$ 의 값의 범위는 $${-A}$ 이상 $${A}$ 이하이다.`,
        `따라서 $M = ${c} + ${A} = ${M}$, $m = ${c} - ${A} = ${m}$`,
        `$Mm = ${M} \\times ${m < 0 ? `(${m})` : m} = ${M * m}$`
      ),
      score: 2,
    }
  },
  verify: ({ f, a, bi, c, ph, ask }) => {
    const b = BS[bi].value
    const phase = PH[ph].value * PI
    const g = (x: number) => a * FN[f](b * x - phase) + c
    if (ask === "period") {
      const xs = [0.123, 0.711, 1.37, 2.05]
      for (let j = 1; j <= 72; j++) {
        const P = (j * PI) / 12
        if (xs.every((x) => Math.abs(g(x + P) - g(x)) < 1e-7 * (1 + Math.abs(g(x))))) return P
      }
      return NaN
    }
    const e = extrema(g, 0, 12 * PI, 30000)
    return ask === "max" ? e.max : e.max * e.min
  },
}

/** π ± θ, π/2 ± θ 등의 변환 */
type Red = { tex: string; f: (t: number) => number; kind: "s" | "c"; sg: number }
const REDS: Red[] = [
  { tex: "\\sin(\\pi - \\theta)", f: (t) => Math.sin(PI - t), kind: "s", sg: 1 },
  { tex: "\\sin(\\pi + \\theta)", f: (t) => Math.sin(PI + t), kind: "s", sg: -1 },
  { tex: "\\sin(-\\theta)", f: (t) => Math.sin(-t), kind: "s", sg: -1 },
  { tex: "\\sin(2\\pi + \\theta)", f: (t) => Math.sin(2 * PI + t), kind: "s", sg: 1 },
  { tex: "\\cos\\left(\\frac{\\pi}{2} - \\theta\\right)", f: (t) => Math.cos(PI / 2 - t), kind: "s", sg: 1 },
  { tex: "\\cos\\left(\\frac{\\pi}{2} + \\theta\\right)", f: (t) => Math.cos(PI / 2 + t), kind: "s", sg: -1 },
  { tex: "\\cos\\left(\\frac{3}{2}\\pi + \\theta\\right)", f: (t) => Math.cos((3 * PI) / 2 + t), kind: "s", sg: 1 },
  { tex: "\\cos\\left(\\frac{3}{2}\\pi - \\theta\\right)", f: (t) => Math.cos((3 * PI) / 2 - t), kind: "s", sg: -1 },
  { tex: "\\cos(\\pi - \\theta)", f: (t) => Math.cos(PI - t), kind: "c", sg: -1 },
  { tex: "\\cos(\\pi + \\theta)", f: (t) => Math.cos(PI + t), kind: "c", sg: -1 },
  { tex: "\\cos(-\\theta)", f: (t) => Math.cos(-t), kind: "c", sg: 1 },
  { tex: "\\cos(2\\pi - \\theta)", f: (t) => Math.cos(2 * PI - t), kind: "c", sg: 1 },
  { tex: "\\sin\\left(\\frac{\\pi}{2} - \\theta\\right)", f: (t) => Math.sin(PI / 2 - t), kind: "c", sg: 1 },
  { tex: "\\sin\\left(\\frac{\\pi}{2} + \\theta\\right)", f: (t) => Math.sin(PI / 2 + t), kind: "c", sg: 1 },
  { tex: "\\sin\\left(\\frac{3}{2}\\pi + \\theta\\right)", f: (t) => Math.sin((3 * PI) / 2 + t), kind: "c", sg: -1 },
  { tex: "\\sin\\left(\\frac{3}{2}\\pi - \\theta\\right)", f: (t) => Math.sin((3 * PI) / 2 - t), kind: "c", sg: -1 },
]
const FRACS = [q(1, 3), q(2, 3), q(1, 4), q(3, 4), q(2, 5), q(3, 5), q(1, 5), q(-1, 3), q(-2, 3), q(-1, 4), q(-3, 4), q(-2, 5), q(-3, 5)]
const reduction: SuTemplate<{ kind: "s" | "c"; vi: number; ids: number[]; cs: number[] }> = {
  id: "trig-reduction",
  subject: "대수",
  unit: U,
  standard: "12대수02-02",
  level: 1,
  count: 40,
  params: (r) => {
    const kind = r.chance(0.5) ? "s" : "c"
    const pool = REDS.map((x, i) => i).filter((i) => REDS[i].kind === kind)
    const n = r.pick([2, 2, 3])
    const ids = r.shuffle([...pool]).slice(0, n)
    const cs = ids.map(() => r.pick([1, 1, -1, 2, -2, 3]))
    const K = ids.reduce((s, id, i) => s + cs[i] * REDS[id].sg, 0)
    if (K === 0) return null
    return { kind, vi: r.int(0, FRACS.length - 1), ids, cs }
  },
  build: ({ kind, vi, ids, cs }, r) => {
    const v = FRACS[vi]
    const base = kind === "s" ? "\\sin\\theta" : "\\cos\\theta"
    const expr = ids.map((id, i) => term(cs[i], REDS[id].tex, i === 0)).join("")
    const K = ids.reduce((s, id, i) => s + cs[i] * REDS[id].sg, 0)
    const ans = v.mul(K)
    const each = ids.map((id) => `$${REDS[id].tex} = ${REDS[id].sg < 0 ? "-" : ""}${base}$`).join(", ")
    const wr = ids.map((id, i) => v.mul(K - 2 * cs[i] * REDS[id].sg))
    return {
      text: `$${base} = ${v.tex()}$ 일 때, $${expr}$ 의 값은?`,
      ...mc(r, qChoice(ans), [...wr, ans.neg(), v].map(qChoice), qFill(ans)),
      solution: sol(
        `각 항을 $${base}$ 로 나타내면 ${each}`,
        `(주어진 식) $= ${term(K, base, true)}$`,
        `$${base} = ${v.tex()}$ 를 대입하면 $${ans.tex()}$`
      ),
      score: 2,
    }
  },
  verify: ({ kind, vi, ids, cs }) => {
    const v = FRACS[vi].value
    const t = kind === "s" ? Math.asin(v) : Math.acos(v)
    return ids.reduce((s, id, i) => s + cs[i] * REDS[id].f(t), 0)
  },
}

// ═════════ 2단계 ═════════

/** 주기·최댓값·함숫값으로 계수 결정 */
const COEF_T: Record<string, { t: Q; g: Q }[]> = {
  cos: [
    { t: q(1, 3), g: q(1, 2) },
    { t: q(2, 3), g: q(-1, 2) },
    { t: q(1, 2), g: q(0) },
    { t: q(1), g: q(-1) },
    { t: q(4, 3), g: q(-1, 2) },
  ],
  sin: [
    { t: q(1, 6), g: q(1, 2) },
    { t: q(5, 6), g: q(1, 2) },
    { t: q(7, 6), g: q(-1, 2) },
    { t: q(1), g: q(0) },
    { t: q(3, 2), g: q(-1) },
    { t: q(1, 2), g: q(1) },
  ],
}
const trigCoef: SuTemplate<{ f: string; a: number; b: number; c: number; ti: number; ext: "max" | "min" }> = {
  id: "trig-coef",
  subject: "대수",
  unit: U,
  standard: "12대수02-02",
  level: 2,
  count: 80,
  params: (r) => {
    const f = r.pick(["sin", "cos"])
    const ext = r.chance(0.6) ? "max" : "min"
    const ti = r.int(0, COEF_T[f].length - 1)
    const g = COEF_T[f][ti].g
    if ((ext === "max" && g.eq(1)) || (ext === "min" && g.eq(-1))) return null
    const a = r.int(1, 8)
    if (!g.isInt && a % 2) return null
    return { f, a, b: r.int(1, 4), c: r.int(-6, 6), ti, ext }
  },
  build: ({ f, a, b, c, ti, ext }, r) => {
    const { t, g } = COEF_T[f][ti]
    const x0 = t.div(b)
    const y0 = g.mul(a).add(c)
    const E = ext === "max" ? a + c : c - a
    const per = q(2, b)
    const ans = a + b + c
    const fname = `a\\${f} bx + c`
    return {
      text: `함수 $f(x) = ${fname}$ 의 주기가 $${piTex(per)}$ 이고 ${ext === "max" ? "최댓값" : "최솟값"}이 $${E}$ 이다. $f\\left(${piTex(x0)}\\right) = ${y0.tex()}$ 일 때, $a + b + c$ 의 값은? (단, $a > 0$, $b > 0$)`,
      ...mc(r, intChoice(ans), ints(a - b + c, a + b - c, ans + 1, ans - 1, b + c - a)),
      solution: sol(
        `$b > 0$ 이므로 주기는 $\\frac{2\\pi}{b} = ${piTex(per)}$ 에서 $b = ${b}$`,
        `$a > 0$ 이므로 ${ext === "max" ? "최댓값은 $a + c$" : "최솟값은 $-a + c$"}, 즉 $${ext === "max" ? "a + c" : "-a + c"} = ${E}$`,
        `$f\\left(${piTex(x0)}\\right) = a\\${f}${angleArg(t)} + c = ${g.eq(0) ? "c" : g.eq(1) ? "a + c" : g.eq(-1) ? "-a + c" : `${term(g, "a", true)} + c`} = ${y0.tex()}$`,
        `두 식을 연립하면 $a = ${a}$, $c = ${c}$ 이므로 $a + b + c = ${a} + ${b} ${signed(c)} = ${ans}$`
      ),
      score: 3,
    }
  },
  // b 는 주기에서 수치로, a·c 는 정수 전체를 대입해 조건을 확인
  verify: ({ f, a, b, c, ti, ext }) => {
    const { t, g } = COEF_T[f][ti]
    const per = (2 * PI) / b
    const bb = Math.round((2 * PI) / per)
    const x0 = (t.value * PI) / b
    const y0 = g.value * a + c
    const E = ext === "max" ? a + c : c - a
    let found = NaN
    let n = 0
    for (let A = 1; A <= 20; A++)
      for (let C = -20; C <= 20; C++) {
        const h = (x: number) => A * FN[f](bb * x) + C
        if (!closeTo(h(x0), y0, 1e-9)) continue
        const samples = Array.from({ length: 25 }, (_, k) => h((k * PI) / (12 * bb)))
        const ex = ext === "max" ? Math.max(...samples) : Math.min(...samples)
        if (!closeTo(ex, E, 1e-9)) continue
        found = A + bb + C
        n++
      }
    return n === 1 ? found : NaN
  },
}

/** 이차식 꼴 삼각방정식의 해의 개수·합 */
const IN = [q(-1), q(-1, 2), q(0), q(1, 2), q(1)]
const OUT = [q(-3), q(-2), q(-3, 2), q(3, 2), q(2), q(3)]
function solsOf(f: string, v: Q): Q[] {
  const out: Q[] = []
  for (let j = 0; j < 24; j++) {
    const t = q(j, 12)
    if (j % 2 && j % 3) continue
    const val = f === "sin" ? sinPi(t) : cosPi(t)
    if (sdEq(val, sd(v))) out.push(t)
  }
  return out
}
function trigQuad(f: string, r1: Q, r2: Q, rewrite: boolean) {
  // (d1 F − n1)(d2 F − n2)
  const A = r1.d * r2.d
  const B = -(r1.d * r2.n + r2.d * r1.n)
  const C = r1.n * r2.n
  const F = `\\${f} x`
  const G = f === "sin" ? "\\cos" : "\\sin"
  let tex: string
  let ev: (x: number) => number
  const Fn = FN[f]
  const Gn = FN[f === "sin" ? "cos" : "sin"]
  if (!rewrite) {
    tex = `${term(A, `\\${f}^{2} x`, true)}${term(B, F)}${term(C, "")}`
    ev = (x) => A * Fn(x) ** 2 + B * Fn(x) + C
  } else {
    // A F² = A − A G²  →  −A G² + B F + (A + C), 부호를 바꿔 A G² − B F − (A + C)
    tex = `${term(A, `${G}^{2} x`, true)}${term(-B, F)}${term(-(A + C), "")}`
    ev = (x) => A * Gn(x) ** 2 - B * Fn(x) - (A + C)
  }
  return { A, B, C, tex, ev, F, G }
}
const trigEqQuad: SuTemplate<{ f: string; i1: number; i2: number; out: boolean; rewrite: boolean; ask: "count" | "sum" }> = {
  id: "trig-eq-quadratic",
  subject: "대수",
  unit: U,
  standard: "12대수02-03",
  level: 2,
  count: 80,
  params: (r) => {
    const out = r.chance(0.4)
    const i1 = r.int(0, IN.length - 1)
    const i2 = out ? r.int(0, OUT.length - 1) : r.int(0, IN.length - 1)
    if (!out && i1 === i2) return null
    return { f: r.pick(["sin", "cos"]), i1, i2, out, rewrite: r.chance(0.5), ask: r.chance(0.5) ? "count" : "sum" }
  },
  build: ({ f, i1, i2, out, rewrite, ask }, r) => {
    const r1 = IN[i1]
    const r2 = out ? OUT[i2] : IN[i2]
    const { A, B, C, tex, F } = trigQuad(f, r1, r2, rewrite)
    const s1 = solsOf(f, r1)
    const s2 = out ? [] : solsOf(f, r2)
    const all = [...s1, ...s2].sort((x, y) => x.value - y.value)
    const sum = all.reduce((s, x) => s.add(x), q(0))
    const fac = (x: Q) => (x.d === 1 ? (x.n === 0 ? "t" : `(t ${signed(-x.n)})`) : `(${x.d}t ${signed(-x.n)})`)
    const lst = (xs: Q[]) => xs.map((x) => `$x = ${piTex(x)}$`).join(", ")
    const lines0 = [
      rewrite ? `$\\${f === "sin" ? "cos" : "sin"}^{2} x = 1 - \\${f}^{2} x$ 를 대입하여 정리하면 $${term(A, `\\${f}^{2} x`, true)}${term(B, F)}${term(C, "")} = 0$` : `$${F} = t$ 로 놓으면 $${term(A, "t^{2}", true)}${term(B, "t")}${term(C, "")} = 0$`,
      `${rewrite ? `$${F} = t$ 로 놓고 ` : ""}인수분해하면 $${fac(r1)}${fac(r2)} = 0$ 이므로 $t = ${r1.tex()}$ 또는 $t = ${r2.tex()}$`,
      out ? `$-1 \\le t \\le 1$ 이므로 $t = ${r2.tex()}$ 는 해가 될 수 없고, $${F} = ${r1.tex()}$ 에서 ${lst(s1)}` : `$${F} = ${r1.tex()}$ 에서 ${lst(s1)}, $${F} = ${r2.tex()}$ 에서 ${lst(s2)}`,
    ]
    if (ask === "count") {
      return {
        text: `$0 \\le x < 2\\pi$ 일 때, 방정식 $${tex} = 0$ 의 서로 다른 실근의 개수를 구하시오.`,
        ...short(all.length),
        solution: sol(...lines0, `따라서 서로 다른 실근의 개수는 $${all.length}$`),
        score: 3,
      }
    }
    const sum1 = s1.reduce((s, x) => s.add(x), q(0))
    const wr = [sum1.eq(sum) ? sum.add(1) : sum1, sum.add(2), sum.sub(1), sum.mul(2)]
    return {
      text: `$0 \\le x < 2\\pi$ 일 때, 방정식 $${tex} = 0$ 의 모든 해의 합은?`,
      ...mc(r, piChoice(sum), wr.map(piChoice), piFill(sum, q(1, 6))),
      solution: sol(...lines0, `따라서 모든 해의 합은 $${all.length > 1 ? `${all.map((x) => piTex(x)).join(" + ")} = ` : ""}${piTex(sum)}$`),
      score: 3,
    }
  },
  verify: ({ f, i1, i2, out, rewrite, ask }) => {
    const r1 = IN[i1]
    const r2 = out ? OUT[i2] : IN[i2]
    const { ev } = trigQuad(f, r1, r2, rewrite)
    const zs = zeros(ev, -0.01, 2 * PI + 0.01, 4000).filter((x) => x > -1e-7 && x < 2 * PI - 1e-7)
    return ask === "count" ? zs.length : zs.reduce((s, x) => s + Math.max(0, x), 0)
  },
}

/** 사인법칙 */
const SA = [q(1, 6), q(1, 4), q(1, 3), q(1, 2), q(2, 3), q(3, 4), q(5, 6)]
const sineLaw: SuTemplate<{ mode: "R" | "area" | "side"; a: number; A: number; B: number; C: number }> = {
  id: "trig-sine-law",
  subject: "대수",
  unit: U,
  standard: "12대수02-04",
  level: 2,
  count: 70,
  params: (r) => {
    const mode = r.pick(["R", "area", "side", "side"] as const)
    const a = r.int(2, 12)
    if (mode !== "side") return { mode, a, A: r.int(0, SA.length - 1), B: 0, C: 0 }
    const B = r.int(0, 5)
    const C = r.int(0, 5)
    if (B === C) return null
    if (SA[B].add(SA[C]).value >= 1) return null
    return { mode, a, A: 0, B, C }
  },
  build: ({ mode, a, A, B, C }, r) => {
    if (mode !== "side") {
      const ang = SA[A]
      const s = sinPi(ang)
      const R = sdDiv(sd(a), sdScale(s, 2))
      const R2 = sdMul(R, R)
      const head = `${tri} 에서 $${seg("BC")} = ${a}$, $\\angle ${T("A")} = ${piTex(ang)}$ 일 때,`
      const lines0 = [
        `사인법칙에 의하여 외접원의 반지름의 길이를 $R$ 라 하면 $\\frac{${seg("BC")}}{\\sin A} = 2R$`,
        `$\\sin${angleArg(ang)} = ${sdTex(s)}$ 이므로 $2R = ${a} \\div ${sdTex(s)}$, 즉 $R = ${sdTex(R)}$`,
      ]
      if (mode === "R") {
        return {
          text: `${head} ${tri} 의 외접원의 반지름의 길이는?`,
          ...mc(r, sdChoice(R), [sdChoice(sdScale(R, 2)), sdChoice(sdScale(R, q(1, 2))), sdChoice(sdMul(sd(a), s)), sdChoice(sdScale(sdMul(sd(a), s), q(1, 2)))], sdFill(R)),
          solution: sol(...lines0, `따라서 외접원의 반지름의 길이는 $${sdTex(R)}$`),
          score: 3,
        }
      }
      const S = R2.a
      return {
        text: `${head} ${tri} 의 외접원의 넓이는?`,
        ...mc(r, piChoice(S), [piChoice(S.mul(4)), piChoice(S.div(4)), piChoice(S.mul(2)), piChoice(q(a * a))], piFill(S, q(1, 3))),
        solution: sol(...lines0, `따라서 외접원의 넓이는 $\\pi R^{2} = ${piTex(S)}$`),
        score: 3,
      }
    }
    const bA = SA[B]
    const cA = SA[C]
    const sB = sinPi(bA)
    const sC = sinPi(cA)
    const c = sdDiv(sdMul(sd(a), sC), sB)
    return {
      text: `${tri} 에서 $${seg("AC")} = ${a}$, $\\angle ${T("B")} = ${piTex(bA)}$, $\\angle ${T("C")} = ${piTex(cA)}$ 일 때, 선분 $${T("AB")}$ 의 길이는?`,
      ...mc(r, sdChoice(c), [sdChoice(sdDiv(sdMul(sd(a), sB), sC)), sdChoice(sdMul(sd(a), sC)), sdChoice(sdScale(c, 2)), sdChoice(sdScale(c, q(1, 2)))], sdFill(c)),
      solution: sol(
        `사인법칙에 의하여 $\\frac{${seg("AC")}}{\\sin B} = \\frac{${seg("AB")}}{\\sin C}$`,
        `$\\sin${angleArg(bA)} = ${sdTex(sB)}$, $\\sin${angleArg(cA)} = ${sdTex(sC)}$ 이므로`,
        `$${seg("AB")} = \\frac{${a} \\times \\sin C}{\\sin B} = ${sdTex(c)}$`
      ),
      score: 3,
    }
  },
  // 좌표평면에 삼각형을 그려 길이를 잰다
  verify: ({ mode, a, A, B, C }) => {
    if (mode !== "side") {
      const angA = SA[A].value * PI
      const angB = (PI - angA) / 3
      const angC = PI - angA - angB
      // BC = a 가 되도록: B=(0,0), C=(a,0)
      const t = triFromAngles(a, angB, angC)
      const R = circumR(t.A, t.B, t.C)
      return mode === "R" ? R : PI * R * R
    }
    const angB = SA[B].value * PI
    const angC = SA[C].value * PI
    const t = triFromAngles(1, angB, angC)
    const k = a / dist(t.A, t.C)
    return dist(t.A, t.B) * k
  },
}

/** 코사인법칙 */
const COSV = [q(1, 3), q(-1, 3), q(1, 4), q(-1, 4), q(1, 6), q(1, 8), q(-1, 8), q(2, 3), q(3, 4), q(-3, 4), q(1, 5), q(-1, 5), q(2, 5)]
const cosineLaw: SuTemplate<{ mode: "special" | "given"; a: number; b: number; ci: number }> = {
  id: "trig-cosine-law",
  subject: "대수",
  unit: U,
  standard: "12대수02-04",
  level: 2,
  count: 70,
  params: (r) => {
    const mode = r.chance(0.5) ? "special" : "given"
    const a = r.int(2, 12)
    const b = r.int(2, 12)
    if (a === b && r.chance(0.7)) return null
    if (mode === "special") return { mode, a, b, ci: r.int(0, 1) }
    const ci = r.int(0, COSV.length - 1)
    const c2 = q(a * a + b * b).sub(COSV[ci].mul(2 * a * b))
    if (!c2.isInt || c2.n < 1 || c2.n > 999) return null
    return { mode, a, b, ci }
  },
  build: ({ mode, a, b, ci }) => {
    const cosC = mode === "special" ? (ci === 0 ? q(1, 2) : q(-1, 2)) : COSV[ci]
    const c2 = q(a * a + b * b).sub(cosC.mul(2 * a * b)).n
    const rt = Math.round(Math.sqrt(c2))
    const perfect = rt * rt === c2
    const head =
      mode === "special"
        ? `${tri} 에서 $${seg("CA")} = ${b}$, $${seg("CB")} = ${a}$, $\\angle ${T("C")} = ${piTex(ci === 0 ? q(1, 3) : q(2, 3))}$ 일 때,`
        : `${tri} 에서 $${seg("CA")} = ${b}$, $${seg("CB")} = ${a}$, $\\cos(\\angle ${T("ACB")}) = ${cosC.tex()}$ 일 때,`
    const ask = perfect ? `선분 $${T("AB")}$ 의 길이를 구하시오.` : `$${seg("AB")}^{2}$ 의 값을 구하시오.`
    return {
      text: `${head} ${ask}`,
      ...short(perfect ? rt : c2),
      solution: sol(
        `코사인법칙에 의하여 $${seg("AB")}^{2} = ${seg("CA")}^{2} + ${seg("CB")}^{2} - 2 \\times ${seg("CA")} \\times ${seg("CB")} \\times \\cos C$`,
        mode === "special" ? `$\\cos${angleArg(ci === 0 ? q(1, 3) : q(2, 3))} = ${cosC.tex()}$ 이므로` : `$\\cos C = ${cosC.tex()}$ 이므로`,
        `$${seg("AB")}^{2} = ${b * b} + ${a * a} - 2 \\times ${b} \\times ${a} \\times ${cosC.n < 0 ? `\\left(${cosC.tex()}\\right)` : cosC.tex()} = ${c2}$`,
        perfect ? `따라서 $${seg("AB")} = ${rt}$` : `따라서 구하는 값은 $${c2}$`
      ),
      score: 3,
    }
  },
  verify: ({ mode, a, b, ci }) => {
    const cosC = mode === "special" ? (ci === 0 ? 0.5 : -0.5) : COSV[ci].value
    const C = Math.acos(cosC)
    const Cp = [0, 0]
    const B = [a, 0]
    const A = [b * Math.cos(C), b * Math.sin(C)]
    void Cp
    const d2 = (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2
    const rt = Math.round(Math.sqrt(d2))
    return Math.abs(rt * rt - d2) < 1e-9 ? Math.sqrt(d2) : d2
  },
}

/** sinθ ± cosθ = k 일 때 여러 식의 값 */
const KS = [q(1, 2), q(-1, 2), q(1, 3), q(-1, 3), q(2, 3), q(-2, 3), q(1, 4), q(3, 4), q(-3, 4), q(4, 3), q(-4, 3), q(6, 5), q(-6, 5), q(7, 5), q(1, 5), q(-1, 5), q(5, 4)]
const sinCos: SuTemplate<{ diff: boolean; ki: number; ask: "sc" | "cube" | "tan" | "sq" | "four" }> = {
  id: "trig-sin-plus-cos",
  subject: "대수",
  unit: U,
  standard: "12대수02-02",
  level: 2,
  count: 70,
  params: (r) => {
    const diff = r.chance(0.4)
    const ki = r.int(0, KS.length - 1)
    const ask = r.pick(["sc", "cube", "tan", "sq", "four"] as const)
    const k = KS[ki]
    const sc = diff ? q(1).sub(k.mul(k)).div(2) : k.mul(k).sub(1).div(2)
    if (ask === "tan" && sc.n === 0) return null
    return { diff, ki, ask }
  },
  build: ({ diff, ki, ask }, r) => {
    const k = KS[ki]
    const k2 = k.mul(k)
    const sc = diff ? q(1).sub(k2).div(2) : k2.sub(1).div(2)
    const lhs = diff ? "\\sin\\theta - \\cos\\theta" : "\\sin\\theta + \\cos\\theta"
    let target: string
    let ans: Q
    let last: string
    if (ask === "sc") {
      target = "\\sin\\theta\\cos\\theta"
      ans = sc
      last = `따라서 $\\sin\\theta\\cos\\theta = ${sc.tex()}$`
    } else if (ask === "cube") {
      target = diff ? "\\sin^{3}\\theta - \\cos^{3}\\theta" : "\\sin^{3}\\theta + \\cos^{3}\\theta"
      ans = diff ? k.mul(q(1).add(sc)) : k.mul(q(1).sub(sc))
      last = diff
        ? `$\\sin^{3}\\theta - \\cos^{3}\\theta = (\\sin\\theta - \\cos\\theta)(1 + \\sin\\theta\\cos\\theta)$ 이므로\n구하는 값은 $${k.tex()} \\times \\left(1 ${signed(sc)}\\right) = ${ans.tex()}$`
        : `$\\sin^{3}\\theta + \\cos^{3}\\theta = (\\sin\\theta + \\cos\\theta)(1 - \\sin\\theta\\cos\\theta)$ 이므로\n구하는 값은 $${k.tex()} \\times \\left(1 ${signed(sc.neg())}\\right) = ${ans.tex()}$`
    } else if (ask === "tan") {
      target = "\\tan\\theta + \\frac{1}{\\tan\\theta}"
      ans = q(1).div(sc)
      last = `$\\tan\\theta + \\frac{1}{\\tan\\theta} = \\frac{\\sin^{2}\\theta + \\cos^{2}\\theta}{\\sin\\theta\\cos\\theta} = \\frac{1}{\\sin\\theta\\cos\\theta}$ 이므로\n구하는 값은 $${ans.tex()}$`
    } else if (ask === "sq") {
      target = diff ? "(\\sin\\theta + \\cos\\theta)^{2}" : "(\\sin\\theta - \\cos\\theta)^{2}"
      ans = diff ? q(1).add(sc.mul(2)) : q(1).sub(sc.mul(2))
      last = `$${target} = 1 ${diff ? "+" : "-"} 2\\sin\\theta\\cos\\theta = ${ans.tex()}$`
    } else {
      target = "\\sin^{4}\\theta + \\cos^{4}\\theta"
      ans = q(1).sub(sc.mul(sc).mul(2))
      last = `$\\sin^{4}\\theta + \\cos^{4}\\theta = (\\sin^{2}\\theta + \\cos^{2}\\theta)^{2} - 2\\sin^{2}\\theta\\cos^{2}\\theta$ 이므로\n구하는 값은 $1 - 2 \\times \\left(${sc.tex()}\\right)^{2} = ${ans.tex()}$`
    }
    const scW = sc.neg()
    const wrongs = [ans.neg(), sc.n !== 0 ? q(1).div(sc).sub(ans).add(ans) : ans.add(1), k2, scW, ans.add(q(1, 2)), q(1).sub(ans)]
    return {
      text: `$${lhs} = ${k.tex()}$ 일 때, $${target}$ 의 값은?`,
      ...mc(r, qChoice(ans), wrongs.map(qChoice), qFill(ans)),
      solution: sol(
        `양변을 제곱하면 $1 ${diff ? "-" : "+"} 2\\sin\\theta\\cos\\theta = ${k2.tex()}$ ($\\sin^{2}\\theta + \\cos^{2}\\theta = 1$)`,
        `$\\sin\\theta\\cos\\theta = ${sc.tex()}$`,
        last
      ),
      score: 3,
    }
  },
  // 실제로 조건을 만족하는 θ 를 수치로 찾아 대입
  verify: ({ diff, ki, ask }) => {
    const k = KS[ki].value
    const rs = roots((t) => Math.sin(t) + (diff ? -1 : 1) * Math.cos(t) - k, 0, 2 * PI, 3000)
    if (!rs.length) return NaN
    const t = rs[0]
    const s = Math.sin(t)
    const c = Math.cos(t)
    if (ask === "sc") return s * c
    if (ask === "cube") return diff ? s ** 3 - c ** 3 : s ** 3 + c ** 3
    if (ask === "tan") return Math.tan(t) + 1 / Math.tan(t)
    if (ask === "sq") return diff ? (s + c) ** 2 : (s - c) ** 2
    return s ** 4 + c ** 4
  },
}

// ═════════ 3단계 ═════════

/** 삼각부등식의 해 (하나의 구간) */
type IneqCase = { f: string; r: Q; gt: boolean; lo: Q; hi: Q }
const INEQ: IneqCase[] = [
  { f: "sin", r: q(0), gt: true, lo: q(0), hi: q(1) },
  { f: "sin", r: q(1, 2), gt: true, lo: q(1, 6), hi: q(5, 6) },
  { f: "sin", r: q(0), gt: false, lo: q(1), hi: q(2) },
  { f: "sin", r: q(-1, 2), gt: false, lo: q(7, 6), hi: q(11, 6) },
  { f: "cos", r: q(1, 2), gt: false, lo: q(1, 3), hi: q(5, 3) },
  { f: "cos", r: q(0), gt: false, lo: q(1, 2), hi: q(3, 2) },
  { f: "cos", r: q(-1, 2), gt: false, lo: q(2, 3), hi: q(4, 3) },
]
const trigIneq: SuTemplate<{ ci: number; oi: number; strict: boolean; rewrite: boolean; flip: boolean; ask: "diff" | "sum" }> = {
  id: "trig-ineq-interval",
  subject: "대수",
  unit: U,
  standard: "12대수02-03",
  level: 3,
  count: 70,
  params: (r) => {
    const ci = r.int(0, INEQ.length - 1)
    const strict = r.chance(0.5)
    // sin x ≥ 0 은 [0, π], sin x ≤ 0 은 {0} ∪ [π, 2π) 이므로 제외
    if (ci === 2 && !strict) return null
    return { ci, oi: r.int(0, OUT.length - 1), strict, rewrite: r.chance(0.5), flip: r.chance(0.4), ask: r.chance(0.5) ? "diff" : "sum" }
  },
  build: ({ ci, oi, strict, rewrite, flip, ask }, r) => {
    const cs = INEQ[ci]
    const r2 = OUT[oi]
    const { A, B, C, tex, F } = trigQuad(cs.f, cs.r, r2, rewrite)
    // (d1F − n1)(d2F − n2): 두 번째 인수의 부호 (|F| ≤ 1)
    const otherNeg = r2.value > 1
    // 원하는 것: F > r (gt) 또는 F < r → (d1F − n1) > 0 또는 < 0
    // 곱 P = (d1F−n1)(d2F−n2): otherNeg 이면 부호 반대
    const wantPos = cs.gt !== otherNeg // P > 0 이어야 하는가
    // rewrite 는 부호가 반대인 식 (A G² − B F − (A + C) = −P)
    let pos = rewrite ? !wantPos : wantPos
    if (flip) pos = !pos
    const opTex = pos ? (strict ? ">" : "\\ge") : strict ? "<" : "\\le"
    const shown = flip ? `${flipSign(tex)}` : tex
    const ans = ask === "diff" ? cs.hi.sub(cs.lo) : cs.hi.add(cs.lo)
    const intv = strict ? `\\alpha < x < \\beta` : `\\alpha \\le x \\le \\beta`
    const fac = (x: Q) => (x.d === 1 ? (x.n === 0 ? "t" : `(t ${signed(-x.n)})`) : `(${x.d}t ${signed(-x.n)})`)
    const wr = ask === "diff" ? [q(2).sub(ans), ans.div(2), cs.hi, ans.add(q(1, 3))] : [ans.sub(cs.lo.mul(2)), ans.add(1), q(2).sub(cs.lo), ans.sub(q(1, 3))]
    const reduced = `\\${cs.f} x ${cs.gt ? (strict ? ">" : "\\ge") : strict ? "<" : "\\le"} ${cs.r.tex()}`
    return {
      text: `$0 \\le x < 2\\pi$ 일 때, 부등식 $${shown} ${opTex} 0$ 의 해가 $${intv}$ 이다. $${ask === "diff" ? "\\beta - \\alpha" : "\\alpha + \\beta"}$ 의 값은?`,
      ...mc(r, piChoice(ans), wr.map(piChoice), piFill(ans, q(1, 6))),
      solution: sol(
        `${rewrite ? `$${trigQuad(cs.f, cs.r, r2, true).G}^{2} x = 1 - \\${cs.f}^{2} x$ 를 이용하여 ` : ""}주어진 부등식을 $${F}$ 에 대하여 정리하면 $${term(A, `\\${cs.f}^{2} x`, true)}${term(B, F)}${term(C, "")} ${wantPos ? (strict ? ">" : "\\ge") : strict ? "<" : "\\le"} 0$`,
        `$${F} = t$ 라 하면 $${term(A, "t^{2}", true)}${term(B, "t")}${term(C, "")} = ${fac(cs.r)}${fac(r2)}$ 이고, $-1 \\le t \\le 1$ 에서 $${fac(r2)} ${otherNeg ? "<" : ">"} 0$ 이다.`,
        `따라서 주어진 부등식은 $${reduced}$ 와 같다.`,
        `$y = \\${cs.f} x$ 의 그래프에서 해는 $${strict ? `${piTex(cs.lo)} < x < ${piTex(cs.hi)}$` : `${piTex(cs.lo)} \\le x \\le ${piTex(cs.hi)}$`} 이므로 $\\alpha = ${piTex(cs.lo)}$, $\\beta = ${piTex(cs.hi)}$`,
        `따라서 $${ask === "diff" ? "\\beta - \\alpha" : "\\alpha + \\beta"} = ${piTex(ans)}$`
      ),
      score: 4,
    }
  },
  // 경계점을 수치로 찾고 각 구간 가운데 점에서 부등식을 확인한다
  verify: ({ ci, oi, strict, rewrite, flip, ask }) => {
    const cs = INEQ[ci]
    const { ev } = trigQuad(cs.f, cs.r, OUT[oi], rewrite)
    const r2 = OUT[oi]
    const otherNeg = r2.value > 1
    const wantPos = cs.gt !== otherNeg
    let pos = rewrite ? !wantPos : wantPos
    if (flip) pos = !pos
    const g = (x: number) => (flip ? -ev(x) : ev(x))
    const ok = (x: number) => (pos ? g(x) > 0 : g(x) < 0)
    const zs = zeros(g, 0, 2 * PI, 4000)
    const pts = [0, ...zs.filter((z) => z > 1e-9 && z < 2 * PI - 1e-9), 2 * PI]
    const segs: [number, number][] = []
    for (let i = 0; i + 1 < pts.length; i++) {
      if (ok((pts[i] + pts[i + 1]) / 2)) {
        const last = segs[segs.length - 1]
        if (last && Math.abs(last[1] - pts[i]) < 1e-9) last[1] = pts[i + 1]
        else segs.push([pts[i], pts[i + 1]])
      }
    }
    void strict
    if (segs.length !== 1) return NaN
    const [a, b] = segs[0]
    return ask === "diff" ? b - a : a + b
  },
}
function flipSign(tex: string) {
  // 식 전체에 −1 을 곱한 TeX: 각 항의 부호를 바꾼다
  let s = tex.trim()
  if (!s.startsWith("-")) s = "+ " + s
  else s = "- " + s.slice(1)
  s = s.replace(/([+-]) /g, (m, sg) => (sg === "+" ? "- " : "+ "))
  s = s.replace(/^\+ /, "").replace(/^- /, "-")
  return s
}

/** 삼각방정식 f(bx − φ) = k 의 해의 합·개수 (구간 제한) */
type KDef = { k: Sd; tex: (F: string) => string }
const KSIN: KDef[] = [
  { k: sd(q(1, 2)), tex: (F) => `2${F} = 1` },
  { k: sd(q(-1, 2)), tex: (F) => `2${F} + 1 = 0` },
  { k: sd(0, q(1, 2), 2), tex: (F) => `2${F} = \\sqrt{2}` },
  { k: sd(0, q(-1, 2), 2), tex: (F) => `2${F} + \\sqrt{2} = 0` },
  { k: sd(0, q(1, 2), 3), tex: (F) => `2${F} = \\sqrt{3}` },
  { k: sd(0, q(-1, 2), 3), tex: (F) => `2${F} + \\sqrt{3} = 0` },
  { k: sd(0), tex: (F) => `${F} = 0` },
  { k: sd(1), tex: (F) => `${F} = 1` },
  { k: sd(-1), tex: (F) => `${F} = -1` },
]
const KTAN: KDef[] = [
  { k: sd(1), tex: (F) => `${F} = 1` },
  { k: sd(-1), tex: (F) => `${F} = -1` },
  { k: sd(0, 1, 3), tex: (F) => `${F} = \\sqrt{3}` },
  { k: sd(0, -1, 3), tex: (F) => `${F} + \\sqrt{3} = 0` },
  { k: sd(0, q(1, 3), 3), tex: (F) => `\\sqrt{3}${F} = 1` },
  { k: sd(0, q(-1, 3), 3), tex: (F) => `\\sqrt{3}${F} + 1 = 0` },
]
const PHS = [q(0), q(1, 6), q(1, 4), q(1, 3), q(1, 2)]
function eqSols(f: string, ki: number, b: number, ph: Q, L: number) {
  const K = (f === "tan" ? KTAN : KSIN)[ki].k
  const per = f === "tan" ? 1 : 2
  const base: Q[] = []
  for (let j = 0; j < 12 * per; j++) {
    if (j % 2 && j % 3) continue
    const t = q(j, 12)
    const v = valOf(f, t)
    if (v && sdEq(v, K)) base.push(t)
  }
  const xs: Q[] = []
  for (const t of base)
    for (let n = -10; n <= 40; n++) {
      const x = t.add(ph).add(per * n).div(b)
      if (x.value >= 0 && x.value < L - 1e-12) xs.push(x)
    }
  return { xs: xs.sort((a, c) => a.value - c.value), base, K, per }
}
const trigEqSum: SuTemplate<{ f: string; ki: number; b: number; phi: number; L: number; ask: "sum" | "count" }> = {
  id: "trig-eq-sum",
  subject: "대수",
  unit: U,
  standard: "12대수02-03",
  level: 3,
  count: 80,
  params: (r) => {
    const f = r.pick(["sin", "cos", "tan"])
    const ki = r.int(0, (f === "tan" ? KTAN : KSIN).length - 1)
    const b = r.int(2, 4)
    const phi = r.chance(0.5) ? 0 : r.int(1, PHS.length - 1)
    const L = r.pick([1, 2])
    const ask = r.chance(0.6) ? "sum" : "count"
    const { xs } = eqSols(f, ki, b, PHS[phi], L)
    if (!xs.length) return null
    return { f, ki, b, phi, L, ask }
  },
  build: ({ f, ki, b, phi, L, ask }, r) => {
    const ph = PHS[phi]
    const { xs, base, per } = eqSols(f, ki, b, ph, L)
    const arg = ph.n === 0 ? `${b}x` : `\\left(${b}x - ${piTex(ph)}\\right)`
    const F = fx(f, arg)
    const eq = (f === "tan" ? KTAN : KSIN)[ki].tex(F)
    const dom = `0 \\le x < ${piTex(q(L))}`
    const sum = xs.reduce((s, x) => s.add(x), q(0))
    const tlo = ph.neg()
    const thi = q(b * L).sub(ph)
    const tVals: Q[] = []
    for (const t of base) for (let n = -10; n <= 40; n++) {
      const tt = t.add(per * n)
      if (tt.value >= tlo.value && tt.value < thi.value - 1e-12) tVals.push(tt)
    }
    tVals.sort((a, c) => a.value - c.value)
    const lines0 = [
      `$${arg.replace("\\left(", "").replace("\\right)", "")} = t$ 로 놓으면 $${dom}$ 에서 $${piTex(tlo)} \\le t < ${piTex(thi)}$`,
      `이 범위에서 $\\${f} t = ${sdTex((f === "tan" ? KTAN : KSIN)[ki].k)}$ 를 만족시키는 $t$ 는 $${tVals.map(piTex).join(", ")}$`,
      `$x = \\frac{t ${ph.n === 0 ? "" : `+ ${piTex(ph)}`}}{${b}}$ 이므로 해는 $${xs.map(piTex).join(", ")}$`,
    ]
    if (ask === "count") {
      return {
        text: `$${dom}$ 일 때, 방정식 $${eq}$ 의 서로 다른 실근의 개수를 구하시오.`,
        ...short(xs.length),
        solution: sol(...lines0, `따라서 실근의 개수는 $${xs.length}$`),
        score: 3,
      }
    }
    const wr = [sum.add(q(1, b)), sum.sub(xs[xs.length - 1]), sum.mul(2), sum.add(ph), sum.sub(q(1, 2))]
    return {
      text: `$${dom}$ 일 때, 방정식 $${eq}$ 의 모든 해의 합은?`,
      ...mc(r, piChoice(sum), wr.map(piChoice), piFill(sum, q(1, 12))),
      solution: sol(...lines0, `따라서 모든 해의 합은 $${piTex(sum)}$`),
      score: 4,
    }
  },
  verify: ({ f, ki, b, phi, L, ask }) => {
    const K = sdVal((f === "tan" ? KTAN : KSIN)[ki].k)
    const ph = PHS[phi].value * PI
    const g = f === "tan" ? (x: number) => Math.sin(b * x - ph) - K * Math.cos(b * x - ph) : (x: number) => FN[f](b * x - ph) - K
    const zs = zeros(g, -0.01, L * PI + 0.01, 6000).filter((x) => x > -1e-7 && x < L * PI - 1e-7)
    return ask === "count" ? zs.length : zs.reduce((s, x) => s + Math.max(0, x), 0)
  },
}

/** 사인법칙의 비 → 코사인법칙 */
const lawRatio: SuTemplate<{ s: number[]; mode: "sin" | "sum"; ask: "max" | "min" }> = {
  id: "trig-law-ratio",
  subject: "대수",
  unit: U,
  standard: "12대수02-04",
  level: 3,
  count: 60,
  params: (r) => {
    const s = [r.int(2, 13), r.int(2, 13), r.int(2, 13)]
    const [x, y, z] = [...s].sort((a, b) => a - b)
    if (x === y || y === z || x + y <= z) return null
    if (gcd(gcd(x, y), z) !== 1) return null
    const mode = r.chance(0.5) ? "sin" : "sum"
    if (mode === "sum") {
      // (a+b):(b+c):(c+a) 가 정수비이고 나눠 떨어지게
    }
    return { s, mode, ask: r.chance(0.6) ? "max" : "min" }
  },
  build: ({ s, mode, ask }, r) => {
    const [a, b, c] = s
    const names = ["A", "B", "C"]
    const idx = ask === "max" ? s.indexOf(Math.max(...s)) : s.indexOf(Math.min(...s))
    const o = [0, 1, 2].filter((i) => i !== idx)
    const cosv = q(s[o[0]] ** 2 + s[o[1]] ** 2 - s[idx] ** 2, 2 * s[o[0]] * s[o[1]])
    const sums = [a + b, b + c, c + a]
    const g = gcd(gcd(sums[0], sums[1]), sums[2])
    const cond =
      mode === "sin"
        ? `$\\sin A : \\sin B : \\sin C = ${a} : ${b} : ${c}$`
        : `$(${seg("BC")} + ${seg("CA")}) : (${seg("CA")} + ${seg("AB")}) : (${seg("AB")} + ${seg("BC")}) = ${sums[0] / g} : ${sums[1] / g} : ${sums[2] / g}$`
    const first =
      mode === "sin"
        ? `사인법칙에 의하여 $a : b : c = \\sin A : \\sin B : \\sin C = ${a} : ${b} : ${c}$ 이므로 $a = ${a}k$, $b = ${b}k$, $c = ${c}k \\ (k > 0)$ 로 놓는다.`
        : `$a = ${seg("BC")}$, $b = ${seg("CA")}$, $c = ${seg("AB")}$ 라 하고 $a + b = ${sums[0] / g}k$, $b + c = ${sums[1] / g}k$, $c + a = ${sums[2] / g}k$ 로 놓으면, 세 식을 더해 $a + b + c = ${(a + b + c) / g}k$ 이므로 $a = ${a / g}k$, $b = ${b / g}k$, $c = ${c / g}k$`
    const kk = mode === "sin" ? 1 : g
    const v = (i: number) => (kk === 1 ? s[i] : q(s[i], kk).tex())
    const wr = [cosv.neg(), q(s[o[0]] ** 2 + s[idx] ** 2 - s[o[1]] ** 2, 2 * s[o[0]] * s[idx]), q(s[o[0]] ** 2 + s[o[1]] ** 2 - s[idx] ** 2, s[o[0]] * s[o[1]]), q(s[idx], s[o[0]] + s[o[1]])]
    return {
      text: `${tri} 에서 ${cond} 이다. ${tri} 의 세 내각 중 크기가 가장 ${ask === "max" ? "큰" : "작은"} 각의 크기를 $\\theta$ 라 할 때, $\\cos\\theta$ 의 값은?`,
      ...mc(r, qChoice(cosv), wr.map(qChoice), qFill(cosv)),
      solution: sol(
        first,
        `가장 ${ask === "max" ? "긴" : "짧은"} 변의 대각이 가장 ${ask === "max" ? "큰" : "작은"} 각이므로 $\\theta = ${names[idx]}$`,
        `코사인법칙에 의하여 $\\cos\\theta = \\frac{(${v(o[0])}k)^{2} + (${v(o[1])}k)^{2} - (${v(idx)}k)^{2}}{2 \\times ${v(o[0])}k \\times ${v(o[1])}k} = ${cosv.tex()}$`.replace(/\(1k\)/g, "k")
      ),
      score: 3,
    }
  },
  // 세 변으로 삼각형을 좌표에 그려 각을 내적으로 구한다
  verify: ({ s, ask }) => {
    const [a, b, c] = s // a = BC, b = CA, c = AB
    const B = [0, 0]
    const C = [a, 0]
    const x = (a * a + c * c - b * b) / (2 * a)
    const A = [x, Math.sqrt(c * c - x * x)]
    const ang = (P: number[], Q1: number[], R: number[]) => {
      const u = [Q1[0] - P[0], Q1[1] - P[1]]
      const v = [R[0] - P[0], R[1] - P[1]]
      return (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))
    }
    const cs = [ang(A, B, C), ang(B, C, A), ang(C, A, B)]
    return ask === "max" ? Math.min(...cs) : Math.max(...cs)
  },
}

/** 외접원 반지름과 b + c 에서 bc, b² + c², 넓이 */
const circumBC: SuTemplate<{ R: number; Ai: 0 | 1; s: number; ask: "bc" | "sq" | "area" }> = {
  id: "trig-circum-bc",
  subject: "대수",
  unit: U,
  standard: "12대수02-04",
  level: 3,
  count: 60,
  params: (r) => {
    const R = r.int(1, 12)
    const Ai = r.chance(0.5) ? 0 : 1
    const s = r.int(2, 4 * R)
    const bc = Ai === 0 ? q(s * s - 3 * R * R, 3) : q(s * s - 3 * R * R)
    if (!bc.isInt || bc.n <= 0) return null
    if (s * s <= 4 * bc.n) return null
    const ask = r.pick(["bc", "sq", "area"] as const)
    const v = ask === "bc" ? bc.n : ask === "sq" ? s * s - 2 * bc.n : 1
    if (!isShortOk(v)) return null
    return { R, Ai, s, ask }
  },
  build: ({ R, Ai, s, ask }, r) => {
    const A = Ai === 0 ? q(1, 3) : q(2, 3)
    const bc = Ai === 0 ? (s * s - 3 * R * R) / 3 : s * s - 3 * R * R
    const lines0 = [
      `$b = ${seg("CA")}$, $c = ${seg("AB")}$ 라 하자. 사인법칙에 의하여 $${seg("BC")} = 2 \\times ${R} \\times \\sin${angleArg(A)} = ${texSqrt(3 * R * R)}$`,
      `코사인법칙에 의하여 $${3 * R * R} = b^{2} + c^{2} - 2bc\\cos${angleArg(A)} = (b + c)^{2} - ${Ai === 0 ? "3" : ""}bc$`,
      `$b + c = ${s}$ 이므로 $${3 * R * R} = ${s * s} - ${Ai === 0 ? "3" : ""}bc$, 즉 $bc = ${bc}$`,
    ]
    const head = `외접원의 반지름의 길이가 $${R}$ 인 ${tri} 에서 $\\angle ${T("A")} = ${piTex(A)}$, $${seg("AB")} + ${seg("AC")} = ${s}$ 일 때,`
    if (ask === "bc")
      return { text: `${head} $${seg("AB")} \\times ${seg("AC")}$ 의 값을 구하시오.`, ...short(bc), solution: sol(...lines0, `따라서 구하는 값은 $${bc}$`), score: 3 }
    if (ask === "sq")
      return {
        text: `${head} $${seg("AB")}^{2} + ${seg("AC")}^{2}$ 의 값을 구하시오.`,
        ...short(s * s - 2 * bc),
        solution: sol(...lines0, `$b^{2} + c^{2} = (b + c)^{2} - 2bc = ${s * s} - ${2 * bc} = ${s * s - 2 * bc}$`),
        score: 4,
      }
    const area = sd(0, q(bc, 4), 3)
    return {
      text: `${head} ${tri} 의 넓이는?`,
      ...mc(r, sdChoice(area), [sdChoice(sd(0, q(bc, 2), 3)), sdChoice(sd(q(bc, 4))), sdChoice(sd(0, q(bc, 4), 2)), sdChoice(sd(0, q(bc * 3, 4), 3))], sdFill(area)),
      solution: sol(...lines0, `넓이는 $\\frac{1}{2}bc\\sin${angleArg(A)} = \\frac{1}{2} \\times ${bc} \\times \\frac{\\sqrt{3}}{2} = ${sdTex(area)}$`),
      score: 4,
    }
  },
  // 각 B 를 수치로 찾아 b = 2R sin B, c = 2R sin C 로 계산
  verify: ({ R, Ai, s, ask }) => {
    const A = Ai === 0 ? PI / 3 : (2 * PI) / 3
    const rs = roots((B) => 2 * R * (Math.sin(B) + Math.sin(PI - A - B)) - s, 1e-9, PI - A - 1e-9, 3000)
    if (!rs.length) return NaN
    const B = rs[0]
    const b = 2 * R * Math.sin(B)
    const c = 2 * R * Math.sin(PI - A - B)
    if (ask === "bc") return b * c
    if (ask === "sq") return b * b + c * c
    return 0.5 * b * c * Math.sin(A)
  },
}

/** sin²x + a cos x + b 꼴의 최대·최소 */
type Dom = { tex: string | null; lo: Q; hi: Q; x: [number, number] }
const DOMS: Record<string, Dom[]> = {
  cos: [
    { tex: null, lo: q(-1), hi: q(1), x: [0, 2 * PI] },
    { tex: "\\frac{\\pi}{3} \\le x \\le \\pi", lo: q(-1), hi: q(1, 2), x: [PI / 3, PI] },
    { tex: "0 \\le x \\le \\frac{2}{3}\\pi", lo: q(-1, 2), hi: q(1), x: [0, (2 * PI) / 3] },
    { tex: "\\frac{\\pi}{2} \\le x \\le \\frac{3}{2}\\pi", lo: q(-1), hi: q(0), x: [PI / 2, (3 * PI) / 2] },
  ],
  sin: [
    { tex: null, lo: q(-1), hi: q(1), x: [0, 2 * PI] },
    { tex: "\\frac{\\pi}{6} \\le x \\le \\frac{5}{6}\\pi", lo: q(1, 2), hi: q(1), x: [PI / 6, (5 * PI) / 6] },
    { tex: "0 \\le x \\le \\pi", lo: q(0), hi: q(1), x: [0, PI] },
    { tex: "\\pi \\le x \\le 2\\pi", lo: q(-1), hi: q(0), x: [PI, 2 * PI] },
    { tex: "-\\frac{\\pi}{6} \\le x \\le \\frac{\\pi}{2}", lo: q(-1, 2), hi: q(1), x: [-PI / 6, PI / 2] },
  ],
}
const trigQuadMax: SuTemplate<{ f: string; a: number; di: number; given: "max" | "min"; E: number }> = {
  id: "trig-quad-maxmin",
  subject: "대수",
  unit: U,
  standard: "12대수02-02",
  level: 3,
  count: 60,
  params: (r) => {
    const f = r.pick(["sin", "cos"])
    const a = r.pick([-4, -3, -2, -1, 1, 2, 3, 4])
    const di = r.int(0, DOMS[f].length - 1)
    return { f, a, di, given: r.chance(0.65) ? "max" : "min", E: r.int(-6, 10) }
  },
  build: ({ f, a, di, given, E }, r) => {
    const D = DOMS[f][di]
    const g = (t: Q) => t.mul(t).neg().add(t.mul(a)).add(1) // b = 0
    const t0 = q(a, 2)
    const inside = t0.value >= D.lo.value && t0.value <= D.hi.value
    const gl = g(D.lo)
    const gh = g(D.hi)
    const max0 = inside ? g(t0) : gl.value > gh.value ? gl : gh
    const tMax = inside ? t0 : gl.value > gh.value ? D.lo : D.hi
    const min0 = gl.value < gh.value ? gl : gh
    const tMin = gl.value < gh.value ? D.lo : D.hi
    const b = given === "max" ? q(E).sub(max0) : q(E).sub(min0)
    const ans = given === "max" ? min0.add(b) : max0.add(b)
    const sq = f === "cos" ? "\\sin^{2} x" : "\\cos^{2} x"
    const fx2 = `${sq}${term(a, `\\${f} x`)} + b`
    const tName = `\\${f} x`
    // 꼭짓점을 무시하고 끝값만 본 경우, 정의역을 무시한 경우
    const endMax = gl.value > gh.value ? gl : gh
    const wr = given === "max" ? [ans.add(max0.sub(endMax)), q(E).sub(ans).add(q(E)), ans.neg(), ans.add(1)] : [max0.sub(endMax).neg().add(ans), ans.neg(), q(E).add(ans), ans.sub(1)]
    return {
      text: `${D.tex ? `$${D.tex}$ 에서 ` : ""}함수 $f(x) = ${fx2}$ 의 ${given === "max" ? "최댓값" : "최솟값"}이 $${E}$ 일 때, $f(x)$ 의 ${given === "max" ? "최솟값" : "최댓값"}은? (단, $b$ 는 상수이다.)`,
      ...mc(r, qChoice(ans), wr.map(qChoice), qFill(ans)),
      solution: sol(
        `$${sq} = 1 - ${tName.replace(" x", "^{2} x")}$ 이므로 $${tName} = t$ 로 놓으면 $f(x) = -t^{2}${term(a, "t")} + 1 + b = -\\left(t ${signed(t0.neg())}\\right)^{2} + ${t0.mul(t0).add(1).tex()} + b$`,
        `${D.tex ? `$${D.tex}$ 에서 ` : ""}$${D.lo.tex()} \\le t \\le ${D.hi.tex()}$ 이다. 꼭짓점의 $t$ 좌표 $${t0.tex()}$ 는 이 범위 ${inside ? "안에" : "밖에"} 있다.`,
        `최댓값은 $t = ${tMax.tex()}$ 일 때 $${max0.tex()} + b$, 최솟값은 $t = ${tMin.tex()}$ 일 때 $${min0.tex()} + b$`,
        `${given === "max" ? `$${max0.tex()} + b = ${E}$` : `$${min0.tex()} + b = ${E}$`} 에서 $b = ${b.tex()}$ 이므로 구하는 값은 $${(given === "max" ? min0 : max0).tex()} ${signed(b)} = ${ans.tex()}$`
      ),
      score: 3,
    }
  },
  verify: ({ f, a, di, given, E }) => {
    const D = DOMS[f][di]
    const h = (x: number) => (f === "cos" ? Math.sin(x) ** 2 + a * Math.cos(x) : Math.cos(x) ** 2 + a * Math.sin(x))
    const e = extrema(h, D.x[0], D.x[1], 8000)
    return given === "max" ? e.min + (E - e.max) : e.max + (E - e.min)
  },
}

// ═════════ 4단계 ═════════

/** |f(x)| = n 의 실근 개수의 합 */
const absTrig: SuTemplate<{ f: string; M: number; m: number; b: number; closed: boolean }> = {
  id: "trig-abs-count-sum",
  subject: "대수",
  unit: U,
  standard: "12대수02-03",
  level: 4,
  count: 60,
  params: (r) => {
    const M = r.int(1, 9)
    const m = -r.int(1, 9)
    if (M === -m) return null
    return { f: r.pick(["sin", "cos"]), M, m, b: r.int(1, 3), closed: r.chance(0.5) }
  },
  build: ({ f, M, m, b, closed }) => {
    const a = q(M - m, 2)
    const c = q(M + m, 2)
    const N = Math.max(M, -m)
    const rows: string[] = []
    let total = 0
    const count = (v: number) => {
      const s = q(v).sub(c).div(a)
      let k = 0
      if (Math.abs(s.value) < 1) k = 2 * b
      else if (s.eq(1) || s.eq(-1)) k = b
      const atEnd = closed && (f === "sin" ? c.eq(v) : M === v)
      return { k: k + (atEnd ? 1 : 0), s, atEnd }
    }
    for (let n = 1; n <= N; n++) {
      const p = count(n)
      const ng = count(-n)
      const g = p.k + ng.k
      total += g
      rows.push(`$g(${n}) = ${p.k} + ${ng.k} = ${g}$`)
    }
    const dom = closed ? `0 \\le x \\le 2\\pi` : `0 \\le x < 2\\pi`
    return {
      text: `함수 $f(x) = a\\${f} ${b === 1 ? "x" : `${b}x`} + c$ 의 최댓값이 $${M}$, 최솟값이 $${m}$ 이다. 자연수 $n$ 에 대하여 $${dom}$ 에서 $x$ 에 대한 방정식 $|f(x)| = n$ 의 서로 다른 실근의 개수를 $g(n)$ 이라 할 때, $\\sum_{n=1}^{${N}} g(n)$ 의 값을 구하시오. (단, $a > 0$ 이고, $c$ 는 상수이다.)`,
      ...short(total),
      solution: sol(
        `$a + c = ${M}$, $-a + c = ${m}$ 에서 $a = ${a.tex()}$, $c = ${c.tex()}$`,
        `$|f(x)| = n$ 은 $f(x) = n$ 또는 $f(x) = -n$ 이다. $${dom}$ 에서 $y = f(x)$ 는 ${b === 1 ? "한" : `${b}`} 주기${b === 1 ? "" : "만큼"} 그려지므로, 직선 $y = k$ 와의 교점은 $${m} < k < ${M}$ 일 때 $${2 * b}$ 개, $k = ${M}$ 또는 $k = ${m}$ 일 때 $${b}$ 개이다.`,
        closed ? `구간의 오른쪽 끝 $x = 2\\pi$ 에서 $f(2\\pi) = f(0) = ${f === "sin" ? c.tex() : M}$ 이므로 $k = ${f === "sin" ? c.tex() : M}$ 일 때는 교점이 하나 더 있다.` : `$x = 2\\pi$ 는 구간에 포함되지 않으므로 위의 교점의 개수를 그대로 쓴다.`,
        ...rows,
        `따라서 구하는 값은 $${total}$`
      ),
      score: 4,
    }
  },
  verify: ({ f, M, m, b, closed }) => {
    const a = (M - m) / 2
    const c = (M + m) / 2
    const N = Math.max(M, -m)
    const h = (x: number) => a * FN[f](b * x) + c
    let tot = 0
    for (let n = 1; n <= N; n++) {
      const zs = zeros((x) => Math.abs(h(x)) - n, -0.01, 2 * PI + 0.01, 4000)
      tot += zs.filter((x) => x > -1e-7 && (closed ? x < 2 * PI + 1e-7 : x < 2 * PI - 1e-7)).length
    }
    return tot
  },
}

/** 원에 내접하는 사각형 */
const cyclicQuad: SuTemplate<{ p: number; qq: number; rr: number; s: number; ask: "ac" | "area" }> = {
  id: "trig-cyclic-quad",
  subject: "대수",
  unit: U,
  standard: "12대수02-04",
  level: 4,
  count: 60,
  params: (r) => {
    const [p, qq, rr, s] = [r.int(2, 9), r.int(2, 9), r.int(2, 9), r.int(2, 9)]
    const cB = q(p * p + qq * qq - rr * rr - s * s, 2 * (p * qq + rr * s))
    if (Math.abs(cB.value) >= 1 || cB.n === 0) return null
    const ac = q(p * p + qq * qq).sub(cB.mul(2 * p * qq))
    if (ac.d > 12) return null
    const R2 = ac.div(q(1).sub(cB.mul(cB)).mul(4))
    const ask = r.chance(0.5) ? "ac" : "area"
    if (ask === "area" && R2.d > 60) return null
    if (new Set([p, qq, rr, s]).size < 3) return null
    return { p, qq, rr, s, ask }
  },
  build: ({ p, qq, rr, s, ask }, r) => {
    const cB = q(p * p + qq * qq - rr * rr - s * s, 2 * (p * qq + rr * s))
    const ac = q(p * p + qq * qq).sub(cB.mul(2 * p * qq))
    const sin2 = q(1).sub(cB.mul(cB))
    const R2 = ac.div(sin2.mul(4))
    const head = `원에 내접하는 사각형 $${T("ABCD")}$ 에서 $${seg("AB")} = ${p}$, $${seg("BC")} = ${qq}$, $${seg("CD")} = ${rr}$, $${seg("DA")} = ${s}$ 일 때,`
    const lines0 = [
      `원에 내접하는 사각형의 마주 보는 두 각의 크기의 합은 $\\pi$ 이므로 $\\angle ${T("D")} = \\pi - \\angle ${T("B")}$, 즉 $\\cos D = -\\cos B$`,
      `삼각형 $${T("ABC")}$ 에서 코사인법칙: $${seg("AC")}^{2} = ${p * p} + ${qq * qq} - ${2 * p * qq}\\cos B$`,
      `삼각형 $${T("ACD")}$ 에서 코사인법칙: $${seg("AC")}^{2} = ${rr * rr} + ${s * s} + ${2 * rr * s}\\cos B$`,
      `두 식에서 $${2 * p * qq + 2 * rr * s}\\cos B = ${p * p + qq * qq - rr * rr - s * s}$, 즉 $\\cos B = ${cB.tex()}$ 이고 $${seg("AC")}^{2} = ${ac.tex()}$`,
    ]
    if (ask === "ac") {
      const wr = [q(p * p + qq * qq), q(p * p + qq * qq).add(cB.mul(2 * p * qq)), q(rr * rr + s * s), ac.add(1)]
      return { text: `${head} $${seg("AC")}^{2}$ 의 값${ac.isInt && isShortOk(ac.n) ? "을 구하시오." : "은?"}`, ...autoQ(r, ac, wr), solution: sol(...lines0), score: 4 }
    }
    return {
      text: `${head} 이 원의 넓이는?`,
      ...mc(r, piChoice(R2), [piChoice(R2.mul(4)), piChoice(ac.div(4)), piChoice(R2.mul(2)), piChoice(ac.div(sin2))], piFill(R2, q(1, R2.d))),
      solution: sol(
        ...lines0,
        `$\\sin^{2} B = 1 - \\cos^{2} B = ${sin2.tex()}$ 이고, 원의 반지름의 길이를 $R$ 라 하면 사인법칙에 의하여 $\\frac{${seg("AC")}}{\\sin B} = 2R$`,
        `$R^{2} = \\frac{${seg("AC")}^{2}}{4\\sin^{2} B} = ${R2.tex()}$ 이므로 원의 넓이는 $${piTex(R2)}$`
      ),
      score: 4,
    }
  },
  // 네 현의 중심각의 합이 2π 가 되는 반지름을 수치로 찾는다
  verify: ({ p, qq, rr, s, ask }) => {
    const cs = [p, qq, rr, s]
    const cmax = Math.max(...cs)
    const th = (c: number, R: number) => 2 * Math.asin(Math.min(1, c / (2 * R)))
    const F1 = (R: number) => cs.reduce((t, c) => t + th(c, R), 0) - 2 * PI
    let R: number
    let outside = false
    if (F1(cmax / 2) >= 0) {
      const rs = roots(F1, cmax / 2, 200, 4000)
      R = rs[0]
    } else {
      outside = true
      const im = cs.indexOf(cmax)
      const F2 = (R: number) => cs.reduce((t, c, i) => (i === im ? t : t + th(c, R)), 0) - th(cmax, R)
      const rs = roots(F2, cmax / 2 + 1e-12, 200, 4000)
      R = rs[0]
    }
    if (!Number.isFinite(R)) return NaN
    const arcs = cs.map((c) => th(c, R))
    if (outside) {
      const im = cs.indexOf(cmax)
      arcs[im] = 2 * PI - arcs[im]
    }
    if (ask === "area") return PI * R * R
    const AC = 2 * R * Math.sin((arcs[0] + arcs[1]) / 2)
    return AC * AC
  },
}

/** a sin(πx/p) + c = t 의 실근의 합 (대칭성) */
const trigSym: SuTemplate<{ p: number; H: number; u: number; v: number; t: number }> = {
  id: "trig-sym-sum",
  subject: "대수",
  unit: U,
  standard: "12대수02-02",
  level: 4,
  count: 60,
  params: (r) => {
    const p = r.int(1, 4)
    const H = r.int(2, 7)
    const u = r.int(-8, 10)
    const v = r.int(-8, 10)
    if (u === v) return null
    const lo = Math.min(u, v)
    const hi = Math.max(u, v)
    const t = r.int(lo, hi)
    const ans = trigSymSum(p, H, u, v, t)
    if (!ans || !ans.isInt || ans.n < 1 || ans.n > 999) return null
    return { p, H, u, v, t }
  },
  build: ({ p, H, u, v, t }) => {
    const a = q(u - v, 2)
    const c = q(u + v, 2)
    const sg = q(t).sub(c).div(a)
    const ans = trigSymSum(p, H, u, v, t)!
    const arg = p === 1 ? "\\pi x" : `\\frac{\\pi x}{${p}}`
    const half = q(p, 2)
    const L = H * p
    let how: string
    const evens: number[] = []
    const odds: number[] = []
    for (let h = 0; h < H; h++) (h % 2 ? odds : evens).push(h)
    const centers = (hs: number[]) => hs.map((h) => q((2 * h + 1) * p, 2).tex()).join(", ")
    if (sg.n === 0) how = `$\\sin ${arg} = 0$ 의 해는 $x = 0, ${p}, ${2 * p}, \\cdots, ${L}$ 이므로 합은 $${p} \\times (0 + 1 + \\cdots + ${H}) = ${ans.tex()}$`
    else if (sg.eq(1) || sg.eq(-1)) {
      const hs = sg.n > 0 ? evens : odds
      how = `$\\sin ${arg} = ${sg.tex()}$ 의 해는 ${sg.n > 0 ? "최댓값" : "최솟값"}을 갖는 $x = ${centers(hs)}$ 이므로 합은 $${ans.tex()}$`
    } else {
      const hs = sg.n > 0 ? evens : odds
      how = `$\\sin ${arg} = ${sg.tex()}$ 의 해는 $\\sin ${arg}$ 가 ${sg.n > 0 ? "양수" : "음수"}인 구간마다 직선 $x = ${centers(hs)}$ 에 대하여 대칭인 두 근씩 있으므로, 합은 $2 \\times (${centers(hs).replace(/, /g, " + ")}) = ${ans.tex()}$`
    }
    return {
      text: `함수 $f(x) = a\\sin ${arg} + c$ 가 $f\\left(${half.tex()}\\right) = ${u}$, $f\\left(${q(3 * p, 2).tex()}\\right) = ${v}$ 를 만족시킨다. $0 \\le x \\le ${L}$ 에서 방정식 $f(x) = ${t}$ 의 모든 실근의 합을 구하시오. (단, $a$, $c$ 는 상수이다.)`,
      ...short(ans.n),
      solution: sol(
        `$\\sin\\frac{\\pi}{2} = 1$, $\\sin\\frac{3}{2}\\pi = -1$ 이므로 $a + c = ${u}$, $-a + c = ${v}$ 에서 $a = ${a.tex()}$, $c = ${c.tex()}$`,
        `$f(x) = ${t}$ 에서 $\\sin ${arg} = \\frac{${t} - c}{a} = ${sg.tex()}$`,
        `$y = \\sin ${arg}$ 의 주기는 $${2 * p}$ 이고, $0 \\le x \\le ${L}$ 은 길이 $${p}$ 인 구간 $${H}$ 개로 나뉜다. 각 구간에서 그래프는 가운데 직선에 대하여 대칭이다.`,
        how,
        `따라서 모든 실근의 합은 $${ans.tex()}$`
      ),
      score: 4,
    }
  },
  verify: ({ p, H, u, v, t }) => {
    const a = (u - v) / 2
    const c = (u + v) / 2
    const L = H * p
    const zs = zeros((x) => a * Math.sin((PI * x) / p) + c - t, -0.01, L + 0.01, 6000).filter((x) => x > -1e-7 && x < L + 1e-7)
    return zs.reduce((s, x) => s + x, 0)
  },
}
function trigSymSum(p: number, H: number, u: number, v: number, t: number): Q | null {
  const a = q(u - v, 2)
  const c = q(u + v, 2)
  const sg = q(t).sub(c).div(a)
  if (Math.abs(sg.value) > 1) return null
  if (sg.n === 0) return q((p * H * (H + 1)) / 2)
  let s = q(0)
  for (let h = 0; h < H; h++) {
    const positive = h % 2 === 0
    if (sg.n > 0 !== positive) continue
    const center = q((2 * h + 1) * p, 2)
    s = s.add(sg.eq(1) || sg.eq(-1) ? center : center.mul(2))
  }
  return s
}

/** 외접원 위의 호의 중점 D: AD² */
const midArc: SuTemplate<{ a: number; c: number; ci: number; ask: "ad" | "area" }> = {
  id: "trig-mid-arc",
  subject: "대수",
  unit: U,
  standard: "12대수02-04",
  level: 4,
  count: 60,
  params: (r) => {
    const a = r.int(2, 10)
    const c = r.int(2, 10)
    if (a === c) return null
    const ci = r.int(0, COSV.length - 1)
    const cB = COSV[ci]
    const b2 = q(a * a + c * c).sub(cB.mul(2 * a * c))
    const ad = b2.div(q(1).add(cB).mul(2))
    const R2 = b2.div(q(1).sub(cB.mul(cB)).mul(4))
    const ask = r.chance(0.6) ? "ad" : "area"
    if (ask === "ad" && ad.d > 12) return null
    if (ask === "area" && R2.d > 40) return null
    return { a, c, ci, ask }
  },
  build: ({ a, c, ci, ask }, r) => {
    const cB = COSV[ci]
    const b2 = q(a * a + c * c).sub(cB.mul(2 * a * c))
    const ad = b2.div(q(1).add(cB).mul(2))
    const R2 = b2.div(q(1).sub(cB.mul(cB)).mul(4))
    const head = `${tri} 에서 $${seg("AB")} = ${c}$, $${seg("BC")} = ${a}$, $\\cos(\\angle ${T("ABC")}) = ${cB.tex()}$ 이다.`
    const l1 = `코사인법칙에 의하여 $${seg("AC")}^{2} = ${c * c} + ${a * a} - 2 \\times ${c} \\times ${a} \\times ${cB.n < 0 ? `\\left(${cB.tex()}\\right)` : cB.tex()} = ${b2.tex()}$`
    if (ask === "ad") {
      const wr = [b2.div(q(1).sub(cB).mul(2)), b2.div(2), b2.div(4), ad.add(1)]
      return {
        text: `${head} ${tri} 의 외접원 위의 점 $${T("D")}$ 가 $${seg("AD")} = ${seg("CD")}$ 를 만족시키고, 점 $${T("D")}$ 는 점 $${T("B")}$ 를 포함하지 않는 호 $${T("AC")}$ 위에 있을 때, $${seg("AD")}^{2}$ 의 값${ad.isInt && isShortOk(ad.n) ? "을 구하시오." : "은?"}`,
        ...autoQ(r, ad, wr),
        solution: sol(
          l1,
          `사각형 $${T("ABCD")}$ 는 원에 내접하므로 $\\angle ${T("ADC")} = \\pi - \\angle ${T("ABC")}$, 즉 $\\cos(\\angle ${T("ADC")}) = ${cB.neg().tex()}$`,
          `$${seg("AD")} = ${seg("CD")} = x$ 라 하면 삼각형 $${T("ACD")}$ 에서 코사인법칙에 의하여 $${b2.tex()} = x^{2} + x^{2} - 2x^{2} \\times \\left(${cB.neg().tex()}\\right) = ${q(2).add(cB.mul(2)).tex()}x^{2}$`,
          `따라서 $${seg("AD")}^{2} = x^{2} = ${ad.tex()}$`
        ),
        score: 4,
      }
    }
    const sin2 = q(1).sub(cB.mul(cB))
    return {
      text: `${head} ${tri} 의 외접원의 넓이는?`,
      ...mc(r, piChoice(R2), [piChoice(R2.mul(4)), piChoice(b2.div(4)), piChoice(b2.div(sin2)), piChoice(R2.mul(2))], piFill(R2, q(1, R2.d))),
      solution: sol(
        l1,
        `$\\sin^{2}(\\angle ${T("ABC")}) = 1 - \\left(${cB.tex()}\\right)^{2} = ${sin2.tex()}$`,
        `외접원의 반지름의 길이를 $R$ 라 하면 사인법칙에 의하여 $4R^{2} = \\frac{${seg("AC")}^{2}}{\\sin^{2}(\\angle ${T("ABC")})} = ${R2.mul(4).tex()}$`,
        `따라서 외접원의 넓이는 $\\pi R^{2} = ${piTex(R2)}$`
      ),
      score: 4,
    }
  },
  // 좌표로 외심과 점 D 를 직접 구한다
  verify: ({ a, c, ci, ask }) => {
    const cB = COSV[ci].value
    const sB = Math.sqrt(1 - cB * cB)
    const B = [0, 0]
    const C = [a, 0]
    const A = [c * cB, c * sB]
    // 외심
    const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]))
    const ux = ((A[0] ** 2 + A[1] ** 2) * (B[1] - C[1]) + (B[0] ** 2 + B[1] ** 2) * (C[1] - A[1]) + (C[0] ** 2 + C[1] ** 2) * (A[1] - B[1])) / d
    const uy = ((A[0] ** 2 + A[1] ** 2) * (C[0] - B[0]) + (B[0] ** 2 + B[1] ** 2) * (A[0] - C[0]) + (C[0] ** 2 + C[1] ** 2) * (B[0] - A[0])) / d
    const R = Math.hypot(A[0] - ux, A[1] - uy)
    if (ask === "area") return PI * R * R
    // AC 의 수직이등분선과 원의 교점 중 B 와 반대쪽
    const M = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2]
    const dir = [-(C[1] - A[1]), C[0] - A[0]]
    const len = Math.hypot(dir[0], dir[1])
    const n = [dir[0] / len, dir[1] / len]
    const side = (P: number[]) => (C[0] - A[0]) * (P[1] - A[1]) - (C[1] - A[1]) * (P[0] - A[0])
    for (const sg of [1, -1]) {
      // O + R * (±n) 이 수직이등분선 위의 원 위의 점
      const D = [ux + sg * R * n[0], uy + sg * R * n[1]]
      void M
      if (side(D) * side(B) < 0) return (D[0] - A[0]) ** 2 + (D[1] - A[1]) ** 2
    }
    return NaN
  },
}

export const TRIGS: SuTemplate[] = [
  sector,
  trigValues,
  trigPyth,
  periodMax,
  reduction,
  trigCoef,
  trigEqQuad,
  sineLaw,
  cosineLaw,
  sinCos,
  trigIneq,
  trigEqSum,
  lawRatio,
  circumBC,
  trigQuadMax,
  absTrig,
  cyclicQuad,
  trigSym,
  midArc,
]
