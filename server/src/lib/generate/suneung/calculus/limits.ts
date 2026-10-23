// 미적분Ⅰ · 함수의 극한과 연속 (12미적Ⅰ-01-01 ~ 04)
import { limitAt, q, roots, short, signed, texPoly, texShift, paren, term } from "../kit"
import type { Choice } from "../types"
import { mc } from "../kit"
import type { SuTemplate } from "../types"
import { answerI, ask, cases, lines, cx, ev, fac, facs, head, mcI, mcQ, nz, only, range, solveLinear, times, U_LIM } from "./helpers"

const U = U_LIM

// ───────────────────────── 1단계 ─────────────────────────

/** 0/0 꼴 유리식의 극한 (인수분해) */
const factorLimit: SuTemplate<{ a: number; b: number; v: number }> = {
  ...head("lim1-factor", U, "12미적Ⅰ-01-01", 1, 75),
  params: (r) => {
    const a = nz(r, -6, 6)
    const b = r.int(-9, 9)
    const v = r.int(0, 1)
    if (b === a) return null
    if (v === 1 && b === -a) return null
    return { a, b, v }
  },
  build: ({ a, b, v }, r) => {
    const num = [1, -(a + b), a * b]
    const den = v === 0 ? [1, -a] : [1, 0, -a * a]
    const ans = v === 0 ? q(a - b) : q(a - b, 2 * a)
    const denTex = v === 0 ? texShift(a) : texPoly(den)
    const wr =
      v === 0
        ? [q(a + b), q(b - a), q(2 * a - b), q(a * b), q(-a - b)]
        : [q(b - a, 2 * a), q(a - b, a), q(a + b, 2 * a), q(2 * a, a - b), q(a - b, 2 * a).add(1)]
    return {
      text: `$\\lim_{x \\to ${a}} \\frac{${texPoly(num)}}{${denTex}}$ 의 값은?`,
      ...mcQ(r, ans, wr),
      solution: lines(
        `$x \\to ${a}$ 일 때 분자와 분모가 모두 $0$ 에 가까워지므로 분자와 분모를 인수분해하여 공통인수를 약분한다.`,
        v === 0
          ? `$${texPoly(num)} = ${facs(1, [a, b])}$ 이므로 $\\frac{${texPoly(num)}}{${denTex}} = ${b === 0 ? "x" : texShift(b)} \\ (x \\ne ${a})$`
          : `$${texPoly(num)} = ${facs(1, [a, b])}$, $${texPoly(den)} = ${facs(1, [a, -a])}$ 이므로 $\\frac{${texPoly(num)}}{${denTex}} = \\frac{${b === 0 ? "x" : texShift(b)}}{${texShift(-a)}} \\ (x \\ne ${a})$`,
        v === 0
          ? `따라서 구하는 극한값은 $${a} ${signed(-b)} = ${ans.tex()}$`
          : `따라서 구하는 극한값은 $\\frac{${a} ${signed(-b)}}{${a} ${signed(a)}} = ${ans.tex()}$`
      ),
      score: 2,
    }
  },
  verify: ({ a, b, v }) => {
    const num = [1, -(a + b), a * b]
    const den = v === 0 ? [1, -a] : [1, 0, -a * a]
    return limitAt((x) => ev(num, x) / ev(den, x), a)
  },
}

/** 분자·분모를 최고차항으로 나누기 */
const divForm = (cs: number[]) => {
  const n = cs.length - 1
  let s = String(cs[0])
  for (let i = 1; i <= n; i++) {
    const c = cs[i]
    if (c === 0) continue
    s += ` ${c < 0 ? "-" : "+"} \\frac{${Math.abs(c)}}{${i === 1 ? "x" : `x^{${i}}`}}`
  }
  return s
}

/** ∞/∞ 꼴 극한 */
const infLimit: SuTemplate<{ N: number[]; D: number[] }> = {
  ...head("lim1-inf", U, "12미적Ⅰ-01-01", 1, 75),
  params: (r) => {
    const n = r.pick([2, 2, 3])
    const a = nz(r, -6, 6)
    const d = r.int(1, 6)
    if (a % d === 0 && r.chance(0.6)) return null
    const N = [a, ...range(1, n).map(() => r.int(-7, 7))]
    const D = [d, ...range(1, n).map(() => r.int(-7, 7))]
    if (N.slice(1).every((x) => x === 0) || D.slice(1).every((x) => x === 0)) return null
    return { N, D }
  },
  build: ({ N, D }, r) => {
    const n = N.length - 1
    const ans = q(N[0], D[0])
    const wr = [q(D[0], N[0]), q(-N[0], D[0]), ans.add(1), ans.mul(2)]
    if (D[n] !== 0) wr.push(q(N[n], D[n]))
    if (D[1] !== 0) wr.push(q(N[1], D[1]))
    return {
      text: `$\\lim_{x \\to \\infty} \\frac{${texPoly(N)}}{${texPoly(D)}}$ 의 값은?`,
      ...mcQ(r, ans, wr),
      solution: lines(
        `분모의 최고차항인 $x^{${n}}$ 으로 분자와 분모를 각각 나누면`,
        `$\\lim_{x \\to \\infty} \\frac{${divForm(N)}}{${divForm(D)}}$`,
        `$x \\to \\infty$ 일 때 $\\frac{1}{x}, \\frac{1}{x^{2}}${n === 3 ? ", \\frac{1}{x^{3}}" : ""}$ 은 모두 $0$ 에 가까워지므로 극한값은 $\\frac{${N[0]}}{${D[0]}} = ${ans.tex()}$`
      ),
      score: 2,
    }
  },
  verify: ({ N, D }) => {
    const X = 1e9
    return ev(N, X) / ev(D, X)
  },
}

