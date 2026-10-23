// 미적분Ⅰ · 미분 (12미적Ⅰ-02-01 ~ 10)
import { deriv, isShortOk, texSqrt, limitAt, q, roots, short, signed, texPoly, texShift, paren, term } from "../kit"
import type { SuTemplate } from "../types"
import { answerI, ask, cases, countRoots, gridCount, gridVals, cx, dcs, ev, fac, facs, head, lines, mcI, mcQ, nz, only, solveLinear, times, U_DIFF } from "./helpers"

const U = U_DIFF
const fx = (cs: number[], x: number | string) => texPoly(cs).replace(/x/g, typeof x === "number" ? `(${x})` : x)

// ───────────────────────── 1단계 ─────────────────────────

/** 미분계수 f'(k) */
const dValue: SuTemplate<{ f: number[]; k: number }> = {
  ...head("d1-dval", U, "12미적Ⅰ-02-03", 1, 60),
  params: (r) => {
    const f = [nz(r, -4, 4), r.int(-6, 6), r.int(-9, 9), r.int(-9, 9)]
    return { f, k: nz(r, -3, 3) }
  },
  build: ({ f, k }, r) => {
    const d = dcs(f)
    const ans = ev(d, k)
    return {
      text: `함수 $f(x) = ${texPoly(f)}$ 에 대하여 $f'(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [ev(f, k), ev([3 * f[0], f[1], f[2]], k), ev([f[0], f[1], f[2]], k), ans + f[3], ans + 1, ans - 1]),
      solution: lines(`$f'(x) = ${texPoly(d)}$ 이므로`, `$f'(${k}) = ${fx(d, k)} = ${ans}$`),
      score: 2,
    }
  },
  verify: ({ f, k }) => deriv((x) => ev(f, x), k),
}

/** 곱의 미분법 */
const prodRule: SuTemplate<{ A: number[]; B: number[]; k: number }> = {
  ...head("d1-prod", U, "12미적Ⅰ-02-03", 1, 60),
  params: (r) => {
    const A = r.chance(0.5) ? [1, r.int(-4, 4), r.int(-5, 5)] : [1, 0, 0, r.int(-5, 5)]
    const B = [nz(r, -3, 3), nz(r, -5, 5)]
    if (A[A.length - 1] === 0) return null
    return { A, B, k: r.int(-2, 3) }
  },
  build: ({ A, B, k }, r) => {
    const dA = dcs(A)
    const ans = ev(dA, k) * ev(B, k) + ev(A, k) * B[0]
    return {
      text: `함수 $f(x) = (${texPoly(A)})(${texPoly(B)})$ 에 대하여 $f'(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [ev(dA, k) * B[0], ev(dA, k) * ev(B, k), ev(A, k) * B[0], ev(dA, k) * ev(B, k) - ev(A, k) * B[0], ans + 1, ans - 1]),
      solution: lines(
        `곱의 미분법에 의하여 $f'(x) = (${texPoly(dA)})(${texPoly(B)}) + (${texPoly(A)}) \\times ${paren(B[0])}$`,
        `$x = ${k}$ 를 대입하면 $f'(${k}) = ${times(ev(dA, k), ev(B, k))} + ${paren(ev(A, k))} \\times ${paren(B[0])}$`,
        `정리하면 $f'(${k}) = ${ev(dA, k) * ev(B, k)} ${signed(ev(A, k) * B[0])} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ A, B, k }) => deriv((x) => ev(A, x) * ev(B, x), k),
}

/** 미분계수의 정의 */
const defn1: SuTemplate<{ f: number[]; k: number; m: number }> = {
  ...head("d1-defn", U, "12미적Ⅰ-02-01", 1, 60),
  params: (r) => {
    const f = r.chance(0.5) ? [nz(r, -3, 3), r.int(-6, 6), r.int(-6, 6)] : [nz(r, -2, 2), r.int(-3, 3), r.int(-6, 6), r.int(-5, 5)]
    const m = r.pick([2, 3, 4, -1, -2, -3])
    const k = r.int(-2, 3)
    if (ev(dcs(f), k) === 0) return null
    return { f, k, m }
  },
  build: ({ f, k, m }, r) => {
    const d = dcs(f)
    const D = ev(d, k)
    const ans = m * D
    const kh = `${k === 0 ? "" : `${k} `}${k === 0 ? cx(m, "h") : `${m < 0 ? "-" : "+"} ${cx(Math.abs(m), "h")}`}`
    return {
      text: `함수 $f(x) = ${texPoly(f)}$ 에 대하여 $\\lim_{h \\to 0} \\frac{f(${kh}) - f(${k})}{h}$ 의 값은?`,
      ...mcI(r, ans, [D, -ans, (m + 1) * D, (m - 1) * D, ev(f, k) * m, ans + 1]),
      solution: lines(
        `$\\lim_{h \\to 0} \\frac{f(${kh}) - f(${k})}{h} = ${m} \\times \\lim_{h \\to 0} \\frac{f(${kh}) - f(${k})}{${cx(m, "h")}} = ${m}f'(${k})$`,
        `$f'(x) = ${texPoly(d)}$ 이므로 $f'(${k}) = ${D}$`,
        `따라서 구하는 값은 $${times(m, D)} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ f, k, m }) => limitAt((h) => (ev(f, k + m * h) - ev(f, k)) / h, 0),
}

/** 접선의 y절편 */
const tangent1: SuTemplate<{ f: number[]; k: number; v: number }> = {
  ...head("d1-tangent", U, "12미적Ⅰ-02-04", 1, 60),
  params: (r) => {
    const f = r.chance(0.5) ? [nz(r, -3, 3), r.int(-6, 6), r.int(-6, 6)] : [nz(r, -2, 2), r.int(-3, 3), r.int(-5, 5), r.int(-5, 5)]
    return { f, k: nz(r, -2, 3), v: r.int(0, 1) }
  },
  build: ({ f, k, v }, r) => {
    const d = dcs(f)
    const m = ev(d, k)
    const y0 = ev(f, k)
    const n = y0 - m * k
    const ans = v === 0 ? n : m + n
    return {
      text: `곡선 $y = ${texPoly(f)}$ 위의 점 $(${k}, ${y0})$ 에서의 접선의 방정식이 $y = ax + b$ 일 때, $${v === 0 ? "b" : "a + b"}$ 의 값은?`,
      ...mcI(r, ans, [v === 0 ? y0 + m * k : m + y0 + m * k, v === 0 ? m : y0, v === 0 ? -n : m - n, ans + 1, ans - 1, y0]),
      solution: lines(
        `$y' = ${texPoly(d)}$ 이므로 점 $(${k}, ${y0})$ 에서의 접선의 기울기는 $${fx(d, k)} = ${m}$`,
        `접선의 방정식은 $y ${signed(-y0)} = ${m}(${texShift(k)})$, 즉 $y = ${texPoly([m, n])}$`,
        `따라서 $a = ${m}$, $b = ${n}$ 이므로 $${v === 0 ? "b" : "a + b"} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ f, k, v }) => {
    const m = deriv((x) => ev(f, x), k)
    const n = ev(f, k) - m * k
    return v === 0 ? n : m + n
  },
}

/** 속도·가속도 */
const velocity1: SuTemplate<{ x: number[]; k: number; v: number }> = {
  ...head("d1-vel", U, "12미적Ⅰ-02-10", 1, 60),
  params: (r) => {
    const x = [r.pick([1, 1, 2, -1]), r.int(-6, 6), r.int(-9, 9), r.int(0, 5)]
    return { x, k: r.int(1, 4), v: r.int(0, 1) }
  },
  build: ({ x, k, v }, r) => {
    const vel = dcs(x)
    const acc = dcs(vel)
    const ans = v === 0 ? ev(vel, k) : ev(acc, k)
    const w = v === 0 ? "속도" : "가속도"
    return {
      text: `수직선 위를 움직이는 점 $\\mathrm{P}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 위치 $x$ 가 $x = ${texPoly(x, "t")}$ 일 때, 시각 $t = ${k}$ 에서 점 $\\mathrm{P}$ 의 ${w}${isShortOk(ans) ? "를 구하시오." : "는?"}`,
      ...answerI(r, ans, v === 0 ? [ev(x, k), ev(acc, k), ans + 1, ans - 1, -ans] : [ev(vel, k), ev(x, k), ans + 1, ans - 1, -ans]),
      solution: lines(
        `속도는 $v = \\frac{dx}{dt} = ${texPoly(vel, "t")}$${v === 1 ? `, 가속도는 $a = \\frac{dv}{dt} = ${texPoly(acc, "t")}$` : ""} 이다.`,
        v === 0 ? `$t = ${k}$ 일 때의 속도는 $${fx(vel, k).replace(/x/g, "t")} = ${ans}$` : `$t = ${k}$ 일 때의 가속도는 $${fx(acc, k)} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ x, k, v }) => {
    const X = (t: number) => ev(x, t)
    return v === 0 ? deriv(X, k) : deriv((t) => deriv(X, t), k, 1e-3)
  },
}

// ───────────────────────── 2단계 ─────────────────────────

/** 미분계수의 정의 변형 */
const defn2: SuTemplate<{ A: number; B: number; k: number; a: number; b: number; v: number }> = {
  ...head("d2-defn2", U, "12미적Ⅰ-02-01", 2, 60),
  params: (r) => {
    const v = r.int(0, 2)
    const k = nz(r, -3, 4)
    return { A: r.int(-6, 9), B: nz(r, -8, 8), k, a: r.int(1, 4), b: r.int(1, 4), v }
  },
  build: ({ A, B, k, a, b, v }, r) => {
    const given = `미분가능한 함수 $f(x)$ 가 $f(${k}) = ${A}$, $f'(${k}) = ${B}$ 를 만족시킬 때,`
    if (v === 0) {
      const ans = (a + b) * B
      const p1 = `${k} + ${cx(a, "h")}`
      const p2 = `${k} - ${cx(b, "h")}`
      return {
        text: `${given} $\\lim_{h \\to 0} \\frac{f(${p1}) - f(${p2})}{h}$ 의 값은?`,
        ...mcI(r, ans, [(a - b) * B, a * B, b * B, a * b * B, ans + B, A * (a + b)]),
        solution: lines(
          `분자에 $f(${k})$ 를 빼고 더하면`,
          `$\\lim_{h \\to 0} \\frac{f(${p1}) - f(${k})}{h} + \\lim_{h \\to 0} \\frac{f(${k}) - f(${p2})}{h}$`,
          `따라서 구하는 값은 $${a}f'(${k}) + ${b}f'(${k}) = ${a + b}f'(${k}) = ${times(a + b, B)} = ${ans}$`
        ),
        score: 3,
      }
    }
    if (v === 1) {
      const ans = q(B, 2 * k)
      return {
        text: `${given} $\\lim_{x \\to ${k}} \\frac{f(x) - f(${k})}{x^{2} - ${k * k}}$ 의 값은?`,
        ...mcQ(r, ans, [q(B, k), q(2 * k * B), q(B, 2 * k).neg(), q(A, 2 * k), q(B)]),
        solution: lines(
          `$x^{2} - ${k * k} = (${texShift(k)})(${texShift(-k)})$ 이므로`,
          `$\\lim_{x \\to ${k}} \\frac{f(x) - f(${k})}{${texShift(k)}} \\times \\frac{1}{${texShift(-k)}} = f'(${k}) \\times \\frac{1}{${2 * k}}$`,
          `따라서 구하는 값은 $\\frac{${B}}{${2 * k}} = ${ans.tex()}$`
        ),
        score: 3,
      }
    }
    const ans = A + k * B
    return {
      text: `${given} $\\lim_{x \\to ${k}} \\frac{xf(x) - ${k === 1 ? "" : paren(k)}f(${k})}{${texShift(k)}}$ 의 값은?`,
      ...mcI(r, ans, [k * B, A + B, A * B, k * A + B, A - k * B, ans + 1]),
      solution: lines(
        `$g(x) = xf(x)$ 라 하면 $g(${k}) = ${k === 1 ? "" : paren(k)}f(${k})$ 이므로 주어진 극한은 $g'(${k})$ 이다.`,
        `곱의 미분법에 의하여 $g'(x) = f(x) + xf'(x)$`,
        `따라서 $g'(${k}) = f(${k}) + ${paren(k)}f'(${k}) = ${A} ${signed(k * B)} = ${ans}$`
      ),
      score: 3,
    }
  },
  // f(k)=A, f'(k)=B 인 구체적인 함수로 극한을 수치 계산
  verify: ({ A, B, k, a, b, v }) => {
    const f = (x: number) => A + B * (x - k) + 2 * (x - k) ** 2 - (x - k) ** 3
    if (v === 0) return limitAt((h) => (f(k + a * h) - f(k - b * h)) / h, 0)
    if (v === 1) return limitAt((x) => (f(x) - f(k)) / (x * x - k * k), k)
    return limitAt((x) => (x * f(x) - k * f(k)) / (x - k), k)
  },
}

/** 미분가능할 조건 (구간별 다항함수) */
const diffable: SuTemplate<{ v: number; k: number; a: number; c: number; w: number }> = {
  ...head("d2-diffable", U, "12미적Ⅰ-02-02", 2, 60),
  params: (r) => {
    const v = r.int(0, 1)
    const k = nz(r, -3, 3)
    return { v, k, a: r.int(-5, 5), c: r.int(-6, 6), w: r.int(0, 1) }
  },
  build: ({ v, k, a, c, w }, r) => {
    let A: number, B: number, f: string, sol: string[]
    if (v === 0) {
      // x<k: x³ + ax², x≥k: bx + d
      const d = -2 * k ** 3 - a * k * k
      A = a
      B = 3 * k * k + 2 * a * k
      f = cases([`x^{3} + ax^{2}`, `x < ${k}`], [`bx ${signed(d)}`, `x \\ge ${k}`])
      sol = [
        `$x = ${k}$ 에서 연속이므로 $${paren(k)}^{3} + ${paren(k)}^{2}a = ${paren(k)}b ${signed(d)}$, 즉 $${texPoly([k * k, 0], "a")} ${k < 0 ? "+" : "-"} ${cx(Math.abs(k), "b")} = ${d - k ** 3}$`,
        `$x = ${k}$ 에서 미분계수가 같아야 하므로 $3 \\times ${paren(k)}^{2} + 2 \\times ${paren(k)} \\times a = b$, 즉 $b = ${texPoly([2 * k, 3 * k * k], "a")}$`,
        `두 식을 연립하면 $a = ${A}$, $b = ${B}$`,
      ]
    } else {
      // x<k: ax² + bx, x≥k: x³ + cx
      A = 2 * k
      B = c - k * k
      f = cases([`ax^{2} + bx`, `x < ${k}`], [texPoly([1, 0, c, 0]), `x \\ge ${k}`])
      sol = [
        `$x = ${k}$ 에서 연속이므로 $${texPoly([k * k, 0], "a")}${term(k, "b")} = ${k ** 3 + c * k}$`,
        `$x = ${k}$ 에서 좌미분계수와 우미분계수가 같아야 하므로 $${2 * k}a + b = ${3 * k * k + c}$ (좌변은 $(ax^{2} + bx)' = 2ax + b$, 우변은 $(${texPoly([1, 0, c, 0])})' = ${texPoly([3, 0, c])}$ 에 $x = ${k}$ 대입)`,
        `두 식을 연립하면 $a = ${A}$, $b = ${B}$`,
      ]
    }
    const ans = w === 0 ? A + B : A * B
    const tgt = w === 0 ? "a + b" : "ab"
    return {
      text: `함수 $f(x) = ${f}$ 가 실수 전체의 집합에서 미분가능할 때, $${tgt}$ 의 값은? (단, $a, b$ 는 상수이다.)`,
      ...mcI(r, ans, w === 0 ? [A - B, -A + B, B, A + B + 1, A + B - 1, 2 * A + B] : [-A * B, A * B + A, A * B - B, A + B, A * (B + 1)]),
      solution: lines(`$f(x)$ 가 $x = ${k}$ 에서 미분가능하려면 $x = ${k}$ 에서 연속이고 좌미분계수와 우미분계수가 같아야 한다.`, ...sol, `따라서 $${tgt} = ${w === 0 ? `${A} ${signed(B)}` : times(A, B)} = ${ans}$`),
      score: 3,
    }
  },
  // 미지수 (a, b)에 대한 일차연립방정식을 수치 미분으로 세워 푼다
  verify: ({ v, k, a, c, w }) => {
    let sol: number[]
    if (v === 0) {
      const d = -2 * k ** 3 - a * k * k
      // 연속: k³ + a k² = b k + d,  미분: 3k² + 2ak = b
      const dx2 = deriv((x) => x * x, k)
      const dx3 = deriv((x) => x ** 3, k)
      sol = solveLinear(
        [
          [k * k, -k],
          [dx2, -1],
        ],
        [d - k ** 3, -dx3]
      )
    } else {
      const dx2 = deriv((x) => x * x, k)
      const dR = deriv((x) => x ** 3 + c * x, k)
      sol = solveLinear(
        [
          [k * k, k],
          [dx2, 1],
        ],
        [k ** 3 + c * k, dR]
      )
    }
    const [A, B] = sol
    return w === 0 ? A + B : A * B
  },
}

/** 평균값 정리를 만족시키는 c */
const mvt: SuTemplate<{ b: number; c: number; d: number; p: number; qq: number }> = {
  ...head("d2-mvt", U, "12미적Ⅰ-02-05", 2, 60),
  params: (r) => {
    const p = r.int(-4, 2)
    const qq = p + r.int(1, 5)
    const b = r.int(-6, 6)
    // 3x² + 2bx - (p²+pq+q²+b(p+q)) = 0 의 근이 유리수
    const K = p * p + p * qq + qq * qq + b * (p + qq)
    const disc = 4 * b * b + 12 * K
    const sq = Math.round(Math.sqrt(disc))
    if (disc < 0 || sq * sq !== disc) return null
    return { b, c: r.int(-6, 6), d: r.int(-5, 5), p, qq }
  },
  build: ({ b, c, d, p, qq }, r) => {
    const f = [1, b, c, d]
    const S = q(ev(f, qq) - ev(f, p), qq - p)
    const K = p * p + p * qq + qq * qq + b * (p + qq)
    const sq = Math.round(Math.sqrt(4 * b * b + 12 * K))
    const rts = [q(-2 * b - sq, 6), q(-2 * b + sq, 6)].filter((x, i, a) => a.findIndex((y) => y.eq(x)) === i)
    const inside = rts.filter((x) => x.value > p && x.value < qq)
    const ans = inside.reduce((s, x) => s.add(x), q(0))
    const all = rts.reduce((s, x) => s.add(x), q(0))
    return {
      text: `함수 $f(x) = ${texPoly(f)}$ 에 대하여 닫힌구간 $[${p}, ${qq}]$ 에서 평균값 정리를 만족시키는 모든 실수 $c$ 의 값의 합은?`,
      ...mcQ(r, ans, [q(p + qq, 2), all, ans.neg(), ans.add(q(1, 3)), q(-2 * b, 3), ...rts]),
      solution: lines(
        `$\\frac{f(${qq}) - f(${p})}{${qq} - ${paren(p)}} = \\frac{${ev(f, qq)} - ${paren(ev(f, p))}}{${qq - p}} = ${S.tex()}$`,
        `$f'(x) = ${texPoly(dcs(f))}$ 이므로 $f'(c) = ${S.tex()}$ 에서 $${texPoly([3, 2 * b, -K], "c")} = 0$`,
        `$c = ${rts.map((x) => x.tex()).join("$ 또는 $c = ")}$ 이고, 이 중 열린구간 $(${p}, ${qq})$ 에 속하는 것은 $${inside.map((x) => x.tex()).join(", ")}$`,
        `따라서 구하는 합은 $${ans.tex()}$`
      ),
      score: 3,
    }
  },
  verify: ({ b, c, d, p, qq }) => {
    const f = (x: number) => ev([1, b, c, d], x)
    const S = (f(qq) - f(p)) / (qq - p)
    return roots((x) => deriv(f, x) - S, p + 1e-7, qq - 1e-7, 4000).reduce((s, x) => s + x, 0)
  },
}

/** 실수 전체에서 증가(감소)하도록 하는 정수 a의 개수 */
const incrRange: SuTemplate<{ p: number; rr: number; s: number; e: number }> = {
  ...head("d2-incr", U, "12미적Ⅰ-02-06", 2, 60),
  params: (r) => {
    const p = nz(r, -4, 4)
    const rr = nz(r, -9, 12)
    const D = 9 * p * p + 12 * rr
    if (D <= 0) return null
    const lo = Math.ceil((3 * p - Math.sqrt(D)) / 2 - 1e-12)
    const hi = Math.floor((3 * p + Math.sqrt(D)) / 2 + 1e-12)
    if (hi - lo + 1 < 2 || hi - lo + 1 > 40) return null
    return { p, rr, s: r.pick([1, -1]), e: r.int(-5, 5) }
  },
  build: ({ p, rr, s, e }) => {
    const D = 9 * p * p + 12 * rr
    const lo = Math.ceil((3 * p - Math.sqrt(D)) / 2 - 1e-12)
    const hi = Math.floor((3 * p + Math.sqrt(D)) / 2 + 1e-12)
    const ans = hi - lo + 1
    // f(x) = s(x³ - a x² + (pa + r)x) + e
    const lin = texPoly([p, rr], "a")
    const ftex = s === 1 ? `x^{3} - ax^{2} + (${lin})x ${signed(e)}` : `-x^{3} + ax^{2} - (${lin})x ${signed(e)}`
    const word = s === 1 ? "증가" : "감소"
    return {
      text: `함수 $f(x) = ${ftex}$ 가 실수 전체의 집합에서 ${word}하도록 하는 정수 $a$ 의 개수를 구하시오.`,
      ...short(ans),
      solution: lines(
        s === 1 ? `$f'(x) = 3x^{2} - 2ax + (${lin})$` : `$f'(x) = -3x^{2} + 2ax - (${lin}) = -\\{3x^{2} - 2ax + (${lin})\\}$`,
        `$f(x)$ 가 실수 전체에서 ${word}하려면 모든 실수 $x$ 에 대하여 $f'(x) ${s === 1 ? "\\ge" : "\\le"} 0$ 이어야 하므로 이차방정식 $3x^{2} - 2ax + (${lin}) = 0$ 의 판별식 $\\frac{D}{4} \\le 0$`,
        `$\\frac{D}{4} = a^{2} - 3(${lin}) = ${texPoly([1, -3 * p, -3 * rr], "a")} \\le 0$`,
        `$\\frac{${3 * p} - ${texSqrt(D)}}{2} \\le a \\le \\frac{${3 * p} + ${texSqrt(D)}}{2}$ 이므로 정수 $a$ 는 $${lo}, ${lo + 1}, \\cdots, ${hi}$`,
        `따라서 정수 $a$ 의 개수는 $${ans}$`
      ),
      score: 3,
    }
  },
  // 정수 a마다 f 값을 촘촘히 계산해 단조인지 확인
  verify: ({ p, rr, s, e }) => {
    let cnt = 0
    for (let a = -25; a <= 25; a++) {
      const f = (x: number) => s * (x ** 3 - a * x * x + (p * a + rr) * x) + e
      let ok = true
      let prev = f(-15)
      for (let i = 1; i <= 1000 && ok; i++) {
        const y = f(-15 + i * 0.03)
        if (s * (y - prev) < -1e-9) ok = false
        prev = y
      }
      if (ok) cnt++
    }
    return cnt
  },
}

/** 극솟값이 주어졌을 때 극댓값 */
const extVal: SuTemplate<{ al: number; be: number; m: number; s: number }> = {
  ...head("d2-ext", U, "12미적Ⅰ-02-07", 2, 60),
  params: (r) => {
    const al = r.int(-4, 3)
    const be = al + r.int(1, 4)
    return { al, be, m: r.int(-10, 10), s: r.pick([1, 1, -1]) }
  },
  build: ({ al, be, m, s }, r) => {
    // f'(x) = 6s(x-α)(x-β), f(x) = s(2x³ - 3(α+β)x² + 6αβx) + c
    const base = [2 * s, -3 * s * (al + be), 6 * s * al * be, 0]
    const minX = s === 1 ? be : al
    const maxX = s === 1 ? al : be
    const c = m - ev(base, minX)
    const f = [...base.slice(0, 3), c]
    const ans = ev(f, maxX)
    const diff = (be - al) ** 3
    return {
      text: `함수 $f(x) = ${texPoly([2 * s, 0, 0, 0])} + ax^{2} + bx + c$ 가 $x = ${minX}$ 에서 극소, $x = ${maxX}$ 에서 극대이고 극솟값이 $${m}$ 일 때, 함수 $f(x)$ 의 극댓값${isShortOk(ans) ? "을 구하시오." : "은?"} (단, $a, b, c$ 는 상수이다.)`,
      ...answerI(r, ans, [m - diff, m + diff / 2, ans + 1, ans - 1, -ans, m + 2 * diff]),
      solution: lines(
        `$f'(x) = ${texPoly([6 * s, 0, 0])} + 2ax + b$ 이고 $f'(${minX}) = f'(${maxX}) = 0$ 이므로 $f'(x) = ${s === 1 ? "6" : "-6"}${facs(1, [al, be])}$`,
        `즉 $2a = ${-6 * s * (al + be)}$, $b = ${6 * s * al * be}$ 에서 $a = ${-3 * s * (al + be)}$, $b = ${6 * s * al * be}$`,
        `$f(${minX}) = ${ev(base, minX)} + c = ${m}$ 에서 $c = ${c}$, 즉 $f(x) = ${texPoly(f)}$`,
        `따라서 극댓값은 $f(${maxX}) = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ al, be, m, s }) => {
    // a, b 를 완전 탐색 (f'(α)=f'(β)=0), c 는 극솟값에서
    const found: number[] = []
    for (let a = -32; a <= 32; a++) {
      // f'(α) = 0 이 되도록 b 를 수치 미분으로 정한 뒤 f'(β) = 0 확인
      const b = -deriv((x) => 2 * s * x ** 3 + a * x * x, al)
      {
        const g = (x: number) => 2 * s * x ** 3 + a * x * x + b * x
        if (Math.abs(deriv(g, be)) > 1e-6) continue
        const crit = roots((x) => deriv(g, x), -10, 10, 400)
        const mins = crit.filter((x) => g(x - 1e-3) > g(x) && g(x + 1e-3) > g(x))
        const maxs = crit.filter((x) => g(x - 1e-3) < g(x) && g(x + 1e-3) < g(x))
        if (mins.length !== 1 || maxs.length !== 1) continue
        const c = m - g(mins[0])
        found.push(g(maxs[0]) + c)
      }
    }
    return only(found) ?? NaN
  },
}

/** 닫힌구간에서 최댓값 + 최솟값 */
const maxMin: SuTemplate<{ al: number; be: number; c: number; p: number; qq: number; s: number }> = {
  ...head("d2-maxmin", U, "12미적Ⅰ-02-08", 2, 60),
  params: (r) => {
    const al = r.int(-3, 2)
    const be = al + r.int(1, 4)
    const p = al - r.int(0, 3)
    const qq = be + r.int(-1, 3)
    if (qq <= p || qq < al) return null
    return { al, be, c: r.int(-8, 8), p, qq, s: r.pick([1, -1]) }
  },
  build: ({ al, be, c, p, qq, s }, r) => {
    const f = [2 * s, -3 * s * (al + be), 6 * s * al * be, c]
    const pts = [p, qq, al, be].filter((x) => x >= p && x <= qq)
    const vals = pts.map((x) => ev(f, x))
    const M = Math.max(...vals)
    const mm = Math.min(...vals)
    const ans = M + mm
    const uniq = [...new Set(pts)].sort((x, y) => x - y)
    return {
      text: `닫힌구간 $[${p}, ${qq}]$ 에서 함수 $f(x) = ${texPoly(f)}$ 의 최댓값을 $M$, 최솟값을 $m$ 이라 할 때, $M + m$ 의 값은?`,
      ...mcI(r, ans, [ev(f, p) + ev(f, qq), ev(f, al) + ev(f, be), M - mm, ans + 1, ans - 1, 2 * M]),
      solution: lines(
        `$f'(x) = ${texPoly(dcs(f))} = ${s === 1 ? "6" : "-6"}${facs(1, [al, be])}$ 이므로 $f'(x) = 0$ 에서 $x = ${al}$ 또는 $x = ${be}$`,
        `구간의 양 끝과 극값을 비교하면 ${uniq.map((x) => `$f(${x}) = ${ev(f, x)}$`).join(", ")}`,
        `따라서 $M = ${M}$, $m = ${mm}$ 이고 $M + m = ${ans}$`
      ),
      score: 3,
    }
  },
  // 2^-10 간격으로 모든 점을 계산
  verify: ({ al, be, c, p, qq, s }) => {
    const f = [2 * s, -3 * s * (al + be), 6 * s * al * be, c]
    let M = -Infinity
    let mm = Infinity
    for (let i = 0; i <= (qq - p) * 1024; i++) {
      const y = ev(f, p + i / 1024)
      M = Math.max(M, y)
      mm = Math.min(mm, y)
    }
    return M + mm
  },
}

// ───────────────────────── 3단계 ─────────────────────────

/** 접선이 곡선과 다시 만나는 점 */
const tanSecond: SuTemplate<{ s: number; b: number; c: number; d: number; t: number; v: number }> = {
  ...head("d3-tan-second", U, "12미적Ⅰ-02-04", 3, 65),
  params: (r) => {
    const s = r.pick([1, -1])
    const b = r.int(-6, 6)
    const t = r.int(-3, 3)
    if (3 * t * s === -b) return null
    return { s, b, c: r.int(-6, 6), d: r.int(-6, 6), t, v: r.int(0, 1) }
  },
  build: ({ s, b, c, d, t, v }, r) => {
    const f = [s, b, c, d]
    const df = dcs(f)
    const m = ev(df, t)
    const y0 = ev(f, t)
    const u = -2 * t - b / s
    const ans = v === 0 ? ev(f, u) : m + u
    const tan = [m, y0 - m * t]
    return {
      text: `곡선 $y = ${texPoly(f)}$ 위의 점 $(${t}, ${y0})$ 에서의 접선이 이 곡선과 만나는 점 중 접점이 아닌 점을 $(p, q)$ 라 할 때, $${v === 0 ? "q" : "p"}$ ${v === 0 ? "의 값은?" : "와 접선의 기울기의 합은?"}`,
      ...mcI(r, ans, v === 0 ? [ev(f, -u), ev(f, u + 1), ev(tan, -2 * t), ans + 1, ans - 1, y0] : [m - u, -m + u, m + t, ans + 1, ans - 1, u]),
      solution: lines(
        `$y' = ${texPoly(df)}$ 이므로 접선의 기울기는 $${m}$ 이고, 접선의 방정식은 $y = ${texPoly(tan)}$`,
        `곡선과 접선의 교점의 $x$ 좌표는 $${texPoly(f)} = ${texPoly(tan)}$, 즉 $${texPoly([s, b, c - m, d - (y0 - m * t)])} = 0$ 의 해이다.`,
        `위 방정식은 $x = ${t}$ 를 중근으로 가지므로 $${s === 1 ? "" : "-"}${fac(t)}^{2}(x - p) = 0$ 꼴이고, $x^{2}$ 의 계수를 비교하면 $${s === 1 ? "" : "-("}${-2 * t} - p${s === 1 ? "" : ")"} = ${b}$ 에서 $p = ${u}$`,
        v === 0 ? `따라서 $q = f(${u}) = ${ans}$` : `따라서 구하는 값은 $${u} ${signed(m)} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ s, b, c, d, t, v }) => {
    const f = (x: number) => ev([s, b, c, d], x)
    const m = deriv(f, t)
    const g = (x: number) => f(x) - (m * (x - t) + f(t))
    const rs = roots(g, -20, 20, 2000).filter((x) => Math.abs(x - t) > 1e-3)
    if (rs.length !== 1) return NaN
    return v === 0 ? f(rs[0]) : m + rs[0]
  },
}

/** 곡선 밖(또는 위)의 점에서 그은 접선 */
const tanExt: SuTemplate<{ v: number; b: number; c: number; p: number; qq: number; a: number; w: number }> = {
  ...head("d3-tan-ext", U, "12미적Ⅰ-02-04", 3, 65),
  params: (r) => {
    const v = r.int(0, 1)
    if (v === 0) {
      const b = r.int(-6, 6)
      const c = r.int(-6, 6)
      const p = r.int(-3, 3)
      const qq = p * p + b * p + c - r.int(1, 12)
      return { v, b, c, p, qq, a: 0, w: r.int(0, 1) }
    }
    const a = r.int(-6, 6)
    const p = r.int(-3, 3)
    if ((p + a) % 2 !== 0 || 3 * p === -a) return null
    return { v, b: r.int(-6, 6), c: r.int(-5, 5), p, qq: 0, a, w: 0 }
  },
  build: ({ v, b, c, p, qq, a, w }, r) => {
    if (v === 0) {
      const f = [1, b, c]
      const K = qq - b * p - c
      const prod = 4 * K + 4 * b * p + b * b
      const sum = 4 * p + 2 * b
      const ans = w === 0 ? prod : sum
      return {
        text: `점 $(${p}, ${qq})$ 에서 곡선 $y = ${texPoly(f)}$ 에 그은 두 접선의 기울기의 ${w === 0 ? "곱" : "합"}은?`,
        ...mcI(r, ans, w === 0 ? [K, 4 * K, prod + 2 * b * p, -prod, prod + 1, sum] : [2 * p + b, 2 * p, sum + b, -sum, sum + 2, prod]),
        solution: lines(
          `접점의 $x$ 좌표를 $s$ 라 하면 접선은 $y = (${texPoly([2, b], "s")})(x - s) + ${texPoly([1, b, c], "s")}$`,
          `그 접선이 점 $(${p}, ${qq})$ 를 지나므로 $${qq} = (${texPoly([2, b], "s")})(${p} - s) + ${texPoly([1, b, c], "s")}$, 정리하면 $${texPoly([1, -2 * p, K], "s")} = 0$`,
          `두 근을 $s_1, s_2$ 라 하면 $s_1 + s_2 = ${2 * p}$, $s_1 s_2 = ${K}$ 이고, 기울기는 $2s_1 ${signed(b)}$, $2s_2 ${signed(b)}$`,
          w === 0
            ? `기울기의 곱은 $4s_1 s_2 + ${paren(2 * b)}(s_1 + s_2) + ${b * b} = ${times(4, K)} + ${paren(2 * b)} \\times ${paren(2 * p)} + ${b * b} = ${ans}$`
            : `기울기의 합은 $2(s_1 + s_2) + ${paren(2 * b)} = ${times(2, 2 * p)} ${signed(2 * b)} = ${ans}$`
        ),
        score: 3,
      }
    }
    const f = [1, a, b, c]
    const df = dcs(f)
    const t = -(p + a) / 2
    const ans = ev(df, t)
    const y0 = ev(f, p)
    return {
      text: `곡선 $y = ${texPoly(f)}$ 위의 점 $\\mathrm{A}(${p}, ${y0})$ 를 지나고, 점 $\\mathrm{A}$ 가 아닌 점에서 이 곡선에 접하는 직선의 기울기는?`,
      ...mcI(r, ans, [ev(df, p), ev(df, -t), ev(df, t + 1), ans + 1, -ans, ev(df, p + t)]),
      solution: lines(
        `접점의 $x$ 좌표를 $s$ 라 하면 접선은 $y = (${texPoly(dcs(f), "s")})(x - s) + ${texPoly(f, "s")}$`,
        `그 접선이 점 A 를 지나므로 $${y0} = (${texPoly(dcs(f), "s")})(${p} - s) + ${texPoly(f, "s")}$`,
        `정리하면 $${fac(p, "s")}^{2}${p + a === 0 ? "s" : `(2s ${signed(p + a)})`} = 0$ 이고, $s \\ne ${p}$ 이므로 $s = ${t}$`,
        `따라서 구하는 기울기는 $f'(${t}) = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ v, b, c, p, qq, a, w }) => {
    if (v === 0) {
      const f = (x: number) => x * x + b * x + c
      const g = (s: number) => f(s) + deriv(f, s) * (p - s) - qq
      const ts = roots(g, -20, 20, 2000)
      if (ts.length !== 2) return NaN
      const ms = ts.map((t) => deriv(f, t))
      return w === 0 ? ms[0] * ms[1] : ms[0] + ms[1]
    }
    const f = (x: number) => ev([1, a, b, c], x)
    const g = (s: number) => f(s) + deriv(f, s) * (p - s) - f(p)
    const ts = roots(g, -20, 20, 2000).filter((x) => Math.abs(x - p) > 1e-3)
    return ts.length === 1 ? deriv(f, ts[0]) : NaN
  },
}

/** 방정식 f(x) = k 의 실근 개수 */
const rootCount: SuTemplate<{ al: number; be: number; e: number; s: number; v: number }> = {
  ...head("d3-rootcount", U, "12미적Ⅰ-02-09", 3, 65),
  params: (r) => {
    const al = r.int(-3, 2)
    const be = al + r.int(1, 4)
    return { al, be, e: r.int(-6, 6), s: r.pick([1, -1]), v: r.int(0, 1) }
  },
  build: ({ al, be, e, s, v }, r) => {
    const f = [2 * s, -3 * s * (al + be), 6 * s * al * be, e]
    const vA = ev(f, al)
    const vB = ev(f, be)
    const M = Math.max(vA, vB)
    const mm = Math.min(vA, vB)
    const ans = v === 0 ? M - mm - 1 : M + mm
    return {
      text:
        v === 0
          ? `$x$ 에 대한 방정식 $${texPoly(f)} = k$ 가 서로 다른 세 실근을 갖도록 하는 정수 $k$ 의 개수${ask(ans) === "의 값은?" ? "는?" : "를 구하시오."}`
          : `$x$ 에 대한 방정식 $${texPoly(f)} = k$ 가 서로 다른 두 실근을 갖도록 하는 모든 실수 $k$ 의 값의 합은?`,
      ...answerI(r, ans, v === 0 ? [M - mm + 1, M - mm, ans + 2, M + mm] : [M - mm, ans + 1, -ans, 2 * M, 2 * mm]),
      solution: lines(
        `$f(x) = ${texPoly(f)}$ 이라 하면 $f'(x) = ${s === 1 ? "6" : "-6"}${facs(1, [al, be])}$`,
        `$f(x)$ 는 $x = ${s === 1 ? al : be}$ 에서 극댓값 $${M}$, $x = ${s === 1 ? be : al}$ 에서 극솟값 $${mm}$ 을 갖는다.`,
        `방정식의 실근의 개수는 곡선 $y = f(x)$ 와 직선 $y = k$ 의 교점의 개수와 같다.`,
        v === 0
          ? `서로 다른 세 실근을 가지려면 $${mm} < k < ${M}$ 이어야 하므로 정수 $k$ 의 개수는 $${ans}$`
          : `서로 다른 두 실근을 가지려면 직선 $y = k$ 가 극점을 지나야 하므로 $k = ${M}$ 또는 $k = ${mm}$, 합은 $${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ al, be, e, s, v }) => {
    const f = [2 * s, -3 * s * (al + be), 6 * s * al * be, e]
    const vals = gridVals((x) => ev(f, x), -12, 12, 32)
    let cnt = 0
    let sum = 0
    for (let k = -300; k <= 300; k++) {
      const n = gridCount(vals, k)
      if (v === 0 && n === 3) cnt++
      if (v === 1 && n === 2) sum += k
    }
    return v === 0 ? cnt : sum
  },
}

/** x ≥ 0 에서 부등식이 항상 성립할 조건 */
const ineqAlways: SuTemplate<{ al: number; be: number; P: number; Qc: number; e: number }> = {
  ...head("d3-ineq", U, "12미적Ⅰ-02-09", 3, 65),
  params: (r) => {
    const al = r.int(-3, 2)
    const be = Math.max(al + 1, r.int(1, 4))
    if (be <= 0) return null
    return { al, be, P: r.int(-4, 4), Qc: r.int(-6, 6), e: r.int(-5, 5) }
  },
  build: ({ al, be, P, Qc, e }, r) => {
    const h = [2, -3 * (al + be), 6 * al * be, e]
    const f = [2, -3 * (al + be) + P, 6 * al * be + Qc, e]
    const g = [P, Qc]
    const cands = [0, be, ...(al > 0 ? [al] : [])]
    const mn = Math.min(...cands.map((x) => ev(h, x)))
    const ans = mn
    const crit = [al, be].filter((x) => x > 0)
    return {
      text: `두 함수 $f(x) = ${texPoly(f)}$, $g(x) = ${g.every((x) => x === 0) ? "k" : `${texPoly([...g, 0])} + k`}$ 가 있다. $x \\ge 0$ 인 모든 실수 $x$ 에 대하여 부등식 $f(x) \\ge g(x)$ 가 성립하도록 하는 실수 $k$ 의 최댓값은?`,
      ...mcI(r, ans, [ev(h, al), e, ans - 1, ans + 1, -ans, ev(h, be) + 1 === ans ? ans + 2 : ev(h, be) + 1]),
      solution: lines(
        `$f(x) \\ge g(x)$ 는 $f(x) - g(x) + k \\ge k$ 와 같다. $h(x) = f(x) - g(x) + k = ${texPoly(h)}$ 이라 하면 $x \\ge 0$ 에서 $h(x) \\ge k$ 이어야 한다.`,
        `$h'(x) = 6${facs(1, [al, be])}$ 이므로 $x \\ge 0$ 에서 $h(x)$ 가 극값을 갖는 $x$ 는 $${crit.join(", ")}$`,
        `$x \\ge 0$ 에서 최솟값의 후보는 ${cands.map((x) => `$h(${x}) = ${ev(h, x)}$`).join(", ")} 이므로 최솟값은 $${mn}$`,
        `따라서 $k \\le ${mn}$ 이고 $k$ 의 최댓값은 $${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ al, be, P, Qc, e }) => {
    const f = (x: number) => ev([2, -3 * (al + be) + P, 6 * al * be + Qc, e], x)
    const g = (x: number) => P * x * x + Qc * x
    let mn = Infinity
    for (let i = 0; i <= 12 * 128; i++) {
      const x = i / 128
      mn = Math.min(mn, f(x) - g(x))
    }
    return mn
  },
}

/** 직선 운동: 운동 방향이 바뀌는 시각 */
const motion3: SuTemplate<{ al: number; be: number; x0: number; v: number }> = {
  ...head("d3-motion", U, "12미적Ⅰ-02-10", 3, 65),
  params: (r) => {
    const al = r.int(1, 5)
    const be = al + r.int(1, 6)
    if ((al + be) % 2 !== 0) return null
    return { al, be, x0: r.int(0, 5), v: r.int(0, 2) }
  },
  build: ({ al, be, x0, v }, r) => {
    const X = [1, (-3 * (al + be)) / 2, 3 * al * be, x0]
    const d = be - al
    if (v === 0) {
      const ans = q(d ** 3, 2)
      return {
        text: `수직선 위를 움직이는 점 $\\mathrm{P}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 위치 $x$ 가 $x = ${texPoly(X, "t")}$ 이다. 점 $\\mathrm{P}$ 가 운동 방향을 바꾸는 두 시각에서 점 $\\mathrm{P}$ 의 위치를 각각 $x_1, x_2$ 라 할 때, $|x_1 - x_2|$ 의 값은?`,
        ...mcQ(r, ans, [q(d ** 3), q(d ** 3, 4), q(d ** 2, 2), q(d ** 3, 6), ans.add(1)]),
        solution: lines(
          `속도는 $v = ${texPoly(dcs(X), "t")} = 3(t - ${al})(t - ${be})$ 이고, $t = ${al}$, $t = ${be}$ 의 좌우에서 $v$ 의 부호가 바뀌므로 이 두 시각에 운동 방향이 바뀐다.`,
          `$x(${al}) = ${ev(X, al)}$, $x(${be}) = ${ev(X, be)}$`,
          `따라서 $|x_1 - x_2| = ${ans.tex()}$`
        ),
        score: 3,
      }
    }
    if (v === 1) {
      const ans = -3 * (d / 2) ** 2
      const m = (al + be) / 2
      return {
        text: `수직선 위를 움직이는 점 $\\mathrm{P}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 위치 $x$ 가 $x = ${texPoly(X, "t")}$ 이다. 점 $\\mathrm{P}$ 의 가속도가 $0$ 일 때 점 $\\mathrm{P}$ 의 속도는?`,
        ...mcI(r, ans, [-ans, ans * 2, ans + 3, ans - 3, 3 * al * be, ev(X, m)]),
        solution: lines(
          `속도 $v = ${texPoly(dcs(X), "t")}$, 가속도 $a = ${texPoly(dcs(dcs(X)), "t")}$`,
          `$a = 0$ 에서 $t = ${m}$`,
          `따라서 이때의 속도는 $${fx(dcs(X), m).replace(/x/g, "t")} = ${ans}$`
        ),
        score: 3,
      }
    }
    const ans = 3 * d
    return {
      text: `수직선 위를 움직이는 점 $\\mathrm{P}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 위치 $x$ 가 $x = ${texPoly(X, "t")}$ 이다. 점 $\\mathrm{P}$ 가 출발한 후 운동 방향을 두 번째로 바꾸는 시각에서 점 $\\mathrm{P}$ 의 가속도는?`,
      ...mcI(r, ans, [-ans, 6 * be, 6 * al, 3 * be, ans + 3]),
      solution: lines(
        `속도 $v = ${texPoly(dcs(X), "t")} = 3(t - ${al})(t - ${be})$ 이므로 $t = ${al}$, $t = ${be}$ 에서 운동 방향이 바뀐다.`,
        `가속도 $a = ${texPoly(dcs(dcs(X)), "t")}$ 이고 두 번째로 바뀌는 시각은 $t = ${be}$`,
        `따라서 구하는 가속도는 $6 \\times ${be} - ${3 * (al + be)} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ al, be, x0, v }) => {
    const X = (t: number) => ev([1, (-3 * (al + be)) / 2, 3 * al * be, x0], t)
    const V = (t: number) => deriv(X, t)
    const ts = roots(V, 1e-6, 15, 1500)
    if (v === 0) return ts.length === 2 ? Math.abs(X(ts[0]) - X(ts[1])) : NaN
    if (v === 1) {
      const tm = roots((t) => deriv(V, t, 1e-3), 0, 15, 600)
      return tm.length === 1 ? V(tm[0]) : NaN
    }
    return ts.length === 2 ? deriv(V, ts[1], 1e-3) : NaN
  },
}

// ───────────────────────── 4단계 ─────────────────────────

/** 삼차함수 결정: f'(a)=f'(b), f(x)=0 의 서로 다른 두 실근의 합 */
const cubicGraph: SuTemplate<{ w: number; d: number; h: number; sg: number; k: number }> = {
  ...head("d4-cubicgraph", U, "12미적Ⅰ-02-08", 4, 55),
  params: (r) => {
    const w = r.int(-3, 3)
    const h = r.int(1, 3)
    const k = w + r.int(-4, 4)
    return { w, d: r.int(1, 4), h, sg: r.pick([1, -1]), k }
  },
  build: ({ w, d, h, sg, k }, r) => {
    // f(x) = (x-w)³ - 3h²(x-w) + B, B = 2h³·sg
    const B = 2 * h ** 3 * sg
    const f = [1, -3 * w, 3 * w * w - 3 * h * h, -(w ** 3) + 3 * h * h * w + B]
    const S = sg === 1 ? 2 * w - h : 2 * w + h
    const ans = ev(f, k)
    const a = w - d
    const b = w + d
    const hOther = sg === 1 ? S - 2 * w : 2 * w - S // 다른 경우에서 나오는 h (음수)
    const fAlt = (x: number) => (x - w) ** 3 - 3 * h * h * (x - w) - B
    return {
      text: `최고차항의 계수가 $1$ 인 삼차함수 $f(x)$ 가 다음 조건을 만족시킨다.\n(가) $f'(${a}) = f'(${b})$\n(나) 방정식 $f(x) = 0$ 은 서로 다른 두 실근을 갖고, 두 실근의 합은 $${S}$ 이다.\n이때 $f(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [fAlt(k), ev(f, k + 1), ev(f, 2 * w - k), ans + 2 * B, -ans, ans + 1]),
      solution: lines(
        `$f'(x)$ 는 이차함수이고 그래프가 직선 $x = \\frac{${a} + ${paren(b)}}{2} = ${w}$ 에 대하여 대칭이므로 $f'(x) = 3${fac(w)}^{2} + p$ 꼴이다. 즉 $f(x) = ${fac(w)}^{3} + p${fac(w)} + q$`,
        `방정식 $f(x) = 0$ 이 서로 다른 두 실근을 가지려면 $f(x)$ 가 극값을 갖고 극값 중 하나가 $0$ 이어야 한다. $p = -3m^{2} \\ (m > 0)$ 이라 하면 극값을 갖는 $x$ 는 $${w} \\pm m$`,
        `(i) 극솟값 $f(${w} + m) = 0$ 일 때: $f(x) = (${texShift(w)} - m)^{2}(${texShift(w)} + 2m)$ 이고 두 실근의 합은 $${2 * w} - m$`,
        `(ii) 극댓값 $f(${w} - m) = 0$ 일 때: $f(x) = (${texShift(w)} + m)^{2}(${texShift(w)} - 2m)$ 이고 두 실근의 합은 $${2 * w} + m$`,
        `두 실근의 합이 $${S}$ 이므로 ${sg === 1 ? `(i)에서 $m = ${h}$ ((ii)이면 $m = ${hOther}$ 로 $m > 0$ 에 모순)` : `(ii)에서 $m = ${h}$ ((i)이면 $m = ${hOther}$ 로 $m > 0$ 에 모순)`}`,
        `따라서 $f(x) = ${sg === 1 ? `(${texShift(w + h)})^{2}(${texShift(w - 2 * h)})` : `(${texShift(w - h)})^{2}(${texShift(w + 2 * h)})`} = ${texPoly(f)}$ 이고 $f(${k}) = ${ans}$`
      ),
      score: 4,
    }
  },
  // c2 는 (가)에서, c1 은 정수 완전 탐색, c0 은 극값이 0이 되도록 수치로 정한 뒤 조건 확인
  verify: ({ w, d, h, sg, k }) => {
    const a = w - d
    const b = w + d
    const S = sg === 1 ? 2 * w - h : 2 * w + h
    const found: number[] = []
    for (let c2 = -12; c2 <= 12; c2++) {
      if (Math.abs(3 * a * a + 2 * c2 * a - (3 * b * b + 2 * c2 * b)) > 1e-9) continue
      for (let c1 = -30; c1 <= 30; c1++) {
        const base = (x: number) => ((x + c2) * x + c1) * x
        const crit = roots((x) => deriv(base, x), -15, 15, 200)
        for (const cp of crit) {
          const c0 = -base(cp)
          const f = (x: number) => base(x) + c0
          // cp 는 중근, 나머지는 부호가 바뀌는 근
          const simple = roots(f, -20, 20, 300).filter((x) => Math.abs(x - cp) > 1e-3)
          if (simple.length !== 1) continue
          if (Math.abs(simple[0] + cp - S) > 1e-4) continue
          found.push(f(k))
        }
      }
    }
    return only(found) ?? NaN
  },
}

/** 점 (p, k) 에서 그은 접선의 개수 */
const tanCount: SuTemplate<{ m: number; b: number; c: number; p: number; v: number }> = {
  ...head("d4-tancount", U, "12미적Ⅰ-02-04", 4, 55),
  params: (r) => {
    const m = r.int(-2, 2)
    const p = r.int(-2, 2)
    if (p === -m) return null
    const b = r.int(-6, 6)
    const c = r.int(-6, 6)
    const f = [1, 3 * m, b, c]
    const g = (t: number) => ev(f, t) + ev(dcs(f), t) * (p - t)
    const V1 = g(p)
    const V2 = g(-m)
    if (Math.abs(V1 - V2) < 3 || Math.abs(V1) > 250 || Math.abs(V2) > 250) return null
    return { m, b, c, p, v: r.int(0, 1) }
  },
  build: ({ m, b, c, p, v }, r) => {
    const f = [1, 3 * m, b, c]
    const df = dcs(f)
    const gq = (t: number) => ev(f, t) + ev(df, t) * (p - t)
    const V1 = gq(p)
    const V2 = gq(-m)
    const hi = Math.max(V1, V2)
    const lo = Math.min(V1, V2)
    const ans = v === 0 ? hi - lo - 1 : V1 + V2
    // g(t) = -2t³ + (3p - 3m)t² + 6mpt + (bp + c)  (f = x³ + 3mx² + bx + c)
    const G = [-2, 3 * p - 3 * m, 6 * m * p, b * p + c]
    const pt = p === 0 ? "(-t)" : `(${p} - t)`
    return {
      text:
        v === 0
          ? `점 $(${p}, k)$ 에서 곡선 $y = ${texPoly(f)}$ 에 그을 수 있는 서로 다른 접선의 개수가 $3$ 이 되도록 하는 정수 $k$ 의 개수${ask(ans) === "의 값은?" ? "는?" : "를 구하시오."}`
          : `점 $(${p}, k)$ 에서 곡선 $y = ${texPoly(f)}$ 에 그을 수 있는 서로 다른 접선의 개수가 $2$ 가 되도록 하는 모든 실수 $k$ 의 값의 합은?`,
      ...answerI(r, ans, v === 0 ? [hi - lo + 1, hi - lo, ans + 2, V1 + V2] : [hi - lo, -ans, 2 * V1, 2 * V2, ans + 1]),
      solution: lines(
        `$f(x) = ${texPoly(f)}$ 위의 점 $(t, f(t))$ 에서의 접선 $y = f'(t)(x - t) + f(t)$ 가 점 $(${p}, k)$ 를 지나면 $k = f(t) + f'(t)${pt}$`,
        `$g(t) = f(t) + f'(t)${pt}$ 라 하면 $g(t) = ${texPoly(G, "t")}$ 이고, 접점이 다르면 접선도 다르므로 접선의 개수는 방정식 $g(t) = k$ 의 서로 다른 실근의 개수와 같다.`,
        `$g'(t) = f''(t)${pt} = (${texPoly([6, 6 * m], "t")})${pt}$ 이므로 $g(t)$ 는 $t = ${-m}$, $t = ${p}$ 에서 극값 $g(${-m}) = ${V2}$, $g(${p}) = ${V1}$ 을 갖는다.`,
        v === 0
          ? `접선이 $3$ 개이려면 $${lo} < k < ${hi}$ 이어야 하므로 정수 $k$ 의 개수는 $${ans}$`
          : `접선이 $2$ 개이려면 $k = ${V2}$ 또는 $k = ${V1}$ 이므로 합은 $${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ m, b, c, p, v }) => {
    const f = (x: number) => ev([1, 3 * m, b, c], x)
    const g = (t: number) => f(t) + deriv(f, t, 1e-4) * (p - t)
    const vals = gridVals(g, -12, 12, 32)
    let cnt = 0
    let sum = 0
    for (let k = -260; k <= 260; k++) {
      const n = gridCount(vals, k, 1e-6)
      if (v === 0 && n === 3) cnt++
      if (v === 1 && n === 2) sum += k
    }
    return v === 0 ? cnt : sum
  },
}

/** |f(x) - t| 가 미분가능하지 않은 점의 개수 h(t) 조건으로 사차함수 결정 */
type ND = { al: number; be: number; tgt: number; st: number[]; k: number }
const ndBase = (al: number, be: number) => [3, -4 * (al + be), 6 * al * be, 0, 0]
// h(t): 단조 구간마다 값의 범위(열린구간)에 t 가 있으면 1
const ndCount = (f: number[], crit: number[], t: number) => {
  const xs = [...crit].sort((a, b) => a - b)
  const vals = xs.map((x) => ev(f, x))
  let n = 0
  if (t > vals[0]) n++
  if (t > vals[vals.length - 1]) n++
  for (let i = 0; i + 1 < xs.length; i++) if (t > Math.min(vals[i], vals[i + 1]) && t < Math.max(vals[i], vals[i + 1])) n++
  return n
}
const ND_STAT = [
  { tex: "\\lim_{t \\to 0-} h(t)", f: (L: number, V: number, R: number) => L },
  { tex: "h(0)", f: (L: number, V: number, R: number) => V },
  { tex: "\\lim_{t \\to 0+} h(t)", f: (L: number, V: number, R: number) => R },
]
const ndCandidates = (al: number, be: number) => {
  const base = ndBase(al, be)
  const crit = [0, al, be]
  return crit.map((x) => {
    const c = -ev(base, x)
    const f = [...base.slice(0, 4), c]
    return { x, c, f, L: ndCount(f, crit, -0.5), V: ndCount(f, crit, 0), R: ndCount(f, crit, 0.5) }
  })
}
const nonDiff: SuTemplate<ND> = {
  ...head("d4-nondiff", U, "12미적Ⅰ-02-08", 4, 55),
  params: (r) => {
    const al = nz(r, -3, 2)
    const be = r.int(al + 1, 4)
    if (be === 0) return null
    const cs = ndCandidates(al, be)
    const vals = cs.map((c) => -c.c)
    if (new Set(vals).size < 3 || vals.some((v) => Math.abs(v) > 200)) return null
    const tgt = r.int(0, 2)
    // 목표 후보만 만족시키는 통계 조건 (1개 또는 2개)
    const opts: number[][] = []
    for (let i = 0; i < 3; i++) {
      const v = ND_STAT[i].f(cs[tgt].L, cs[tgt].V, cs[tgt].R)
      if (cs.filter((c) => ND_STAT[i].f(c.L, c.V, c.R) === v).length === 1) opts.push([i])
    }
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++) {
        const ok = cs.filter((c) => [i, j].every((s) => ND_STAT[s].f(c.L, c.V, c.R) === ND_STAT[s].f(cs[tgt].L, cs[tgt].V, cs[tgt].R))).length === 1
        if (ok && !opts.some((o) => o.length === 1 && (o[0] === i || o[0] === j))) opts.push([i, j])
      }
    if (!opts.length) return null
    return { al, be, tgt, st: r.pick(opts), k: r.pick([-2, -1, 1, 2, 3]) }
  },
  build: ({ al, be, tgt, st, k }, r) => {
    const cs = ndCandidates(al, be)
    const T = cs[tgt]
    const ans = ev(T.f, k)
    const conds = st.map((s) => `$${ND_STAT[s].tex} = ${ND_STAT[s].f(T.L, T.V, T.R)}$`)
    const base = ndBase(al, be)
    return {
      text: `상수 $c$ 에 대하여 함수 $f(x) = ${texPoly(base)} + c$ 가 있다. 실수 $t$ 에 대하여 함수 $|f(x) - t|$ 가 미분가능하지 않은 실수 $x$ 의 개수를 $h(t)$ 라 하자. 함수 $h(t)$ 가 다음 조건을 만족시킬 때, $f(${k})$ ${ask(ans)}\n(가) 함수 $h(t)$ 는 $t = 0$ 에서 불연속이다.\n(나) ${conds.join(", ")}`,
      ...answerI(r, ans, [...cs.filter((c) => c !== T).map((c) => ev(c.f, k)), ans + 1, ans - 1, -ans]),
      solution: lines(
        `$f'(x) = ${texPoly(dcs(base))} = 12x${fac(al)}${fac(be)}$ 이므로 $f(x)$ 는 $x = ${[0, al, be].sort((a, b) => a - b).join(", ")}$ 에서 극값을 갖는다.`,
        `$|f(x) - t|$ 는 방정식 $f(x) = t$ 의 실근 중 중근이 아닌 근(그래프가 직선 $y = t$ 를 뚫고 지나는 점)에서만 미분가능하지 않으므로, $h(t)$ 는 곡선 $y = f(x)$ 가 직선 $y = t$ 를 가로지르는 점의 개수이다.`,
        `$h(t)$ 는 $t$ 가 극값을 지날 때만 값이 바뀌므로 (가)에서 $0$ 은 $f(x)$ 의 극값 중 하나이다. 즉 $c = ${cs.map((c) => c.c).join("$ 또는 $c = ")}$`,
        ...cs.map(
          (c) =>
            `$f(${c.x}) = 0$ 인 경우 ($c = ${c.c}$): $\\lim_{t \\to 0-} h(t) = ${c.L}$, $h(0) = ${c.V}$, $\\lim_{t \\to 0+} h(t) = ${c.R}$`
        ),
        `(나)를 만족시키는 것은 $c = ${T.c}$ 뿐이므로 $f(x) = ${texPoly(T.f)}$`,
        `따라서 $f(${k}) = ${ans}$`
      ),
      score: 4,
    }
  },
  // c 를 정수 범위에서 모두 넣어 h(t) 를 부호 변화로 직접 센다
  verify: ({ al, be, tgt, st, k }) => {
    const cs = ndCandidates(al, be)
    const T = cs[tgt]
    const want = st.map((s) => ND_STAT[s].f(T.L, T.V, T.R))
    const base = ndBase(al, be)
    const found: number[] = []
    const vals = gridVals((x) => ev(base, x), -7, 7, 40)
    // 부호가 바뀌는 점(홀수 중근)만 센다
    const H = (c: number, t: number) => {
      let n = 0
      let prev = 0
      for (let i = 0; i < vals.length; i++) {
        const y = vals[i] + c - t
        if (y === 0) continue
        if (prev * y < 0) n++
        prev = y
      }
      return n
    }
    for (let c = -210; c <= 210; c++) {
      const L = H(c, -0.25)
      const V = H(c, 0)
      const R = H(c, 0.25)
      if (L === V && V === R) continue
      const got = [L, V, R]
      if (st.every((s, i) => got[s] === want[i])) found.push(ev(base, k) + c)
    }
    return only(found) ?? NaN
  },
}

/** 대칭인 사차함수 결정 */
const quarticSym: SuTemplate<{ w: number; a: number; v: number; k: number }> = {
  ...head("d4-quartic-sym", U, "12미적Ⅰ-02-08", 4, 55),
  params: (r) => {
    const w = r.int(-3, 3)
    const k = w + nz(r, -3, 3)
    return { w, a: r.int(1, 3), v: r.int(0, 1), k }
  },
  build: ({ w, a, v, k }, r) => {
    const A = -2 * a * a
    // f(x) = (x-w)⁴ + A(x-w)²
    const F = (x: number) => (x - w) ** 4 + A * (x - w) ** 2
    const ans = F(k)
    const D = 4 + 2 * A
    const E = 1 + A
    const cond = v === 0 ? `$f'(${w + 1}) = ${D}$` : `$f(${w + 1}) = ${E}$`
    const u = k - w
    return {
      text: `최고차항의 계수가 $1$ 인 사차함수 $f(x)$ 가 다음 조건을 만족시킨다.\n(가) 모든 실수 $x$ 에 대하여 $f(${w === 0 ? "x" : `${w} + x`}) = f(${w === 0 ? "-x" : `${w} - x`})$ 이다.\n(나) 방정식 $f(x) = 0$ 의 서로 다른 실근의 개수는 $3$ 이다.\n(다) ${cond}\n이때 $f(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [u ** 4 - A * u * u, u ** 4 + A * u * u + 1, u ** 4 + (A / 2) * u * u, ans + 1, -ans, F(k + 1)]),
      solution: lines(
        `(가)에서 곡선 $y = f(x)$ 는 직선 $x = ${w}$ 에 대하여 대칭이므로 $f(x) = ${fac(w)}^{4} + p${fac(w)}^{2} + q$ 로 놓을 수 있다.`,
        `$f(x) = 0$ 의 근은 $x = ${w}$ 에 대하여 대칭으로 짝을 이루므로, 실근의 개수가 홀수인 $3$ 이려면 $x = ${w}$ 가 근이어야 한다. 즉 $q = 0$`,
        `이때 $f(x) = ${fac(w)}^{2}\\{${fac(w)}^{2} + p\\}$ 이고 서로 다른 실근이 $3$ 개이려면 $p < 0$`,
        v === 0
          ? `$f'(x) = 4${fac(w)}^{3} + 2p${fac(w)}$ 이므로 $f'(${w + 1}) = 4 + 2p = ${D}$ 에서 $p = ${A}$`
          : `$f(${w + 1}) = 1 + p = ${E}$ 에서 $p = ${A}$`,
        `따라서 $f(x) = ${fac(w)}^{4} ${signed(A)}${fac(w)}^{2}$ 이고 $f(${k}) = ${paren(u)}^{4} ${signed(A)} \\times ${paren(u)}^{2} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ w, a, v, k }) => {
    const A0 = -2 * a * a
    const D = 4 + 2 * A0
    const E = 1 + A0
    const found: number[] = []
    for (let A = -40; A <= 40; A++) {
      if (v === 0 && Math.abs(deriv((x) => (x - w) ** 4 + A * (x - w) ** 2, w + 1) - D) > 1e-5) continue
      for (let B = -60; B <= 60; B++) {
        if (v === 1 && 1 + A + B !== E) continue
        const f = (x: number) => (x - w) ** 4 + A * (x - w) ** 2 + B
        if (gridCount(gridVals(f, w - 8, w + 8, 16), 0) !== 3) continue
        found.push(f(k))
      }
    }
    return only(found) ?? NaN
  },
}

export const DERIVATIVE: SuTemplate[] = [
  dValue,
  prodRule,
  defn1,
  tangent1,
  velocity1,
  defn2,
  diffable,
  mvt,
  incrRange,
  extVal,
  maxMin,
  tanSecond,
  tanExt,
  rootCount,
  ineqAlways,
  motion3,
  cubicGraph,
  tanCount,
  nonDiff,
  quarticSym,
]
