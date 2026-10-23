// 미적분Ⅰ · 적분 (12미적Ⅰ-03-01 ~ 06)
import { deriv, integrate, isShortOk, limitAt, pEval, pInteg, q, roots, signed, texPoly, texShift, paren, term } from "../kit"
import type { SuTemplate } from "../types"
import { answerI, ask, cases, coefTex, plus, cx, dcs, plusPoly, ev, fac, facs, gridCount, gridVals, head, integrateAbs, lines, mcI, mcQ, nz, only, simpson, solveLinear, times, U_INT } from "./helpers"

const U = U_INT
/** 정수 계수 다항식의 부정적분 (유리수 계수, 상수항 0) */
const F = (cs: number[]) => pInteg(cs.map((c) => q(c)))
/** ∫_a^b (정확한 값) */
const defI = (cs: number[], a: number, b: number) => pEval(F(cs), b).sub(pEval(F(cs), a))
const bracket = (cs: number[], a: number, b: number) => `\\left[ ${texPoly(F(cs))} \\right]_{${a}}^{${b}}`
const intTex = (a: number | string, b: number | string, body: string, v = "x") => `\\int_{${a}}^{${b}} ${body} \\, d${v}`
const wrap = (cs: number[], v = "x") => (cs.filter((c) => c !== 0).length > 1 || texPoly(cs, v).startsWith("-") ? `(${texPoly(cs, v)})` : texPoly(cs, v))

// ───────────────────────── 1단계 ─────────────────────────

/** 부정적분과 적분상수 */
const antideriv: SuTemplate<{ A: number; B: number; C: number; x0: number; d: number; k: number }> = {
  ...head("i1-antideriv", U, "12미적Ⅰ-03-01", 1, 60),
  params: (r) => {
    const x0 = r.pick([0, 0, 1, -1])
    const k = r.int(-2, 3)
    if (k === x0) return null
    return { A: nz(r, -3, 3), B: r.int(-4, 4), C: r.int(-6, 6), x0, d: r.int(-8, 8), k }
  },
  build: ({ A, B, C, x0, d, k }, r) => {
    const fp = [3 * A, 2 * B, C]
    const K = d - ev([A, B, C, 0], x0)
    const f = [A, B, C, K]
    const ans = ev(f, k)
    return {
      text: `함수 $f(x)$ 에 대하여 $f'(x) = ${texPoly(fp)}$ 이고 $f(${x0}) = ${d}$ 일 때, $f(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [ev([A, B, C, 0], k), ev([A, B, C, d], k), ev(fp, k), ans + 1, ans - 1, -ans]),
      solution: lines(
        `$f(x) = \\int (${texPoly(fp)}) dx = ${texPoly([A, B, C, 0])} + C$ ($C$ 는 적분상수)`,
        `$f(${x0}) = ${ev([A, B, C, 0], x0)} + C = ${d}$ 에서 $C = ${K}$`,
        `따라서 $f(x) = ${texPoly(f)}$ 이고 $f(${k}) = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ A, B, C, x0, d, k }) => d + integrate((x) => ev([3 * A, 2 * B, C], x), x0, k),
}

/** 정적분 계산 */
const defint: SuTemplate<{ cs: number[]; a: number; b: number }> = {
  ...head("i1-defint", U, "12미적Ⅰ-03-02", 1, 60),
  params: (r) => {
    const cs = r.chance(0.6) ? [r.pick([3, 6, -3, 1, 2]), r.int(-6, 6), r.int(-6, 6)] : [r.pick([4, -4, 1]), r.pick([0, 3, -3]), r.int(-4, 4), r.int(-5, 5)]
    const a = r.int(-2, 1)
    const b = a + r.int(1, 3)
    return { cs, a, b }
  },
  build: ({ cs, a, b }, r) => {
    const ans = defI(cs, a, b)
    const Fb = pEval(F(cs), b)
    const Fa = pEval(F(cs), a)
    return {
      text: `$${intTex(a, b, wrap(cs))}$ 의 값은?`,
      ...mcQ(r, ans, [Fb.add(Fa), Fb, Fa.sub(Fb), ans.add(1), q(ev(dcs(cs), b) - ev(dcs(cs), a))]),
      solution: lines(`$${intTex(a, b, wrap(cs))} = ${bracket(cs, a, b)}$`, Fa.n === 0 ? `$x = ${a}$ 에서의 값이 $0$ 이므로 구하는 값은 $${ans.tex()}$` : `따라서 구하는 값은 $${Fb.tex()} - ${paren(Fa)} = ${ans.tex()}$`),
      score: 2,
    }
  },
  verify: ({ cs, a, b }) => integrate((x) => ev(cs, x), a, b),
}

/** 정적분의 성질 */
const props: SuTemplate<{ v: number; f: number[]; g: number[]; a: number; b: number; c: number }> = {
  ...head("i1-props", U, "12미적Ⅰ-03-03", 1, 60),
  params: (r) => {
    const v = r.int(0, 2)
    if (v === 0) {
      const a = r.int(-2, 0)
      const c = a + r.int(1, 2)
      const b = c + r.int(1, 2)
      return { v, f: [r.pick([3, 6, -3]), r.pick([2, 4, -2, -4, 0]), r.int(-5, 5)], g: [], a, b, c }
    }
    if (v === 1) {
      const a = r.int(-1, 1)
      const b = a + r.int(1, 3)
      const top = [nz(r, -3, 3), r.int(-5, 5)]
      const f = [...top, r.pick([2, 4, -2, 6]), r.int(-6, 6)]
      const g = [...top, r.pick([-2, 0, 4, -4]), r.int(-6, 6)]
      if (f[2] === g[2] && f[3] === g[3]) return null
      return { v, f, g, a, b, c: 0 }
    }
    const a = r.int(1, 3)
    return { v, f: [nz(r, -5, 5), r.pick([3, -3, 6]), r.int(-7, 7), r.int(-5, 5)], g: [], a: -a, b: a, c: 0 }
  },
  build: ({ v, f, g, a, b, c }, r) => {
    if (v === 0) {
      const ans = defI(f, a, b)
      return {
        text: `$${intTex(a, c, wrap(f))} + ${intTex(c, b, wrap(f))}$ 의 값은?`,
        ...mcQ(r, ans, [defI(f, a, c), defI(f, c, b), defI(f, a, c).sub(defI(f, c, b)), ans.neg(), ans.add(1)]),
        solution: lines(
          `정적분의 성질 $\\int_{a}^{c} f(x) \\, dx + \\int_{c}^{b} f(x) \\, dx = \\int_{a}^{b} f(x) \\, dx$ 에 의하여`,
          `(주어진 식) $= ${intTex(a, b, wrap(f))} = ${bracket(f, a, b)}$`,
          `따라서 구하는 값은 $${ans.tex()}$`
        ),
        score: 2,
      }
    }
    if (v === 1) {
      const d = [f[2] - g[2], f[3] - g[3]]
      const ans = defI(d, a, b)
      return {
        text: `$${intTex(a, b, wrap(f))} - ${intTex(a, b, wrap(g))}$ 의 값은?`,
        ...mcQ(r, ans, [defI([f[2] + g[2], f[3] + g[3]], a, b), ans.neg(), defI(f, a, b), ans.add(1), ans.mul(2)]),
        solution: lines(
          `적분 구간이 같으므로 피적분함수끼리 빼서 한 번에 계산한다.`,
          `(주어진 식) $= ${intTex(a, b, wrap(d))} = ${bracket(d, a, b)}$`,
          `따라서 구하는 값은 $${ans.tex()}$`
        ),
        score: 2,
      }
    }
    const ev2 = [f[1], 0, f[3]]
    const ans = defI(ev2, 0, b).mul(2)
    return {
      text: `$${intTex(a, b, wrap(f))}$ 의 값은?`,
      ...mcQ(r, ans, [defI(f, 0, b), defI(ev2, 0, b), ans.neg(), defI(f, 0, b).mul(2), ans.add(1)]),
      solution: lines(
        `$${texPoly([f[0], 0, f[2], 0])}$ 은 홀수 차수의 항만 있어 $${intTex(-b, b, wrap([f[0], 0, f[2], 0]))} = 0$`,
        `나머지 항만 남으므로 (주어진 식) $= 2${intTex(0, b, wrap(ev2))} = 2${bracket(ev2, 0, b)}$`,
        `따라서 구하는 값은 $${ans.tex()}$`
      ),
      score: 2,
    }
  },
  verify: ({ v, f, g, a, b, c }) => {
    const ff = (x: number) => ev(f, x)
    if (v === 0) return integrate(ff, a, c) + integrate(ff, c, b)
    if (v === 1) return integrate(ff, a, b) - integrate((x) => ev(g, x), a, b)
    return integrate(ff, a, b)
  },
}

