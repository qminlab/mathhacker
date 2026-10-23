// 대수 · 지수함수와 로그함수
import { closeTo, gcd, intChoice, ints, mc, q, Q, qChoice, roots, short, signed, texPoly, texShift } from "../kit"
import type { SuTemplate } from "../types"
import { extrema, nearInt, qFill, sol } from "./helpers"

const U = "지수함수와 로그함수"
const lg = (x: number, b: number) => Math.log(x) / Math.log(b)
/** b^e 를 수로 (e 는 음이 아닌 정수 또는 음의 정수 → 분수 TeX) */
const powTex = (b: number, e: number) => (e >= 0 ? String(b ** e) : `\\frac{1}{${b ** -e}}`)
const rootTex = (n: number, inside: string) => (n === 2 ? `\\sqrt{${inside}}` : `\\sqrt[${n}]{${inside}}`)
/** 지수 자리의 유리수 */
const expTex = (x: Q) => x.tex()
const realRoot = (x: number, n: number) => (x < 0 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n))

// ═════════ 1단계 ═════════

/** 거듭제곱근과 지수법칙 */
const expLaw: SuTemplate<{ b: number; n: number; a: number; c: number; div: boolean }> = {
  id: "exp-law-root",
  subject: "대수",
  unit: U,
  standard: "12대수01-03",
  level: 1,
  count: 70,
  params: (r) => {
    const b = r.pick([2, 3, 5])
    const n = r.pick([2, 3, 4, 5])
    const e = r.int(1, b === 2 ? 6 : b === 3 ? 4 : 3)
    const a = r.int(1, e * n - 1)
    if (a % n === 0) return null
    return { b, n, a, c: e * n - a, div: r.chance(0.4) }
  },
  build: ({ b, n, a, c, div }, r) => {
    const e = (a + c) / n
    const ans = b ** e
    const cq = q(c, n)
    const second = div ? `${b}^{-${expTex(cq)}}` : `${b}^{${expTex(cq)}}`
    const op = div ? "\\div" : "\\times"
    return {
      text: `$${rootTex(n, `${b}^{${a}}`)} ${op} ${second}$ 의 값은?`,
      ...mc(r, intChoice(ans), ints(b ** (e + 1), b ** (e - 1), b * e, ans + b)),
      solution: sol(
        `거듭제곱근을 지수로 나타내면 $${rootTex(n, `${b}^{${a}}`)} = ${b}^{${expTex(q(a, n))}}$ 이다.`,
        div
          ? `$${b}^{x} \\div ${b}^{-y} = ${b}^{x + y}$ 이므로 지수끼리 더한다.`
          : `$${b}^{x} \\times ${b}^{y} = ${b}^{x + y}$ 이므로 지수끼리 더한다.`,
        `$${expTex(q(a, n))} + ${expTex(cq)} = ${e}$ 이므로 구하는 값은 $${b}^{${e}} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ b, n, a, c, div }) => (div ? Math.pow(b ** a, 1 / n) / Math.pow(b, -c / n) : Math.pow(b ** a, 1 / n) * Math.pow(b, c / n)),
}

/** 밑변환: log_x p^k × log_{p^m} x */
const logChain: SuTemplate<{ p: number; m: number; k: number; x: number; swap: boolean }> = {
  id: "exp-log-chain",
  subject: "대수",
  unit: U,
  standard: "12대수01-04",
  level: 1,
  count: 60,
  params: (r) => {
    const p = r.pick([2, 3])
    const m = r.int(1, 3)
    const k = r.int(1, 6)
    if (p ** k > 729 || k === m) return null
    const x = r.pick([3, 5, 6, 7, 10, 11, 12, 13].filter((v) => v !== p && v !== 9 && v !== 4 && v !== 8))
    return { p, m, k, x, swap: r.chance(0.5) }
  },
  build: ({ p, m, k, x, swap }, r) => {
    const ans = q(k, m)
    const A = `\\log_{${x}} ${p ** k}`
    const B = `\\log_{${p ** m}} ${x}`
    return {
      text: `$${swap ? `${B} \\times ${A}` : `${A} \\times ${B}`}$ 의 값은?`,
      ...mc(r, qChoice(ans), [qChoice(q(m, k)), qChoice(q(k * m)), qChoice(q(k + m)), qChoice(ans.add(1)), qChoice(q(k - 1, m))], qFill(ans)),
      solution: sol(
        `밑을 $${p}$ 로 바꾸면 $${A} = \\frac{\\log_{${p}} ${p ** k}}{\\log_{${p}} ${x}} = \\frac{${k}}{\\log_{${p}} ${x}}$`,
        `$${B} = \\frac{\\log_{${p}} ${x}}{\\log_{${p}} ${p ** m}} = \\frac{\\log_{${p}} ${x}}{${m}}$`,
        `두 식을 곱하면 $\\log_{${p}} ${x}$ 가 약분되어 $${ans.d === m && ans.n === k ? ans.tex() : `\\frac{${k}}{${m}} = ${ans.tex()}`}$`
      ),
      score: 2,
    }
  },
  verify: ({ p, m, k, x }) => lg(p ** k, x) * lg(x, p ** m),
}

/** 로그의 성질: c log x1 + log x2 − log x3 */
const logCombo: SuTemplate<{ b: number; c1: number; x1: number; x2: number; x3: number }> = {
  id: "exp-log-combo",
  subject: "대수",
  unit: U,
  standard: "12대수01-04",
  level: 1,
  count: 60,
  params: (r) => {
    const b = r.pick([2, 3, 5, 6])
    const e = r.int(1, 4)
    if (b ** e > 1296) return null
    const c1 = r.pick([1, 1, 2])
    const x1 = r.int(2, c1 === 2 ? 12 : 30)
    const x3 = r.int(2, 20)
    const num = b ** e * x3
    const den = x1 ** c1
    if (num % den !== 0) return null
    const x2 = num / den
    if (x2 < 2 || x2 > 300 || x2 === x1 || x2 === x3 || x1 === x3) return null
    return { b, c1, x1, x2, x3 }
  },
  build: ({ b, c1, x1, x2, x3 }, r) => {
    const e = Math.round(Math.log((x1 ** c1 * x2) / x3) / Math.log(b))
    const lead = c1 === 2 ? `2\\log_{${b}} ${x1}` : `\\log_{${b}} ${x1}`
    return {
      text: `$${lead} + \\log_{${b}} ${x2} - \\log_{${b}} ${x3}$ 의 값은?`,
      ...mc(r, intChoice(e), ints(e - 1, e + 1, 2 * e, e + 2)),
      solution: sol(
        c1 === 2 ? `$2\\log_{${b}} ${x1} = \\log_{${b}} ${x1}^{2} = \\log_{${b}} ${x1 ** 2}$ 이다.` : `로그의 덧셈은 진수의 곱, 뺄셈은 진수의 나눗셈이 된다.`,
        `(주어진 식) $= \\log_{${b}} \\frac{${x1 ** c1} \\times ${x2}}{${x3}} = \\log_{${b}} ${b ** e}$`,
        `$${b ** e} = ${b}^{${e}}$ 이므로 구하는 값은 $${e}$`
      ),
      score: 2,
    }
  },
  verify: ({ b, c1, x1, x2, x3 }) => c1 * lg(x1, b) + lg(x2, b) - lg(x3, b),
}

/** 거듭제곱근의 성질: ⁿ√P × ⁿ√R, ⁿ√P ÷ ⁿ√R */
const rootProd: SuTemplate<{ n: number; P: number; R: number; div: boolean }> = {
  id: "exp-root-product",
  subject: "대수",
  unit: U,
  standard: "12대수01-01",
  level: 1,
  count: 50,
  params: (r) => {
    const n = r.pick([2, 3, 3, 4, 5])
    const tMax = { 2: 15, 3: 8, 4: 5, 5: 3 }[n]!
    const t = r.int(2, tMax)
    const isPow = (x: number) => Number.isInteger(Math.round(Math.pow(x, 1 / n))) && Math.round(Math.pow(x, 1 / n)) ** n === x
    const div = r.chance(0.4)
    let P: number
    let R: number
    if (div) {
      R = r.int(2, 12)
      if (isPow(R)) return null
      P = t ** n * R
      if (P > 3000) return null
    } else {
      const N = t ** n
      const ds: number[] = []
      for (let d = 2; d < N; d++) if (N % d === 0 && !isPow(d)) ds.push(d)
      if (!ds.length) return null
      P = r.pick(ds)
      R = N / P
      if (P === R) return null
    }
    const neg = n % 2 === 1 && r.chance(0.3)
    return { n, P: neg ? -P : P, R, div }
  },
  build: ({ n, P, R, div }, r) => {
    const ans = div ? Math.round(realRoot(P / R, n)) : Math.round(realRoot(P * R, n))
    const inner = div ? P / R : P * R
    const op = div ? "\\div" : "\\times"
    return {
      text: `$${rootTex(n, String(P))} ${op} ${rootTex(n, String(R))}$ 의 값은?`,
      ...mc(r, intChoice(ans), ints(-ans, ans + 1, ans - 1, ans * 2, ans * ans)),
      solution: sol(
        div ? `$\\frac{${rootTex(n, "a")}}{${rootTex(n, "b")}} = ${rootTex(n, "\\frac{a}{b}")}$ 이므로` : `$${rootTex(n, "a")} \\times ${rootTex(n, "b")} = ${rootTex(n, "ab")}$ 이므로`,
        `(주어진 식) $= ${rootTex(n, String(inner))}$`,
        `$${inner} = ${ans < 0 ? `(${ans})` : ans}^{${n}}$ 이므로 구하는 값은 $${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ n, P, R, div }) => (div ? realRoot(P, n) / realRoot(R, n) : realRoot(P, n) * realRoot(R, n)),
}

/** 지수·로그함수 그래프의 평행이동과 점근선 */
const graphShift: SuTemplate<{ kind: "exp" | "log"; b: number; inv: boolean; m: number; n: number; x0: number; y0: number }> = {
  id: "exp-graph-shift",
  subject: "대수",
  unit: U,
  standard: "12대수01-06",
  level: 1,
  count: 50,
  params: (r) => {
    const kind = r.chance(0.5) ? "exp" : "log"
    const b = r.pick([2, 3])
    const inv = kind === "exp" && r.chance(0.4)
    const m = r.int(-4, 4)
    const n = r.int(-5, 5)
    const j = r.int(0, b === 2 ? 4 : 3)
    if (m === 0 || n === 0 || m + n === 0) return null
    if (kind === "exp") {
      // y = B^{x-m} + n 을 지나는 점: x0 - m = (inv ? -j : j), y0 = b^j + n
      const x0 = m + (inv ? -j : j)
      return { kind, b, inv, m, n, x0, y0: b ** j + n }
    }
    // y = log_b(x - m) + n: x0 - m = b^j, y0 = j + n
    return { kind, b, inv, m, n, x0: m + b ** j, y0: j + n }
  },
  build: ({ kind, b, inv, m, n, x0, y0 }, r) => {
    const base = inv ? `\\left(\\frac{1}{${b}}\\right)^{x}` : `${b}^{x}`
    const f = kind === "exp" ? `y = ${base}` : `y = \\log_{${b}} x`
    const asym = kind === "exp" ? `y = ${n}` : `x = ${m}`
    const ans = m + n
    const shifted = kind === "exp" ? `y = ${inv ? `\\left(\\frac{1}{${b}}\\right)^{${texShift(m)}}` : `${b}^{${texShift(m)}}`} ${signed(n)}` : `y = \\log_{${b}}(${texShift(m)}) ${signed(n)}`
    return {
      text: `함수 $${f}$ 의 그래프를 $x$ 축의 방향으로 $m$ 만큼, $y$ 축의 방향으로 $n$ 만큼 평행이동한 그래프의 점근선이 직선 $${asym}$ 이고, 이 그래프가 점 $(${x0}, ${y0})$ 을 지날 때, $m + n$ 의 값은? (단, $m$, $n$ 은 상수이다.)`,
      ...mc(r, intChoice(ans), ints(m - n, n - m, ans + 1, ans - 1, -ans)),
      solution: sol(
        kind === "exp"
          ? `평행이동한 그래프는 $y = ${inv ? `\\left(\\frac{1}{${b}}\\right)^{x - m}` : `${b}^{x - m}`} + n$ 이고 점근선은 직선 $y = n$ 이므로 $n = ${n}$`
          : `평행이동한 그래프는 $y = \\log_{${b}}(x - m) + n$ 이고 점근선은 직선 $x = m$ 이므로 $m = ${m}$`,
        kind === "exp"
          ? `점 $(${x0}, ${y0})$ 을 지나므로 $${y0} = ${inv ? `\\left(\\frac{1}{${b}}\\right)^{${x0} - m}` : `${b}^{${x0} - m}`} ${signed(n)}$, 즉 $${inv ? `\\left(\\frac{1}{${b}}\\right)` : b}^{${x0} - m} = ${y0 - n}$ 에서 $m = ${m}$`
          : `점 $(${x0}, ${y0})$ 을 지나므로 $${y0} = \\log_{${b}} ${x0 - m} + n$, 즉 $n = ${y0} - ${Math.round(lg(x0 - m, b))} = ${n}$`,
        `그래프는 $${shifted}$ 이고, $m + n = ${m} ${signed(n)} = ${ans}$`
      ),
      score: 2,
    }
  },
  // 정수 m, n 을 모두 대입해 보며 조건을 확인
  verify: ({ kind, b, inv, x0, y0, m: mm, n: nn }) => {
    let found = NaN
    for (let m = -20; m <= 20; m++)
      for (let n = -20; n <= 20; n++) {
        if (kind === "exp") {
          if (n !== nn) continue // 점근선 y = n
          const v = Math.pow(inv ? 1 / b : b, x0 - m) + n
          if (closeTo(v, y0, 1e-9)) found = m + n
        } else {
          if (m !== mm) continue // 점근선 x = m
          if (x0 - m <= 0) continue
          if (closeTo(lg(x0 - m, b) + n, y0, 1e-9)) found = m + n
        }
      }
    return found
  },
}

// ═════════ 2단계 ═════════

/** 지수방정식: 치환하여 이차방정식 */
const expQuad: SuTemplate<{ b: number; al: number; be: number; ask: "sum" | "sq"; twoX: boolean }> = {
  id: "exp-eq-quadratic",
  subject: "대수",
  unit: U,
  standard: "12대수01-08",
  level: 2,
  count: 40,
  params: (r) => {
    const b = r.pick([2, 2, 3])
    const lo = b === 2 ? -2 : -1
    const hi = b === 2 ? 6 : 4
    const al = r.int(lo, hi - 1)
    const be = r.int(al + 1, hi)
    if (al < 0 && be - al > 6) return null
    return { b, al, be, ask: r.chance(0.5) ? "sum" : "sq", twoX: r.chance(0.4) }
  },
  build: ({ b, al, be, ask, twoX }, r) => {
    const t1 = al >= 0 ? q(b ** al) : q(1, b ** -al)
    const t2 = q(b ** be)
    const D = t1.d
    const A = D
    const B = t1.add(t2).mul(D)
    const C = t1.mul(t2).mul(D)
    const sq = twoX ? `${b}^{2x}` : `${b * b}^{x}`
    const eq = `${A === 1 ? "" : `${A} \\times `}${sq} - ${B.tex()} \\times ${b}^{x} + ${C.tex()} = 0`
    const ans = ask === "sum" ? al + be : al * al + be * be
    const wr = ask === "sum" ? [al * be, ans + 1, ans - 1, be - al, t1.add(t2).isInt ? t1.add(t2).n : ans + 2] : [(al + be) ** 2, ans - 2 * al * be + 1, ans + 2 * al * be, ans + 1, ans - 1]
    return {
      text: `방정식 $${eq}$ 의 두 실근을 $\\alpha$, $\\beta$ 라 할 때, $${ask === "sum" ? "\\alpha + \\beta" : "\\alpha^{2} + \\beta^{2}"}$ 의 값은?`,
      ...mc(r, intChoice(ans), ints(...wr)),
      solution: sol(
        `$${b}^{x} = t \\ (t > 0)$ 로 놓으면 $${sq} = t^{2}$ 이므로 $${texPoly([A, B.neg(), C], "t")} = 0$`,
        `인수분해하면 $${A === 1 ? "" : A}\\left(t - ${t1.tex()}\\right)(t - ${t2.tex()}) = 0$ 에서 $t = ${t1.tex()}$ 또는 $t = ${t2.tex()}$ (모두 양수)`,
        `$${b}^{x} = ${t1.tex()}$ 에서 $x = ${al}$, $${b}^{x} = ${t2.tex()}$ 에서 $x = ${be}$`,
        ask === "sum" ? `따라서 $\\alpha + \\beta = ${al} ${signed(be)} = ${ans}$` : `따라서 $\\alpha^{2} + \\beta^{2} = ${al * al} + ${be * be} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ b, al, be, ask }) => {
    const t1 = Math.pow(b, al)
    const t2 = Math.pow(b, be)
    const D = al >= 0 ? 1 : b ** -al
    const f = (x: number) => D * Math.pow(b, 2 * x) - D * (t1 + t2) * Math.pow(b, x) + D * t1 * t2
    const rs = roots(f, -6, 8, 28000)
    if (rs.length !== 2) return NaN
    return ask === "sum" ? rs[0] + rs[1] : rs[0] ** 2 + rs[1] ** 2
  },
}

/** 로그방정식: log(x−a) + log(x−c) = log N */
const logEq: SuTemplate<{ b: number; a: number; c: number; N: number; asNum: boolean }> = {
  id: "exp-log-eq",
  subject: "대수",
  unit: U,
  standard: "12대수01-08",
  level: 2,
  count: 80,
  params: (r) => {
    const b = r.pick([2, 3, 5])
    const pow = r.chance(0.6)
    let u: number
    let v: number
    if (pow) {
      u = b ** r.int(0, 4)
      v = b ** r.int(0, 4)
    } else {
      u = r.int(1, 12)
      v = r.int(1, 12)
    }
    if (u === v || u * v > 400) return null
    const a = r.int(-8, 12)
    const x0 = a + u
    const c = x0 - v
    if (x0 < 1 || a === 0 || c === 0) return null
    const N = u * v
    const isPow = Number.isInteger(Math.round(lg(N, b))) && b ** Math.round(lg(N, b)) === N
    return { b, a, c, N, asNum: !isPow || r.chance(0.3) }
  },
  build: ({ b, a, c, N, asNum }) => {
    const e = Math.round(lg(N, b))
    const rhs = asNum ? `\\log_{${b}} ${N}` : String(e)
    // (x-a)(x-c) = N
    const S = a + c
    const P = a * c - N
    const disc = S * S - 4 * P
    const sq = Math.round(Math.sqrt(disc))
    const x1 = (S + sq) / 2
    const x2 = (S - sq) / 2
    const lo = Math.max(a, c)
    return {
      text: `방정식 $\\log_{${b}}(${texShift(a)}) + \\log_{${b}}(${texShift(c)}) = ${rhs}$ 의 해를 구하시오.`,
      ...short(x1),
      solution: sol(
        `진수 조건에서 $x > ${a}$ 이고 $x > ${c}$ 이므로 $x > ${lo}$`,
        `로그의 성질에 의하여 $(${texShift(a)})(${texShift(c)}) = ${N}$, 즉 $${texPoly([1, -S, P])} = 0$`,
        `$(x - ${x1})(${texShift(x2)}) = 0$ 에서 $x = ${x1}$ 또는 $x = ${x2}$`,
        `$x > ${lo}$ 이므로 구하는 해는 $x = ${x1}$`
      ),
      score: 3,
    }
  },
  verify: ({ b, a, c, N }) => {
    const lo = Math.max(a, c)
    const rs = roots((x) => lg(x - a, b) + lg(x - c, b) - lg(N, b), lo + 1e-9, lo + 600, 30000)
    return rs.length === 1 ? rs[0] : NaN
  },
}

/** 지수부등식의 정수해 개수 */
const expIneq: SuTemplate<{ b: number; m: number; n: number; strict: boolean; form: 0 | 1 }> = {
  id: "exp-ineq-count",
  subject: "대수",
  unit: U,
  standard: "12대수01-08",
  level: 2,
  count: 70,
  params: (r) => {
    const m = r.int(-7, 3)
    const n = r.int(m + 2, m + 11)
    if (m === 0 && n === 0) return null
    return { b: r.pick([2, 3, 5]), m, n, strict: r.chance(0.4), form: r.chance(0.5) ? 0 : 1 }
  },
  build: ({ b, m, n, strict, form }) => {
    // 조건: x^2 + px + c (≤ or <) 0, p = -(m+n), c = mn
    const p = -(m + n)
    const c = m * n
    const g = texPoly([p, c])
    const inv = `\\left(\\frac{1}{${b}}\\right)`
    // form 0: (1/b)^{x^2} ≥ b^{g}   form 1: b^{x^2} ≤ (1/b)^{g}
    const op0 = strict ? ">" : "\\ge"
    const op1 = strict ? "<" : "\\le"
    const text = form === 0 ? `${inv}^{x^{2}} ${op0} ${b}^{${g}}` : `${b}^{x^{2}} ${op1} ${inv}^{${g}}`
    const quad = texPoly([1, p, c])
    const ans = strict ? n - m - 1 : n - m + 1
    return {
      text: `부등식 $${text}$ 을 만족시키는 정수 $x$ 의 개수를 구하시오.`,
      ...short(ans),
      solution: sol(
        form === 0
          ? `$${inv}^{x^{2}} = ${b}^{-x^{2}}$ 이고 밑 $${b}$ 가 $1$ 보다 크므로 $-x^{2} ${op0} ${g}$`
          : `$${inv}^{${g}} = ${b}^{-(${g})}$ 이고 밑 $${b}$ 가 $1$ 보다 크므로 $x^{2} ${op1} -(${g})$`,
        `정리하면 $${quad} ${strict ? "<" : "\\le"} 0$, 즉 $(${texShift(m)})(${texShift(n)}) ${strict ? "<" : "\\le"} 0$`,
        `$${m} ${strict ? "<" : "\\le"} x ${strict ? "<" : "\\le"} ${n}$ 이므로 정수 $x$ 는 $${strict ? m + 1 : m}, ${strict ? m + 2 : m + 1}, \\cdots, ${strict ? n - 1 : n}$ 의 $${ans}$ 개`
      ),
      score: 3,
    }
  },
  verify: ({ b, m, n, strict, form }) => {
    const p = -(m + n)
    const c = m * n
    let cnt = 0
    for (let x = -60; x <= 60; x++) {
      const L = form === 0 ? -x * x * Math.log(b) : x * x * Math.log(b)
      const R = form === 0 ? (p * x + c) * Math.log(b) : -(p * x + c) * Math.log(b)
      const d = L - R
      const eps = 1e-9
      if (form === 0) {
        if (strict ? d > eps : d > -eps) cnt++
      } else if (strict ? d < -eps : d < eps) cnt++
    }
    return cnt
  },
}

/** 로그부등식의 정수해 개수 */
const logIneq: SuTemplate<{ b: number; a: number; i: number; j: number; ge: boolean; half: boolean }> = {
  id: "exp-log-ineq-count",
  subject: "대수",
  unit: U,
  standard: "12대수01-08",
  level: 2,
  count: 70,
  params: (r) => {
    const b = r.pick([2, 3])
    const i = r.int(0, 3)
    const j = r.int(i + 1, b === 2 ? 6 : 4)
    if (b ** i + b ** j > 90) return null
    const a = r.int(-6, 8)
    return { b, a, i, j, ge: r.chance(0.6), half: r.chance(0.35) }
  },
  build: ({ b, a, i, j, ge, half }) => {
    const y1 = b ** i
    const y2 = b ** j
    const L = y1 + y2
    const c = a + L
    const k = i + j
    const op = ge ? "\\ge" : "\\le"
    const base = half ? `\\frac{1}{${b}}` : String(b)
    const shownOp = half ? (ge ? "\\le" : "\\ge") : op
    const rhs = half ? String(-k) : String(k)
    const ans = ge ? y2 - y1 + 1 : 2 * (y1 - 1) + 2
    // ge: y1 ≤ x−a ≤ y2,  le: 0 < x−a ≤ y1 또는 y2 ≤ x−a < L
    const lo = a + y1
    const hi = a + y2
    return {
      text: `부등식 $\\log_{${base}}(${texShift(a)}) + \\log_{${base}}(${c} - x) ${shownOp} ${rhs}$ 을 만족시키는 정수 $x$ 의 개수를 구하시오.`,
      ...short(ans),
      solution: sol(
        `진수 조건에서 $${a} < x < ${c}$`,
        half
          ? `$\\log_{\\frac{1}{${b}}} t = -\\log_{${b}} t$ 이므로 주어진 부등식은 $\\log_{${b}}(${texShift(a)})(${c} - x) ${op} ${k}$ 와 같다.`
          : `로그의 성질에 의하여 $\\log_{${b}}(${texShift(a)})(${c} - x) ${op} ${k}$`,
        `밑이 $1$ 보다 크므로 $(${texShift(a)})(${c} - x) ${op} ${b ** k}$, 정리하면 $${texPoly([1, -(a + c), a * c + b ** k])} ${ge ? "\\le" : "\\ge"} 0$`,
        `$(${texShift(lo)})(${texShift(hi)}) ${ge ? "\\le" : "\\ge"} 0$ 이므로 ${ge ? `$${lo} \\le x \\le ${hi}$` : `$x \\le ${lo}$ 또는 $x \\ge ${hi}$`}`,
        ge
          ? `따라서 정수 $x$ 는 $${lo}$ 부터 $${hi}$ 까지 $${ans}$ 개`
          : `진수 조건과 함께 $${a} < x \\le ${lo}$ 또는 $${hi} \\le x < ${c}$ 이므로 정수 $x$ 는 $${y1} + ${y1} = ${ans}$ 개`
      ),
      score: 3,
    }
  },
  verify: ({ b, a, i, j, ge, half }) => {
    const c = a + b ** i + b ** j
    const k = i + j
    const B = half ? 1 / b : b
    let cnt = 0
    for (let x = a + 1; x < c; x++) {
      const v = lg(x - a, B) + lg(c - x, B)
      const rhs = half ? -k : k
      const d = v - rhs
      const shownGe = half ? !ge : ge
      if (shownGe ? d >= -1e-9 : d <= 1e-9) cnt++
    }
    return cnt
  },
}

/** n제곱근이 자연수가 되는 n 의 개수 */
const rootNatural: SuTemplate<{ c: number; e: number; M: number; m: number }> = {
  id: "exp-root-natural-count",
  subject: "대수",
  unit: U,
  standard: "12대수01-02",
  level: 2,
  count: 60,
  params: (r) => {
    const c = r.pick([2, 3, 5, 7])
    const eMax = { 2: 96, 3: 60, 5: 42, 7: 34 }[c]!
    const e = r.pick([12, 18, 20, 24, 30, 36, 40, 42, 48, 60, 72, 84, 90, 96].filter((x) => x <= eMax))
    const m = r.pick([1, 1, 2, 3])
    if (e % m !== 0) return null
    const M = r.int(6, Math.min(40, e))
    let cnt = 0
    for (let n = 2; n <= M; n++) if (e % (m * n) === 0) cnt++
    if (cnt < 1) return null
    return { c, e, M, m }
  },
  build: ({ c, e, M, m }) => {
    const ns: number[] = []
    for (let n = 2; n <= M; n++) if (e % (m * n) === 0) ns.push(n)
    const expr = m === 1 ? `\\sqrt[n]{${c}^{${e}}}` : `\\sqrt[n]{${rootTex(m, `${c}^{${e}}`)}}`
    return {
      text: `$2$ 이상 $${M}$ 이하의 자연수 $n$ 에 대하여 $${expr}$ 의 값이 자연수가 되도록 하는 $n$ 의 개수를 구하시오.`,
      ...short(ns.length),
      solution: sol(
        m === 1 ? `$\\sqrt[n]{${c}^{${e}}} = ${c}^{\\frac{${e}}{n}}$ 이다.` : `$${expr} = \\left(${c}^{\\frac{${e}}{${m}}}\\right)^{\\frac{1}{n}} = ${c}^{\\frac{${e / m}}{n}}$ 이다.`,
        `$${c}$ 는 소수이므로 이 값이 자연수가 되려면 $\\frac{${e / m}}{n}$ 이 자연수, 즉 $n$ 이 $${e / m}$ 의 약수여야 한다.`,
        `$2 \\le n \\le ${M}$ 인 $${e / m}$ 의 약수는 $${ns.join(", ")}$ 이므로 구하는 개수는 $${ns.length}$`
      ),
      score: 3,
    }
  },
  // 후보 y 를 잡아 BigInt 로 yⁿ (또는 y^{mn}) = cᵉ 인지 직접 확인
  verify: ({ c, e, M, m }) => {
    const target = BigInt(c) ** BigInt(e)
    let cnt = 0
    for (let n = 2; n <= M; n++) {
      const y = Math.round(Math.pow(c, e / (m * n)))
      for (const z of [y - 1, y, y + 1]) if (z > 0 && BigInt(z) ** BigInt(m * n) === target) cnt++
    }
    return cnt
  },
}

/** 상용로그 실생활: 공식이 주어진 측정값 */
const CONTEXTS = [
  { who: "어느 금속 막대를 가열하는 실험에서 가열을 시작한 지", unit: "분", v: "T", t: "t", what: "측정값" },
  { who: "어느 식물을 키우는 실험에서 씨앗을 심은 지", unit: "일", v: "H", t: "t", what: "성장 지수" },
  { who: "어느 호수의 수질을 관찰하는 실험에서 관찰을 시작한 지", unit: "시간", v: "Q", t: "t", what: "수질 지수" },
  { who: "어느 저장 장치의 성능을 측정하는 실험에서 사용을 시작한 지", unit: "일", v: "P", t: "t", what: "성능 지수" },
] as const
const commonLog: SuTemplate<{ ci: number; A: number; B: number; h: number; i: number; j: number; l: number; mode: "val" | "time" }> = {
  id: "exp-common-log-life",
  subject: "대수",
  unit: U,
  standard: "12대수01-05",
  level: 2,
  count: 50,
  params: (r) => {
    const h = r.pick([1, 10])
    const lo = h === 1 ? 0 : 1
    const pool = [0, 1, 2, 3].filter((x) => x >= lo)
    const [i, j, l] = r.shuffle([...pool]).slice(0, 3)
    if (l === undefined || i > j) return null
    const A = r.int(10, 90)
    const B = r.pick([-12, -9, -8, -6, -5, -4, -3, 3, 4, 5, 6, 8, 10, 12])
    const mode = r.chance(0.5) ? "val" : "time"
    const val = A + B * l
    if (val < 1 || val > 999) return null
    if (mode === "time" && 10 ** l - h < 1) return null
    return { ci: r.int(0, CONTEXTS.length - 1), A, B, h, i, j, l, mode }
  },
  build: ({ ci, A, B, h, i, j, l, mode }) => {
    const C = CONTEXTS[ci]
    const t1 = 10 ** i - h
    const t2 = 10 ** j - h
    const t3 = 10 ** l - h
    const v1 = A + B * i
    const v2 = A + B * j
    const v3 = A + B * l
    const formula = `${C.v} = a + b\\log(${C.t} + ${h})`
    const ans = mode === "val" ? v3 : t3
    return {
      text: `${C.who} $${C.t}$ ${C.unit} 후의 ${C.what} $${C.v}$ 는\n$${formula}$\n를 만족시킨다고 한다. $${C.t} = ${t1}$ 일 때 $${C.v} = ${v1}$ 이고, $${C.t} = ${t2}$ 일 때 $${C.v} = ${v2}$ 이었다. ${
        mode === "val" ? `$${C.t} = ${t3}$ 일 때 $${C.v}$ 의 값을 구하시오.` : `$${C.v} = ${v3}$ 일 때 $${C.t}$ 의 값을 구하시오.`
      } (단, $a$, $b$ 는 상수이다.)`,
      ...short(ans),
      solution: sol(
        `$${C.t} = ${t1}$ 일 때 $\\log ${10 ** i} = ${i}$, $${C.t} = ${t2}$ 일 때 $\\log ${10 ** j} = ${j}$ 이므로`,
        `$${v1} = a${i === 0 ? "" : ` + ${i === 1 ? "" : i}b`}$, $${v2} = a + ${j === 1 ? "" : j}b$${i === 0 ? ` 에서 $a = ${A}$, $b = ${B}$` : ` 에서 두 식을 빼면 $${j - i}b = ${v2 - v1}$, 즉 $b = ${B}$, $a = ${A}$`}`,
        mode === "val"
          ? `$${C.t} = ${t3}$ 일 때 $\\log ${10 ** l} = ${l}$ 이므로 $${C.v} = ${A} ${signed(B)} \\times ${l} = ${v3}$`
          : `$${v3} = ${A} ${signed(B)}\\log(${C.t} + ${h})$ 에서 $\\log(${C.t} + ${h}) = ${l}$, 즉 $${C.t} + ${h} = ${10 ** l}$ 이므로 $${C.t} = ${t3}$`
      ),
      score: 3,
    }
  },
  verify: ({ A, B, h, i, j, l, mode }) => {
    const t1 = 10 ** i - h
    const t2 = 10 ** j - h
    const x1 = Math.log10(t1 + h)
    const x2 = Math.log10(t2 + h)
    const v1 = A + B * i
    const v2 = A + B * j
    const b = (v2 - v1) / (x2 - x1)
    const a = v1 - b * x1
    if (mode === "val") return a + b * Math.log10(10 ** l - h + h)
    const target = A + B * l
    const rs = roots((t) => a + b * Math.log10(t + h) - target, 0, 1500, 30000)
    return rs.length === 1 ? rs[0] : NaN
  },
}

// ═════════ 3단계 ═════════

/** log_a b 가 자연수인 순서쌍 개수 */
const logPairs: SuTemplate<{ M: number; N: number }> = {
  id: "exp-log-natural-pairs",
  subject: "대수",
  unit: U,
  standard: "12대수01-04",
  level: 3,
  count: 60,
  params: (r) => {
    const M = r.int(5, 30)
    const N = r.int(Math.max(M, 16), 260)
    return { M, N }
  },
  build: ({ M, N }) => {
    // a 마다 a^k ≤ N 인 k 의 개수
    const cnt = (a: number) => {
      let k = 0
      let p = a
      while (p <= N) {
        k++
        p *= a
      }
      return k
    }
    const groups: { lo: number; hi: number; k: number }[] = []
    for (let a = 2; a <= M; a++) {
      const k = cnt(a)
      const g = groups[groups.length - 1]
      if (g && g.k === k) g.hi = a
      else groups.push({ lo: a, hi: a, k })
    }
    const ans = groups.reduce((s, g) => s + (g.hi - g.lo + 1) * g.k, 0)
    const desc = groups.map((g) => {
      const range = g.lo === g.hi ? `$a = ${g.lo}$` : `$${g.lo} \\le a \\le ${g.hi}$`
      return `${range} 일 때 $a^{${g.k}} \\le ${N} < a^{${g.k + 1}}$ 이므로 $b$ 는 $${g.k}$ 개씩, 합 $${(g.hi - g.lo + 1) * g.k}$`
    })
    return {
      text: `$2 \\le a \\le ${M}$, $2 \\le b \\le ${N}$ 인 두 자연수 $a$, $b$ 에 대하여 $\\log_{a} b$ 의 값이 자연수가 되도록 하는 순서쌍 $(a, b)$ 의 개수를 구하시오.`,
      ...short(ans),
      solution: sol(
        `$\\log_{a} b = k$ ($k$ 는 자연수) 이면 $b = a^{k}$ 이므로, 각 $a$ 에 대하여 $a^{k} \\le ${N}$ 인 자연수 $k$ 의 개수를 센다.`,
        ...desc,
        `따라서 구하는 순서쌍의 개수는 $${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ M, N }) => {
    let c = 0
    for (let a = 2; a <= M; a++)
      for (let b = 2; b <= N; b++) {
        const v = lg(b, a)
        if (nearInt(v, 1e-9) && Math.round(v) >= 1) c++
      }
    return c
  },
}

/** 역함수 관계인 두 곡선과 직선 y = −x + k */
const inverseLine: SuTemplate<{ v: 0 | 1; b: number; c: number; p: number }> = {
  id: "exp-inverse-line",
  subject: "대수",
  unit: U,
  standard: "12대수01-06",
  level: 3,
  count: 60,
  params: (r) => {
    const v = r.chance(0.5) ? 0 : 1
    const b = r.pick([2, 3])
    const c = r.int(-3, 3)
    const p = r.int(-3, 6)
    // v=0: A = (p, b^{p-c}),  v=1: A = (p, b^p + c)
    const e = v === 0 ? p - c : p
    if (e < 0 || e > (b === 2 ? 5 : 3)) return null
    const y = v === 0 ? b ** (p - c) : b ** p + c
    if (y === p) return null
    const k = p + y
    if (k === 0) return null
    const ans = 2 * (y - p) ** 2
    if (ans > 999) return null
    if (v === 1 && y - c <= 0) return null
    return { v, b, c, p }
  },
  build: ({ v, b, c, p }) => {
    const y = v === 0 ? b ** (p - c) : b ** p + c
    const k = p + y
    const f = v === 0 ? `y = ${b}^{${texShift(c)}}` : `y = ${b}^{x}${c === 0 ? "" : ` ${signed(c)}`}`
    const g = v === 0 ? `y = \\log_{${b}} x${c === 0 ? "" : ` ${signed(c)}`}` : `y = \\log_{${b}}(${texShift(c)})`
    const ans = 2 * (y - p) ** 2
    return {
      text: `직선 $y = -x ${signed(k)}$ 가 두 곡선 $${f}$, $${g}$ 와 만나는 점을 각각 $\\mathrm{A}$, $\\mathrm{B}$ 라 할 때, $\\overline{\\mathrm{AB}}^{2}$ 의 값을 구하시오.`,
      ...short(ans),
      solution: sol(
        `$${f}$ 에서 $x$ 와 $y$ 를 바꾸어 정리하면 $${g}$ 이므로 두 함수는 서로 역함수이고, 두 그래프는 직선 $y = x$ 에 대하여 대칭이다.`,
        `직선 $y = -x ${signed(k)}$ 는 직선 $y = x$ 와 수직이므로 점 $\\mathrm{A}(s, t)$ 에 대하여 $\\mathrm{B}(t, s)$ 이다.`,
        `점 $\\mathrm{A}$ 는 $${f}$ 위에 있고 $s + t = ${k}$ 이므로 $s + ${v === 0 ? `${b}^{${texShift(c, "s")}}` : `${b}^{s}${c === 0 ? "" : ` ${signed(c)}`}`} = ${k}$ 이다. 좌변은 $s$ 에 대하여 증가하므로 이 방정식의 해는 $s = ${p}$ 하나뿐이다.`,
        `따라서 $\\mathrm{A}(${p}, ${y})$, $\\mathrm{B}(${y}, ${p})$ 이고 $\\overline{\\mathrm{AB}}^{2} = (${y} - ${p < 0 ? `(${p})` : p})^{2} \\times 2 = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ v, b, c, p }) => {
    const y = v === 0 ? b ** (p - c) : b ** p + c
    const k = p + y
    const f = (x: number) => (v === 0 ? Math.pow(b, x - c) : Math.pow(b, x) + c)
    const g = (x: number) => (v === 0 ? lg(x, b) + c : lg(x - c, b))
    const ra = roots((x) => f(x) + x - k, -20, 40, 30000)
    const gx0 = v === 0 ? 1e-9 : c + 1e-9
    const rb = roots((x) => g(x) + x - k, gx0, 80, 40000)
    if (ra.length !== 1 || rb.length !== 1) return NaN
    const A = [ra[0], f(ra[0])]
    const B = [rb[0], g(rb[0])]
    return (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2
  },
}

/** 치환을 이용한 최대·최소 (정의역 제한) */
const maxMinSub: SuTemplate<{ v: 0 | 1; b: number; p: number; lo: number; hi: number; M: number }> = {
  id: "exp-maxmin-sub",
  subject: "대수",
  unit: U,
  standard: "12대수01-06",
  level: 3,
  count: 70,
  params: (r) => {
    const v = r.chance(0.5) ? 0 : 1
    const b = r.pick([2, 3])
    if (v === 0) {
      // t = log_b x ∈ [lo, hi], g(t) = t^2 + p t + a, p 짝수
      const lo = -r.int(0, 3)
      const hi = r.int(1, 4)
      const p = 2 * r.int(-4, 4)
      const M = r.int(-5, 20)
      return { v, b, p, lo, hi, M }
    }
    // t = b^x ∈ [b^lo, b^hi], g(t) = t^2 - 2s t + a  (p = s)
    const lo = r.int(0, 1)
    const hi = r.int(lo + 1, b === 2 ? 4 : 2)
    const s = r.int(1, b ** hi + 2)
    const M = r.int(-5, 40)
    return { v, b, p: s, lo, hi, M }
  },
  build: ({ v, b, p, lo, hi, M }, r) => {
    const g = (t: number) => (v === 0 ? t * t + p * t : t * t - 2 * p * t)
    const tl = v === 0 ? lo : b ** lo
    const th = v === 0 ? hi : b ** hi
    const t0 = v === 0 ? -p / 2 : p
    const maxEnd = g(tl) >= g(th) ? tl : th
    const max0 = g(maxEnd)
    const inside = t0 >= tl && t0 <= th
    const minT = inside ? t0 : g(tl) < g(th) ? tl : th
    const min0 = g(minT)
    const a = M - max0
    const ans = min0 + a
    const endMin = Math.min(g(tl), g(th)) + a
    const fx = v === 0 ? `f(x) = (\\log_{${b}} x)^{2} ${p === 0 ? "" : `${signed(p)}\\log_{${b}} x `}+ a` : `f(x) = ${b * b}^{x} - ${2 * p} \\times ${b}^{x} + a`
    const dom = v === 0 ? `${powTex(b, lo)} \\le x \\le ${powTex(b, hi)}` : `${lo} \\le x \\le ${hi}`
    const tName = v === 0 ? `\\log_{${b}} x` : `${b}^{x}`
    const gTex = `${texPoly(v === 0 ? [1, p, 0] : [1, -2 * p, 0], "t")} + a`
    const h0 = v === 0 ? p / 2 : -p
    const vertexForm = h0 === 0 ? `t^{2} + a` : `(t ${signed(h0)})^{2} ${signed(-(h0 * h0))} + a`
    return {
      text: `$${dom}$ 에서 함수 $${fx}$ 의 최댓값이 $${M}$ 일 때, $f(x)$ 의 최솟값은? (단, $a$ 는 상수이다.)`,
      ...mc(r, intChoice(ans), ints(endMin, a, ans + 1, ans - 1, min0 - a, M - ans)),
      solution: sol(
        `$${tName} = t$ 로 놓으면 $${dom}$ 에서 $${tl} \\le t \\le ${th}$ 이고 $f(x) = ${gTex} = ${vertexForm}$`,
        inside ? `꼭짓점의 $t$ 좌표 $${t0}$ 가 범위 안에 있으므로 최솟값은 $t = ${t0}$ 일 때, 최댓값은 꼭짓점에서 더 먼 끝 $t = ${maxEnd}$ 일 때이다.` : `꼭짓점의 $t$ 좌표 $${t0}$ 가 범위 밖에 있으므로 $t$ 의 범위의 양 끝에서 최댓값과 최솟값을 갖는다. 최댓값은 $t = ${maxEnd}$, 최솟값은 $t = ${minT}$ 일 때이다.`,
        `최댓값은 $${max0} + a = ${M}$ 이므로 $a = ${a}$`,
        `따라서 최솟값은 $${min0} + a = ${min0} ${signed(a)} = ${ans}$`
      ),
      score: 4,
    }
  },
  // a = 0 일 때의 최대·최소를 x 에 대해 수치로 구한다
  verify: ({ v, b, p, lo, hi, M }) => {
    const f0 = (x: number) => {
      if (v === 0) {
        const t = lg(x, b)
        return t * t + p * t
      }
      return Math.pow(b * b, x) - 2 * p * Math.pow(b, x)
    }
    const [x1, x2] = v === 0 ? [Math.pow(b, lo), Math.pow(b, hi)] : [lo, hi]
    const e = extrema(f0, x1, x2, 6000)
    return e.min + (M - e.max)
  },
}

/** (p^x − p^a)(log_q x − n) ≤ 0 의 정수해 개수 조건 */
const ineqParam: SuTemplate<{ p: number; qb: number; n: number; N: number; strict: boolean }> = {
  id: "exp-ineq-param",
  subject: "대수",
  unit: U,
  standard: "12대수01-08",
  level: 3,
  count: 60,
  params: (r) => {
    const p = r.pick([2, 3, 5])
    const qb = r.pick([2, 3])
    const n = r.int(1, qb === 2 ? 5 : 3)
    const N = r.int(2, 30)
    const strict = r.chance(0.4)
    const Qv = qb ** n
    const as = strict ? [Qv - N - 1, Qv + N + 1] : [Qv - N + 1, Qv + N - 1]
    const s = as.filter((a) => a >= 1).reduce((x, y) => x + y, 0)
    if (s < 1 || s > 999) return null
    return { p, qb, n, N, strict }
  },
  build: ({ p, qb, n, N, strict }) => {
    const Qv = qb ** n
    const op = strict ? "<" : "\\le"
    const d = strict ? N + 1 : N - 1
    const cand = [Qv - d, Qv + d]
    const ok = cand.filter((a) => a >= 1)
    const ans = ok.reduce((x, y) => x + y, 0)
    return {
      text: `자연수 $a$ 에 대하여 $x$ 에 대한 부등식\n$(${p}^{x} - ${p}^{a})(\\log_{${qb}} x - ${n}) ${op} 0$\n을 만족시키는 정수 $x$ 의 개수가 $${N}$ 이 되도록 하는 모든 $a$ 의 값의 합을 구하시오.`,
      ...short(ans),
      solution: sol(
        `진수 조건에서 $x > 0$ 이다. $${p}^{x} - ${p}^{a}$ 는 $x > a$ 일 때 양수, $x < a$ 일 때 음수이고, $\\log_{${qb}} x - ${n}$ 은 $x > ${Qv}$ 일 때 양수, $0 < x < ${Qv}$ 일 때 음수이다.`,
        `${strict ? "두 식의 부호가 서로 달라야" : "두 식의 부호가 서로 다르거나 어느 하나가 $0$ 이어야"} 하므로 해는 $a$ 와 $${Qv}$ 사이의 수이다 (${strict ? "양 끝 제외" : "양 끝 포함"}). $a = ${Qv}$ 이면 ${strict ? "해가 없다" : "해는 $x = " + Qv + "$ 하나뿐이다"}.`,
        strict
          ? `$a < ${Qv}$ 이면 정수해는 $${Qv} - a - 1$ 개, $a > ${Qv}$ 이면 $a - ${Qv} - 1$ 개이므로 $a = ${Qv} \\pm ${d}$`
          : `$a < ${Qv}$ 이면 정수해는 $${Qv} - a + 1$ 개, $a > ${Qv}$ 이면 $a - ${Qv} + 1$ 개이므로 $a = ${Qv} \\pm ${d}$`,
        ok.length === 2 ? `두 값 $${cand[0]}$, $${cand[1]}$ 모두 자연수이므로 합은 $${ans}$` : `$${cand[0]} < 1$ 이므로 $a = ${cand[1]}$ 뿐이고, 답은 $${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ p, qb, n, N, strict }) => {
    let s = 0
    for (let a = 1; a <= 150; a++) {
      let c = 0
      for (let x = 1; x <= 300; x++) {
        const f1 = x * Math.log(p) - a * Math.log(p) // p^x − p^a 와 부호가 같다
        let f2 = lg(x, qb) - n
        if (Math.abs(f2) < 1e-9) f2 = 0
        const s1 = Math.sign(f1)
        const s2 = Math.sign(f2)
        const prod = s1 * s2
        if (strict ? prod < 0 : prod <= 0) c++
      }
      if (c === N) s += a
    }
    return s
  },
}

/** a^x = b^y = k, m/x + n/y = t 일 때 k */
const expSystem: SuTemplate<{ a: number; b: number; i: number; j: number; s: number }> = {
  id: "exp-system-k",
  subject: "대수",
  unit: U,
  standard: "12대수01-04",
  level: 3,
  count: 70,
  params: (r) => {
    const [a, b] = r.shuffle([2, 3, 5, 6, 7, 10]).slice(0, 2)
    const i = r.int(1, 3)
    const j = r.int(1, 3)
    const k = a ** i * b ** j
    if (k > 999) return null
    return { a, b, i, j, s: r.pick([1, 1, 2, 3]) }
  },
  build: ({ a, b, i, j, s }) => {
    const k = a ** i * b ** j
    const m = i * s
    const n = j * s
    return {
      text: `세 실수 $x$, $y$, $k$ 가 $${a}^{x} = ${b}^{y} = k$, $\\frac{${m}}{x} + \\frac{${n}}{y} = ${s}$ 를 만족시킬 때, $k$ 의 값을 구하시오. (단, $k > 1$)`,
      ...short(k),
      solution: sol(
        `$${a}^{x} = k$ 에서 $x = \\log_{${a}} k$ 이므로 $\\frac{1}{x} = \\log_{k} ${a}$, 같은 방법으로 $\\frac{1}{y} = \\log_{k} ${b}$`,
        `$\\frac{${m}}{x} + \\frac{${n}}{y} = ${m}\\log_{k} ${a} + ${n}\\log_{k} ${b} = \\log_{k} (${a}^{${m}} \\times ${b}^{${n}}) = ${s}$`,
        `따라서 $k^{${s}} = ${a}^{${m}} \\times ${b}^{${n}} = (${a}^{${i}} \\times ${b}^{${j}})^{${s}}$ 이고 $k > 1$ 이므로 $k = ${k}$`
      ),
      score: 3,
    }
  },
  verify: ({ a, b, i, j, s }) => {
    const m = i * s
    const n = j * s
    const rs = roots((k) => (m * Math.log(a) + n * Math.log(b)) / Math.log(k) - s, 1.001, 1500, 60000)
    return rs.length === 1 ? rs[0] : NaN
  },
}

// ═════════ 4단계 ═════════

/** n제곱근 중 실수인 것의 개수 f(n) 의 합이 S 가 되는 k */
const rootCountK: SuTemplate<{ a: number; M: number; S: number }> = {
  id: "exp-root-count-k",
  subject: "대수",
  unit: U,
  standard: "12대수01-01",
  level: 4,
  count: 60,
  params: (r) => {
    const M = r.int(7, 14)
    const a = r.int(2, M - 1)
    const F = (k: number) => rootCountSum(a, k, M)
    const big = F(M + 50)
    const vals = new Map<number, number[]>()
    for (let k = 1; k <= M + 4; k++) vals.set(F(k), [...(vals.get(F(k)) ?? []), k])
    const options = [...vals.entries()].filter(([S]) => S !== big)
    if (!options.length) return null
    const [S, ks] = r.pick(options)
    const sum = ks.reduce((x, y) => x + y, 0)
    if (sum > 999 || ks.some((k) => k > M)) return null
    return { a, M, S }
  },
  build: ({ a, M, S }) => {
    const odd: number[] = []
    for (let n = 3; n <= M; n += 2) odd.push(n)
    const evens: number[] = []
    for (let n = 2; n <= M; n += 2) evens.push(n)
    const need = S - odd.length
    const ks: number[] = []
    const rows: string[] = []
    for (let k = 1; k <= M + 1; k++) {
      const e = evens.reduce((s, n) => {
        const c = (n - a) * (n - k)
        return s + (c > 0 ? 2 : c === 0 ? 1 : 0)
      }, 0)
      if (e === need) ks.push(k)
      rows.push(`$k = ${k}${k === M + 1 ? `$ 이상` : "$"}: $${e}$`)
    }
    const ans = ks.reduce((x, y) => x + y, 0)
    return {
      text: `자연수 $k$ 와 $2$ 이상의 자연수 $n$ 에 대하여 $(n - ${a})(n - k)$ 의 $n$ 제곱근 중 실수인 것의 개수를 $f(n)$ 이라 하자.\n$\\sum_{n=2}^{${M}} f(n) = ${S}$\n를 만족시키는 모든 $k$ 의 값의 합을 구하시오.`,
      ...short(ans),
      solution: sol(
        `실수 $c$ 의 $n$ 제곱근 중 실수인 것은 $n$ 이 홀수이면 항상 $1$ 개이고, $n$ 이 짝수이면 $c > 0$ 일 때 $2$ 개, $c = 0$ 일 때 $1$ 개, $c < 0$ 일 때 $0$ 개이다.`,
        `$2 \\le n \\le ${M}$ 인 홀수 $n$ 은 $${odd.length}$ 개이므로 홀수에서 $f(n)$ 의 합은 $${odd.length}$ 이고, 짝수 $n = ${evens.join(", ")}$ 에서의 합이 $${S} - ${odd.length} = ${need}$ 이어야 한다.`,
        `짝수 $n$ 에서 $(n - ${a})(n - k)$ 의 부호는 $n$ 이 $${a}$ 와 $k$ 사이에 있으면 음, 바깥에 있으면 양, $n = ${a}$ 또는 $n = k$ 이면 $0$ 이다.`,
        `$k$ 의 값에 따른 짝수 부분의 합: ${rows.join(", ")} (단, $k > ${M}$ 이면 모두 같다)`,
        `합이 $${need}$ 인 $k$ 는 $${ks.join(", ")}$ 이므로 구하는 값은 $${ans}$`
      ),
      score: 4,
    }
  },
  // 각 n 에 대해 x = ±|c|^{1/n} 을 실제로 n 제곱해 보는 방식으로 개수를 센다
  verify: ({ a, M, S }) => {
    let s = 0
    for (let k = 1; k <= 80; k++) {
      let tot = 0
      for (let n = 2; n <= M; n++) {
        const c = (n - a) * (n - k)
        if (c === 0) {
          tot += 1
          continue
        }
        const r0 = Math.pow(Math.abs(c), 1 / n)
        for (const x of [r0, -r0]) if (Math.abs(Math.pow(x, n) - c) < 1e-6 * Math.abs(c)) tot++
      }
      if (tot === S) s += k
    }
    return s
  },
}
function rootCountSum(a: number, k: number, M: number) {
  let s = 0
  for (let n = 2; n <= M; n++) {
    if (n % 2) s += 1
    else {
      const c = (n - a) * (n - k)
      s += c > 0 ? 2 : c === 0 ? 1 : 0
    }
  }
  return s
}

/** 로그곡선·직선·x축으로 둘러싸인 영역의 격자점 개수로 k 결정 */
const lattice: SuTemplate<{ b: number; m: number; k: number }> = {
  id: "exp-log-lattice",
  subject: "대수",
  unit: U,
  standard: "12대수01-06",
  level: 4,
  count: 55,
  params: (r) => {
    const b = r.pick([2, 3])
    const m = r.pick([1, 2])
    const k = r.int(4, 60)
    const S = latticeCount(b, m, k)
    if (S > 999) return null
    return { b, m, k }
  },
  build: ({ b, m, k }) => {
    const S = latticeCount(b, m, k)
    const line = m === 1 ? `y = -x + k` : `x + ${m}y = k`
    const rowsK: string[] = []
    for (let y = 0; b ** y <= k - m * y; y++) rowsK.push(`$y = ${y}$: $${k - m * y - b ** y + 1}$ 개`)
    const Sprev = latticeCount(b, m, k - 1)
    return {
      text: `$k > 1$ 인 자연수 $k$ 에 대하여 곡선 $y = \\log_{${b}} x$ 와 직선 $${line}$ 및 $x$ 축으로 둘러싸인 부분의 내부 또는 경계에 있는 점 중 $x$ 좌표와 $y$ 좌표가 모두 정수인 점의 개수를 $f(k)$ 라 하자. $f(k) = ${S}$ 를 만족시키는 $k$ 의 값을 구하시오.`,
      ...short(k),
      solution: sol(
        `영역은 $y \\ge 0$, $x \\ge ${b}^{y}$ (곡선의 오른쪽), $x ${m === 1 ? "+ y" : `+ ${m}y`} \\le k$ 를 만족시키는 점 전체이다.`,
        `$y = j$ ($j \\ge 0$ 인 정수) 위의 격자점은 $${b}^{j} \\le x \\le k - ${m === 1 ? "" : m}j$ 이므로 $k - ${m === 1 ? "" : m}j - ${b}^{j} + 1$ 개 (양수일 때)이다.`,
        `$k$ 가 $1$ 커지면 $y = 0$ 위의 점이 적어도 하나 늘어나므로 $f(k)$ 는 증가하고, 조건을 만족시키는 $k$ 는 하나뿐이다.`,
        `$k = ${k}$ 일 때 ${rowsK.join(", ")} 이므로 $f(${k}) = ${S}$ (참고로 $f(${k - 1}) = ${Sprev}$)`,
        `따라서 $k = ${k}$`
      ),
      score: 4,
    }
  },
  // 격자점을 직접 하나씩 검사하며 f(k) 를 늘려 간다
  verify: ({ b, m, k }) => {
    const S = latticeCount(b, m, k)
    for (let kk = 2; kk <= 300; kk++) {
      let c = 0
      for (let x = 1; x <= kk; x++) for (let y = 0; y <= kk; y++) if (y <= lg(x, b) + 1e-12 && x + m * y <= kk) c++
      if (c === S) return kk
      if (c > S) return NaN
    }
    return NaN
  },
}
function latticeCount(b: number, m: number, k: number) {
  let s = 0
  for (let y = 0; b ** y <= k - m * y; y++) s += k - m * y - b ** y + 1
  return s
}

/** ᵐ√(cⁿ) 이 자연수가 되는 순서쌍 (m, n) */
const rootPairs: SuTemplate<{ p: number; e: number; M: number; N: number; le: boolean }> = {
  id: "exp-root-pairs",
  subject: "대수",
  unit: U,
  standard: "12대수01-02",
  level: 4,
  count: 50,
  params: (r) => {
    const p = r.pick([2, 3, 5, 7])
    const e = r.pick([2, 3, 4, 6].filter((x) => p ** x <= 1000))
    const M = r.int(4, 12)
    const N = r.int(8, 30)
    const le = r.chance(0.4)
    const ans = rootPairCount(e, M, N, le)
    if (ans < 1 || ans > 999) return null
    return { p, e, M, N, le }
  },
  build: ({ p, e, M, N, le }) => {
    const c = p ** e
    const rows: string[] = []
    for (let m = 2; m <= M; m++) {
      const step = m / gcd(m, e)
      let cnt = 0
      for (let n = 2; n <= N; n++) if (n % step === 0 && (!le || m <= n)) cnt++
      rows.push(`$m = ${m}$: ${step === 1 ? "모든 $n$" : `$n$ 이 $${step}$ 의 배수`}${le ? `이고 $n \\ge ${m}$` : ""} → $${cnt}$ 개`)
    }
    const ans = rootPairCount(e, M, N, le)
    return {
      text: `$2 \\le m \\le ${M}$, $2 \\le n \\le ${N}$ 인 두 자연수 $m$, $n$ 에 대하여 $\\sqrt[m]{${c}^{n}}$ 의 값이 자연수가 되도록 하는 순서쌍 $(m, n)$ 의 개수를 구하시오.${le ? ` (단, $m \\le n$)` : ""}`,
      ...short(ans),
      solution: sol(
        `$${c} = ${p}^{${e}}$ 이므로 $\\sqrt[m]{${c}^{n}} = ${p}^{\\frac{${e}n}{m}}$ 이고, 이 값이 자연수가 되려면 $\\frac{${e}n}{m}$ 이 자연수여야 한다.`,
        `즉 $m$ 이 $${e}n$ 의 약수이어야 한다. $m$ 을 $m$ 과 $${e}$ 의 최대공약수로 나눈 수를 $m'$ 이라 하면, 이는 $n$ 이 $m'$ 의 배수인 것과 같다.`,
        ...rows,
        `따라서 구하는 순서쌍의 개수는 $${ans}$`
      ),
      score: 4,
    }
  },
  // n 마다 en 을 소인수분해해서 m 이 en 의 약수인지 직접 확인
  verify: ({ p, e, M, N, le }) => {
    const c = p ** e
    // c 를 소인수분해
    const fac = new Map<number, number>()
    let x = c
    for (let d = 2; d <= x; d++)
      while (x % d === 0) {
        fac.set(d, (fac.get(d) ?? 0) + 1)
        x /= d
      }
    let cnt = 0
    for (let n = 2; n <= N; n++)
      for (let m = 2; m <= M; m++) {
        if (le && m > n) continue
        let ok = true
        for (const v of fac.values()) if ((v * n) % m !== 0) ok = false
        if (ok) cnt++
      }
    return cnt
  },
}
function rootPairCount(e: number, M: number, N: number, le: boolean) {
  let s = 0
  for (let m = 2; m <= M; m++) {
    const step = m / gcd(m, e)
    for (let n = 2; n <= N; n++) if (n % step === 0 && (!le || m <= n)) s++
  }
  return s
}

/** log_b(x − a) ≤ log_{b²}(cx + d) 의 정수해 개수가 N 인 a 의 합 */
const logIneqParam: SuTemplate<{ b: number; c: number; d: number; N: number; form: 0 | 1 }> = {
  id: "exp-log-ineq-param",
  subject: "대수",
  unit: U,
  standard: "12대수01-08",
  level: 4,
  count: 60,
  params: (r) => {
    const b = r.pick([2, 3])
    const c = r.int(1, 3)
    const d = r.int(0, 10)
    const N = r.int(2, 9)
    const as = logIneqAs(c, d, N)
    if (!as.length) return null
    const s = as.reduce((x, y) => x + y, 0)
    if (s > 999) return null
    return { b, c, d, N, form: r.chance(0.5) ? 0 : 1 }
  },
  build: ({ b, c, d, N, form }) => {
    const as = logIneqAs(c, d, N)
    const ans = as.reduce((x, y) => x + y, 0)
    const lin = texPoly([c, d])
    const lhs = form === 0 ? `\\log_{${b}}(x - a) \\le \\log_{${b * b}}(${lin})` : `2\\log_{${b}}(x - a) \\le \\log_{${b}}(${lin})`
    const lo = N * (N - c)
    const hi = (N + 1) * (N + 1 - c) - 1
    return {
      text: `자연수 $a$ 에 대하여 $x$ 에 대한 부등식\n$${lhs}$\n를 만족시키는 정수 $x$ 의 개수가 $${N}$ 이 되도록 하는 모든 $a$ 의 값의 합을 구하시오.`,
      ...short(ans),
      solution: sol(
        form === 0
          ? `$\\log_{${b * b}}(${lin}) = \\frac{1}{2}\\log_{${b}}(${lin})$ 이므로 부등식은 $2\\log_{${b}}(x - a) \\le \\log_{${b}}(${lin})$ 과 같다.`
          : `진수 조건에서 $x > a$ 이고, 이때 $${lin} > 0$ 도 성립한다.`,
        `$x > a$ 에서 $(x - a)^{2} \\le ${lin}$. $x - a = u$ ($u$ 는 양의 정수) 로 놓으면 $u^{2} ${c === 1 ? "- u" : `- ${c}u`} \\le ${c === 1 ? "a" : `${c}a`}${d ? ` + ${d}` : ""}$`,
        `$u^{2} ${c === 1 ? "- u" : `- ${c}u`}$ 는 $u \\ge 1$ 에서 증가하므로 정수해가 $${N}$ 개이려면 $u = ${N}$ 은 만족하고 $u = ${N + 1}$ 은 만족하지 않아야 한다.`,
        `$${lo} \\le ${c === 1 ? "a" : `${c}a`}${d ? ` + ${d}` : ""} \\le ${hi}$ 이므로 자연수 $a$ 는 $${as.join(", ")}$`,
        `따라서 구하는 합은 $${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ b, c, d, N, form }) => {
    let s = 0
    for (let a = 1; a <= 400; a++) {
      let cnt = 0
      for (let x = a + 1; x <= a + 200; x++) {
        const L = form === 0 ? lg(x - a, b) : 2 * lg(x - a, b)
        const R = form === 0 ? lg(c * x + d, b * b) : lg(c * x + d, b)
        if (L <= R + 1e-12) cnt++
      }
      if (cnt === N) s += a
    }
    return s
  },
}
function logIneqAs(c: number, d: number, N: number) {
  const lo = N * (N - c)
  const hi = (N + 1) * (N + 1 - c) - 1
  const out: number[] = []
  for (let a = 1; c * a + d <= hi; a++) if (c * a + d >= lo) out.push(a)
  return out
}

export const EXP: SuTemplate[] = [
  expLaw,
  logChain,
  logCombo,
  rootProd,
  graphShift,
  expQuad,
  logEq,
  expIneq,
  logIneq,
  rootNatural,
  commonLog,
  logPairs,
  inverseLine,
  maxMinSub,
  ineqParam,
  expSystem,
  rootCountK,
  lattice,
  rootPairs,
  logIneqParam,
]
