// 유아 ~ 초6 (2022 개정 교육과정 단원 흐름에 맞춘 오리지널 문제)
import {
  clock,
  fmt,
  fracAnswer,
  fracChoices,
  fractionBar,
  gcd,
  lcm,
  numberChoices,
  rect,
  reduce,
  SHAPE_NAME,
  shapes,
  textChoices,
  THING_NAME,
  THING_UNIT,
  things,
  triangleAngles,
  twoGroups,
  type Shape,
  type Thing,
} from "../lib"
import type { Rng, Unit } from "../types"

const THINGS: Thing[] = ["apple", "star", "fish", "ball", "flower", "car"]
const SHAPES: Shape[] = ["circle", "triangle", "square", "star", "heart"]
const ORDER = (xs: Shape[]) => SHAPES.filter((s) => xs.includes(s)).map((s) => SHAPE_NAME[s])

export const kindergarten: Unit[] = [
  {
    grade: "k",
    unit: "수 세기",
    slug: "count",
    templates: [
      {
        id: "count",
        make: (r) => {
          const k = r.pick(THINGS)
          const n = r.int(1, 10)
          return {
            text: `${THING_NAME[k]}는 모두 몇 ${THING_UNIT[k]}일까요?`,
            figure: things(k, n),
            ...numberChoices(r, n, [n - 1, n + 1, n - 2, n + 2].filter((x) => x >= 1)),
            hint: "하나씩 손가락으로 짚으며 세어 보세요.",
          }
        },
      },
      {
        id: "next",
        make: (r) => {
          const n = r.int(1, 9)
          const after = r.chance(0.5)
          const ans = after ? n + 1 : n - 1
          if (ans < 1) return { text: `$${n}$ 바로 다음 수는 무엇일까요?`, ...numberChoices(r, n + 1, [n, n + 2, n - 1].filter((x) => x >= 1)) }
          return {
            text: after ? `$${n}$ 바로 다음 수는 무엇일까요?` : `$${n}$ 바로 앞의 수는 무엇일까요?`,
            ...numberChoices(r, ans, [n, ans + 2, ans - 2, n + 2].filter((x) => x >= 0)),
            hint: "1, 2, 3, … 소리 내어 세어 보세요.",
          }
        },
      },
      {
        id: "bigger",
        make: (r) => {
          const xs = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 5)
          const big = r.chance(0.5)
          const ans = big ? Math.max(...xs) : Math.min(...xs)
          return { text: big ? "가장 큰 수는 무엇일까요?" : "가장 작은 수는 무엇일까요?", ...numberChoices(r, ans, xs.filter((x) => x !== ans)) }
        },
      },
    ],
  },
  {
    grade: "k",
    unit: "모으기와 가르기",
    slug: "addsub",
    templates: [
      {
        id: "add",
        make: (r) => {
          const k = r.pick(THINGS)
          const a = r.int(1, 5)
          const b = r.int(1, 5)
          return {
            text: `${THING_NAME[k]} ${a}${THING_UNIT[k]}와 ${b}${THING_UNIT[k]}를 모으면 모두 몇 ${THING_UNIT[k]}일까요?`,
            figure: twoGroups(k, a, b),
            ...numberChoices(r, a + b, [a + b - 1, a + b + 1, a, b].filter((x) => x >= 1)),
          }
        },
      },
      {
        id: "sub",
        make: (r) => {
          const k = r.pick(THINGS)
          const n = r.int(3, 10)
          const m = r.int(1, n - 1)
          return {
            text: `${THING_NAME[k]} ${n}${THING_UNIT[k]} 중에서 ${m}${THING_UNIT[k]}를 먹었어요(✕ 표시). 몇 ${THING_UNIT[k]} 남았을까요?`.replace("먹었어요", k === "apple" ? "먹었어요" : "가져갔어요"),
            figure: things(k, n, { crossed: m }),
            ...numberChoices(r, n - m, [n - m - 1, n - m + 1, m, n].filter((x) => x >= 0)),
          }
        },
      },
    ],
  },
  {
    grade: "k",
    unit: "모양과 규칙",
    slug: "shape",
    templates: [
      {
        id: "name",
        make: (r) => {
          const s = r.pick(SHAPES)
          return {
            text: "이 모양의 이름은 무엇일까요?",
            figure: shapes([s], 110),
            ...textChoices(r, SHAPE_NAME[s], SHAPES.map((x) => SHAPE_NAME[x]), ORDER(SHAPES)),
          }
        },
      },
      {
        id: "pattern",
        make: (r) => {
          const [a, b, c] = r.shuffle(SHAPES).slice(0, 3)
          const unit: Shape[] = r.chance(0.5) ? [a, b] : [a, b, c]
          const len = unit.length === 2 ? 5 : 5
          const seq: Shape[] = Array.from({ length: len }, (_, i) => unit[i % unit.length])
          const ans = unit[len % unit.length]
          return {
            text: "규칙에 맞게 ? 에 들어갈 모양은 무엇일까요?",
            figure: shapes([...seq, "?"], 60),
            ...textChoices(r, SHAPE_NAME[ans], SHAPES.map((x) => SHAPE_NAME[x]), ORDER(SHAPES)),
            hint: "어떤 모양이 되풀이되는지 찾아보세요.",
          }
        },
      },
    ],
  },
]