/** 곡선과 x축 사이 넓이 */
const area1: SuTemplate<{ k: number; p: number; qq: number }> = {
  ...head("i1-area", U, "12미적Ⅰ-03-05", 1, 60),
  params: (r) => {
    const p = r.int(-4, 2)
    const qq = p + r.int(1, 5)
    return { k: r.pick([1, -1, 2, -2, 3, -3, 6]), p, qq }
  },
  build: ({ k, p, qq }, r) => {
    const f = [k, -k * (p + qq), k * p * qq]
    const sgn = defI(f, p, qq)
    const ans = sgn.n < 0 ? sgn.neg() : sgn
    return {
      text: `곡선 $y = ${texPoly(f)}$ 와 $x$ 축으로 둘러싸인 부분의 넓이는?`,
      ...mcQ(r, ans, [ans.neg(), ans.mul(2), q((qq - p) ** 3, 6), q(Math.abs(k) * (qq - p) ** 3, 3), ans.add(1)].filter((x) => !x.eq(ans))),
      solution: lines(
        `$${texPoly(f)} = ${facs(k, [p, qq])} = 0$ 에서 $x = ${p}$ 또는 $x = ${qq}$`,
        `$${p} \\le x \\le ${qq}$ 에서 $y ${k > 0 ? "\\le" : "\\ge"} 0$ 이므로 넓이는 $${k > 0 ? "-" : ""}${intTex(p, qq, wrap(f))}$`,
        `$${intTex(p, qq, wrap(f))} = ${bracket(f, p, qq)} = ${sgn.tex()}$ 이므로 넓이는 $${ans.tex()}$`
      ),
      score: 2,
    }
  },
  verify: ({ k, p, qq }) => integrateAbs((x) => k * (x - p) * (x - qq), p - 1, qq + 1) - integrateAbs((x) => k * (x - p) * (x - qq), p - 1, p) - integrateAbs((x) => k * (x - p) * (x - qq), qq, qq + 1),
}