/** 좌극한 + 우극한 (구간별 함수) */
const oneSided: SuTemplate<{ k: number; p: number; c: number; m: number; n: number; v: number }> = {
  ...head("lim1-onesided", U, "12미적Ⅰ-01-01", 1, 75),
  params: (r) => {
    const k = r.int(-3, 3)
    const p = r.int(-5, 5)
    const c = r.int(-6, 6)
    const m = nz(r, -4, 4)
    const n = r.int(-6, 6)
    if (k * k + p * k + c === m * k + n) return null
    return { k, p, c, m, n, v: r.int(0, 1) }
  },
  build: ({ k, p, c, m, n, v }, r) => {
    const L = k * k + p * k + c
    const R = m * k + n
    const ans = v === 0 ? L + R : L - R
    const f = cases([texPoly([1, p, c]), `x < ${k}`], [texPoly([m, n]), `x \\ge ${k}`])
    const op = v === 0 ? "+" : "-"
    return {
      text: `함수 $f(x) = ${f}$ 에 대하여 $\\lim_{x \\to ${k}-} f(x) ${op} \\lim_{x \\to ${k}+} f(x)$ 의 값은?`,
      ...mcI(r, ans, [2 * L, 2 * R, R - L, v === 0 ? L - R : L + R, ans + 1, ans - 1]),
      solution: lines(
        `$x \\to ${k}-$ 이면 $x < ${k}$ 이므로 $\\lim_{x \\to ${k}-} f(x) = \\lim_{x \\to ${k}-} (${texPoly([1, p, c])}) = ${L}$`,
        `$x \\to ${k}+$ 이면 $x > ${k}$ 이므로 $\\lim_{x \\to ${k}+} f(x) = \\lim_{x \\to ${k}+} (${texPoly([m, n])}) = ${R}$`,
        `따라서 구하는 값은 $${L} ${op} ${paren(R)} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ k, p, c, m, n, v }) => {
    const f = (x: number) => (x < k ? ev([1, p, c], x) : ev([m, n], x))
    const L = f(k - 1e-10)
    const R = f(k + 1e-10)
    return v === 0 ? L + R : L - R
  },
}

/** 연속이 되도록 하는 상수 */
const contConst: SuTemplate<{ v: number; k: number; m: number; p: number; c: number; b: number }> = {
  ...head("lim1-contconst", U, "12미적Ⅰ-01-03", 1, 75),
  params: (r) => {
    const v = r.int(0, 1)
    const k = r.int(-3, 3)
    if (v === 0) return { v, k, m: nz(r, -5, 5), p: r.int(-5, 5), c: r.int(-6, 6), b: 0 }
    if (k === 0 && r.chance(0.5)) return null
    return { v, k, m: 0, p: 0, c: 0, b: r.int(-8, 8) }
  },
  build: ({ v, k, m, p, c, b }, r) => {
    if (v === 0) {
      const R = k * k + p * k + c
      const ans = R - m * k
      const f = cases([`${cx(m)} + a`, `x < ${k}`], [texPoly([1, p, c]), `x \\ge ${k}`])
      return {
        text: `함수 $f(x) = ${f}$ 가 실수 전체의 집합에서 연속일 때, 상수 $a$ 의 값은?`,
        ...mcI(r, ans, [R, R + m * k, -ans, ans + 1, ans - 1, m * k - R]),
        solution: lines(
          `두 식은 각각 연속이므로 $x = ${k}$ 에서 연속이면 된다. 즉 $\\lim_{x \\to ${k}-} f(x) = f(${k})$`,
          `$\\lim_{x \\to ${k}-} f(x) = ${times(m, k)} + a = ${m * k} + a$, $f(${k}) = ${R}$`,
          `$${m * k} + a = ${R}$ 에서 $a = ${ans}$`
        ),
        score: 3,
      }
    }
    const num = [1, -(k + b), k * b]
    const ans = k - b
    const f = cases([`\\frac{${texPoly(num)}}{${texShift(k)}}`, `x \\ne ${k}`], ["a", `x = ${k}`])
    return {
      text: `함수 $f(x) = ${f}$ 가 실수 전체의 집합에서 연속일 때, 상수 $a$ 의 값은?`,
      ...mcI(r, ans, [k + b, b - k, -k - b, ans + 1, ans - 1, k * b]),
      solution: lines(
        `$x = ${k}$ 에서 연속이려면 $\\lim_{x \\to ${k}} f(x) = f(${k}) = a$ 이어야 한다.`,
        `$${texPoly(num)} = ${facs(1, [k, b])}$ 이므로 $\\lim_{x \\to ${k}} \\frac{${texPoly(num)}}{${texShift(k)}} = \\lim_{x \\to ${k}} ${b === 0 ? "x" : `(${texShift(b)})`} = ${ans}$`,
        `따라서 $a = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ v, k, m, p, c, b }) => {
    if (v === 0) return limitAt((x) => ev([1, p, c], x) - m * x, k)
    return limitAt((x) => ev([1, -(k + b), k * b], x) / (x - k), k)
  },
}

// ───────────────────────── 2단계 ─────────────────────────

/** 극한값이 존재할 조건으로 계수 결정 */
const coefLimit: SuTemplate<{ c: number; e: number; v: number; w: number }> = {
  ...head("lim2-coef", U, "12미적Ⅰ-01-02", 2, 60),
  params: (r) => {
    const c = nz(r, -5, 5)
    const e = r.int(-8, 8)
    return { c, e, v: r.int(0, 1), w: r.int(0, 1) }
  },
  build: ({ c, e, v, w }, r) => {
    const a = -(c + e)
    const b = c * e
    const L = v === 0 ? q(c - e) : q(c - e, 2 * c)
    const den = v === 0 ? texShift(c) : texPoly([1, 0, -c * c])
    const ans = w === 0 ? a + b : a * b
    const target = w === 0 ? "a + b" : "ab"
    // 실수: b = -c² - ac 대신 c² + ac, a의 부호 반대
    const comb = (A: number, B: number) => (w === 0 ? A + B : A * B)
    const wrongs = [comb(-a, b), comb(a, -b), comb(-a, -b), comb(a, c * c + a * c), ans + 1, ans - 1]
    return {
      text: `두 상수 $a, b$ 에 대하여 $\\lim_{x \\to ${c}} \\frac{x^{2} + ax + b}{${den}} = ${L.tex()}$ 일 때, $${target}$ 의 값은?`,
      ...mcI(r, ans, wrongs),
      solution: lines(
        `$x \\to ${c}$ 일 때 (분모) $\\to 0$ 이고 극한값이 존재하므로 (분자) $\\to 0$ 이어야 한다.`,
        `즉 $${c * c} ${signed(c)}a + b = 0$ 에서 $b = ${texPoly([-c, -c * c], "a")}$ 이고, 분자는 $x^{2} + ax ${c * c >= 0 ? "-" : "+"} ${c * c} ${c >= 0 ? "-" : "+"} ${Math.abs(c)}a = (${texShift(c)})(${texShift(-c)} + a)$`,
        v === 0
          ? `$\\lim_{x \\to ${c}} (${texShift(-c)} + a) = ${2 * c} + a = ${L.tex()}$ 이므로 $a = ${a}$`
          : `$\\lim_{x \\to ${c}} \\frac{${texShift(-c)} + a}{${texShift(-c)}} = \\frac{${2 * c} + a}{${2 * c}} = ${L.tex()}$ 이므로 $a = ${a}$`,
        `$b = ${texPoly([-c, -c * c], "a")} = ${b}$ 이므로 $${target} = ${w === 0 ? `${a} ${signed(b)}` : times(a, b)} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ c, e, v, w }) => {
    const L = v === 0 ? c - e : (c - e) / (2 * c)
    const found: number[] = []
    for (let A = -30; A <= 30; A++)
      for (let B = -60; B <= 60; B++) {
        if (c * c + A * c + B !== 0) continue
        const den = v === 0 ? [1, -c] : [1, 0, -c * c]
        const lim = limitAt((x) => ev([1, A, B], x) / ev(den, x), c)
        if (Math.abs(lim - L) < 1e-6) found.push(w === 0 ? A + B : A * B)
      }
    return only(found) ?? NaN
  },
}

/** 극한 조건으로 다항식 결정 */
const polyDet: SuTemplate<{ v: number; C: number; A: number; B: number; k: number; al: number }> = {
  ...head("lim2-polydet", U, "12미적Ⅰ-01-02", 2, 60),
  params: (r) => {
    const v = r.int(0, 1)
    const k = r.int(-2, 3)
    if (v === 0) {
      const B = nz(r, -6, 6)
      return { v, C: r.int(1, 3), A: r.int(-5, 5), B, k: k === 0 ? 2 : k, al: 0 }
    }
    const al = nz(r, -3, 3)
    const A = nz(r, -3, 3)
    const B = r.int(-6, 6)
    if (k === al) return null
    return { v, C: 0, A, B, k, al }
  },
  build: ({ v, C, A, B, k, al }, r) => {
    if (v === 0) {
      const f = [C, A, B, 0]
      const ans = ev(f, k)
      return {
        text: `다항함수 $f(x)$ 가 $\\lim_{x \\to \\infty} \\frac{f(x) - ${texPoly([C, 0, 0, 0])}}{x^{2}} = ${A}$, $\\lim_{x \\to 0} \\frac{f(x)}{x} = ${B}$ 를 만족시킬 때, $f(${k})$ ${ask(ans)}`,
        ...answerI(r, ans, [ev([C, A, B, 1], k), ev([C, B, A, 0], k), ev([C, A, 0, B], k), ev([C, -A, B, 0], k), ans + 1, ans - 1]),
        solution: lines(
          `첫 번째 조건에서 $f(x) - ${texPoly([C, 0, 0, 0])}$ 은 최고차항의 계수가 $${A}$ 인 이차 이하의 다항식${A === 0 ? "이고 이차항이 없다" : "이다"}. 즉 $f(x) = ${texPoly([C, A, 0, 0])} + px + q$ 로 놓을 수 있다.`,
          `두 번째 조건에서 $x \\to 0$ 일 때 (분모) $\\to 0$ 이므로 (분자) $\\to 0$, 즉 $f(0) = q = 0$`,
          `$\\lim_{x \\to 0} \\frac{f(x)}{x} = \\lim_{x \\to 0} (${texPoly([C, A, 0])} + p) = p = ${B}$ 이므로 $f(x) = ${texPoly(f)}$`,
          `따라서 $f(${k}) = ${ans}$`
        ),
        score: 3,
      }
    }
    const m = B - A * al
    const f = [A, m - A * al, -m * al]
    const ans = ev(f, k)
    return {
      text: `이차함수 $f(x)$ 가 $\\lim_{x \\to \\infty} \\frac{f(x)}{x^{2} + 1} = ${A}$, $\\lim_{x \\to ${al}} \\frac{f(x)}{${texShift(al)}} = ${B}$ 를 만족시킬 때, $f(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [ev([A, B - A * al, 0], k) - (B - A * al) * al + 1, (k - al) * (A * k + B), (k + al) * (A * k + m), ans + A, ans - A, -ans]),
      solution: lines(
        `첫 번째 조건에서 $f(x)$ 의 이차항의 계수는 $${A}$ 이다.`,
        `두 번째 조건에서 (분모) $\\to 0$ 이므로 (분자) $\\to 0$, 즉 $f(${al}) = 0$ 이다. 따라서 $f(x) = (${texShift(al)})(${cx(A)} + m)$ 으로 놓을 수 있다.`,
        `$\\lim_{x \\to ${al}} (${cx(A)} + m) = ${A * al} + m = ${B}$ 에서 $m = ${m}$, 즉 $f(x) = (${texShift(al)})(${texPoly([A, m])})$`,
        `따라서 $f(${k}) = ${times(k - al, A * k + m)} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ v, C, A, B, k, al }) => {
    const found: number[] = []
    if (v === 0) {
      const X = 1e6
      const h = 1e-6
      for (let a2 = -8; a2 <= 8; a2++)
        for (let a1 = -9; a1 <= 9; a1++)
          for (let a0 = -3; a0 <= 3; a0++) {
            const f = [C, a2, a1, a0]
            if (Math.abs((ev(f, X) - C * X ** 3) / X ** 2 - A) > 1e-3) continue
            if (Math.abs(ev(f, h) / h - B) > 1e-3 || Math.abs(ev(f, -h) / -h - B) > 1e-3) continue
            found.push(ev(f, k))
          }
    } else {
      const X = 1e6
      const h = 1e-6
      for (let a2 = -4; a2 <= 4; a2++)
        for (let a1 = -30; a1 <= 30; a1++)
          for (let a0 = -50; a0 <= 50; a0++) {
            const f = [a2, a1, a0]
            if (Math.abs(ev(f, X) / (X * X + 1) - A) > 1e-3) continue
            if (Math.abs(ev(f, al + h) / h - B) > 1e-3 || Math.abs(ev(f, al - h) / -h - B) > 1e-3) continue
            found.push(ev(f, k))
          }
    }
    return only(found) ?? NaN
  },
}

/** 사잇값 정리로 실근이 있는 구간 */
const ivtInterval: SuTemplate<{ c3: number; p: number; c: number; s: number }> = {
  ...head("lim2-ivt", U, "12미적Ⅰ-01-04", 2, 60),
  params: (r) => {
    const c3 = r.pick([1, 1, 2])
    const p = r.int(1, 8)
    const c = r.int(-40, 40)
    const f = [c3, 0, p, c]
    let k = NaN
    for (let x = -4; x <= 3; x++) if (ev(f, x) < 0 && ev(f, x + 1) > 0) k = x
    if (Number.isNaN(k)) return null
    return { c3, p, c, s: k - r.int(0, 4) }
  },
  build: ({ c3, p, c, s }, r) => {
    const f = [c3, 0, p, c]
    let k = 0
    for (let x = -4; x <= 3; x++) if (ev(f, x) < 0 && ev(f, x + 1) > 0) k = x
    const iv = (j: number): Choice => ({ tex: `(${j}, ${j + 1})`, value: j })
    const picked = mc(r, iv(k), range(s, s + 4).filter((j) => j !== k).map(iv))
    return {
      text: `다음 중 방정식 $${texPoly(f)} = 0$ 의 실근이 존재하는 열린구간은?`,
      ...picked,
      solution: lines(
        `$f(x) = ${texPoly(f)}$ 이라 하면 $f(x)$ 는 실수 전체에서 연속이고, $${texPoly([c3, 0, 0, 0])}$ 과 $${cx(p)}$ 가 모두 증가하므로 $f(x)$ 는 증가하는 함수이다. 즉 실근은 하나뿐이다.`,
        `$f(${k}) = ${ev(f, k)} < 0$, $f(${k + 1}) = ${ev(f, k + 1)} > 0$`,
        `사잇값 정리에 의하여 방정식 $f(x) = 0$ 은 열린구간 $(${k}, ${k + 1})$ 에서 실근을 갖는다.`
      ),
      score: 3,
    }
  },
  verify: ({ c3, p, c }) => {
    const rs = roots((x) => ev([c3, 0, p, c], x), -10, 10, 2001)
    return rs.length === 1 ? Math.floor(rs[0]) : NaN
  },
}

/** 무리식의 극한 */
const radLimit: SuTemplate<{ v: number; a: number; c: number; p: number; qq: number }> = {
  ...head("lim2-radical", U, "12미적Ⅰ-01-02", 2, 60),
  params: (r) => {
    const v = r.int(0, 3)
    if (v === 2) return { v, a: 0, c: 0, p: nz(r, -12, 12), qq: r.int(-9, 9) }
    const c = r.int(1, 6)
    const a = r.int(-6, 9)
    if (v === 3 && a === 0) return null
    return { v, a, c, p: 0, qq: 0 }
  },
  build: ({ v, a, c, p, qq }, r) => {
    const b = c * c - a
    const rad = `\\sqrt{${texPoly([1, b])}}`
    if (v === 2) {
      const ans = q(p, 2)
      return {
        text: `$\\lim_{x \\to \\infty} (\\sqrt{${texPoly([1, p, qq])}} - x)$ 의 값은?`,
        ...mcQ(r, ans, [q(p), q(-p, 2), q(p, 4), q(qq, 2), q(p + 1, 2)]),
        solution: lines(
          `분자를 유리화하면 $\\sqrt{${texPoly([1, p, qq])}} - x = \\frac{${texPoly([p, qq])}}{\\sqrt{${texPoly([1, p, qq])}} + x}$`,
          `분자와 분모를 $x$ 로 나누면 $\\frac{${p}${qq === 0 ? "" : ` ${qq < 0 ? "-" : "+"} \\frac{${Math.abs(qq)}}{x}`}}{\\sqrt{1 ${p < 0 ? "-" : "+"} \\frac{${Math.abs(p)}}{x}${qq === 0 ? "" : ` ${qq < 0 ? "-" : "+"} \\frac{${Math.abs(qq)}}{x^{2}}`}} + 1}$`,
          `$x \\to \\infty$ 일 때 이 값은 $\\frac{${p}}{1 + 1} = ${ans.tex()}$ 에 가까워진다.`
        ),
        score: 2,
      }
    }
    if (v === 0 || v === 3) {
      const ans = v === 0 ? q(1, 2 * c) : q(1, 4 * a * c)
      const den = v === 0 ? texShift(a) : texPoly([1, 0, -a * a])
      return {
        text: `$\\lim_{x \\to ${a}} \\frac{${rad} - ${c}}{${den}}$ 의 값은?`,
        ...mcQ(r, ans, v === 0 ? [q(1, c), q(2 * c), q(c), q(-1, 2 * c), q(1, 4 * c)] : [q(1, 2 * c), q(1, 2 * a * c), q(-1, 4 * a * c), q(1, a * c), q(4 * a * c)]),
        solution: lines(
          `분자를 유리화하면 $${rad} - ${c} = \\frac{(${texPoly([1, b])}) - ${c * c}}{${rad} + ${c}} = \\frac{${texShift(a)}}{${rad} + ${c}}$`,
          v === 0
            ? `따라서 주어진 식은 $\\lim_{x \\to ${a}} \\frac{1}{${rad} + ${c}}$`
            : `따라서 주어진 식은 $\\lim_{x \\to ${a}} \\frac{1}{(${texShift(-a)})(${rad} + ${c})}$`,
          v === 0
            ? `$x \\to ${a}$ 일 때 $${rad} \\to ${c}$ 이므로 극한값은 $\\frac{1}{${c} + ${c}} = ${ans.tex()}$`
            : `$x \\to ${a}$ 일 때 $${rad} \\to ${c}$ 이므로 극한값은 $\\frac{1}{${2 * a} \\times ${2 * c}} = ${ans.tex()}$`
        ),
        score: 2,
      }
    }
    const ans = q(2 * c)
    return {
      text: `$\\lim_{x \\to ${a}} \\frac{${texShift(a)}}{${rad} - ${c}}$ 의 값은?`,
      ...mcQ(r, ans, [q(c), q(1, 2 * c), q(c * c), q(-2 * c), q(4 * c)]),
      solution: lines(
        `분모를 유리화하면 $\\frac{${texShift(a)}}{${rad} - ${c}} = \\frac{(${texShift(a)})(${rad} + ${c})}{(${texPoly([1, b])}) - ${c * c}}$`,
        `분모가 $${texShift(a)}$ 이므로 약분하면 $${rad} + ${c} \\ (x \\ne ${a})$`,
        `$x \\to ${a}$ 일 때 극한값은 $${c} + ${c} = ${ans.tex()}$`
      ),
      score: 2,
    }
  },
  verify: ({ v, a, c, p, qq }) => {
    const b = c * c - a
    if (v === 2) {
      const g = (x: number) => Math.sqrt(x * x + p * x + qq) - x
      const X = 1e6
      return 2 * g(2 * X) - g(X)
    }
    if (v === 0) return limitAt((x) => (Math.sqrt(x + b) - c) / (x - a), a)
    if (v === 3) return limitAt((x) => (Math.sqrt(x + b) - c) / (x * x - a * a), a)
    return limitAt((x) => (x - a) / (Math.sqrt(x + b) - c), a)
  },
}

/** 극한의 성질: 두 일차결합의 극한에서 lim f·g */
const limProp: SuTemplate<{ al: number; be: number; ga: number; de: number; F: number; G: number; a: string }> = {
  ...head("lim2-limprop", U, "12미적Ⅰ-01-02", 2, 60),
  params: (r) => {
    const al = nz(r, -3, 3)
    const be = nz(r, -3, 3)
    const ga = nz(r, -3, 3)
    const de = nz(r, -3, 3)
    if (al * de - be * ga === 0) return null
    const F = nz(r, -6, 6)
    const G = nz(r, -6, 6)
    return { al, be, ga, de, F, G, a: r.pick(["1", "2", "3", "-1", "0", "\\infty"]) }
  },
  build: ({ al, be, ga, de, F, G, a }, r) => {
    const P = al * F + be * G
    const R = ga * F + de * G
    const comb = (x: number, y: number) => `${term(x, "f(x)", true)}${term(y, "g(x)")}`
    const ans = F * G
    const lim = `\\lim_{x \\to ${a}}`
    return {
      text: `두 함수 $f(x), g(x)$ 에 대하여 $${lim} \\{${comb(al, be)}\\} = ${P}$, $${lim} \\{${comb(ga, de)}\\} = ${R}$ 일 때, $${lim} f(x)g(x)$ 의 값은?`,
      ...mcI(r, ans, [F + G, -ans, P * R, ans + 1, ans - 1, F * F + G * G, F - G]),
      solution: lines(
        `$h_1(x) = ${comb(al, be)}$, $h_2(x) = ${comb(ga, de)}$ 이라 하면 $f(x), g(x)$ 는 $h_1(x), h_2(x)$ 의 일차결합으로 나타낼 수 있다.`,
        `$${term(de, "h_1(x)", true)}${term(-be, "h_2(x)")} = ${term(al * de - be * ga, "f(x)", true)}$, $${term(-ga, "h_1(x)", true)}${term(al, "h_2(x)")} = ${term(al * de - be * ga, "g(x)", true)}$`,
        `극한의 성질에 의하여 $${lim} f(x) = \\frac{${times(de, P)} ${signed(-be * R)}}{${al * de - be * ga}} = ${F}$, $${lim} g(x) = \\frac{${times(-ga, P)} ${signed(al * R)}}{${al * de - be * ga}} = ${G}$`,
        `따라서 $${lim} f(x)g(x) = ${times(F, G)} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ al, be, ga, de, F, G }) => {
    const P = al * F + be * G
    const R = ga * F + de * G
    const found: number[] = []
    for (let x = -20; x <= 20; x++) for (let y = -20; y <= 20; y++) if (al * x + be * y === P && ga * x + de * y === R) found.push(x * y)
    return only(found) ?? NaN
  },
}

/** 세 조각 함수의 연속 */
const contTwo: SuTemplate<{ s: number; t: number; m1: number; m2: number; u: number; w: number; v: number }> = {
  ...head("lim2-conttwo", U, "12미적Ⅰ-01-03", 2, 60),
  params: (r) => {
    const s = r.int(-3, 1)
    const t = s + r.int(1, 4)
    return { s, t, m1: nz(r, -4, 4), m2: nz(r, -4, 4), u: r.int(-5, 5), w: r.int(-6, 6), v: r.int(0, 1) }
  },
  build: ({ s, t, m1, m2, u, w, v }, r) => {
    const Qd = [1, u, w]
    const a = ev(Qd, s) - m1 * s
    const b = ev(Qd, t) - m2 * t
    const ans = v === 0 ? a + b : a - b
    const f = cases([`${cx(m1)} + a`, `x < ${s}`], [texPoly(Qd), `${s} \\le x < ${t}`], [`${cx(m2)} + b`, `x \\ge ${t}`])
    const tgt = v === 0 ? "a + b" : "a - b"
    const sg = v === 0 ? 1 : -1
    return {
      text: `함수 $f(x) = ${f}$ 가 실수 전체의 집합에서 연속일 때, $${tgt}$ 의 값은? (단, $a, b$ 는 상수이다.)`,
      ...mcI(r, ans, [ev(Qd, s) + sg * ev(Qd, t), a + m1 * s * 2 + sg * b, a + sg * (b + 2 * m2 * t), -ans, ans + 1, ans - 1]),
      solution: lines(
        `각 구간에서 $f(x)$ 는 다항함수이므로 $x = ${s}$, $x = ${t}$ 에서 연속이면 된다.`,
        `$x = ${s}$ 에서: $${times(m1, s)} + a = ${ev(Qd, s)}$ 이므로 $a = ${a}$`,
        `$x = ${t}$ 에서: $${texPoly(Qd).replace(/x/g, `(${t})`)} = ${times(m2, t)} + b$ 이므로 $b = ${b}$`,
        `따라서 $${tgt} = ${a} ${signed(sg * b)} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ s, t, m1, m2, u, w, v }) => {
    const a = limitAt((x) => ev([1, u, w], x) - m1 * x, s)
    const b = limitAt((x) => ev([1, u, w], x) - m2 * x, t)
    return v === 0 ? a + b : a - b
  },
}

// ───────────────────────── 3단계 ─────────────────────────

/** 두 극한 조건으로 삼차함수 결정 */
const cubicDet: SuTemplate<{ al: number; be: number; A: number; m: number; k: number }> = {
  ...head("lim3-cubicdet", U, "12미적Ⅰ-01-02", 3, 65),
  params: (r) => {
    const al = r.int(-3, 3)
    const be = r.int(-3, 3)
    if (al >= be) return null
    const k = r.int(-3, 4)
    if (k === al || k === be) return null
    return { al, be, A: nz(r, -3, 3), m: r.int(-6, 6), k }
  },
  build: ({ al, be, A, m, k }, r) => {
    const P = (al - be) * (A * al + m)
    const R = (be - al) * (A * be + m)
    const f = (x: number) => (x - al) * (x - be) * (A * x + m)
    const ans = f(k)
    const g1 = q(P, al - be)
    const g2 = q(R, be - al)
    return {
      text: `삼차함수 $f(x)$ 가 $\\lim_{x \\to ${al}} \\frac{f(x)}{${texShift(al)}} = ${P}$, $\\lim_{x \\to ${be}} \\frac{f(x)}{${texShift(be)}} = ${R}$ 를 만족시킬 때, $f(${k})$ ${ask(ans)}`,
      ...answerI(r, ans, [(k - al) * (k - be) * (A * k - m), (k - al) * (k - be) * (-A * k + m), (k + al) * (k + be) * (A * k + m), ans + 1, ans - 1, -ans]),
      solution: lines(
        `두 극한에서 (분모) $\\to 0$ 이고 극한값이 존재하므로 $f(${al}) = 0$, $f(${be}) = 0$ 이다.`,
        `$f(x)$ 는 삼차함수이므로 $f(x) = ${facs(1, [al, be])}(ax + b) \\ (a \\ne 0)$ 로 놓을 수 있다.`,
        `$\\lim_{x \\to ${al}} ${fac(be)}(ax + b) = ${al - be}(${al === 0 ? "b" : `${texPoly([al, 0], "a")} + b`}) = ${P}$ 에서 $${al === 0 ? "" : `${texPoly([al, 0], "a")} + `}b = ${g1.tex()}$`,
        `$\\lim_{x \\to ${be}} ${fac(al)}(ax + b) = ${be - al}(${be === 0 ? "b" : `${texPoly([be, 0], "a")} + b`}) = ${R}$ 에서 $${be === 0 ? "" : `${texPoly([be, 0], "a")} + `}b = ${g2.tex()}$`,
        `두 식을 연립하면 $a = ${A}$, $b = ${m}$ 이므로 $f(x) = ${facs(1, [al, be])}(${texPoly([A, m])})$`,
        `따라서 $f(${k}) = ${times(k - al, k - be, A * k + m)} = ${ans}$`
      ),
      score: 4,
    }
  },
  // 일반 삼차식 c3x³+c2x²+c1x+c0 에 f(α)=0, f(β)=0, f'(α)=P, f'(β)=R 을 세워 연립
  verify: ({ al, be, A, m, k }) => {
    const P = (al - be) * (A * al + m)
    const R = (be - al) * (A * be + m)
    const row = (x: number) => [x ** 3, x ** 2, x, 1]
    const drow = (x: number) => [3 * x * x, 2 * x, 1, 0]
    const c = solveLinear([row(al), row(be), drow(al), drow(be)], [0, 0, P, R])
    return ev(c, k)
  },
}

/** f(x)g(x) 연속 → g(s) = 0 */
const contProd: SuTemplate<{ s: number; rr: number; c0: number; n: number; L: number[]; Rr: number[] }> = {
  ...head("lim3-contprod", U, "12미적Ⅰ-01-03", 3, 65),
  params: (r) => {
    const s = r.int(-3, 3)
    const rr = r.int(-6, 6)
    const c0 = r.int(-3, 4)
    const n = r.int(-3, 5)
    if (c0 === s || n === s || n === c0) return null
    const L = r.chance(0.5) ? [nz(r, -3, 3), r.int(-5, 5)] : [r.pick([1, -1]), r.int(-3, 3), r.int(-5, 5)]
    const Rr = [nz(r, -3, 3), r.int(-5, 5)]
    if (ev(L, s) === ev(Rr, s)) return null
    return { s, rr, c0, n, L, Rr }
  },
  build: ({ s, rr, c0, n, L, Rr }, r) => {
    const g = (x: number) => (x - s) * (x - rr)
    const G = g(c0)
    const ans = g(n)
    const f = cases([texPoly(L), `x < ${s}`], [texPoly(Rr), `x \\ge ${s}`])
    return {
      text: `함수 $f(x) = ${f}$ 와 이차함수 $g(x) = x^{2} + ax + b$ 에 대하여 함수 $f(x)g(x)$ 가 실수 전체의 집합에서 연속이고 $g(${c0}) = ${G}$ 일 때, $g(${n})$ ${ask(ans)} (단, $a, b$ 는 상수이다.)`,
      ...answerI(r, ans, [(n + s) * (n - rr), (n - s) * (n + rr), (n - c0) * (n - s) + G, ans + 1, ans - 1, -ans]),
      solution: lines(
        `$f(x)$ 는 $x = ${s}$ 에서만 불연속일 수 있으므로 $x = ${s}$ 에서 $f(x)g(x)$ 가 연속이면 된다.`,
        `$\\lim_{x \\to ${s}-} f(x)g(x) = ${ev(L, s)}g(${s})$, $\\lim_{x \\to ${s}+} f(x)g(x) = f(${s})g(${s}) = ${ev(Rr, s)}g(${s})$`,
        `$${ev(L, s)}g(${s}) = ${ev(Rr, s)}g(${s})$ 에서 $g(${s}) = 0$ 이므로 $g(x) = ${fac(s)}(x - c)$ 로 놓을 수 있다.`,
        `$g(${c0}) = ${times(c0 - s)}(${c0} - c) = ${G}$ 에서 $c = ${rr}$, 즉 $g(x) = ${facs(1, [s, rr])}$`,
        `따라서 $g(${n}) = ${times(n - s, n - rr)} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ s, rr, c0, n, L, Rr }) => {
    const G = (c0 - s) * (c0 - rr)
    const f = (x: number) => (x < s ? ev(L, x) : ev(Rr, x))
    const found: number[] = []
    for (let A = -25; A <= 25; A++)
      for (let B = -40; B <= 40; B++) {
        const g = (x: number) => x * x + A * x + B
        if (g(c0) !== G) continue
        const h = (x: number) => f(x) * g(x)
        if (Math.abs(h(s - 1e-9) - h(s)) > 1e-6 || Math.abs(h(s + 1e-9) - h(s)) > 1e-6) continue
        found.push(g(n))
      }
    return only(found) ?? NaN
  },
}

/** 무리식 극한 조건으로 계수 */
const radCoef: SuTemplate<{ v: number; c: number; d: number; m: number; s: number }> = {
  ...head("lim3-radcoef", U, "12미적Ⅰ-01-02", 3, 65),
  params: (r) => {
    const v = r.int(0, 1)
    if (v === 0) return { v, c: r.int(1, 5), d: nz(r, -8, 8), m: 0, s: 0 }
    const s = r.int(1, 4)
    const m = r.int(-5, 6)
    if (s * s - m === 0) return null
    return { v, c: 0, d: nz(r, -4, 4), m, s }
  },
  build: ({ v, c, d, m, s }, r) => {
    if (v === 0) {
      const a = c * c
      const b = 2 * c * d
      const ans = a + b
      return {
        text: `두 상수 $a, b$ 에 대하여 $\\lim_{x \\to \\infty} (\\sqrt{ax^{2} + bx} - ${cx(c)}) = ${d}$ 일 때, $a + b$ 의 값은? (단, $a > 0$)`,
        ...mcI(r, ans, [c + b, a + c * d, a - b, a + d, c * c + 4 * c * d, ans + 1]),
        solution: lines(
          `$\\sqrt{ax^{2} + bx} - ${cx(c)} = \\frac{${a === 1 ? "" : "("}a ${signed(-c * c)}${a === 1 ? "" : ")"}x^{2} + bx}{\\sqrt{ax^{2} + bx} + ${cx(c)}}$ 이므로, $a \\ne ${c * c}$ 이면 분자의 차수가 분모보다 높아 발산한다. 따라서 $a = ${c * c}$`,
          `이때 $\\lim_{x \\to \\infty} \\frac{bx}{\\sqrt{${c * c}x^{2} + bx} + ${cx(c)}} = \\lim_{x \\to \\infty} \\frac{b}{\\sqrt{${c * c} + \\frac{b}{x}} + ${c}} = \\frac{b}{${2 * c}}$`,
          `$\\frac{b}{${2 * c}} = ${d}$ 에서 $b = ${b}$`,
          `따라서 $a + b = ${a} ${signed(b)} = ${ans}$`
        ),
        score: 3,
      }
    }
    const n = s * s - m
    const L = d
    const a = 2 * s * L
    const b = 2 * s * s * L
    const ans = a + b
    return {
      text: `두 상수 $a, b$ 에 대하여 $\\lim_{x \\to ${m}} \\frac{a\\sqrt{${texPoly([1, n])}} - b}{${texShift(m)}} = ${L}$ 일 때, $a + b$ 의 값은?`,
      ...mcI(r, ans, [s * L + s * s * L, a - b, a + s * L * 2, 2 * L + 2 * s * L, -ans, ans + s]),
      solution: lines(
        `$x \\to ${m}$ 일 때 (분모) $\\to 0$ 이고 극한값이 존재하므로 (분자) $\\to 0$: $a\\sqrt{${s * s}} - b = 0$, 즉 $b = ${s === 1 ? "" : s}a$`,
        `$\\frac{a\\sqrt{${texPoly([1, n])}} - ${s === 1 ? "" : s}a}{${texShift(m)}} = \\frac{a\\{(${texPoly([1, n])}) - ${s * s}\\}}{(${texShift(m)})(\\sqrt{${texPoly([1, n])}} + ${s})} = \\frac{a}{\\sqrt{${texPoly([1, n])}} + ${s}}$`,
        `$x \\to ${m}$ 일 때 극한값은 $\\frac{a}{${2 * s}} = ${L}$ 이므로 $a = ${a}$, $b = ${b}$`,
        `따라서 $a + b = ${a} ${signed(b)} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ v, c, d, m, s }) => {
    const found: number[] = []
    if (v === 0) {
      const X = 1e6
      for (let A = 1; A <= 30; A++)
        for (let B = -100; B <= 100; B++) {
          const g = (x: number) => Math.sqrt(A * x * x + B * x) - c * x
          if (Math.abs(2 * g(2 * X) - g(X) - d) < 1e-3) found.push(A + B)
        }
    } else {
      const n = s * s - m
      for (let A = -40; A <= 40; A++)
        for (let B = -160; B <= 160; B++) {
          if (Math.abs(A * Math.sqrt(m + n) - B) > 1e-9) continue
          const lim = limitAt((x) => (A * Math.sqrt(x + n) - B) / (x - m), m)
          if (Math.abs(lim - d) < 1e-6) found.push(A + B)
        }
    }
    return only(found) ?? NaN
  },
}

/** {f(x)}² 또는 |f(x)| 가 연속 */
const sqCont: SuTemplate<{ k: number; m: number; R: number[]; v: number }> = {
  ...head("lim3-sqcont", U, "12미적Ⅰ-01-03", 3, 65),
  params: (r) => {
    const k = r.int(-3, 3)
    const m = nz(r, -3, 3)
    const R = [r.pick([1, -1, 2]), r.int(-4, 4), r.int(-6, 6)]
    const P0 = ev(R, k)
    if (P0 === 0) return null
    return { k, m, R, v: r.int(0, 1) }
  },
  build: ({ k, m, R, v }, r) => {
    const P0 = ev(R, k)
    const a1 = P0 - m * k
    const a2 = -P0 - m * k
    const ans = a1 * a2
    const f = cases([`${cx(m)} + a`, `x < ${k}`], [texPoly(R), `x \\ge ${k}`])
    const h = v === 0 ? "\\{f(x)\\}^{2}" : "|f(x)|"
    return {
      text: `함수 $f(x) = ${f}$ 에 대하여 함수 $${h}$ ${v === 0 ? "이" : "가"} 실수 전체의 집합에서 연속이 되도록 하는 모든 상수 $a$ 의 값의 곱은?`,
      ...mcI(r, ans, [a1, -ans, a1 + a2, a1 * a1, P0 * P0 + m * m * k * k, ans + 1]),
      solution: lines(
        `$x \\ne ${k}$ 에서 $f(x)$ 는 연속이므로 $${h}$ 도 연속이다. $x = ${k}$ 에서의 연속만 확인하면 된다.`,
        v === 0
          ? `$\\lim_{x \\to ${k}-} \\{f(x)\\}^{2} = (${m * k} + a)^{2}$, $\\{f(${k})\\}^{2} = ${P0 * P0}$ 이므로 $(${m * k} + a)^{2} = ${P0 * P0}$`
          : `$\\lim_{x \\to ${k}-} |f(x)| = |${m * k} + a|$, $|f(${k})| = ${Math.abs(P0)}$ 이므로 $|${m * k} + a| = ${Math.abs(P0)}$`,
        `$${m * k} + a = ${P0}$ 또는 $${m * k} + a = ${-P0}$ 에서 $a = ${a1}$ 또는 $a = ${a2}$`,
        `($a = ${a2}$ 이면 $f(x)$ 는 불연속이지만 $${h}$ ${v === 0 ? "은" : "는"} 연속이다.)`,
        `따라서 모든 $a$ 의 값의 곱은 $${times(a1, a2)} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ k, m, R, v }) => {
    const found: number[] = []
    for (let a = -100; a <= 100; a++) {
      const f = (x: number) => (x < k ? m * x + a : ev(R, x))
      const h = (x: number) => (v === 0 ? f(x) ** 2 : Math.abs(f(x)))
      if (Math.abs(h(k - 1e-10) - h(k)) < 1e-6) found.push(a)
    }
    return found.length === 2 ? found[0] * found[1] : NaN
  },
}

// 직선 y = t 와 y = f(x) 의 교점 개수 (f: x<0 에서 mx+n, x≥0 에서 s(x-a)²+b)
type Cross = { m: number; n: number; s: number; a: number; b: number }
const crossCount = ({ m, n, s, a, b }: Cross, t: number) => {
  let cnt = 0
  if ((t - n) / m < 0) cnt++
  const w = (t - b) / s
  if (w === 0) cnt += a >= 0 ? 1 : 0
  else if (w > 0) {
    const sq = Math.sqrt(w)
    if (a + sq >= 0) cnt++
    if (a - sq >= 0) cnt++
  }
  return cnt
}
const crossInfo = (c: Cross) => {
  const R0 = c.s * c.a * c.a + c.b
  const crit = [...new Set([c.b, R0, c.n])].sort((x, y) => x - y)
  const disc = crit.filter((t) => crossCount(c, t - 0.5) !== crossCount(c, t) || crossCount(c, t + 0.5) !== crossCount(c, t))
  const vals = crit.flatMap((t) => [crossCount(c, t - 0.5), crossCount(c, t), crossCount(c, t + 0.5)])
  return { R0, crit, disc, max: Math.max(...vals) }
}
const crossTable = (c: Cross, crit: number[]) => {
  const parts: string[] = []
  parts.push(`$t < ${crit[0]}$ 일 때 $${crossCount(c, crit[0] - 0.5)}$`)
  crit.forEach((t, i) => {
    parts.push(`$t = ${t}$ 일 때 $${crossCount(c, t)}$`)
    if (i + 1 < crit.length) parts.push(`$${t} < t < ${crit[i + 1]}$ 일 때 $${crossCount(c, (t + crit[i + 1]) / 2)}$`)
  })
  parts.push(`$t > ${crit[crit.length - 1]}$ 일 때 $${crossCount(c, crit[crit.length - 1] + 0.5)}$`)
  return parts.join(", ")
}
const crossFTex = ({ m, n, s, a, b }: Cross, nTex?: string) =>
  cases([nTex ? `${cx(m)} + ${nTex}` : texPoly([m, n]), "x < 0"], [texPoly([s, -2 * s * a, s * a * a + b]), "x \\ge 0"])
const crossShape = ({ m, n, s, a, b }: Cross, R0: number, nTex = String(n)) =>
  lines(
    `$x \\ge 0$ 일 때 $f(x) = ${s === 1 ? "" : "-"}${fac(a)}^{2} ${signed(b)}$ 이므로 $x = ${a}$ 에서 ${s === 1 ? "최솟값" : "최댓값"}을 갖고 그 값은 $${b}$ 이다. 또 $f(0) = ${R0}$ 이다.`,
    `$x < 0$ 일 때 $f(x) = ${nTex === String(n) ? texPoly([m, n]) : `${cx(m)} + ${nTex}`}$ 이고, 이 직선은 ${m > 0 ? "증가" : "감소"}하므로 $${nTex}$ 보다 ${m > 0 ? "작은" : "큰"} 모든 값을 정확히 한 번씩 갖는다. ($\\lim_{x \\to 0-} f(x) = ${nTex}$)`
  )
const crossScan = (c: Cross) => {
  const disc: number[] = []
  for (let t2 = -160; t2 <= 160; t2++) {
    const t = t2 / 2
    const g0 = crossCount(c, t)
    if (crossCount(c, t - 0.25) !== g0 || crossCount(c, t + 0.25) !== g0) disc.push(t)
  }
  return disc
}

/** 교점 개수 함수 g(t)의 불연속 */
const crossDisc: SuTemplate<Cross> = {
  ...head("lim3-crossdisc", U, "12미적Ⅰ-01-03", 3, 65),
  params: (r) => {
    const c = { m: nz(r, -3, 3), n: r.int(-8, 8), s: r.pick([1, -1]), a: r.int(1, 4), b: r.int(-6, 6) }
    const { crit } = crossInfo(c)
    if (crit.length < 3) return null
    return c
  },
  build: (c, r) => {
    const { R0, crit, disc, max } = crossInfo(c)
    const S = disc.reduce((x, y) => x + y, 0)
    const ans = S + max
    return {
      text: `함수 $f(x) = ${crossFTex(c)}$ 와 실수 $t$ 에 대하여 직선 $y = t$ 와 곡선 $y = f(x)$ 가 만나는 점의 개수를 $g(t)$ 라 하자. 함수 $g(t)$ 가 불연속인 모든 $t$ 의 값의 합을 $S$, 함수 $g(t)$ 의 최댓값을 $M$ 이라 할 때, $S + M$ 의 값은?`,
      ...mcI(r, ans, [S, ans + 1, ans - 1, crit.reduce((x, y) => x + y, 0) + max + 1, S + max - 1 + (disc.length === 3 ? -crit[0] : 2), ans + 2]),
      solution: lines(
        crossShape(c, R0),
        `직선 $y = t$ 를 위아래로 움직이며 교점의 개수를 세면 ${crossTable(c, crit)}`,
        `따라서 $g(t)$ 는 $t = ${disc.join(", ")}$ 에서 불연속이고 $S = ${disc.join(" + ").replace(/\+ -/g, "- ")} = ${S}$, 최댓값 $M = ${max}$`,
        `$S + M = ${S} ${signed(max)} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: (c) => {
    const disc = crossScan(c)
    let max = 0
    for (let t2 = -160; t2 <= 160; t2++) max = Math.max(max, crossCount(c, t2 / 2), crossCount(c, t2 / 2 + 0.25))
    return disc.reduce((x, y) => x + y, 0) + max
  },
}

// ───────────────────────── 4단계 ─────────────────────────

/** f(x)f(x-k) 가 연속이 되는 k */
type Shift = { A: number[]; B: number[]; rho: number; sig: number }
const shiftF = ({ A, B, rho, sig }: Shift) => (x: number) => (x < 0 ? rho * (x - A[0]) * (x - A[1]) : sig * (x - B[0]) * (x - B[1]))
const shiftInfo = (p: Shift) => {
  const Z = [...new Set([...p.A.filter((x) => x < 0), ...p.B.filter((x) => x >= 0)])].sort((x, y) => x - y)
  const pos = Z.filter((k) => k > 0 && Z.includes(-k))
  const A0 = p.rho * p.A[0] * p.A[1]
  const B0 = p.sig * p.B[0] * p.B[1]
  const zero = A0 === -B0
  return { Z, pos, A0, B0, zero }
}
const shiftCont: SuTemplate<Shift> = {
  ...head("lim4-shiftcont", U, "12미적Ⅰ-01-03", 4, 73),
  params: (r) => {
    const A = [r.int(-6, 2), r.int(-6, 2)].sort((x, y) => x - y)
    const B = [r.int(-2, 6), r.int(-2, 6)].sort((x, y) => x - y)
    const p = { A, B, rho: r.pick([1, -1]), sig: r.pick([1, -1]) }
    const { pos, A0, B0 } = shiftInfo(p)
    if (A0 === B0 || pos.length === 0) return null
    return p
  },
  build: (p, r) => {
    const { Z, pos, A0, B0, zero } = shiftInfo(p)
    const m = 2 * pos.length + (zero ? 1 : 0)
    const S = pos.reduce((x, y) => x + y, 0)
    const ans = m + S
    const Atex = texPoly([p.rho, -p.rho * (p.A[0] + p.A[1]), p.rho * p.A[0] * p.A[1]])
    const Btex = texPoly([p.sig, -p.sig * (p.B[0] + p.B[1]), p.sig * p.B[0] * p.B[1]])
    const f = cases([Atex, "x < 0"], [Btex, "x \\ge 0"])
    return {
      text: `함수 $f(x) = ${f}$ 에 대하여 함수 $f(x)f(x - k)$ 가 실수 전체의 집합에서 연속이 되도록 하는 실수 $k$ 의 개수를 $m$, 이러한 $k$ 중 양수인 것의 합을 $S$ 라 할 때, $m + S$ 의 값을 구하시오.`,
      ...short(ans),
      solution: lines(
        `$\\lim_{x \\to 0-} f(x) = ${A0}$, $f(0) = ${B0}$ 이므로 $f(x)$ 는 $x = 0$ 에서만 불연속이다. $h(x) = f(x)f(x - k)$ 라 하자.`,
        `(i) $k \\ne 0$ 일 때: $h(x)$ 가 불연속일 수 있는 곳은 $x = 0$ 과 $x = k$ 이다.`,
        `$x = 0$ 에서 $f(x - k)$ 는 연속이므로 $\\lim_{x \\to 0-} h(x) = ${A0}f(-k)$, $h(0) = ${B0}f(-k)$ 가 같아야 하고, $${A0} \\ne ${B0}$ 이므로 $f(-k) = 0$`,
        `$x = k$ 에서 $f(x)$ 는 연속이므로 같은 방법으로 $f(k) \\times ${paren(A0)} = f(k) \\times ${paren(B0)}$, 즉 $f(k) = 0$`,
        `$f(x) = 0$ 의 해는 $x = ${Z.join(", ")}$ 이므로 $f(k) = f(-k) = 0$ 인 $k$ 는 $k = ${[...pos.map((x) => -x), ...pos].sort((x, y) => x - y).join(", ")}$`,
        `(ii) $k = 0$ 일 때: $h(x) = \\{f(x)\\}^{2}$ 이고 $x = 0$ 에서 $${A0 * A0}${zero ? " = " : " \\ne "}${B0 * B0}$ 이므로 ${zero ? "연속이다." : "불연속이다."}`,
        `따라서 $m = ${m}$, $S = ${S}$ 이고 $m + S = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: (p) => {
    const f = shiftF(p)
    let m = 0
    let S = 0
    for (let k = -15; k <= 15; k++) {
      const h = (x: number) => f(x) * f(x - k)
      let ok = true
      for (const x0 of [0, k]) {
        const e = 1e-9
        if (Math.abs(h(x0 - e) - h(x0)) > 1e-6 || Math.abs(h(x0 + e) - h(x0)) > 1e-6) ok = false
      }
      if (ok) {
        m++
        if (k > 0) S += k
      }
    }
    return m + S
  },
}

/** 교점 개수 함수가 불연속인 점의 개수 조건으로 상수 결정 */
const crossParam: SuTemplate<Cross & { T: number }> = {
  ...head("lim4-crossparam", U, "12미적Ⅰ-01-03", 4, 72),
  params: (r) => {
    const base = { m: nz(r, -3, 3), n: 0, s: r.pick([1, -1]), a: r.int(1, 4), b: r.int(-6, 6) }
    const R0 = base.s * base.a * base.a + base.b
    const cb = crossInfo({ ...base, n: base.b }).disc.length
    const cR = crossInfo({ ...base, n: R0 }).disc.length
    if (cb === cR || b0eq(base.b, R0)) return null
    const opts = [cb, cR].filter((x) => x !== 3)
    if (!opts.length) return null
    const T = r.pick(opts)
    const n = T === cb ? base.b : R0
    return { ...base, n, T }
  },
  build: (c, r) => {
    const { R0, crit, disc } = crossInfo(c)
    const S = disc.reduce((x, y) => x + y, 0)
    const ans = c.n + S
    const other = c.n === c.b ? R0 : c.b
    const cOther = crossInfo({ ...c, n: other }).disc.length
    return {
      text: `상수 $n$ 에 대하여 함수 $f(x) = ${crossFTex(c, "n")}$ 이 있다. 실수 $t$ 에 대하여 직선 $y = t$ 와 곡선 $y = f(x)$ 가 만나는 점의 개수를 $g(t)$ 라 하자. 함수 $g(t)$ 가 불연속인 실수 $t$ 의 개수가 $${c.T}$ 일 때, 함수 $g(t)$ 가 불연속인 모든 $t$ 의 값의 합을 $S$ 라 하자. $n + S$ 의 값은?`,
      ...mcI(r, ans, [S, other + S, other + crossInfo({ ...c, n: other }).disc.reduce((x, y) => x + y, 0), ans + 1, ans - 1, c.n]),
      solution: lines(
        crossShape(c, R0, "n"),
        `$g(t)$ 는 $t = ${c.b}$ (꼭짓점), $t = ${R0}$ ($f(0)$), $t = n$ (직선의 끝) 에서 개수가 바뀔 수 있다.`,
        `$n \\ne ${c.b}$, $n \\ne ${R0}$ 이면 세 값에서 모두 $g(t)$ 의 좌극한과 우극한이 달라 불연속인 점이 $3$ 개이다. 따라서 $n = ${c.b}$ 또는 $n = ${R0}$`,
        `$n = ${other}$ 이면 불연속인 $t$ 가 $${cOther}$ 개이므로 조건을 만족시키지 않는다.`,
        `$n = ${c.n}$ 이면 ${crossTable(c, crit)} 이므로 $g(t)$ 는 $t = ${disc.join(", ")}$ 에서만 불연속이다.`,
        `따라서 $n = ${c.n}$, $S = ${S}$ 이고 $n + S = ${ans}$`
      ),
      score: 4,
    }
  },
  // n 을 0.5 간격으로 모두 넣어 보며 불연속점 개수가 T 인 n 을 찾는다
  verify: (c) => {
    const found: number[] = []
    for (let n2 = -60; n2 <= 60; n2++) {
      const n = n2 / 2
      const disc = crossScan({ ...c, n })
      if (disc.length === c.T) found.push(n + disc.reduce((x, y) => x + y, 0))
    }
    return only(found) ?? NaN
  },
}

/** f(x)g(x) 연속 + lim f(x)g(x)/(x-s) 존재 → 중근 */
const dblRoot: SuTemplate<{ s: number; rr: number; c0: number; n: number; L: number[]; Rr: number[] }> = {
  ...head("lim4-dblroot", U, "12미적Ⅰ-01-03", 4, 72),
  params: (r) => {
    const s = r.int(-3, 3)
    const rr = r.int(-5, 5)
    const c0 = r.int(-3, 4)
    const n = r.int(-3, 5)
    if (c0 === s || n === s || n === c0 || rr === s) return null
    const L = [nz(r, -3, 3), r.int(-5, 5)]
    const Rr = r.chance(0.5) ? [nz(r, -3, 3), r.int(-5, 5)] : [r.pick([1, -1]), r.int(-3, 3), r.int(-4, 4)]
    if (ev(L, s) === ev(Rr, s)) return null
    return { s, rr, c0, n, L, Rr }
  },
  build: ({ s, rr, c0, n, L, Rr }, r) => {
    const g = (x: number) => (x - s) ** 2 * (x - rr)
    const G = g(c0)
    if (G === 0) {
      /* c0 = rr 이면 G=0 이어도 유일 */
    }
    const ans = g(n)
    const f = cases([texPoly(L), `x < ${s}`], [texPoly(Rr), `x \\ge ${s}`])
    const wr = [(n - s) * (n - rr) * (n - c0), (n - s) ** 2 * (n + rr), (n + s) ** 2 * (n - rr), ans + 1, ans - 1, -ans]
    return {
      text: `함수 $f(x) = ${f}$ 와 최고차항의 계수가 $1$ 인 삼차함수 $g(x)$ 가 다음 조건을 만족시킨다.\n(가) 함수 $f(x)g(x)$ 는 실수 전체의 집합에서 연속이다.\n(나) $\\lim_{x \\to ${s}} \\frac{f(x)g(x)}{${texShift(s)}}$ 의 값이 존재한다.\n(다) $g(${c0}) = ${G}$\n이때 $g(${n})$ ${ask(ans)}`,
      ...answerI(r, ans, wr),
      solution: lines(
        `$\\lim_{x \\to ${s}-} f(x) = ${ev(L, s)}$, $f(${s}) = ${ev(Rr, s)}$ 이므로 $f(x)$ 는 $x = ${s}$ 에서 불연속이다.`,
        `(가)에서 $${ev(L, s)}g(${s}) = ${ev(Rr, s)}g(${s})$ 이므로 $g(${s}) = 0$, 즉 $g(x) = ${fac(s)}h(x)$ ($h(x)$ 는 최고차항의 계수가 $1$ 인 이차함수)`,
        `(나)에서 $\\frac{f(x)g(x)}{${texShift(s)}} = f(x)h(x)$ 이고, 좌극한 $${ev(L, s)}h(${s})$ 와 우극한 $${ev(Rr, s)}h(${s})$ 가 같아야 하므로 $h(${s}) = 0$`,
        `따라서 $g(x) = ${fac(s)}^{2}(x - c)$ 로 놓을 수 있고, (다)에서 $${times((c0 - s) ** 2)}(${c0} - c) = ${G}$ 이므로 $c = ${rr}$`,
        `$g(${n}) = ${times((n - s) ** 2, n - rr)} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ s, rr, c0, n, L, Rr }) => {
    const G = (c0 - s) ** 2 * (c0 - rr)
    const f = (x: number) => (x < s ? ev(L, x) : ev(Rr, x))
    const found: number[] = []
    for (let c2 = -14; c2 <= 14; c2++)
      for (let c1 = -45; c1 <= 45; c1++) {
        const c0v = G - (c0 ** 3 + c2 * c0 * c0 + c1 * c0)
        const g = (x: number) => ev([1, c2, c1, c0v], x)
        const h = (x: number) => f(x) * g(x)
        const e = 1e-9
        if (Math.abs(h(s - e) - h(s)) > 1e-6 || Math.abs(h(s + e) - h(s)) > 1e-6) continue
        const d = 1e-5
        const lq = h(s - d) / -d
        const rq = h(s + d) / d
        if (Math.abs(lq - rq) > 1e-3) continue
        found.push(g(n))
      }
    return only(found) ?? NaN
  },
}

export const LIMITS: SuTemplate[] = [
  factorLimit,
  infLimit,
  oneSided,
  contConst,
  coefLimit,
  polyDet,
  ivtInterval,
  radLimit,
  limProp,
  contTwo,
  cubicDet,
  contProd,
  radCoef,
  sqCont,
  crossDisc,
  shiftCont,
  crossParam,
  dblRoot,
]
const b0eq = (x: number, y: number) => x === y
