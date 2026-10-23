// 중1 ~ 중3
import { fracChoices, numberChoices, reduce, rightTriangle } from "../lib"
import type { Unit } from "../types"

const sgn = (n: number) => (n < 0 ? `- ${-n}` : `+ ${n}`)
/** ax + b 꼴을 TeX로 (계수 1·0 처리) */
function lin(a: number, b: number, v = "x") {
  const head = a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`
  return b === 0 ? head : `${head} ${sgn(b)}`
}
/** ax^2 + bx + c */
function quad(a: number, b: number, c: number, v = "x") {
  let s = a === 1 ? `${v}^2` : a === -1 ? `-${v}^2` : `${a}${v}^2`
  if (b) s += ` ${b < 0 ? "-" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}${v}`
  if (c) s += ` ${sgn(c)}`
  return s
}

export const middle: Unit[] = [
  // ───────── 중1 ─────────
  {
    grade: "m1",
    unit: "소인수분해",
    slug: "prime",
    templates: [
      {
        id: "divisors",
        make: (r) => {
          const p = r.pick([2, 3]) ** r.int(1, 4)
          const q = r.pick([5, 7]) ** r.int(1, 2)
          const n = p * q * r.pick([1, 1, 11])
          let c = 0
          for (let d = 1; d <= n; d++) if (n % d === 0) c++
          return { text: `$${n}$ 의 약수의 개수를 구하세요.`, answer: String(c), hint: "소인수분해 $a^m b^n$ 이면 약수는 $(m+1)(n+1)$ 개예요." }
        },
      },
      {
        id: "sum",
        make: (r) => {
          const a = r.int(1, 4)
          const b = r.int(1, 3)
          const c = r.int(0, 2)
          const n = 2 ** a * 3 ** b * 5 ** c
          return { text: `$${n} = 2^a \\times 3^b${c ? " \\times 5^c" : ""}$ 일 때, $a + b${c ? " + c" : ""}$ 의 값을 구하세요.`, answer: String(a + b + c) }
        },
      },
    ],
  },
  {
    grade: "m1",
    unit: "정수와 유리수",
    slug: "integer",
    templates: [
      {
        id: "calc",
        make: (r) => {
          const a = r.int(-15, 15)
          const b = r.int(-15, 15)
          const c = r.int(-9, 9) || 2
          const v = a - b * c
          const w = (n: number) => (n < 0 ? `(${n})` : String(n))
          return { text: `$${w(a)} - ${w(b)} \\times ${w(c)}$ 를 계산하세요.`, ...numberChoices(r, v, [a + b * c, (a - b) * c, -v, a - b + c]) }
        },
      },
      {
        id: "frac",
        make: (r) => {
          const a = r.int(1, 5)
          const b = r.int(2, 7)
          const c = r.int(1, 5)
          const d = r.int(2, 7)
          const [n, m] = reduce(-a * d + c * b, b * d)
          return { text: `$\\left(-\\frac{${a}}{${b}}\\right) + \\frac{${c}}{${d}}$ 를 계산하세요.`, ...fracChoices(r, [n, m], [[a * d + c * b, b * d], [-n, m], [c - a, b + d], [n + m, m]]) }
        },
      },
    ],
  },
  {
    grade: "m1",
    unit: "일차방정식",
    slug: "linear",
    templates: [
      {
        id: "solve",
        make: (r) => {
          const x = r.int(-9, 9)
          const a = r.pick([2, 3, 4, 5, -2, -3])
          const b = r.int(-12, 12)
          const c = r.pick([1, 2, -1].filter((k) => k !== a))
          const d = (a - c) * x + b
          return { text: `일차방정식 $${lin(a, b)} = ${lin(c, d)}$ 의 해를 구하세요.`, ...numberChoices(r, x, [-x, x + 1, x - 1, x + 2]) }
        },
      },
      {
        id: "word",
        make: (r) => {
          const kids = r.int(5, 15)
          const each = r.int(3, 6)
          const left = r.int(1, kids - 1)
          return { text: `사탕을 학생들에게 ${each}개씩 나누어 주면 ${left}개가 남고, ${each + 1}개씩 나누어 주면 ${kids - left}개가 모자라요. 학생은 몇 명일까요?`, answer: String(kids) }
        },
      },
    ],
  },
  {
    grade: "m1",
    unit: "좌표평면과 그래프",
    slug: "graph",
    templates: [
      {
        id: "direct",
        make: (r) => {
          const a = r.pick([-4, -3, -2, 2, 3, 4, 5])
          const x = r.int(1, 6)
          const x2 = r.int(-6, 6) || 3
          return { text: `$y$ 가 $x$ 에 정비례하고 $x = ${x}$ 일 때 $y = ${a * x}$ 이에요. $x = ${x2}$ 일 때 $y$ 의 값은?`, ...numberChoices(r, a * x2, [-a * x2, a + x2, a * x2 + a, a * x2 - a]) }
        },
      },
      {
        id: "inverse",
        make: (r) => {
          const k = r.pick([12, 18, 24, 30, 36, 48, 60])
          const divs = Array.from({ length: k }, (_, i) => i + 1).filter((d) => k % d === 0 && d > 1 && d < k)
          const x = r.pick(divs)
          const x2 = r.pick(divs.filter((d) => d !== x))
          return { text: `$y$ 가 $x$ 에 반비례하고 $x = ${x}$ 일 때 $y = ${k / x}$ 이에요. $x = ${x2}$ 일 때 $y$ 의 값은?`, answer: String(k / x2) }
        },
      },
    ],
  },
  {
    grade: "m1",
    unit: "자료의 정리",
    slug: "stats",
    templates: [
      {
        id: "median",
        make: (r) => {
          const n = r.pick([5, 7])
          const xs = Array.from({ length: n }, () => r.int(1, 30))
          const sorted = [...xs].sort((a, b) => a - b)
          return { text: `자료 $${xs.join(",\\ ")}$ 의 중앙값을 구하세요.`, answer: String(sorted[(n - 1) / 2]) }
        },
      },
      {
        id: "mode",
        make: (r) => {
          const m = r.int(1, 9)
          const xs = r.shuffle([m, m, m, ...r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== m)).slice(0, 5)])
          return { text: `자료 $${xs.join(",\\ ")}$ 의 최빈값을 구하세요.`, answer: String(m) }
        },
      },
    ],
  },
  // ───────── 중2 ─────────
  {
    grade: "m2",
    unit: "유리수와 순환소수",
    slug: "repeat",
    templates: [
      {
        id: "tofrac",
        make: (r) => {
          const a = r.int(1, 8)
          const b = r.int(0, 9)
          const ab = a * 10 + b
          // 0.ab ab ... = ab/99
          const [n, d] = reduce(ab, 99)
          return { text: `순환소수 $0.\\dot{${a}}\\dot{${b}}$ 를 기약분수로 나타내면 $\\frac{b}{a}$ 일 때, $a + b$ 의 값은?`, answer: String(n + d), hint: "순환마디가 두 자리면 분모는 99예요." }
        },
      },
      {
        id: "terminate",
        make: (r) => {
          const d = r.pick([12, 14, 15, 18, 21, 22, 24, 28, 30, 35, 36, 42, 45])
          const odd = (n: number) => {
            let x = n
            while (x % 2 === 0) x /= 2
            while (x % 5 === 0) x /= 5
            return x
          }
          const need = odd(d)
          return { text: `$\\frac{x}{${d}}$ 를 소수로 나타내면 유한소수가 될 때, $x$ 의 값이 될 수 있는 가장 작은 자연수는?`, answer: String(need), hint: "기약분수의 분모의 소인수가 2와 5뿐이어야 해요." }
        },
      },
    ],
  },
  {
    grade: "m2",
    unit: "식의 계산",
    slug: "expr",
    templates: [
      {
        id: "power",
        make: (r) => {
          const a = r.int(2, 5)
          const b = r.int(2, 5)
          const c = r.int(1, 4)
          return { text: `$(x^{${a}})^{${b}} \\div x^{${c}} = x^{n}$ 일 때, $n$ 의 값은?`, ...numberChoices(r, a * b - c, [a + b - c, a * b + c, a * b, a + b + c]) }
        },
      },
      {
        id: "expand",
        make: (r) => {
          const a = r.int(1, 5)
          const b = r.int(-6, 6) || 1
          const c = r.int(1, 4)
          const d = r.int(-6, 6) || -2
          // (ax+b)(cx+d) 의 x 계수
          return { text: `$(${lin(a, b)})(${lin(c, d)})$ 를 전개했을 때 $x$ 의 계수는?`, ...numberChoices(r, a * d + b * c, [a * c, b * d, a * d - b * c, a + b + c + d]) }
        },
      },
    ],
  },
  {
    grade: "m2",
    unit: "연립방정식과 부등식",
    slug: "system",
    templates: [
      {
        id: "system",
        make: (r) => {
          const x = r.int(-5, 6)
          const y = r.int(-5, 6)
          const a = r.int(1, 4)
          const b = r.pick([1, 2, -1, 3])
          const c = r.int(1, 3)
          const d = r.pick([-1, -2, 1, -3].filter((k) => a * k - b * c !== 0))
          const row = (p: number, q: number) => `${p === 1 ? "" : p}x ${q < 0 ? "-" : "+"} ${Math.abs(q) === 1 ? "" : Math.abs(q)}y = ${p * x + q * y}`
          return {
            text: `연립방정식 $\\begin{cases} ${row(a, b)} \\\\ ${row(c, d)} \\end{cases}$ 의 해가 $x = p,\\ y = q$ 일 때 $p + q$ 의 값은?`,
            ...numberChoices(r, x + y, [x - y, y - x, x * y, x + y + 2]),
          }
        },
      },
      {
        id: "ineq",
        make: (r) => {
          const a = r.int(2, 5)
          const k = r.int(2, 8)
          const b = r.int(-5, 5)
          // ax + b < a*k + b → x < k, 자연수 해 k-1개
          return { text: `일차부등식 $${lin(a, b)} < ${a * k + b}$ 를 만족하는 자연수 $x$ 의 개수는?`, answer: String(k - 1) }
        },
      },
    ],
  },
  {
    grade: "m2",
    unit: "일차함수",
    slug: "linfunc",
    templates: [
      {
        id: "slope",
        make: (r) => {
          const m = r.pick([-3, -2, -1, 1, 2, 3, 4])
          const x1 = r.int(-4, 2)
          const x2 = x1 + r.int(1, 4)
          const b = r.int(-5, 5)
          return { text: `두 점 $(${x1},\\ ${m * x1 + b})$, $(${x2},\\ ${m * x2 + b})$ 를 지나는 직선의 기울기는?`, ...numberChoices(r, m, [-m, m + 1, m - 1, b]) }
        },
      },
      {
        id: "intercept",
        make: (r) => {
          const m = r.pick([2, 3, -2, -3, 4])
          const xi = r.int(-5, 5) || 2
          const b = -m * xi
          return { text: `일차함수 $y = ${lin(m, b)}$ 의 그래프의 $x$ 절편은?`, ...numberChoices(r, xi, [-xi, b, -b, xi + 1]) }
        },
      },
    ],
  },
  {
    grade: "m2",
    unit: "확률",
    slug: "prob",
    templates: [
      {
        id: "dice",
        make: (r) => {
          const s = r.int(3, 11)
          let c = 0
          for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) c++
          const [n, d] = reduce(c, 36)
          return { text: `서로 다른 두 주사위를 던질 때, 나오는 눈의 합이 $${s}$ 일 확률을 기약분수 $\\frac{q}{p}$ 로 나타내면 $p + q$ 의 값은?`, answer: String(n + d) }
        },
      },
      {
        id: "count",
        make: (r) => {
          const n = r.int(4, 7)
          const k = r.pick([2, 3])
          let v = 1
          for (let i = 0; i < k; i++) v *= n - i
          return { text: `${n}명 중에서 ${k === 2 ? "회장 1명, 부회장 1명" : "회장, 부회장, 총무를 각각 1명씩"} 뽑는 경우의 수는?`, answer: String(v) }
        },
      },
    ],
  },
  // ───────── 중3 ─────────
  {
    grade: "m3",
    unit: "제곱근과 실수",
    slug: "root",
    templates: [
      {
        id: "simplify",
        make: (r) => {
          const a = r.int(2, 6)
          const b = r.pick([2, 3, 5, 6, 7])
          return { text: `$\\sqrt{${a * a * b}} = a\\sqrt{${b}}$ 일 때, 자연수 $a$ 의 값은?`, answer: String(a) }
        },
      },
      {
        id: "calc",
        make: (r) => {
          const b = r.pick([2, 3, 5])
          const p = r.int(1, 4)
          const q = r.int(1, 4)
          // sqrt(p^2 b) + sqrt(q^2 b) = (p+q) sqrt b
          return { text: `$\\sqrt{${p * p * b}} + \\sqrt{${q * q * b}} = k\\sqrt{${b}}$ 일 때, $k$ 의 값은?`, ...numberChoices(r, p + q, [p * q, p + q + 1, Math.abs(p - q), p * p + q * q]) }
        },
      },
    ],
  },
  {
    grade: "m3",
    unit: "인수분해와 이차방정식",
    slug: "quadratic",
    templates: [
      {
        id: "factor",
        make: (r) => {
          const p = r.int(-7, 7) || 1
          let q = r.int(-7, 7) || -2
          if (q === p) q = p + 1
          // x^2 - (p+q)x + pq = (x-p)(x-q)
          return { text: `$${quad(1, -(p + q), p * q)} = (x - a)(x - b)$ 일 때, $a^2 + b^2$ 의 값은?`, answer: String(p * p + q * q) }
        },
      },
      {
        id: "roots",
        make: (r) => {
          const p = r.int(-6, 6)
          let q = r.int(-6, 6)
          if (q === p) q = p + 2
          const big = Math.max(p, q)
          return { text: `이차방정식 $${quad(1, -(p + q), p * q)} = 0$ 의 두 근 중 큰 근은?`, ...numberChoices(r, big, [Math.min(p, q), -big, -Math.min(p, q), big + 1]) }
        },
      },
    ],
  },
  {
    grade: "m3",
    unit: "이차함수",
    slug: "quadfunc",
    templates: [
      {
        id: "vertex",
        make: (r) => {
          const a = r.pick([1, 2, -1, -2, 3])
          const h = r.int(-4, 4)
          const k = r.int(-6, 6)
          // a(x-h)^2 + k = a x^2 - 2ah x + a h^2 + k
          return { text: `이차함수 $y = ${quad(a, -2 * a * h, a * h * h + k)}$ 의 그래프의 꼭짓점의 좌표가 $(p,\\ q)$ 일 때, $p + q$ 의 값은?`, ...numberChoices(r, h + k, [-h + k, h - k, -h - k, h + k + a]) }
        },
      },
    ],
  },
  {
    grade: "m3",
    unit: "삼각비와 피타고라스",
    slug: "trig",
    templates: [
      {
        id: "pyth",
        make: (r) => {
          const [a, b, c] = r.pick([
            [3, 4, 5],
            [5, 12, 13],
            [6, 8, 10],
            [8, 15, 17],
            [9, 12, 15],
            [7, 24, 25],
          ])
          return { text: "직각삼각형에서 빗변의 길이를 구하세요.", figure: rightTriangle({ a: String(b), b: String(a), c: "?" }), answer: String(c), hint: "$a^2 + b^2 = c^2$" }
        },
      },
      {
        id: "ratio",
        make: (r) => {
          const [a, b, c] = r.pick([
            [3, 4, 5],
            [5, 12, 13],
            [8, 15, 17],
          ])
          const kind = r.pick(["sin", "cos", "tan"] as const)
          // 각 B: 마주보는 변 a(세로), 이웃 b(밑변), 빗변 c
          const [n, d] = kind === "sin" ? [a, c] : kind === "cos" ? [b, c] : [a, b]
          return {
            text: `$\\angle C = 90^\\circ$ 인 직각삼각형 $ABC$ 에서 $\\overline{AC} = ${a},\\ \\overline{BC} = ${b},\\ \\overline{AB} = ${c}$ 일 때, $\\${kind} B$ 의 값은?`,
            ...fracChoices(r, [n, d], [[b, c], [a, c], [a, b], [b, a], [c, a], [c, b]]),
          }
        },
      },
    ],
  },
]

