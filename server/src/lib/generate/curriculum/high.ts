// 고1(공통수학1·2). 고2·3은 수능 문제 은행(suneung/)이 맡는다
import { numberChoices } from "../lib"
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
]