/** 속도와 위치 */
const disp1: SuTemplate<{ A: number; B: number; C: number; x0: number; T: number; t1: number; v: number }> = {
  ...head("i1-disp", U, "12미적Ⅰ-03-06", 1, 60),
  params: (r) => {
    const v = r.int(0, 1)
    const t1 = v === 0 ? 0 : r.int(1, 2)
    return { A: r.pick([1, 1, 2, -1]), B: r.int(-4, 4), C: r.int(-5, 8), x0: r.int(-5, 5), T: t1 + r.int(1, 3), t1, v }
  },
  build: ({ A, B, C, x0, T, t1, v }, r) => {
    const vel = [3 * A, 2 * B, C]
    const disp = defI(vel, t1, T).value
    const ans = v === 0 ? x0 + disp : disp
    const vtex = `v(t) = ${texPoly(vel, "t")}`
    return {
      text:
        v === 0
          ? `원점을 출발하지 않고 위치 $${x0}$ 에서 출발하여 수직선 위를 움직이는 점 $\\mathrm{P}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 속도가 $${vtex}$ 이다. 시각 $t = ${T}$ 에서 점 $\\mathrm{P}$ 의 위치${isShortOk(ans) ? "를 구하시오." : "는?"}`.replace("원점을 출발하지 않고 위치", "시각 $t = 0$ 일 때 위치")
          : `수직선 위를 움직이는 점 $\\mathrm{P}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 속도가 $${vtex}$ 일 때, 시각 $t = ${t1}$ 에서 $t = ${T}$ 까지 점 $\\mathrm{P}$ 의 위치의 변화량${isShortOk(ans) ? "을 구하시오." : "은?"}`,
      ...answerI(r, ans, v === 0 ? [disp, x0 - disp, ans + 1, ans - 1, ev(vel, T)] : [-ans, ev(vel, T) - ev(vel, t1), ans + 1, ans - 1, ev([A, B, C, 0], T)]),
      solution: lines(
        v === 0 ? `시각 $t = ${T}$ 에서의 위치는 $${x0} + ${intTex(0, T, `(${texPoly(vel, "t")})`, "t")}$` : `위치의 변화량은 $${intTex(t1, T, `(${texPoly(vel, "t")})`, "t")}$`,
        `$${intTex(t1, T, `(${texPoly(vel, "t")})`, "t")} = \\left[ ${texPoly([A, B, C, 0], "t")} \\right]_{${t1}}^{${T}} = ${disp}$`,
        v === 0 ? `따라서 구하는 위치는 $${plus(x0, disp)} = ${ans}$` : `따라서 구하는 값은 $${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ A, B, C, x0, T, t1, v }) => {
    const d = integrate((t) => ev([3 * A, 2 * B, C], t), t1, T)
    return v === 0 ? x0 + d : d
  },
}

// ───────────────────────── 2단계 ─────────────────────────

/** 정적분으로 정의된 함수: 대입과 미분 */
const defnFn: SuTemplate<{ L: number; a: number; c: number; p: number; k: number }> = {
  ...head("i2-defnfn", U, "12미적Ⅰ-03-04", 2, 72),
  params: (r) => {
    const p = nz(r, -2, 3)
    const k = nz(r, -2, 3) // f(0) = c 는 a 와 무관하게 정해지므로 묻지 않는다
    const a = nz(r, -6, 6)
    return { L: r.pick([1, 1, 2, -1]), a, c: r.int(-8, 8), p, k }
  },
  build: ({ L, a, c, p, k }, r) => {
    const d = -(L * p ** 3 + a * p * p + c * p)
    const fcs = [3 * L, 2 * a, c]
    const ans = ev(fcs, k)
    const rhs = `${texPoly([L, 0, 0, 0])} + ax^{2}${term(c, "x")}${term(d, "")}`
    return {
      text: `다항함수 $f(x)$ 가 모든 실수 $x$ 에 대하여 $${intTex(p, "x", "f(t)", "t")} = ${rhs}$ 를 만족시킬 때, $f(${k})$ ${ask(ans)} (단, $a$ 는 상수이다.)`,
      ...answerI(r, ans, [ev([3 * L, a, c], k), ev([3 * L, -2 * a, c], k), ev([L, a, c, d], k), ans + 1, ans - 1, -ans]),
      solution: lines(
        `양변에 $x = ${p}$ 를 대입하면 좌변은 $0$ 이므로 $0 = ${L * p ** 3}${term(p * p, "a")}${term(c * p + d, "")}$, 즉 $a = ${a}$`,
        `양변을 $x$ 에 대하여 미분하면 $f(x) = ${texPoly([3 * L, 0, 0])} + 2ax${term(c, "")} = ${texPoly(fcs)}$`,
        `따라서 $f(${k}) = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ L, a, c, p, k }) => {
    const d = -(L * p ** 3 + a * p * p + c * p)
    const found: number[] = []
    for (let A = -20; A <= 20; A++) {
      const G = (x: number) => L * x ** 3 + A * x * x + c * x + d
      if (Math.abs(G(p)) < 1e-9) found.push(deriv(G, k))
    }
    // 대입 조건 없이(a 가 달라도) 같은 답이 나오면 조건을 쓰지 않는 문제
    if (Math.abs(deriv((x) => L * x ** 3 + (a + 1) * x * x + c * x, k) - deriv((x) => L * x ** 3 + a * x * x + c * x, k)) < 1e-6) return NaN
    return only(found) ?? NaN
  },
}

/** 절댓값 함수의 정적분 */
const absInt: SuTemplate<{ v: number; a: number; l: number; m: number; k: number }> = {
  ...head("i2-abs", U, "12미적Ⅰ-03-03", 2, 72),
  params: (r) => {
    const v = r.int(0, 1)
    if (v === 0) {
      const a = r.int(-3, 4)
      const l = a - r.int(1, 4)
      const m = a + r.int(1, 4)
      return { v, a, l, m, k: r.pick([1, 2, 3]) }
    }
    const a = r.int(1, 4)
    return { v, a, l: 0, m: a + r.int(1, 3), k: r.pick([1, 1, 3, 2]) }
  },
  build: ({ v, a, l, m, k }, r) => {
    if (v === 0) {
      const f = [k, -k * a]
      const left = defI([-k, k * a], l, a)
      const right = defI(f, a, m)
      const ans = left.add(right)
      const body = `|${texPoly(f)}|`
      return {
        text: `$${intTex(l, m, body)}$ 의 값은?`,
        ...mcQ(r, ans, [defI(f, l, m), right.sub(left), ans.add(q(1, 2)), ans.mul(2), left]),
        solution: lines(
          `$x \\le ${a}$ 일 때 $${body} = ${texPoly([-k, k * a])}$, $x \\ge ${a}$ 일 때 $${body} = ${texPoly(f)}$`,
          `(주어진 식) $= ${intTex(l, a, wrap([-k, k * a]))} + ${intTex(a, m, wrap(f))}$`,
          `따라서 구하는 값은 $${left.tex()} + ${right.tex()} = ${ans.tex()}$`
        ),
        score: 3,
      }
    }
    const f = [k, -k * a, 0]
    const left = defI([-k, k * a, 0], 0, a)
    const right = defI(f, a, m)
    const ans = left.add(right)
    const body = `|${texPoly(f)}|`
    return {
      text: `$${intTex(0, m, body)}$ 의 값은?`,
      ...mcQ(r, ans, [defI(f, 0, m), right.sub(left), left, right, ans.add(1)]),
      solution: lines(
        `$${texPoly(f)} = ${facs(k, [0, a])}$ 이므로 $0 \\le x \\le ${a}$ 에서 $${texPoly(f)} \\le 0$, $x \\ge ${a}$ 에서 $${texPoly(f)} \\ge 0$`,
        `(주어진 식) $= -${intTex(0, a, wrap(f))} + ${intTex(a, m, wrap(f))}$`,
        `따라서 구하는 값은 $${left.tex()} + ${right.tex()} = ${ans.tex()}$`
      ),
      score: 3,
    }
  },
  verify: ({ v, a, l, m, k }) => (v === 0 ? integrateAbs((x) => k * (x - a), l, m) : integrateAbs((x) => k * x * (x - a), 0, m)),
}

/** 구간별로 정의된 연속함수의 정적분 */
const pieceInt: SuTemplate<{ k: number; p: number; m: number; l: number; u: number }> = {
  ...head("i2-piecewise", U, "12미적Ⅰ-03-03", 2, 72),
  params: (r) => {
    const k = r.int(-1, 2)
    return { k, p: r.int(-4, 4), m: nz(r, -4, 4), l: k - r.int(1, 2), u: k + r.int(1, 2) }
  },
  build: ({ k, p, m, l, u }, r) => {
    const n = k * k + p - m * k
    const L = [1, 0, p]
    const R = [m, n]
    const I1 = defI(L, l, k)
    const I2 = defI(R, k, u)
    const ans = I1.add(I2)
    const f = cases([texPoly(L), `x < ${k}`], [`${cx(m)} + a`, `x \\ge ${k}`])
    return {
      text: `함수 $f(x) = ${f}$ 가 실수 전체의 집합에서 연속일 때, $${intTex(l, u, "f(x)")}$ 의 값은? (단, $a$ 는 상수이다.)`,
      ...mcQ(r, ans, [defI(L, l, u), defI(R, l, u), I1.sub(I2), defI([m, k * k + p], k, u).add(I1), ans.add(1)]),
      solution: lines(
        `$x = ${k}$ 에서 연속이므로 $${k * k + p} = ${m * k === 0 ? "a" : `${m * k} + a`}$, 즉 $a = ${n}$`,
        `$${intTex(l, u, "f(x)")} = ${intTex(l, k, wrap(L))} + ${intTex(k, u, wrap(R))}$`,
        `따라서 구하는 값은 $${plus(I1, I2)} = ${ans.tex()}$`
      ),
      score: 3,
    }
  },
  verify: ({ k, p, m, l, u }) => {
    const a = limitAt((x) => x * x + p - m * x, k)
    return simpson((x) => x * x + p, l, k) + simpson((x) => m * x + a, k, u)
  },
}

/** 두 곡선(곡선과 직선) 사이의 넓이 */
const area2: SuTemplate<{ v: number; al: number; be: number; a1: number; a2: number; b1: number; c1: number }> = {
  ...head("i2-area2", U, "12미적Ⅰ-03-05", 2, 72),
  params: (r) => {
    const v = r.int(0, 1)
    const al = r.int(-3, 2)
    const be = al + r.int(1, 4)
    const a1 = r.pick([1, -1, 2, -2, 3])
    const a2 = v === 0 ? 0 : r.pick([1, -1, 2, -2, 3, 0].filter((x) => x !== a1))
    if (v === 1 && a2 === 0) return null
    return { v, al, be, a1, a2, b1: r.int(-4, 4), c1: r.int(-5, 5) }
  },
  build: ({ v, al, be, a1, a2, b1, c1 }, r) => {
    const f = [a1, b1, c1]
    const dlt = a1 - a2 // f - g = dlt (x-α)(x-β)
    const g = [a1 - dlt, b1 + dlt * (al + be), c1 - dlt * al * be]
    const ans = q(Math.abs(dlt) * (be - al) ** 3, 6)
    const gTex = v === 0 ? texPoly(g.slice(1)) : texPoly(g)
    return {
      text: `곡선 $y = ${texPoly(f)}$ 와 ${v === 0 ? "직선" : "곡선"} $y = ${gTex}$ 로 둘러싸인 부분의 넓이는?`,
      ...mcQ(r, ans, [ans.mul(2), q(Math.abs(dlt) * (be - al) ** 3, 3), q((be - al) ** 3, 6), ans.add(1), q(Math.abs(dlt) * (be - al) ** 2, 2)].filter((x) => !x.eq(ans))),
      solution: lines(
        `두 식을 빼면 $(${texPoly(f)}) - (${gTex}) = ${texPoly([dlt, -dlt * (al + be), dlt * al * be])} = ${facs(dlt, [al, be])}$`,
        `교점의 $x$ 좌표는 $${al}, ${be}$ 이고, 그 사이에서 ${dlt > 0 ? `$y = ${gTex}$ 가 위쪽` : `$y = ${texPoly(f)}$ 가 위쪽`}에 있다.`,
        `넓이는 $${intTex(al, be, `\\{${dlt > 0 ? "-" : ""}${facs(dlt > 0 ? dlt : -dlt, [al, be])}\\}`)} = ${ans.tex()}$`
      ),
      score: 3,
    }
  },
  verify: ({ v, al, be, a1, a2, b1, c1 }) => {
    const dlt = a1 - a2
    const f = (x: number) => ev([a1, b1, c1], x)
    const g = (x: number) => ev([a1 - dlt, b1 + dlt * (al + be), c1 - dlt * al * be], x)
    const xs = roots((x) => f(x) - g(x), -10, 10, 1000)
    return xs.length === 2 ? Math.abs(simpson((x) => f(x) - g(x), xs[0], xs[1], 4)) : NaN
  },
}

/** 속도의 부호가 바뀔 때 움직인 거리 */
const dist2: SuTemplate<{ c: number; al: number; be: number; T: number }> = {
  ...head("i2-dist", U, "12미적Ⅰ-03-06", 2, 72),
  params: (r) => {
    const al = r.int(0, 3)
    const be = al + r.int(1, 4)
    const T = al + r.int(1, be - al + 2)
    return { c: r.pick([1, 1, 3, -1, 2, -3]), al, be, T }
  },
  build: ({ c, al, be, T }, r) => {
    const vel = [c, -c * (al + be), c * al * be]
    const cuts = [0, ...[al, be].filter((x) => x > 0 && x < T), T]
    const parts = cuts.slice(0, -1).map((x, i) => defI(vel, x, cuts[i + 1]))
    const ans = parts.reduce((s, x) => s.add(x.n < 0 ? x.neg() : x), q(0))
    const disp = defI(vel, 0, T)
    return {
      text: `수직선 위를 움직이는 점 $\\mathrm{P}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 속도가 $v(t) = ${texPoly(vel, "t")}$ 일 때, 시각 $t = 0$ 에서 $t = ${T}$ 까지 점 $\\mathrm{P}$ 가 움직인 거리는?`,
      ...mcQ(r, ans, [disp, disp.n < 0 ? disp.neg() : disp.add(2), ans.add(1), ans.mul(2), parts[0].n < 0 ? parts[0].neg() : parts[0]].filter((x) => !x.eq(ans))),
      solution: lines(
        `$v(t) = ${facs(c, [al, be], "t")}$ 이므로 $t = ${cuts.slice(1, -1).join(", ") || "-"}$ 의 좌우에서 $v(t)$ 의 부호가 바뀐다.`.replace("$t = -$ 의 좌우에서 $v(t)$ 의 부호가 바뀐다.", "$0 < t < " + T + "$ 에서 $v(t)$ 의 부호가 바뀌지 않는다."),
        `움직인 거리는 $${intTex(0, T, "|v(t)|", "t")} = ${parts.map((x, i) => `\\left| ${intTex(cuts[i], cuts[i + 1], "v(t)", "t")} \\right|`).join(" + ")}$`,
        `따라서 구하는 값은 $${parts.map((x) => (x.n < 0 ? x.neg() : x).tex()).join(" + ")} = ${ans.tex()}$`
      ),
      score: 3,
    }
  },
  verify: ({ c, al, be, T }) => integrateAbs((t) => c * (t - al) * (t - be), 0, T),
}

// ───────────────────────── 3단계 ─────────────────────────

/** x f(x) = ∫ f + 다항식 */
const xfx: SuTemplate<{ c: number; d: number; a: number; k: number; v: number }> = {
  ...head("i3-xfx", U, "12미적Ⅰ-03-04", 3, 65),
  params: (r) => {
    const c = r.pick([2, 4, -2, -4, 6])
    const a = nz(r, -3, 3)
    const k = r.int(-2, 3)
    if (k === a) return null
    return { c, d: r.int(-4, 4), a, k, v: r.int(0, 1) }
  },
  build: ({ c, d, a, k, v }, r) => {
    const A = (3 * c) / 2
    const e = -(c / 2) * a * a - d * a
    const f = [A, 2 * d, e]
    const ans = ev(f, k)
    const poly = texPoly([c, d, 0, 0])
    const eq =
      v === 0
        ? `xf(x) = ${intTex(a, "x", "f(t)", "t")} + ${poly}`.replace("+ -", "- ")
        : `${intTex(a, "x", "f(t)", "t")} = xf(x)${term(-c, "x^{3}")}${term(-d, "x^{2}")}`
    return {
      text: `다항함수 $f(x)$ 가 모든 실수 $x$ 에 대하여 $${eq}$ 를 만족시킬 때, $f(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [ev([A, 2 * d, 0], k), ev([3 * c, 2 * d, e], k), ev([A, d, e], k), ans + 1, -ans, ev(f, a)]),
      solution: lines(
        `양변을 $x$ 에 대하여 미분하면 $f(x) + xf'(x) = f(x) ${plusPoly([3 * c, 2 * d, 0])}$, 즉 $f'(x) = ${texPoly([3 * c, 2 * d])}$`,
        `따라서 $f(x) = ${texPoly([A, 2 * d, 0])} + C$ ($C$ 는 적분상수)`,
        a === 1
          ? `처음 식에 $x = 1$ 을 대입하면 $f(1) = ${c + d}$`
          : `처음 식에 $x = ${a}$ 를 대입하면 $${a === -1 ? "-" : a}f(${a}) = ${c * a ** 3 + d * a * a}$ 이므로 $f(${a}) = ${(c * a ** 3 + d * a * a) / a}$`,
        `$f(${a}) = ${ev([A, 2 * d, 0], a)} + C = ${(c * a ** 3 + d * a * a) / a}$ 에서 $C = ${e}$`,
        `따라서 $f(x) = ${texPoly(f)}$ 이고 $f(${k}) = ${ans}$`
      ),
      score: 4,
    }
  },
  // f(x) = px² + qx + r 로 놓고 세 점에서 항등식을 세워 연립 (적분은 수치)
  verify: ({ c, d, a, k }) => {
    const basis = [(t: number) => t * t, (t: number) => t, () => 1]
    const xs = [a + 1, a + 2, a - 1.5]
    const M = xs.map((x) => basis.map((b) => x * b(x) - simpson(b, a, x, 20)))
    const rhs = xs.map((x) => c * x ** 3 + d * x * x)
    const [p, qq, rr] = solveLinear(M, rhs)
    return p * k * k + qq * k + rr
  },
}

/** 정적분 값이 상수인 함수 */
const fconst: SuTemplate<{ v: number; a: number; b: number; m: number; k: number }> = {
  ...head("i3-fconst", U, "12미적Ⅰ-03-04", 3, 65),
  params: (r) => {
    const v = r.int(0, 1)
    const m = v === 0 ? r.pick([2, 3, -1, -2]) : r.pick([1, -1, 2, -2])
    return { v, a: r.pick([3, 6, -3]), b: r.pick([2, 4, -2, -4, 0, 6]), m, k: r.int(-2, 3) }
  },
  build: ({ v, a, b, m, k }, r) => {
    if (v === 0) {
      // f(x) = ax² + bx + K, K = ∫_0^m f
      const K = q(a * m ** 3, 3).add(q(b * m * m, 2)).div(1 - m)
      const ans = q(a * k * k + b * k).add(K)
      return {
        text: `함수 $f(x)$ 가 모든 실수 $x$ 에 대하여 $f(x) = ${texPoly([a, b, 0])} + ${intTex(0, m, "f(t)", "t")}$ 를 만족시킬 때, $f(${k})$ 의 값은?`,
        ...mcQ(r, ans, [q(a * k * k + b * k).sub(K), q(a * k * k + b * k).add(K.mul(m)), q(a * k * k + b * k), ans.add(1), q(a * k * k + b * k).add(q(a * m ** 3, 3).add(q(b * m * m, 2)))]),
        solution: lines(
          `$${intTex(0, m, "f(t)", "t")} = K$ ($K$ 는 상수)라 하면 $f(x) = ${texPoly([a, b, 0])} + K$`,
          `$K = ${intTex(0, m, `(${texPoly([a, b, 0], "t")} + K)`, "t")} = ${q(a * m ** 3, 3).add(q(b * m * m, 2)).tex()} ${m < 0 ? "-" : "+"} ${Math.abs(m) === 1 ? "" : Math.abs(m)}K$`,
          `$${1 - m === 1 ? "" : 1 - m === -1 ? "-" : 1 - m}K = ${q(a * m ** 3, 3).add(q(b * m * m, 2)).tex()}$ 에서 $K = ${K.tex()}$`,
          `따라서 $f(${k}) = ${plus(a * k * k + b * k, K)} = ${ans.tex()}$`
        ),
        score: 3,
      }
    }
    // f(x) = ax² + Kx + c, K = ∫_0^m f, c = b
    const c = b
    const rhs = q(a * m ** 3, 3).add(c * m)
    const coef = q(1).sub(q(m * m, 2))
    const K = rhs.div(coef)
    const ans = q(a * k * k + c).add(K.mul(k))
    return {
      text: `함수 $f(x)$ 가 모든 실수 $x$ 에 대하여 $f(x) = ${texPoly([a, 0, 0])} + x${intTex(0, m, "f(t)", "t")}${term(c, "")}$ 를 만족시킬 때, $f(${k})$ 의 값은?`,
      ...mcQ(r, ans, [q(a * k * k + c).sub(K.mul(k)), q(a * k * k + c).add(rhs.mul(k)), q(a * k * k + c), ans.add(1), q(a * k * k + c).add(K)]),
      solution: lines(
        `$${intTex(0, m, "f(t)", "t")} = K$ ($K$ 는 상수)라 하면 $f(x) = ${texPoly([a, 0, 0])} + Kx${term(c, "")}$`,
        `$K = ${intTex(0, m, `(${texPoly([a, 0, 0], "t")} + Kt${term(c, "")})`, "t")} = ${rhs.tex()} + ${q(m * m, 2).tex()}K$`,
        `$${coef.eq(1) ? "" : coef.eq(-1) ? "-" : coef.tex()}K = ${rhs.tex()}$ 에서 $K = ${K.tex()}$`,
        k === 0 ? `따라서 $f(0) = ${ans.tex()}$` : `따라서 $f(${k}) = ${a * k * k + c} + ${paren(K)} \\times ${paren(k)} = ${ans.tex()}$`
      ),
      score: 3,
    }
  },
  // K 에 대한 일차식 T(K) = ∫ f_K 를 수치로 두 번 계산해 고정점을 구한다
  verify: ({ v, a, b, m, k }) => {
    const fK = (K: number) => (x: number) => (v === 0 ? a * x * x + b * x + K : a * x * x + K * x + b)
    const T = (K: number) => simpson(fK(K), 0, m, 20)
    const T0 = T(0)
    const slope = T(1) - T0
    const K = T0 / (1 - slope)
    return fK(K)(k)
  },
}

/** 넓이가 같을 조건 */
const equalArea: SuTemplate<{ v: number; a: number; p: number; qq: number; side: number }> = {
  ...head("i3-equal-area", U, "12미적Ⅰ-03-05", 3, 65),
  params: (r) => {
    const v = r.pick([0, 0, 1])
    if (v === 0) {
      const p = r.int(-4, 3)
      const qq = p + 2 * r.int(1, 3)
      return { v, a: r.pick([1, -1, 2, -2, 3, -3]), p, qq, side: r.pick([1, -1]) }
    }
    return { v, a: r.pick([1, -1, 2, -2, 3]), p: 0, qq: r.int(1, 9), side: 1 }
  },
  build: ({ v, a, p, qq, side }, r) => {
    if (v === 0) {
      const f = [a, -a * (p + qq), a * p * qq]
      const t = side === 1 ? p + (3 * (qq - p)) / 2 : qq - (3 * (qq - p)) / 2
      const ans = t
      const cond = side === 1 ? `t > ${qq}` : `t < ${p}`
      const from = side === 1 ? p : qq
      return {
        text: `곡선 $y = ${texPoly(f)}$ 와 $x$ 축으로 둘러싸인 부분의 넓이를 $A$, 곡선 $y = ${texPoly(f)}$ 와 $x$ 축 및 직선 $x = t$ $${`(${cond})`}$ 로 둘러싸인 부분의 넓이를 $B$ 라 하자. $A = B$ 일 때, $t$ 의 값은?`.replace("$ $(", " \\ ("),
        ...mcI(r, ans, side === 1 ? [2 * qq - p, qq + (qq - p) / 2 + 1, p + 2 * (qq - p), qq + 1, t - 1] : [2 * p - qq, p - 1, qq - 2 * (qq - p), t + 1, t - 2]),
        solution: lines(
          `$y = ${facs(a, [p, qq])}$ 이고, $A = B$ 이며 두 부분은 $x$ 축을 기준으로 서로 반대쪽에 있으므로 $${intTex(from, "t", wrap(f))} = 0$ 이다.`,
          `적분하여 $t$ 에 대하여 정리하면 $${intTex(from, "t", wrap(f))} = ${coefTex(q(a, 6))}${fac(from, "t")}^{2}(2t${term(side === 1 ? p - 3 * qq : qq - 3 * p, "")})$`,
          `$t \\ne ${from}$ 이므로 $2t${term(side === 1 ? p - 3 * qq : qq - 3 * p, "")} = 0$, 즉 $t = ${ans}$`
        ),
        score: 3,
      }
    }
    const b = qq
    const ans = 2 * b
    return {
      text: `곡선 $y = ${a === 1 ? "" : a === -1 ? "-" : a}x(${texShift(b)})(x - k)$ 와 $x$ 축으로 둘러싸인 두 부분의 넓이가 서로 같을 때, 상수 $k$ 의 값은? (단, $k > ${b}$)`,
      ...mcI(r, ans, [3 * b, (3 * b) / 2 === Math.floor((3 * b) / 2) ? (3 * b) / 2 : 3 * b + 1, b + 1, 4 * b, 2 * b + 1]),
      solution: lines(
        `두 부분이 $x$ 축의 위쪽과 아래쪽에 있고 넓이가 같으므로 $${intTex(0, "k", `x(${texShift(b)})(x - k)`)} = 0$`,
        `피적분함수를 전개하면 $x^{3} - (k + ${b})x^{2} + ${b === 1 ? "" : b}kx$ 이므로 적분값은 $\\frac{k^{4}}{4} - \\frac{(k + ${b})k^{3}}{3} + \\frac{${b === 1 ? "" : b}k^{3}}{2}$ 이고,`,
        `이를 정리하면 $\\frac{k^{3}(${2 * b} - k)}{12} = 0$ 이다.`,
        `$k > ${b}$ 이므로 $k = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ v, a, p, qq, side }) => {
    if (v === 0) {
      const f = (x: number) => a * (x - p) * (x - qq)
      const from = side === 1 ? p : qq
      const G = (t: number) => simpson(f, from, t, 20)
      const lo0 = side === 1 ? qq + 1e-9 : p - 1e-9
      const hi0 = side === 1 ? qq + 10 * (qq - p) : p - 10 * (qq - p)
      let lo = lo0
      let hi = hi0
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2
        if (G(lo) * G(mid) <= 0) hi = mid
        else lo = mid
      }
      return (lo + hi) / 2
    }
    const b = qq
    const G = (k: number) => simpson((x) => a * x * (x - b) * (x - k), 0, k, 20)
    const ks = roots(G, b + 1e-6, 4 * b + 5, 2000)
    return ks.length === 1 ? ks[0] : NaN
  },
}

