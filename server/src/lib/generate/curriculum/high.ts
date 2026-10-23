// 고1(공통수학1·2) · 고2(대수, 미적분Ⅰ) · 고3(확률과 통계, 미적분Ⅱ, 기하)
import { fracChoices, numberChoices, reduce } from "../lib"
import type { Unit } from "../types"

const sgn = (n: number) => (n < 0 ? `- ${-n}` : `+ ${n}`)
const coef = (n: number, v: string, first = false) => {
  if (n === 0) return ""
  const abs = Math.abs(n) === 1 ? "" : String(Math.abs(n))
  if (first) return `${n < 0 ? "-" : ""}${abs}${v}`
  return ` ${n < 0 ? "-" : "+"} ${abs}${v}`
}
/** 다항식 계수 [최고차, ..., 상수] → TeX */
function poly(cs: number[], v = "x") {
  const deg = cs.length - 1
  let s = ""
  cs.forEach((c, i) => {
    const p = deg - i
    if (c === 0) return
    const vv = p === 0 ? "" : p === 1 ? v : `${v}^{${p}}`
    if (p === 0) s += s ? ` ${sgn(c)}` : String(c)
    else s += coef(c, vv, s === "")
  })
  return s || "0"
}
const evalPoly = (cs: number[], x: number) => cs.reduce((acc, c) => acc * x + c, 0)
const C = (n: number, k: number) => {
  let v = 1
  for (let i = 0; i < k; i++) v = (v * (n - i)) / (i + 1)
  return Math.round(v)
}
const P = (n: number, k: number) => {
  let v = 1
  for (let i = 0; i < k; i++) v *= n - i
  return v
}