export const elementary: Unit[] = [
  // ───────── 초1 ─────────
  {
    grade: "e1",
    unit: "100까지의 수",
    slug: "num100",
    templates: [
      {
        id: "tens",
        make: (r) => {
          const t = r.int(1, 9)
          const o = r.int(0, 9)
          return { text: `10개씩 묶음 ${t}개와 낱개 ${o}개는 얼마일까요?`, answer: String(t * 10 + o), hint: "10개씩 묶음이 십의 자리예요." }
        },
      },
      {
        id: "compare",
        make: (r) => {
          const xs = r.shuffle(Array.from({ length: 90 }, (_, i) => i + 10)).slice(0, 5)
          return { text: "가장 큰 수는 무엇일까요?", ...numberChoices(r, Math.max(...xs), xs.filter((x) => x !== Math.max(...xs))) }
        },
      },
    ],
  },
  {
    grade: "e1",
    unit: "덧셈과 뺄셈",
    slug: "addsub",
    templates: [
      {
        id: "add",
        make: (r) => {
          const a = r.int(1, 5) * 10 + r.int(0, 8)
          const b = r.int(1, 9 - (a % 10)) + r.int(0, 3) * 10
          return { text: `$${a} + ${b}$ 의 값을 구하세요.`, answer: String(a + b) }
        },
      },
      {
        id: "sub",
        make: (r) => {
          const a = r.int(20, 99)
          const b = r.int(0, a % 10) + r.int(0, Math.floor(a / 10) - 1) * 10
          return { text: `$${a} - ${b}$ 의 값을 구하세요.`, answer: String(a - b) }
        },
      },
      {
        id: "word",
        make: (r) => {
          const a = r.int(5, 15)
          const b = r.int(2, 9)
          return { text: `민지는 사탕 ${a}개를 가지고 있었는데 동생에게 ${b}개를 주었어요. 남은 사탕은 몇 개일까요?`, answer: String(a - b) }
        },
      },
    ],
  },
  {
    grade: "e1",
    unit: "시계 보기",
    slug: "clock",
    templates: [
      {
        id: "read",
        make: (r) => {
          const h = r.int(1, 12)
          const m = r.pick([0, 30])
          const label = (hh: number, mm: number) => (mm ? `${hh}시 30분` : `${hh}시`)
          const ans = label(h, m)
          const wrongs = [label(h, m ? 0 : 30), label((h % 12) + 1, m), label(h === 1 ? 12 : h - 1, m), label(((h + 5) % 12) + 1, m), label(((h + 2) % 12) + 1, m ? 0 : 30)]
          return { text: "시계가 나타내는 시각은 몇 시일까요?", figure: clock(h, m), ...textChoices(r, ans, wrongs) }
        },
      },
    ],
  },
  // ───────── 초2 ─────────
  {
    grade: "e2",
    unit: "세 자리 수와 덧셈·뺄셈",
    slug: "addsub",
    templates: [
      {
        id: "add",
        make: (r) => {
          const a = r.int(15, 79)
          const b = r.int(15, 99 - a + 30)
          return { text: `$${a} + ${b}$ 를 계산하세요.`, answer: String(a + b), hint: "일의 자리끼리 더해 10이 넘으면 받아올림해요." }
        },
      },
      {
        id: "sub",
        make: (r) => {
          const a = r.int(41, 99)
          const b = r.int(12, a - 5)
          return { text: `$${a} - ${b}$ 를 계산하세요.`, answer: String(a - b) }
        },
      },
      {
        id: "place",
        make: (r) => {
          const n = r.int(100, 999)
          const pos = r.pick(["백", "십", "일"] as const)
          const d = pos === "백" ? Math.floor(n / 100) * 100 : pos === "십" ? (Math.floor(n / 10) % 10) * 10 : n % 10
          return { text: `$${n}$ 에서 ${pos}의 자리 숫자가 나타내는 값은 얼마일까요?`, answer: String(d) }
        },
      },
    ],
  },
  {
    grade: "e2",
    unit: "곱셈구구",
    slug: "times",
    templates: [
      {
        id: "times",
        make: (r) => {
          const a = r.int(2, 9)
          const b = r.int(2, 9)
          return { text: `$${a} \\times ${b}$ 의 값을 구하세요.`, ...numberChoices(r, a * b, [a * (b + 1), a * (b - 1), (a + 1) * b, a + b]) }
        },
      },
      {
        id: "word",
        make: (r) => {
          const a = r.int(3, 9)
          const b = r.int(2, 9)
          return { text: `한 상자에 과자가 ${a}개씩 들어 있어요. ${b}상자에 들어 있는 과자는 모두 몇 개일까요?`, answer: String(a * b) }
        },
      },
    ],
  },
  {
    grade: "e2",
    unit: "길이와 시간",
    slug: "length",
    templates: [
      {
        id: "cm",
        make: (r) => {
          const m = r.int(1, 5)
          const cm = r.int(5, 95)
          return { text: `$${m}\\,\\mathrm{m}\\ ${cm}\\,\\mathrm{cm}$ 는 몇 $\\mathrm{cm}$ 일까요?`, answer: String(m * 100 + cm), hint: "1 m = 100 cm" }
        },
      },
      {
        id: "minutes",
        make: (r) => {
          const h = r.int(1, 3)
          const m = r.int(5, 55)
          return { text: `${h}시간 ${m}분은 모두 몇 분일까요?`, answer: String(h * 60 + m), hint: "1시간 = 60분" }
        },
      },
    ],
  },
  // ───────── 초3 ─────────
  {
    grade: "e3",
    unit: "곱셈과 나눗셈",
    slug: "muldiv",
    templates: [
      {
        id: "mul",
        make: (r) => {
          const a = r.int(12, 99)
          const b = r.int(3, 9)
          return { text: `$${a} \\times ${b}$ 를 계산하세요.`, answer: String(a * b) }
        },
      },
      {
        id: "mul2",
        make: (r) => {
          const a = r.int(12, 49)
          const b = r.int(11, 39)
          return { text: `$${a} \\times ${b}$ 를 계산하세요.`, answer: String(a * b) }
        },
      },
      {
        id: "div",
        make: (r) => {
          const b = r.int(3, 9)
          const q = r.int(3, 12)
          const rem = r.int(1, b - 1)
          const a = b * q + rem
          return { text: `$${a} \\div ${b}$ 의 몫과 나머지를 차례로 구할 때, 나머지는 얼마일까요?`, answer: String(rem), hint: `${b} × 몫 + 나머지 = ${a}` }
        },
      },
      {
        id: "share",
        make: (r) => {
          const b = r.int(3, 8)
          const q = r.int(4, 12)
          return { text: `구슬 ${b * q}개를 ${b}명에게 똑같이 나누어 주면 한 사람이 몇 개씩 가질까요?`, answer: String(q) }
        },
      },
    ],
  },
  {
    grade: "e3",
    unit: "분수와 소수",
    slug: "fraction",
    templates: [
      {
        id: "bar",
        make: (r) => {
          const n = r.int(3, 8)
          const k = r.int(1, n - 1)
          return {
            text: "색칠한 부분은 전체의 얼마일까요?",
            figure: fractionBar(k, n),
            ...fracChoicesNoReduce(r, k, n),
          }
        },
      },
      {
        id: "dec",
        make: (r) => {
          const a = r.int(11, 59)
          const b = r.int(11, 39)
          return { text: `$${(a / 10).toFixed(1)} + ${(b / 10).toFixed(1)}$ 를 계산하세요.`, answer: ((a + b) / 10).toString() }
        },
      },
    ],
  },
  {
    grade: "e3",
    unit: "원",
    slug: "circle",
    templates: [
      {
        id: "dia",
        make: (r) => {
          const rad = r.int(3, 25)
          return r.chance(0.5)
            ? { text: `반지름이 $${rad}\\,\\mathrm{cm}$ 인 원의 지름은 몇 $\\mathrm{cm}$ 일까요?`, answer: String(rad * 2) }
            : { text: `지름이 $${rad * 2}\\,\\mathrm{cm}$ 인 원의 반지름은 몇 $\\mathrm{cm}$ 일까요?`, answer: String(rad) }
        },
      },
    ],
  },
  // ───────── 초4 ─────────
  {
    grade: "e4",
    unit: "큰 수",
    slug: "bignum",
    templates: [
      {
        id: "place",
        make: (r) => {
          const n = r.int(10, 99) * 1_000_000 + r.int(0, 999_999)
          const digit = Math.floor(n / 10_000) % 10
          return { text: `$${fmt(n).replace(/,/g, "{,}")}$ 에서 만의 자리 숫자는 무엇일까요?`, ...numberChoices(r, digit, [Math.floor(n / 1000) % 10, Math.floor(n / 100000) % 10, Math.floor(n / 1_000_000) % 10, n % 10], (x) => `$${x}$`) }
        },
      },
      {
        id: "zeros",
        make: (r) => {
          const ok = r.int(1, 9)
          const man = r.int(1, 999)
          const one = r.int(0, 999)
          const n = ok * 1e8 + man * 1e4 + one
          const zeros = String(n).split("").filter((c) => c === "0").length
          return { text: `억이 ${ok}개, 만이 ${man}개, 일이 ${one}개인 수를 숫자로 쓸 때 0은 모두 몇 개일까요?`, answer: String(zeros), hint: "억은 0이 8개, 만은 0이 4개 붙어요." }
        },
      },
    ],
  },
  {
    grade: "e4",
    unit: "곱셈과 나눗셈",
    slug: "muldiv",
    templates: [
      {
        id: "mul",
        make: (r) => {
          const a = r.int(105, 899)
          const b = r.int(12, 79)
          return { text: `$${a} \\times ${b}$ 를 계산하세요.`, answer: String(a * b) }
        },
      },
      {
        id: "div",
        make: (r) => {
          const b = r.int(12, 49)
          const q = r.int(5, 29)
          const rem = r.int(0, b - 1)
          return { text: `$${b * q + rem} \\div ${b}$ 의 몫을 구하세요.`, answer: String(q) }
        },
      },
    ],
  },
  {
    grade: "e4",
    unit: "각도",
    slug: "angle",
    templates: [
      {
        id: "tri",
        make: (r) => {
          const a = r.int(30, 80)
          const b = r.int(30, 150 - a)
          return { text: "삼각형에서 ? 에 알맞은 각도는 몇 도일까요?", figure: triangleAngles(a, b), answer: String(180 - a - b), hint: "삼각형의 세 각의 합은 180°예요." }
        },
      },
      {
        id: "quad",
        make: (r) => {
          const a = r.int(60, 120)
          const b = r.int(60, 120)
          const c = r.int(50, 110)
          return { text: `사각형의 세 각이 $${a}^\\circ,\\ ${b}^\\circ,\\ ${c}^\\circ$ 일 때, 나머지 한 각은 몇 도일까요?`, answer: String(360 - a - b - c), hint: "사각형의 네 각의 합은 360°예요." }
        },
      },
    ],
  },
  {
    grade: "e4",
    unit: "분수와 소수의 덧셈과 뺄셈",
    slug: "fracdec",
    templates: [
      {
        id: "same",
        make: (r) => {
          const d = r.int(5, 12)
          const a = r.int(1, d - 1)
          const b = r.int(1, d - 1)
          const n = a + b
          const whole = Math.floor(n / d)
          return {
            text: `$\\frac{${a}}{${d}} + \\frac{${b}}{${d}}$ 의 값은?`,
            answer: fracAnswer(n, d),
            hint: whole ? "분모가 같으면 분자끼리 더해요. 가분수는 그대로 답해도 돼요." : "분모가 같으면 분자끼리 더해요.",
          }
        },
      },
      {
        id: "dec",
        make: (r) => {
          const a = r.int(120, 899)
          const b = r.int(105, a - 10)
          return { text: `$${(a / 100).toFixed(2)} - ${(b / 100).toFixed(2)}$ 를 계산하세요.`, answer: String((a - b) / 100) }
        },
      },
    ],
  },
  // ───────── 초5 ─────────
  {
    grade: "e5",
    unit: "약수와 배수",
    slug: "divisor",
    templates: [
      {
        id: "gcd",
        make: (r) => {
          const g = r.int(2, 12)
          const a = g * r.int(2, 9)
          let b = g * r.int(2, 9)
          if (b === a) b += g
          return { text: `$${a}$ 와 $${b}$ 의 최대공약수를 구하세요.`, answer: String(gcd(a, b)) }
        },
      },
      {
        id: "lcm",
        make: (r) => {
          const a = r.int(4, 18)
          let b = r.int(4, 18)
          if (b === a) b++
          return { text: `$${a}$ 와 $${b}$ 의 최소공배수를 구하세요.`, answer: String(lcm(a, b)) }
        },
      },
      {
        id: "count",
        make: (r) => {
          const n = r.pick([12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 60, 64, 72, 80, 84, 90, 96, 100])
          const c = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0).length
          return { text: `$${n}$ 의 약수는 모두 몇 개일까요?`, answer: String(c) }
        },
      },
    ],
  },
  {
    grade: "e5",
    unit: "분수의 덧셈·뺄셈·곱셈",
    slug: "fraction",
    templates: [
      {
        id: "add",
        make: (r) => {
          const d1 = r.int(2, 9)
          let d2 = r.int(2, 9)
          if (d2 === d1) d2++
          const a = r.int(1, d1 - 1)
          const b = r.int(1, d2 - 1)
          const n = a * d2 + b * d1
          const d = d1 * d2
          return { text: `$\\frac{${a}}{${d1}} + \\frac{${b}}{${d2}}$ 를 계산하세요.`, ...fracChoices(r, reduce(n, d), [[a + b, d1 + d2], [a + b, d1 * d2], [n + d, d], [a * b, d], [n, d1 + d2]]), hint: "분모를 같게 통분한 뒤 더해요." }
        },
      },
      {
        id: "mul",
        make: (r) => {
          const a = r.int(1, 8)
          const b = r.int(a + 1, 9)
          const c = r.int(1, 8)
          const d = r.int(c + 1, 9)
          return { text: `$\\frac{${a}}{${b}} \\times \\frac{${c}}{${d}}$ 를 계산하세요.`, answer: fracAnswer(a * c, b * d) }
        },
      },
    ],
  },
  {
    grade: "e5",
    unit: "다각형의 넓이와 평균",
    slug: "area",
    templates: [
      {
        id: "rect",
        make: (r) => {
          const w = r.int(4, 20)
          const h = r.int(3, 15)
          return { text: "직사각형의 넓이는 몇 $\\mathrm{cm}^2$ 일까요?", figure: rect(`${w} cm`, `${h} cm`), answer: String(w * h) }
        },
      },
      {
        id: "tri",
        make: (r) => {
          const b = r.int(2, 12) * 2
          const h = r.int(3, 15)
          return { text: `밑변이 $${b}\\,\\mathrm{cm}$, 높이가 $${h}\\,\\mathrm{cm}$ 인 삼각형의 넓이는 몇 $\\mathrm{cm}^2$ 일까요?`, answer: String((b * h) / 2), hint: "(밑변) × (높이) ÷ 2" }
        },
      },
      {
        id: "trap",
        make: (r) => {
          const a = r.int(3, 10)
          const b = r.int(a + 1, 16)
          const h = r.int(2, 8) * 2
          return { text: `윗변 $${a}\\,\\mathrm{cm}$, 아랫변 $${b}\\,\\mathrm{cm}$, 높이 $${h}\\,\\mathrm{cm}$ 인 사다리꼴의 넓이는 몇 $\\mathrm{cm}^2$ 일까요?`, answer: String(((a + b) * h) / 2) }
        },
      },
      {
        id: "avg",
        make: (r) => {
          const n = r.int(4, 5)
          const avg = r.int(60, 90)
          const xs = Array.from({ length: n - 1 }, () => avg + r.int(-12, 12))
          const last = avg * n - xs.reduce((s, x) => s + x, 0)
          const all = r.shuffle([...xs, last])
          return { text: `${n}번의 시험 점수가 $${all.join(",\\ ")}$ 점일 때 평균은 몇 점일까요?`, answer: String(avg) }
        },
      },
    ],
  },
  // ───────── 초6 ─────────
  {
    grade: "e6",
    unit: "분수와 소수의 나눗셈",
    slug: "division",
    templates: [
      {
        id: "frac",
        make: (r) => {
          const a = r.int(1, 8)
          const b = r.int(a + 1, 9)
          const c = r.int(1, 8)
          const d = r.int(c + 1, 9)
          return { text: `$\\frac{${a}}{${b}} \\div \\frac{${c}}{${d}}$ 를 계산하세요.`, answer: fracAnswer(a * d, b * c), hint: "나누는 분수의 분모와 분자를 바꾸어 곱해요." }
        },
      },
      {
        id: "dec",
        make: (r) => {
          const q = r.int(2, 40)
          const b = r.int(2, 9) / 10
          return { text: `$${(q * b).toFixed(1)} \\div ${b.toFixed(1)}$ 을 계산하세요.`, answer: String(q) }
        },
      },
    ],
  },
  {
    grade: "e6",
    unit: "비와 비율",
    slug: "ratio",
    templates: [
      {
        id: "percent",
        make: (r) => {
          const total = r.pick([20, 25, 40, 50, 80, 200])
          let p = r.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80])
          while (!Number.isInteger((total * p) / 100)) p += 5
          return { text: `전체 $${total}$ 명 중 $${(total * p) / 100}$ 명은 전체의 몇 %일까요?`, answer: String(p) }
        },
      },
      {
        id: "proportion",
        make: (r) => {
          const a = r.int(2, 9)
          const b = r.int(2, 9)
          const k = r.int(2, 9)
          return { text: `비례식 $${a} : ${b} = ${a * k} : \\square$ 에서 $\\square$ 에 알맞은 수는?`, answer: String(b * k) }
        },
      },
      {
        id: "share",
        make: (r) => {
          const a = r.int(1, 5)
          const b = r.int(1, 5)
          const total = (a + b) * r.int(3, 20)
          return { text: `사탕 $${total}$ 개를 형과 동생이 $${a} : ${b}$ 로 나누어 가질 때, 형이 가지는 사탕은 몇 개일까요?`, answer: String((total * a) / (a + b)) }
        },
      },
    ],
  },
  {
    grade: "e6",
    unit: "원의 넓이와 입체도형",
    slug: "solid",
    templates: [
      {
        id: "circle",
        make: (r) => {
          const rad = r.int(2, 10)
          const area = Math.round(rad * rad * 3.14 * 100) / 100
          return { text: `반지름이 $${rad}\\,\\mathrm{cm}$ 인 원의 넓이는 몇 $\\mathrm{cm}^2$ 일까요? (원주율: $3.14$)`, answer: String(area) }
        },
      },
      {
        id: "box",
        make: (r) => {
          const a = r.int(2, 12)
          const b = r.int(2, 12)
          const c = r.int(2, 12)
          return r.chance(0.5)
            ? { text: `가로 $${a}\\,\\mathrm{cm}$, 세로 $${b}\\,\\mathrm{cm}$, 높이 $${c}\\,\\mathrm{cm}$ 인 직육면체의 부피는 몇 $\\mathrm{cm}^3$ 일까요?`, answer: String(a * b * c) }
            : { text: `가로 $${a}\\,\\mathrm{cm}$, 세로 $${b}\\,\\mathrm{cm}$, 높이 $${c}\\,\\mathrm{cm}$ 인 직육면체의 겉넓이는 몇 $\\mathrm{cm}^2$ 일까요?`, answer: String(2 * (a * b + b * c + c * a)) }
        },
      },
    ],
  },
]

/** 막대 그림처럼 약분하지 않은 분수 보기 (색칠 칸 그대로 읽게) */
function fracChoicesNoReduce(r: Rng, k: number, n: number) {
  const cands = [`${k}/${n}`, `${n - k}/${n}`, `${k}/${n - k}`, `${n}/${k}`, `${k + 1}/${n}`, `${k}/${n + 1}`]
  const show = (s: string) => {
    const [a, b] = s.split("/").map(Number)
    return `$\\frac{${a}}{${b}}$`
  }
  const uniq = [...new Set(cands)].filter((s) => !s.endsWith("/0") && !s.startsWith("0/"))
  const ans = `${k}/${n}`
  const list = [ans, ...r.shuffle(uniq.filter((s) => s !== ans)).slice(0, 4)]
  while (list.length < 5) list.push(`${k + list.length}/${n + 1}`)
  const shuffled = r.shuffle(list)
  return { choices: shuffled.map(show), answer: String(shuffled.indexOf(ans) + 1) }
}