/** 두 점이 다시 만날 때 */
const meet: SuTemplate<{ p: number; qv: number; T: number; v: number }> = {
  ...head("i3-meet", U, "12미적Ⅰ-03-06", 3, 65),
  params: (r) => {
    const p = r.int(1, 6)
    const qv = 2 * r.int(-3, 4)
    const T = r.int(1, 7)
    const s = p + qv / 2
    const Tp = s - T // 다른 만나는 시각
    if (Tp > 0 && Tp <= T) return null
    const rr = T * T - s * T
    if (Math.abs(rr) > 40 || (qv === 0 && rr === 0)) return null
    return { p, qv, T, v: r.int(0, 1) }
  },
  build: ({ p, qv, T, v }, r) => {
    const s = p + qv / 2
    const rr = T * T - s * T
    const v1 = [3, -2 * p, 0]
    const v2 = [qv, rr]
    const x1 = [1, -p, 0, 0]
    const tc = q(2 * p, 3)
    const inside = tc.value < T
    const part1 = defI(v1, 0, 0).add(pEval(F(v1), tc)).sub(0)
    const d1 = inside ? part1.neg() : q(0)
    const xT = q(ev(x1, T))
    const d2 = inside ? xT.sub(part1) : xT.n < 0 ? xT.neg() : xT
    const dist = d1.add(d2)
    const ans = v === 0 ? dist : q(ev(x1, T))
    return {
      text: `원점에서 동시에 출발하여 수직선 위를 움직이는 두 점 $\\mathrm{P}$, $\\mathrm{Q}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 속도가 각각 $v_1(t) = ${texPoly(v1, "t")}$, $v_2(t) = ${texPoly(v2, "t")}$ 이다. 출발한 후 두 점 $\\mathrm{P}$, $\\mathrm{Q}$ 가 처음으로 다시 만나는 시각까지 ${v === 0 ? "점 $\\mathrm{P}$ 가 움직인 거리는?" : "가 만나는 위치는?"}`.replace("시각까지 가 만나는 위치는?", "시각에 두 점이 만나는 위치는?"),
      ...(v === 0 ? mcQ(r, ans, [q(ev(x1, T)), dist.add(d1), d2, ans.add(1), q(T ** 3)]) : mcQ(r, ans, [q(T ** 3), q(ev(x1, T) + 1), q(ev([1, p, 0, 0], T)), q(-ev(x1, T)), q(ev(v1, T))])),
      solution: lines(
        `두 점의 위치는 $x_1(t) = ${texPoly(x1, "t")}$, $x_2(t) = ${texPoly([qv / 2, rr, 0], "t")}$`,
        `$x_1(t) - x_2(t) = ${texPoly([1, -s, -rr, 0], "t")} = ${facs(1, [0, T, s - T], "t")}$ 이므로 출발 후 처음 만나는 시각은 $t = ${T}$`,
        v === 0
          ? inside
            ? `$v_1(t) = 3t(t - ${tc.tex()})$ 이므로 $t = ${tc.tex()}$ 에서 운동 방향이 바뀐다. 움직인 거리는 $\\left| ${intTex(0, tc.tex(), "v_1(t)", "t")} \\right| + ${intTex(tc.tex(), T, "v_1(t)", "t")} = ${d1.tex()} + ${d2.tex()} = ${ans.tex()}$`
            : `$0 < t < ${T}$ 에서 $v_1(t)$ 의 부호가 바뀌지 않으므로 움직인 거리는 $\\left| ${intTex(0, T, "v_1(t)", "t")} \\right| = ${ans.tex()}$`
          : `따라서 만나는 위치는 $x_1(${T}) = ${ans.tex()}$`
      ),
      score: 4,
    }
  },
  verify: ({ p, qv, T, v }) => {
    const s = p + qv / 2
    const rr = T * T - s * T
    const v1 = (t: number) => 3 * t * t - 2 * p * t
    const v2 = (t: number) => qv * t + rr
    const D = (t: number) => simpson((u) => v1(u) - v2(u), 0, t, 4)
    const ts = roots(D, 1e-4, 40, 8000)
    if (!ts.length) return NaN
    const t0 = ts[0]
    return v === 0 ? integrateAbs(v1, 0, t0) : simpson(v1, 0, t0, 4)
  },
}