export const high: Unit[] = [
  // ───────── 고1 ─────────
  {
    grade: "h1",
    unit: "다항식",
    slug: "poly",
    templates: [
      {
        id: "remainder",
        make: (r) => {
          const cs = [1, r.int(-5, 5), r.int(-6, 6), r.int(-9, 9)]
          const a = r.int(-3, 3) || 2
          const v = evalPoly(cs, a)
          return { text: `다항식 $P(x) = ${poly(cs)}$ 를 $${a < 0 ? `x + ${-a}` : `x - ${a}`}$ 로 나눈 나머지는?`, ...numberChoices(r, v, [evalPoly(cs, -a), v + 1, v - 2, cs[3]]), hint: "나머지정리: $P(a)$" }
        },
      },
      {
        id: "identity",
        make: (r) => {
          const p = r.int(-5, 5)
          const q = r.int(-5, 5)
          // (x+p)(x+q) = x^2 + ax + b
          return { text: `등식 $(x ${sgn(p)})(x ${sgn(q)}) = x^2 + ax + b$ 가 $x$ 에 대한 항등식일 때, $a + b$ 의 값은?`.replace(/x \+ 0/g, "x"), ...numberChoices(r, p + q + p * q, [p + q, p * q, p + q - p * q, -(p + q)]) }
        },
      },
    ],
  },
  {
    grade: "h1",
    unit: "방정식과 부등식",
    slug: "equation",
    templates: [
      {
        id: "complex",
        make: (r) => {
          const a = r.int(-4, 5)
          const b = r.int(1, 5)
          const c = r.int(-4, 5)
          const d = r.int(1, 5)
          // (a+bi)(c+di) = (ac-bd) + (ad+bc)i
          return { text: `$(${a} + ${b}i)(${c} + ${d}i) = p + qi$ ($p,\\ q$ 는 실수) 일 때, $p + q$ 의 값은?`.replace(/\(0 \+ /g, "(").replace(/\+ 1i/g, "+ i"), ...numberChoices(r, a * c - b * d + a * d + b * c, [a * c + b * d + a * d + b * c, a * c - b * d, a * d + b * c, a * c - b * d - (a * d + b * c)]) }
        },
      },
      {
        id: "vieta",
        make: (r) => {
          const p = r.int(-6, 6)
          const q = r.int(-6, 6)
          const s = p + q
          const t = p * q
          return { text: `이차방정식 $${poly([1, -s, t])} = 0$ 의 두 근을 $\\alpha,\\ \\beta$ 라 할 때, $\\alpha^2 + \\beta^2$ 의 값은?`, answer: String(s * s - 2 * t), hint: "$\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta$" }
        },
      },
      {
        id: "ineq",
        make: (r) => {
          const p = r.int(-5, 3)
          const q = p + r.int(2, 7)
          // (x-p)(x-q) < 0 → p < x < q, 정수 개수 q-p-1
          return { text: `이차부등식 $${poly([1, -(p + q), p * q])} < 0$ 을 만족하는 정수 $x$ 의 개수는?`, answer: String(q - p - 1) }
        },
      },
    ],
  },
  {
    grade: "h1",
    unit: "경우의 수와 행렬",
    slug: "count",
    templates: [
      {
        id: "perm",
        make: (r) => {
          const n = r.int(5, 9)
          const k = r.int(2, 3)
          return r.chance(0.5)
            ? { text: `$_{${n}}\\mathrm{P}_{${k}}$ 의 값은?`, answer: String(P(n, k)) }
            : { text: `$_{${n}}\\mathrm{C}_{${k}}$ 의 값은?`, answer: String(C(n, k)) }
        },
      },
      {
        id: "matrix",
        make: (r) => {
          const m = Array.from({ length: 4 }, () => r.int(-3, 4))
          const n = Array.from({ length: 4 }, () => r.int(-3, 4))
          const [a, b, c, d] = m
          const [e, f, g, h] = n
          const prod = [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h]
          const sum = prod.reduce((s, x) => s + x, 0)
          return {
            text: `두 행렬 $A = \\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix},\\ B = \\begin{pmatrix} ${e} & ${f} \\\\ ${g} & ${h} \\end{pmatrix}$ 에 대하여 행렬 $AB$ 의 모든 성분의 합은?`,
            ...numberChoices(r, sum, [m.reduce((s, x) => s + x, 0) * n.reduce((s, x) => s + x, 0), a * e + b * f + c * g + d * h, sum + 2, -sum]),
          }
        },
      },
    ],
  },
  {
    grade: "h1",
    unit: "도형의 방정식",
    slug: "coord",
    templates: [
      {
        id: "dist",
        make: (r) => {
          const [dx, dy, d] = r.pick([
            [3, 4, 5],
            [6, 8, 10],
            [5, 12, 13],
            [8, 6, 10],
            [12, 5, 13],
          ])
          const x1 = r.int(-5, 5)
          const y1 = r.int(-5, 5)
          return { text: `두 점 $A(${x1},\\ ${y1})$, $B(${x1 + dx},\\ ${y1 - dy})$ 사이의 거리는?`, ...numberChoices(r, d, [dx + dy, d + 1, d - 1, Math.abs(dx - dy)]) }
        },
      },
      {
        id: "circle",
        make: (r) => {
          const a = r.int(-4, 4)
          const b = r.int(-4, 4)
          const rad = r.int(1, 6)
          // x^2 + y^2 - 2a x - 2b y + (a^2+b^2-r^2) = 0
          const c = a * a + b * b - rad * rad
          let eq = "x^2 + y^2"
          if (a) eq += ` ${-2 * a < 0 ? "-" : "+"} ${Math.abs(2 * a)}x`
          if (b) eq += ` ${-2 * b < 0 ? "-" : "+"} ${Math.abs(2 * b)}y`
          if (c) eq += ` ${sgn(c)}`
          return { text: `원 $${eq} = 0$ 의 반지름의 길이는?`, ...numberChoices(r, rad, [rad * rad, rad + 1, Math.abs(a) + Math.abs(b), rad + 2]) }
        },
      },
    ],
  },
  {
    grade: "h1",
    unit: "집합과 명제·함수",
    slug: "setfunc",
    templates: [
      {
        id: "subsets",
        make: (r) => {
          const n = r.int(3, 6)
          const must = r.int(1, Math.min(2, n - 1))
          return { text: `집합 $A = \\{${Array.from({ length: n }, (_, i) => i + 1).join(",\\ ")}\\}$ 의 부분집합 중 $${Array.from({ length: must }, (_, i) => i + 1).join(",\\ ")}$ 을(를) 반드시 원소로 갖는 부분집합의 개수는?`, answer: String(2 ** (n - must)) }
        },
      },
      {
        id: "compose",
        make: (r) => {
          const a = r.int(2, 4)
          const b = r.int(-3, 3)
          const c = r.int(1, 3)
          const x = r.int(-2, 3)
          // f(x)=ax+b, g(x)=x^2+c ; (f∘g)(x)=a(x^2+c)+b
          return { text: `두 함수 $f(x) = ${poly([a, b])},\\ g(x) = ${poly([1, 0, c])}$ 에 대하여 $(f \\circ g)(${x})$ 의 값은?`, ...numberChoices(r, a * (x * x + c) + b, [(a * x + b) ** 2 + c, a * x * x + b, a * (x * x + c), a * (x * x + c) - b]) }
        },
      },
    ],
  },
  // ───────── 고2 ─────────
  {
    grade: "h2",
    unit: "지수함수와 로그함수",
    slug: "explog",
    templates: [
      {
        id: "log",
        make: (r) => {
          const base = r.pick([2, 3])
          const a = r.int(1, 5)
          const b = r.int(1, 4)
          const n = base ** a * base ** b
          return { text: `$\\log_{${base}} ${base ** a} + \\log_{${base}} ${base ** b}$ 의 값은?`, ...numberChoices(r, a + b, [a * b, n, a + b + 1, Math.abs(a - b)]) }
        },
      },
      {
        id: "exp",
        make: (r) => {
          const a = r.pick([4, 8, 9, 27, 16])
          const base = a === 9 || a === 27 ? 3 : 2
          const e = Math.round(Math.log(a) / Math.log(base))
          const m = r.int(1, 4)
          return { text: `$${a}^{\\frac{1}{${e}}} \\times ${base}^{${m}}$ 의 값은?`, ...numberChoices(r, base ** (1 + m), [base ** m, a * base ** m, base ** (m + 2), base * m]) }
        },
      },
      {
        id: "logeq",
        make: (r) => {
          const base = r.pick([2, 3, 5])
          const k = r.int(1, 3)
          const c = r.int(1, 6)
          // log_base (x - c) = k → x = base^k + c
          return { text: `방정식 $\\log_{${base}}(x - ${c}) = ${k}$ 의 해는?`, answer: String(base ** k + c) }
        },
      },
    ],
  },
  {
    grade: "h2",
    unit: "삼각함수",
    slug: "trig",
    templates: [
      {
        id: "value",
        make: (r) => {
          const opts = [
            { t: "\\sin\\frac{\\pi}{6}", v: [1, 2] },
            { t: "\\cos\\frac{\\pi}{3}", v: [1, 2] },
            { t: "\\sin\\frac{5\\pi}{6}", v: [1, 2] },
            { t: "\\cos\\frac{2\\pi}{3}", v: [-1, 2] },
            { t: "\\sin\\frac{7\\pi}{6}", v: [-1, 2] },
            { t: "\\tan\\frac{\\pi}{4}", v: [1, 1] },
            { t: "\\tan\\frac{3\\pi}{4}", v: [-1, 1] },
            { t: "\\cos\\pi", v: [-1, 1] },
          ] as const
          const a = r.pick(opts)
          const b = r.pick(opts)
          const [n, d] = reduce(a.v[0] * b.v[1] + b.v[0] * a.v[1], a.v[1] * b.v[1])
          return { text: `$${a.t} + ${b.t}$ 의 값은?`, ...fracChoices(r, [n, d], [[-n, d], [n + d, d], [n - d, d], [n, 2 * d], [2 * n + 1, 2 * d]]) }
        },
      },
      {
        id: "period",
        make: (r) => {
          const k = r.int(2, 6)
          const f = r.pick(["\\sin", "\\cos"])
          return { text: `함수 $y = 3${f}\\,${k}x + 1$ 의 주기를 $\\frac{q}{p}\\pi$ ($p,\\ q$ 는 서로소인 자연수) 라 할 때 $p + q$ 의 값은?`, answer: String(reduce(2, k)[0] + reduce(2, k)[1]) }
        },
      },
    ],
  },
  {
    grade: "h2",
    unit: "수열",
    slug: "sequence",
    templates: [
      {
        id: "arith",
        make: (r) => {
          const a = r.int(-5, 10)
          const d = r.int(-4, 6) || 3
          const n = r.int(8, 20)
          return { text: `첫째항이 $${a}$, 공차가 $${d}$ 인 등차수열의 제 $${n}$ 항은?`, ...numberChoices(r, a + (n - 1) * d, [a + n * d, a * d * (n - 1), a + (n - 2) * d, (n - 1) * d]) }
        },
      },
      {
        id: "geo",
        make: (r) => {
          const a = r.int(1, 3)
          const q = r.pick([2, 3])
          const n = r.int(4, 7)
          return { text: `첫째항이 $${a}$, 공비가 $${q}$ 인 등비수열의 첫째항부터 제 $${n}$ 항까지의 합은?`, answer: String((a * (q ** n - 1)) / (q - 1)) }
        },
      },
      {
        id: "sigma",
        make: (r) => {
          const n = r.int(5, 12)
          const a = r.int(1, 3)
          const b = r.int(-3, 4)
          // Σ (a k + b) = a n(n+1)/2 + b n
          return { text: `$\\displaystyle\\sum_{k=1}^{${n}} (${poly([a, b], "k")})$ 의 값은?`, answer: String((a * n * (n + 1)) / 2 + b * n) }
        },
      },
    ],
  },
  {
    grade: "h2",
    unit: "함수의 극한과 미분",
    slug: "diff",
    templates: [
      {
        id: "limit",
        make: (r) => {
          const a = r.int(-4, 5)
          const b = r.int(-4, 5)
          // lim_{x→a} (x^2 - (a+b)x + ab)/(x - a) = a - b
          return { text: `$\\displaystyle\\lim_{x \\to ${a}} \\frac{${poly([1, -(a + b), a * b])}}{${poly([1, -a])}}$ 의 값은?`, ...numberChoices(r, a - b, [a + b, b - a, a * b, 0]) }
        },
      },
      {
        id: "deriv",
        make: (r) => {
          const cs = [r.int(1, 3), r.int(-4, 4), r.int(-5, 5), r.int(-5, 5)]
          const x = r.int(-2, 2)
          const d = 3 * cs[0] * x * x + 2 * cs[1] * x + cs[2]
          return { text: `함수 $f(x) = ${poly(cs)}$ 에 대하여 $f'(${x})$ 의 값은?`, ...numberChoices(r, d, [evalPoly(cs, x), d + cs[0], 3 * cs[0] * x + cs[1], d - 2]) }
        },
      },
      {
        id: "tangent",
        make: (r) => {
          const b = r.int(-4, 4)
          const c = r.int(-5, 5)
          const t = r.int(-2, 3)
          return { text: `곡선 $y = ${poly([1, b, c])}$ 위의 점 $(${t},\\ ${t * t + b * t + c})$ 에서의 접선의 기울기는?`, answer: String(2 * t + b) }
        },
      },
    ],
  },
  {
    grade: "h2",
    unit: "다항함수의 적분",
    slug: "integral",
    templates: [
      {
        id: "definite",
        make: (r) => {
          const a = r.pick([3, 6]) // 3x^2 계수 계열이 정수로 떨어지게
          const b = r.pick([2, 4, -2])
          const c = r.int(-3, 3)
          const lo = r.int(0, 1)
          const hi = lo + r.int(1, 3)
          const F = (x: number) => (a / 3) * x ** 3 + (b / 2) * x * x + c * x
          return { text: `$\\displaystyle\\int_{${lo}}^{${hi}} (${poly([a, b, c])})\\,dx$ 의 값은?`, answer: String(F(hi) - F(lo)) }
        },
      },
    ],
  },
  // ───────── 고3 ─────────
  {
    grade: "h3",
    unit: "확률과 통계",
    slug: "probstat",
    templates: [
      {
        id: "multiset",
        make: (r) => {
          const n = r.int(2, 5)
          const k = r.int(3, 7)
          // nHk = C(n+k-1, k)
          return { text: `$_{${n}}\\mathrm{H}_{${k}}$ 의 값은?`, answer: String(C(n + k - 1, k)), hint: "$_n\\mathrm{H}_r = {}_{n+r-1}\\mathrm{C}_r$" }
        },
      },
      {
        id: "binom",
        make: (r) => {
          const n = r.int(4, 7)
          const k = r.int(1, n - 1)
          const a = r.pick([1, 2])
          // (x + a)^n 에서 x^k 계수 C(n,k) a^{n-k}
          return { text: `$(x + ${a})^{${n}}$ 의 전개식에서 $x^{${k}}$ 의 계수는?`, answer: String(C(n, k) * a ** (n - k)) }
        },
      },
      {
        id: "cond",
        make: (r) => {
          const red = r.int(2, 5)
          const blue = r.int(2, 5)
          // 두 번 비복원 추출, 첫 번째가 빨강일 때 두 번째도 빨강
          const [n, d] = reduce(red - 1, red + blue - 1)
          return { text: `빨간 공 $${red}$ 개, 파란 공 $${blue}$ 개가 든 주머니에서 공을 한 개씩 두 번 꺼낸다(꺼낸 공은 넣지 않는다). 첫 번째 공이 빨간 공일 때, 두 번째 공도 빨간 공일 확률을 $\\frac{q}{p}$ ($p,\\ q$ 는 서로소인 자연수) 라 하면 $p + q$ 의 값은?`, answer: String(n + d) }
        },
      },
      {
        id: "binomdist",
        make: (r) => {
          const n = r.pick([10, 20, 30, 40, 50, 100])
          const [pn, pd] = r.pick([
            [1, 2],
            [1, 5],
            [1, 10],
            [2, 5],
          ] as const)
          const variance = (n * pn * (pd - pn)) / (pd * pd)
          if (!Number.isInteger(variance)) return { text: `확률변수 $X$ 가 이항분포 $\\mathrm{B}\\left(${n},\\ \\frac{${pn}}{${pd}}\\right)$ 를 따를 때, $\\mathrm{E}(X)$ 의 값은?`, answer: String((n * pn) / pd) }
          return { text: `확률변수 $X$ 가 이항분포 $\\mathrm{B}\\left(${n},\\ \\frac{${pn}}{${pd}}\\right)$ 를 따를 때, $\\mathrm{V}(X)$ 의 값은?`, answer: String(variance) }
        },
      },
    ],
  },
  {
    grade: "h3",
    unit: "미적분Ⅱ",
    slug: "calculus",
    templates: [
      {
        id: "seqlimit",
        make: (r) => {
          const a = r.int(1, 6)
          const b = r.int(1, 5)
          const c = r.int(1, 4)
          const d = r.int(-5, 5)
          // lim (a n^2 + b n)/(c n^2 + d) = a/c
          return { text: `$\\displaystyle\\lim_{n \\to \\infty} \\frac{${poly([a, b, 0], "n")}}{${poly([c, 0, d], "n")}}$ 의 값은?`, ...fracChoices(r, [a, c], [[b, c], [a, d || 1], [c, a], [a + b, c], [0, 1]]) }
        },
      },
      {
        id: "elimit",
        make: (r) => {
          const k = r.int(2, 6)
          return { text: `$\\displaystyle\\lim_{x \\to 0} \\frac{e^{${k}x} - 1}{x}$ 의 값은?`, ...numberChoices(r, k, [1, 0, k * k, k + 1]) }
        },
      },
      {
        id: "lnderiv",
        make: (r) => {
          const a = r.int(2, 5)
          const b = r.int(1, 4)
          const x = r.int(1, 3)
          // f(x) = ln(a x + b), f'(x) = a/(ax+b)
          const [n, d] = reduce(a, a * x + b)
          return { text: `함수 $f(x) = \\ln(${a}x + ${b})$ 에 대하여 $f'(${x})$ 의 값은?`, ...fracChoices(r, [n, d], [[1, a * x + b], [a, b], [a * x, a * x + b], [a, a * x]]) }
        },
      },
      {
        id: "trigint",
        make: (r) => {
          const k = r.int(1, 4)
          // ∫0^{π/2} k cos x dx = k
          return { text: `$\\displaystyle\\int_{0}^{\\frac{\\pi}{2}} ${k === 1 ? "" : k}\\cos x\\,dx$ 의 값은?`, ...numberChoices(r, k, [0, -k, 2 * k, k + 1]) }
        },
      },
    ],
  },
  {
    grade: "h3",
    unit: "기하",
    slug: "geometry",
    templates: [
      {
        id: "parabola",
        make: (r) => {
          const p = r.int(1, 6)
          // y^2 = 4px, 초점 (p, 0)
          return { text: `포물선 $y^2 = ${4 * p}x$ 의 초점의 $x$ 좌표는?`, ...numberChoices(r, p, [4 * p, 2 * p, p + 1, p * p]) }
        },
      },
      {
        id: "dot",
        make: (r) => {
          const a = [r.int(-3, 4), r.int(-3, 4)]
          const b = [r.int(-3, 4), r.int(-3, 4)]
          const dot = a[0] * b[0] + a[1] * b[1]
          return { text: `두 벡터 $\\vec{a} = (${a[0]},\\ ${a[1]})$, $\\vec{b} = (${b[0]},\\ ${b[1]})$ 에 대하여 $\\vec{a} \\cdot \\vec{b}$ 의 값은?`, ...numberChoices(r, dot, [a[0] * b[1] + a[1] * b[0], a[0] + b[0] + a[1] + b[1], -dot, dot + 1]) }
        },
      },
      {
        id: "space",
        make: (r) => {
          const [dx, dy, dz, d] = r.pick([
            [1, 2, 2, 3],
            [2, 3, 6, 7],
            [2, 6, 9, 11],
            [4, 4, 7, 9],
            [1, 4, 8, 9],
          ])
          const p = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]
          return { text: `좌표공간의 두 점 $A(${p.join(",\\ ")})$, $B(${p[0] + dx},\\ ${p[1] - dy},\\ ${p[2] + dz})$ 사이의 거리는?`, answer: String(d) }
        },
      },
    ],
  },
]