/** 곡선과 접선으로 둘러싸인 넓이 */
const areaTan: SuTemplate<{ v: number; a: number; b: number; c: number; d: number; t: number }> = {
  ...head("i3-area-tan", U, "12미적Ⅰ-03-05", 3, 65),
  params: (r) => {
    const v = r.int(0, 1)
    const t = nz(r, -3, 3)
    if (v === 0) {
      const b = r.int(-6, 6)
      if (3 * t + b === 0) return null
      return { v, a: 1, b, c: r.int(-5, 5), d: r.int(-5, 5), t }
    }
    return { v, a: r.pick([1, -1, 2, 3, -3]), b: r.int(-5, 5), c: r.int(-5, 5), d: 0, t }
  },
  build: ({ v, a, b, c, d, t }, r) => {
    if (v === 0) {
      const f = [1, b, c, d]
      const m = ev(dcs(f), t)
      const tan = [m, ev(f, t) - m * t]
      const s = -2 * t - b
      const ans = q((s - t) ** 4, 12)
      return {
        text: `곡선 $y = ${texPoly(f)}$ 위의 점 $(${t}, ${ev(f, t)})$ 에서의 접선과 이 곡선으로 둘러싸인 부분의 넓이는?`,
        ...mcQ(r, ans, [q((s - t) ** 4, 6), q((s - t) ** 3, 6), q((s - t) ** 4, 4), ans.mul(2).add(1), q((s - t) ** 4, 3)]),
        solution: lines(
          `$y' = ${texPoly(dcs(f))}$ 이므로 접선은 $y = ${texPoly(tan)}$`,
          `$(${texPoly(f)}) - (${texPoly(tan)}) = ${fac(t)}^{2}${fac(s)}$ 이므로 두 그래프는 $x = ${t}$, $x = ${s}$ 에서 만난다.`,
          `넓이는 $\\left| ${intTex(Math.min(s, t), Math.max(s, t), `${fac(t)}^{2}${fac(s)}`)} \\right| = \\frac{${Math.abs(s - t)}^{4}}{12} = ${ans.tex()}$`
        ),
        score: 4,
      }
    }
    const f = [a, b, c]
    const m = ev(dcs(f), t)
    const tan = [m, ev(f, t) - m * t]
    const ans = q(Math.abs(a * t ** 3), 3)
    return {
      text: `곡선 $y = ${texPoly(f)}$ 위의 점 $(${t}, ${ev(f, t)})$ 에서의 접선과 이 곡선 및 $y$ 축으로 둘러싸인 부분의 넓이는?`,
      ...mcQ(r, ans, [q(Math.abs(a * t ** 3), 6), q(Math.abs(a * t ** 3), 2), q(Math.abs(t ** 3), 3), ans.add(1), q(Math.abs(a * t * t), 2)]),
      solution: lines(
        `$y' = ${texPoly(dcs(f))}$ 이므로 접선은 $y = ${texPoly(tan)}$`,
        `$(${texPoly(f)}) - (${texPoly(tan)}) = ${a === 1 ? "" : a === -1 ? "-" : a}${fac(t)}^{2}$`,
        `넓이는 $${intTex(Math.min(0, t), Math.max(0, t), `${Math.abs(a) === 1 ? "" : Math.abs(a)}${fac(t)}^{2}`)} = ${ans.tex()}$`
      ),
      score: 3,
    }
  },
  verify: ({ v, a, b, c, d, t }) => {
    const f = (x: number) => (v === 0 ? ev([1, b, c, d], x) : ev([a, b, c], x))
    const m = deriv(f, t)
    const g = (x: number) => f(x) - (m * (x - t) + f(t))
    if (v === 1) return Math.abs(simpson(g, Math.min(0, t), Math.max(0, t), 40))
    const others = roots(g, -20, 20, 2000).filter((x) => Math.abs(x - t) > 1e-3)
    if (others.length !== 1) return NaN
    return Math.abs(simpson(g, Math.min(t, others[0]), Math.max(t, others[0]), 40))
  },
}

// ───────────────────────── 4단계 ─────────────────────────

/** 운동 방향과 위치 변화량 조건으로 속도 결정 → 움직인 거리 */
const motionCond: SuTemplate<{ p: number; p2: number; qd: number; R: number }> = {
  ...head("i4-motion-cond", U, "12미적Ⅰ-03-06", 4, 44),
  params: (r) => {
    const p = r.int(1, 5)
    const p2 = r.int(-2, 6)
    if (p2 === p || (p + p2) % 2 !== 0) return null
    const R = Math.max(p, p2) + r.int(1, 3)
    // 같은 v(t)·같은 구간이면 같은 문제가 되도록 (나)의 구간 끝 q 를 (p, p2, R) 로 정한다 (조건만 다른 중복 방지)
    let qd = ((p * 7 + (p2 + 2) * 3 + R) % 6) + 1
    if (qd === 2 * p) qd = (qd % 6) + 1
    return { p, p2, qd, R }
  },
  build: ({ p, p2, qd, R }, r) => {
    const a = (-3 * (p + p2)) / 2
    const b = 3 * p * p2
    const vel = [3, 2 * a, b]
    const X = [1, a, b, 0]
    const D = ev(X, qd)
    const cuts = [0, ...[p, p2].filter((x) => x > 0 && x < R).sort((x, y) => x - y), R]
    const parts = cuts.slice(0, -1).map((x, i) => ev(X, cuts[i + 1]) - ev(X, x))
    const ans = parts.reduce((s, x) => s + Math.abs(x), 0)
    return {
      text: `수직선 위를 움직이는 점 $\\mathrm{P}$ 의 시각 $t \\ (t \\ge 0)$ 에서의 속도가 $v(t) = 3t^{2} + at + b$ 이다. 점 $\\mathrm{P}$ 가 다음 조건을 만족시킬 때, 시각 $t = 0$ 에서 $t = ${R}$ 까지 점 $\\mathrm{P}$ 가 움직인 거리${isShortOk(ans) ? "를 구하시오." : "는?"} (단, $a, b$ 는 상수이다.)\n(가) 점 $\\mathrm{P}$ 는 시각 $t = ${p}$ 에서 운동 방향을 바꾼다.\n(나) 시각 $t = 0$ 에서 $t = ${qd}$ 까지 점 $\\mathrm{P}$ 의 위치의 변화량은 $${D}$ 이다.`,
      ...answerI(r, ans, [ev(X, R), Math.abs(ev(X, R)), ans + parts.length, ans - 1, ans + 1, 2 * ans]),
      solution: lines(
        `(가)에서 $v(${p}) = 0$ 이므로 $${3 * p * p} + ${cx(p, "a")} + b = 0$ … ①`,
        `(나)에서 $${intTex(0, qd, "v(t)", "t")} = \\left[ t^{3} + \\frac{a}{2}t^{2} + bt \\right]_{0}^{${qd}} = ${qd ** 3} + ${q(qd * qd, 2).tex()}a + ${cx(qd, "b")} = ${D}$ … ②`,
        `①, ②를 연립하면 $a = ${2 * a}$, $b = ${b}$ 이므로 $v(t) = ${texPoly(vel, "t")} = ${facs(3, [p, p2], "t")}$ ($t = ${p}$ 은 중근이 아니므로 실제로 운동 방향이 바뀐다)`,
        `$0 \\le t \\le ${R}$ 에서 $v(t)$ 의 부호는 $t = ${cuts.slice(1, -1).join(", ")}$ 에서 바뀌므로 움직인 거리는`,
        `$${parts.map((x, i) => `\\left| ${intTex(cuts[i], cuts[i + 1], "v(t)", "t")} \\right|`).join(" + ")} = ${parts.map((x) => Math.abs(x)).join(" + ")} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ p, p2, qd, R }) => {
    const a0 = (-3 * (p + p2)) / 2
    const D = qd ** 3 + a0 * qd * qd + 3 * p * p2 * qd
    const found: number[] = []
    for (let A = -40; A <= 40; A++)
      for (let B = -160; B <= 160; B++) {
        if (3 * p * p + A * p + B !== 0) continue
        const v = (t: number) => 3 * t * t + A * t + B
        if (v(p - 1e-3) * v(p + 1e-3) >= 0) continue
        if (Math.abs(simpson(v, 0, qd, 4) - D) > 1e-6) continue
        found.push(integrateAbs(v, 0, R))
      }
    return only(found) ?? NaN
  },
}

/** g(x) = ∫_0^x f(t)dt 의 극값 조건 */
const defnExtVal = (A: number, be: number, al: number, x: number) => pEval(F([A, -A * (al + be), A * al * be]), x)
const defnExt: SuTemplate<{ A: number; be: number; k: number; v: number }> = {
  ...head("i4-defn-ext", U, "12미적Ⅰ-03-04", 4, 44),
  params: (r) => {
    const k = r.int(-3, 4)
    const A = r.pick([3, -3, 6, -6])
    const be = nz(r, -5, 5)
    const v = r.int(0, 2)
    // g(0) = 0 처럼 조건 없이 정해지는 값, 또는 두 경우(α = 0, α = 3β)에서 같은 값이 되는 점은 묻지 않는다
    if (v === 0 && (k === 0 || defnExtVal(A, be, 0, k).eq(defnExtVal(A, be, 3 * be, k)))) return null
    return { A, be, k, v }
  },
  build: ({ A, be, k, v }, r) => {
    // 경우: α = 0 또는 α = 3β, 극대 조건으로 하나만
    const aZeroOk = A > 0 ? 0 < be : 0 > be
    const al = aZeroOk ? 0 : 3 * be
    const other = aZeroOk ? 3 * be : 0
    const fcs = [A, -A * (al + be), A * al * be]
    const g = (x: number) => pEval(F(fcs), x)
    const ask2 = v === 0 ? `g(${k})` : `g(x)$ 의 극솟값`
    const ans = v === 0 ? g(k) : g(be)
    const fAlt = [A, -A * (other + be), A * other * be]
    const wr = v === 0 ? [pEval(F(fAlt), k), g(k).neg(), g(k).add(1), q(ev(fcs, k))] : [pEval(F(fAlt), be), g(be).neg(), g(be).mul(2), g(be).add(1)]
    return {
      text: `최고차항의 계수가 $${A}$ 인 이차함수 $f(x)$ 에 대하여 함수 $g(x) = ${intTex(0, "x", "f(t)", "t")}$ 가 다음 조건을 만족시킨다.\n(가) 함수 $g(x)$ 는 $x = ${be}$ 에서 극소이다.\n(나) 함수 $g(x)$ 의 극댓값은 $0$ 이다.\n${v === 0 ? `$g(${k})$` : "함수 $g(x)$ 의 극솟값"}${v === 0 ? " 의 값은?" : "은?"}`,
      ...mcQ(r, ans, wr.filter((x) => !x.eq(ans))),
      solution: lines(
        `$g'(x) = f(x)$ 이므로 (가)에서 $f(${be}) = 0$ 이고, (나)에서 $g(x)$ 는 극댓값을 가지므로 $f(x)$ 는 다른 근 $\\alpha$ 를 갖는다. $f(x) = ${A}(x - \\alpha)${fac(be)}$`,
        `$g(\\alpha) = ${intTex(0, "\\alpha", `${A}(t - \\alpha)${fac(be, "t")}`, "t")} = ${q(A, 6).eq(1) ? "" : q(A, 6).eq(-1) ? "-" : q(A, 6).tex()}\\alpha^{2}(${3 * be} - \\alpha) = 0$ 에서 $\\alpha = 0$ 또는 $\\alpha = ${3 * be}$`,
        `최고차항의 계수가 ${A > 0 ? "양수" : "음수"}이므로 $g(x)$ 는 $f(x)$ 의 두 근 중 ${A > 0 ? "작은" : "큰"} 근에서 극대, ${A > 0 ? "큰" : "작은"} 근에서 극소이다.`,
        `$\\alpha = ${other}$ 이면 $x = ${be}$ 가 극소가 될 수 없으므로 $\\alpha = ${al}$, 즉 $f(x) = ${facs(A, [al, be])}$`,
        `따라서 ${v === 0 ? `$g(${k}) = ${intTex(0, k, `${facs(A, [al, be], "t")}`, "t")} = ${ans.tex()}$` : `극솟값은 $g(${be}) = ${intTex(0, be, `${facs(A, [al, be], "t")}`, "t")} = ${ans.tex()}$`}`
      ),
      score: 4,
    }
  },
  // α 를 정수 범위에서 모두 시도: g(α)=0 극대, g 가 β에서 극소
  verify: ({ A, be, k, v }) => {
    const found: number[] = []
    for (let al = -30; al <= 30; al++) {
      if (al === be) continue
      const f = (t: number) => A * (t - al) * (t - be)
      const g = (x: number) => simpson(f, 0, x, 4)
      const e = 0.01
      if (Math.abs(g(al)) > 1e-9) continue
      if (!(g(al - e) < g(al) && g(al + e) < g(al))) continue
      if (!(g(be - e) > g(be) && g(be + e) > g(be))) continue
      found.push(v === 0 ? g(k) : g(be))
    }
    // 조건 (가)·(나) 없이 두 후보 α = 0, α = 3β 에서 같은 답이 나오면 조건을 쓰지 않는 문제이므로 거부
    const at = v === 0 ? k : be
    const alt = [0, 3 * be].map((al) => simpson((t) => A * (t - al) * (t - be), 0, at, 4))
    if (Math.abs(alt[0] - alt[1]) < 1e-9) return NaN
    return only(found) ?? NaN
  },
}

/** g(t) = ∫_t^{t+k} f(x)dx 의 최댓값 */
const maxInt: SuTemplate<{ a: number; k: number; p: number; h: number; rr: number }> = {
  ...head("i4-maxint", U, "12미적Ⅰ-03-04", 4, 44),
  params: (r) => {
    const k = r.pick([2, 4])
    const p = r.int(-4, 3)
    const rr = r.int(-3, 5)
    if (rr === p + k / 2) return null
    return { a: r.int(1, 3), k, p, h: r.int(-6, 12), rr }
  },
  build: ({ a, k, p, h, rr }, r) => {
    const vx = p + k / 2
    const M = q(h * k).sub(q(a * k ** 3, 12))
    const ans = h - a * (rr - vx) ** 2
    const f = [-a, 2 * a * vx, h - a * vx * vx]
    return {
      text: `최고차항의 계수가 $${-a}$ 인 이차함수 $f(x)$ 에 대하여 함수 $g(t) = ${intTex("t", `t + ${k}`, "f(x)")}$ 가 $t = ${p}$ 에서 최댓값 $${M.tex()}$ 을 가질 때, $f(${rr})$ ${ask(ans)}`,
      ...answerI(r, ans, [h - a * (rr - p) ** 2, h + a * (rr - vx) ** 2, ans + a, ans - 1, -ans, h]),
      solution: lines(
        `$g'(t) = f(t + ${k}) - f(t)$ 이고 $g(t)$ 는 $t = ${p}$ 에서 최대이므로 $g'(${p}) = 0$, 즉 $f(${p + k}) = f(${p})$`,
        `이때 $g'(t) = f(t + ${k}) - f(t)$ 는 기울기가 $${-2 * a * k}$ 인 일차함수이므로 $t = ${p}$ 의 좌우에서 부호가 양에서 음으로 바뀌어, $g(t)$ 는 $t = ${p}$ 에서 실제로 최대이다.`,
        `따라서 이차함수 $y = f(x)$ 의 그래프의 축은 $x = \\frac{${plus(p, p + k)}}{2} = ${vx}$ 이고, $f(x) = ${-a === -1 ? "-" : -a}${fac(vx)}^{2} + m$ 으로 놓을 수 있다.`,
        `$x = ${texShift(-vx, "s")}$ 로 놓으면 $g(${p}) = ${intTex(p, p + k, "f(x)")} = ${intTex(-k / 2, k / 2, `(${-a === -1 ? "-" : -a}s^{2} + m)`, "s")}$`,
        `계산하면 $${k}m - ${q(a * k ** 3, 12).tex()} = ${M.tex()}$ 에서 $m = ${h}$`,
        `따라서 $f(x) = ${texPoly(f)}$ 이고 $f(${rr}) = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ a, k, p, h, rr }) => {
    const M = h * k - (a * k ** 3) / 12
    const G = (B: number, Cc: number, t: number) => simpson((x) => -a * x * x + B * x + Cc, t, t + k, 4)
    const Bs: number[] = []
    for (let B = -100; B <= 100; B++) if (Math.abs(G(B, 0, p + 1e-3) - G(B, 0, p - 1e-3)) < 1e-9) Bs.push(B)
    if (Bs.length !== 1) return NaN
    const found: number[] = []
    for (let Cc = -300; Cc <= 300; Cc++) if (Math.abs(G(Bs[0], Cc, p) - M) < 1e-9) found.push(-a * rr * rr + Bs[0] * rr + Cc)
    return only(found) ?? NaN
  },
}

/** 넓이와 조건으로 삼차함수 결정 (경우 나누기) */
type AC = { type: "A" | "B"; a: number }
const acF = ({ type, a }: AC) => (type === "A" ? [1, -a, 0, 0] : [1, -2 * a, a * a, 0])
const AC_STAT: { tex: string; ok: (c: AC) => boolean }[] = [
  { tex: "함수 $f(x)$ 는 $x = 0$ 에서 극값을 갖는다.", ok: (c) => c.type === "A" },
  { tex: "함수 $f(x)$ 는 $x = 0$ 에서 극값을 갖지 않는다.", ok: (c) => c.type === "B" },
  { tex: "$f(-1) > 0$", ok: (c) => ev(acF(c), -1) > 0 },
  { tex: "$f(-1) < 0$", ok: (c) => ev(acF(c), -1) < 0 },
  { tex: "$f(1) > 0$", ok: (c) => ev(acF(c), 1) > 0 },
  { tex: "$f(1) < 0$", ok: (c) => ev(acF(c), 1) < 0 },
  { tex: "곡선 $y = f(x)$ 와 $x$ 축이 만나는 점 중 원점이 아닌 점의 $x$ 좌표는 양수이다.", ok: (c) => c.a > 0 },
  { tex: "곡선 $y = f(x)$ 와 $x$ 축이 만나는 점 중 원점이 아닌 점의 $x$ 좌표는 음수이다.", ok: (c) => c.a < 0 },
]
const acCands = (s: number): AC[] => [
  { type: "A", a: s },
  { type: "A", a: -s },
  { type: "B", a: s },
  { type: "B", a: -s },
]
const areaCond: SuTemplate<{ s: number; tgt: number; st: number[]; k: number }> = {
  ...head("i4-area-cond", U, "12미적Ⅰ-03-05", 4, 44),
  params: (r) => {
    const s = r.int(2, 6)
    const tgt = r.int(0, 3)
    const cs = acCands(s)
    const T = cs[tgt]
    const trueSt = AC_STAT.map((_, i) => i).filter((i) => AC_STAT[i].ok(T))
    const pairs: number[][] = []
    for (let i = 0; i < trueSt.length; i++)
      for (let j = i + 1; j < trueSt.length; j++) {
        const pr = [trueSt[i], trueSt[j]]
        const n2 = cs.filter((c) => pr.every((x) => AC_STAT[x].ok(c))).length
        // 두 조건을 함께 써야만 하나로 정해지고, 하나만으로는 정해지지 않아야 한다
        const single = pr.map((x) => cs.filter((c) => AC_STAT[x].ok(c)).length)
        if (n2 === 1 && single.every((n) => n >= 2)) pairs.push(pr)
      }
    if (!pairs.length) return null
    return { s, tgt, st: r.pick(pairs), k: r.pick([-3, -2, 2, 3, 4]) }
  },
  build: ({ s, tgt, st, k }, r) => {
    const cs = acCands(s)
    const T = cs[tgt]
    const f = acF(T)
    const S = q(s ** 4, 12)
    const ans = ev(f, k)
    const name = (c: AC) => (c.type === "A" ? `x^{2}(${texShift(c.a)})` : `x(${texShift(c.a)})^{2}`)
    return {
      text: `최고차항의 계수가 $1$ 인 삼차함수 $f(x)$ 가 다음 조건을 만족시킨다.\n(가) 곡선 $y = f(x)$ 는 $x$ 축과 서로 다른 두 점에서만 만나고, 그중 한 점은 원점이다.\n(나) 곡선 $y = f(x)$ 와 $x$ 축으로 둘러싸인 부분의 넓이는 $${S.tex()}$ 이다.\n(다) ${AC_STAT[st[0]].tex}\n(라) ${AC_STAT[st[1]].tex}\n이때 $f(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [...cs.filter((c) => c !== T).map((c) => ev(acF(c), k)), ans + 1, -ans]),
      solution: lines(
        `(가)에서 $f(x) = 0$ 의 서로 다른 실근은 $0$ 과 $a \\ (a \\ne 0)$ 뿐이므로 $f(x) = x^{2}(x - a)$ 또는 $f(x) = x(x - a)^{2}$`,
        `넓이는 $f(x) = x^{2}(x - a)$ 일 때 $\\left| ${intTex(0, "a", "x^{2}(x - a)")} \\right| = \\frac{a^{4}}{12}$ 이고,`,
        `$f(x) = x(x - a)^{2}$ 일 때도 $\\left| ${intTex(0, "a", "x(x - a)^{2}")} \\right| = \\frac{a^{4}}{12}$ 이다.`,
        `(나)에서 $a^{4} = ${s ** 4}$ 이므로 $a = ${s}$ 또는 $a = ${-s}$`,
        `네 후보 ${cs.map((c) => `$${name(c)}$`).join(", ")} 중`,
        `(다)를 만족시키는 것은 ${cs.filter((c) => AC_STAT[st[0]].ok(c)).map((c) => `$${name(c)}$`).join(", ")}`,
        `(라)를 만족시키는 것은 ${cs.filter((c) => AC_STAT[st[1]].ok(c)).map((c) => `$${name(c)}$`).join(", ")}`,
        `따라서 $f(x) = ${name(T)} = ${texPoly(f)}$ 이고 $f(${k}) = ${ans}$`
      ),
      score: 4,
    }
  },
  // 원점을 지나는 최고차항 1 삼차함수의 계수를 모두 시도하며 조건을 수치로 확인
  verify: ({ s, st, k }) => {
    const all = acSearch(s, st, k)
    // 조건 (다), (라) 중 하나를 빼면 함수가 하나로 정해지지 않아야 한다
    if (acSearch(s, [st[0]], k, 2).length < 2 || acSearch(s, [st[1]], k, 2).length < 2) return NaN
    return only(all) ?? NaN
  },
}
function acSearch(s: number, st: number[], k: number, stopAt = Infinity) {
    const S = s ** 4 / 12
    const found: number[] = []
    for (let c2 = -14; c2 <= 14; c2++)
      for (let c1 = -5; c1 <= 40; c1++) {
        const f = (x: number) => x ** 3 + c2 * x * x + c1 * x
        const checks = st.map((i) => {
          if (i === 0 || i === 1) {
            const e = 1e-3
            const ext = deriv(f, -e) * deriv(f, e) < 0
            return i === 0 ? ext : !ext
          }
          if (i === 2) return f(-1) > 0
          if (i === 3) return f(-1) < 0
          if (i === 4) return f(1) > 0
          if (i === 5) return f(1) < 0
          return null
        })
        if (checks.some((x) => x === false)) continue
        const vals = gridVals(f, -8, 8, 4)
        if (gridCount(vals, 0) !== 2) continue
        const rs: number[] = []
        for (let i = 0; i < vals.length; i++) if (Math.abs(vals[i]) < 1e-12) rs.push(-8 + i / 4)
        if (rs.length !== 2 || !rs.includes(0)) continue
        const other = rs[0] === 0 ? rs[1] : rs[0]
        if (st.includes(6) && !(other > 0)) continue
        if (st.includes(7) && !(other < 0)) continue
        const area = Math.abs(simpson(f, Math.min(0, other), Math.max(0, other), 4))
        if (Math.abs(area - S) > 1e-9) continue
        found.push(f(k))
        if (found.length >= stopAt) return found
      }
    return found
}

/** 기함수·우함수의 정적분으로 삼차함수 결정 */
const oddEven: SuTemplate<{ L: number; p: number; qq: number; rr: number; side: number; k: number }> = {
  ...head("i4-oddeven", U, "12미적Ⅰ-03-03", 4, 44),
  params: (r) => {
    return { L: r.pick([1, 1, 2]), p: r.int(-6, 6), qq: r.int(-6, 6), rr: r.int(-6, 6), side: r.pick([1, -1]), k: r.pick([2, -2, 3]) }
  },
  build: ({ L, p, qq, rr, side, k }, r) => {
    const f = [1, p, qq, rr]
    const A = q(2 * p * L ** 3, 3).add(2 * rr * L)
    const B = q(2 * L ** 5, 5).add(q(2 * qq * L ** 3, 3))
    const E = ev(f, side)
    const ans = ev(f, k)
    return {
      text: `최고차항의 계수가 $1$ 인 삼차함수 $f(x)$ 가 다음 조건을 만족시킨다.\n(가) $${intTex(-L, L, "f(x)")} = ${A.tex()}$\n(나) $${intTex(-L, L, "xf(x)")} = ${B.tex()}$\n(다) $f(${side}) = ${E}$\n이때 $f(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [ev([1, -p, qq, rr], k), ev([1, p, -qq, rr], k), ev([1, rr, qq, p], k), ans + 1, -ans]),
      solution: lines(
        `$f(x) = x^{3} + ax^{2} + bx + c$ 라 하자. $\\int_{-${L}}^{${L}}$ 에서 홀수 차수 항의 적분은 $0$ 이고 짝수 차수 항은 $2\\int_{0}^{${L}}$ 이다.`,
        `(가): $2${intTex(0, L, "(ax^{2} + c)")} = ${q(2 * L ** 3, 3).tex()}a + ${2 * L}c = ${A.tex()}$`,
        `(나): $2${intTex(0, L, "(x^{4} + bx^{2})")} = ${q(2 * L ** 5, 5).tex()} + ${q(2 * L ** 3, 3).tex()}b = ${B.tex()}$ 에서 $b = ${qq}$`,
        `(다): $f(${side}) = ${side === 1 ? "1 + a + b + c" : "-1 + a - b + c"} = ${E}$ 에서 $a + c = ${E - side - side * qq}$`,
        `(가)와 연립하면 $a = ${p}$, $c = ${rr}$, 즉 $f(x) = ${texPoly(f)}$`,
        `따라서 $f(${k}) = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ L, p, qq, rr, side, k }) => {
    const A = (2 * p * L ** 3) / 3 + 2 * rr * L
    const B = (2 * L ** 5) / 5 + (2 * qq * L ** 3) / 3
    const E = ev([1, p, qq, rr], side)
    // 미지수 (a, b, c): 기저 x², x, 1 의 적분을 수치로
    const basis = [(x: number) => x * x, (x: number) => x, () => 1]
    const I = (g: (x: number) => number) => simpson(g, -L, L, 2000)
    const M = [basis.map((b) => I(b)), basis.map((b) => I((x) => x * b(x))), basis.map((b) => b(side))]
    const rhs = [A - I((x) => x ** 3), B - I((x) => x ** 4), E - side ** 3]
    const [a, b, c] = solveLinear(M, rhs)
    return k ** 3 + a * k * k + b * k + c
  },
}

export const INTEGRAL: SuTemplate[] = [
  antideriv,
  defint,
  props,
  area1,
  disp1,
  defnFn,
  absInt,
  pieceInt,
  area2,
  dist2,
  xfx,
  fconst,
  equalArea,
  meet,
  areaTan,
  motionCond,
  defnExt,
  maxInt,
  areaCond,
  oddEven,
]



