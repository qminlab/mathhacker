// 확률과 통계 · 확률 (12확통02-01~06)
import { C, combos, perms, q, Q, roots, tuples } from "../kit"
import type { SuTemplate } from "../types"
import { askProb, fracEq, fracMc, pqOrValue, ratioTex, sol as lines, tableFigure, polish } from "./helpers"

const UNIT = "확률"
const S = "확률과 통계" as const
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const nC = (n: number | string, k: number | string) => `{}_{${n}}\\mathrm{C}_{${k}}`
const fr = (n: number, d: number) => q(n, d).tex()
const DICE = range(1, 6)

// ═════════════════ 1단계 ═════════════════

type DiceEv = { kind: number; v: number }
const diceEvText = ({ kind, v }: DiceEv) =>
  [
    `두 눈의 수의 합이 $${v}$ 일`,
    `두 눈의 수의 합이 $${v}$ 이상일`,
    `두 눈의 수의 합이 $${v}$ 이하일`,
    `두 눈의 수의 차가 $${v}$ 일`,
    `두 눈의 수의 곱이 $${v}$ 의 배수일`,
    `두 눈의 수의 합이 $${v}$ 의 배수일`,
    `처음 나온 눈의 수가 두 번째 나온 눈의 수의 약수일`,
  ][kind]
const diceEv = ({ kind, v }: DiceEv) => (a: number, b: number) =>
  [a + b === v, a + b >= v, a + b <= v, Math.abs(a - b) === v, (a * b) % v === 0, (a + b) % v === 0, b % a === 0][kind]

const diceBasic: SuTemplate<{ ev: DiceEv; twice: boolean }> = {
  id: "p1-dice",
  subject: S,
  unit: UNIT,
  standard: "12확통02-01",
  level: 1,
  count: 50,
  params: (r) => {
    const kind = r.int(0, 6)
    const v = [r.int(3, 11), r.int(7, 11), r.int(3, 7), r.int(0, 4), r.int(2, 6), r.int(3, 6), 0][kind]
    const ev = { kind, v }
    if (kind === 6 && !r.chance(0.3)) return null
    return { ev, twice: r.chance(0.5) }
  },
  build: ({ ev, twice }, r) => {
    const f = diceEv(ev)
    const fav: [number, number][] = []
    for (const a of DICE) for (const b of DICE) if (f(a, b)) fav.push([a, b])
    const ans = q(fav.length, 36)
    const stem = twice
      ? `한 개의 주사위를 두 번 던질 때, ${diceEvText(ev).replace("두 눈의 수", "나온 두 눈의 수")} 확률은?`
      : `서로 다른 두 개의 주사위를 동시에 던질 때, ${diceEvText(ev).replace("처음 나온 눈의 수가 두 번째 나온 눈의 수의", "첫 번째 주사위의 눈의 수가 두 번째 주사위의 눈의 수의")} 확률은?`
    const show = fav.length <= 12 ? fav.map(([a, b]) => `(${a}, ${b})`).join(", ") : ""
    return {
      text: stem,
      ...fracMc(r, ans, [q(fav.length, 21), q(36 - fav.length, 36), q(fav.length + 1, 36), q(Math.max(1, fav.length - 1), 36), q(fav.length, 30)]),
      solution: lines(
        `모든 경우의 수는 $6 \\times 6 = 36$ 이다.`,
        show ? `조건을 만족시키는 순서쌍은 $${show}$ 로 $${fav.length}$ 가지이다.` : `조건을 만족시키는 순서쌍을 첫 번째 눈의 수별로 세면 ${DICE.map((a) => `$${DICE.filter((b) => f(a, b)).length}$`).join(", ")} 가지이므로 모두 $${fav.length}$ 가지이다.`,
        `따라서 구하는 확률은 $${fracEq(fav.length, 36)}$`
      ),
      score: 2,
    }
  },
  verify: ({ ev }) => {
    const f = diceEv(ev)
    let c = 0
    for (const [a, b] of tuples(DICE, 2)) if (f(a, b)) c++
    return c / 36
  },
}

const addRule: SuTemplate<{ D: number; a: number; b: number; c: number; kind: number }> = {
  id: "p1-add-rule",
  subject: S,
  unit: UNIT,
  standard: "12확통02-02",
  level: 1,
  count: 50,
  params: (r) => {
    const D = r.pick([6, 8, 10, 12, 15, 20, 24])
    const kind = r.int(0, 3)
    const c = kind === 3 ? 0 : r.int(1, D / 3)
    const a = r.int(c + 1, D - 2)
    const b = r.int(c + 1, D - 2)
    if (a + b - c >= D) return null
    return { D, a, b, c, kind }
  },
  build: ({ D, a, b, c, kind }, r) => {
    const PA = q(a, D)
    const PB = q(b, D)
    const PAB = q(c, D)
    const PU = q(a + b - c, D)
    let text: string
    let ans: Q
    let sol: string[]
    let wr: Q[]
    if (kind === 0) {
      ans = PU
      text = `두 사건 $A, B$ 에 대하여 $P(A) = ${PA.tex()},\\ P(B) = ${PB.tex()},\\ P(A \\cap B) = ${PAB.tex()}$ 일 때, $P(A \\cup B)$ 의 값은?`
      sol = [`확률의 덧셈정리 $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ 를 이용한다.`, `$P(A \\cup B) = ${PA.tex()} + ${PB.tex()} - ${PAB.tex()} = ${ans.tex()}$`]
      wr = [PA.add(PB), PU.sub(PAB), q(1).sub(PU), PA.add(PB).sub(PAB.mul(2))]
    } else if (kind === 1) {
      ans = PAB
      text = `두 사건 $A, B$ 에 대하여 $P(A) = ${PA.tex()},\\ P(B) = ${PB.tex()},\\ P(A \\cup B) = ${PU.tex()}$ 일 때, $P(A \\cap B)$ 의 값은?`
      sol = [`확률의 덧셈정리 $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ 에서`, `$P(A \\cap B) = P(A) + P(B) - P(A \\cup B) = ${PA.tex()} + ${PB.tex()} - ${PU.tex()} = ${ans.tex()}$`]
      wr = [PU.sub(PA), PA.mul(PB), PAB.add(q(1, D)), q(1).sub(PU)]
    } else if (kind === 2) {
      ans = PB
      const none = q(1).sub(PU)
      text = `두 사건 $A, B$ 에 대하여 $P(A) = ${PA.tex()},\\ P(A \\cap B) = ${PAB.tex()},\\ P(A^{C} \\cap B^{C}) = ${none.tex()}$ 일 때, $P(B)$ 의 값은? (단, $A^{C}$, $B^{C}$ 은 각각 $A$, $B$ 의 여사건이다.)`
      sol = [
        `$A^{C} \\cap B^{C} = (A \\cup B)^{C}$ 이므로 $P(A \\cup B) = 1 - ${none.tex()} = ${PU.tex()}$`,
        `덧셈정리에서 $P(B) = P(A \\cup B) - P(A) + P(A \\cap B)$`,
        `$= ${PU.tex()} - ${PA.tex()} + ${PAB.tex()} = ${ans.tex()}$`,
      ]
      wr = [PU.sub(PA), none, PU.sub(PA).sub(PAB), q(1).sub(PB)]
    } else {
      ans = PB
      text = `두 사건 $A$ 와 $B$ 는 서로 배반사건이고 $P(A) = ${PA.tex()},\\ P(A \\cup B) = ${PU.tex()}$ 일 때, $P(B)$ 의 값은?`
      sol = [`$A$ 와 $B$ 가 서로 배반사건이면 $P(A \\cap B) = 0$ 이므로 $P(A \\cup B) = P(A) + P(B)$`, `따라서 $P(B) = ${PU.tex()} - ${PA.tex()} = ${ans.tex()}$`]
      wr = [PU, q(1).sub(PA), PA, PU.add(PA).sub(q(1)), q(1).sub(PU)]
    }
    return { text, ...fracMc(r, ans, wr), solution: lines(...sol), score: 2 }
  },
  // 원소 D개 표본공간에 A, B를 실제로 놓고 센다
  verify: ({ D, a, b, c, kind }) => {
    const A = new Set(range(0, a - 1))
    const B = new Set(range(a - c, a - c + b - 1))
    const pts = range(0, D - 1)
    const n = (f: (x: number) => boolean) => pts.filter(f).length / D
    if (kind === 0) return n((x) => A.has(x) || B.has(x))
    if (kind === 1) return n((x) => A.has(x) && B.has(x))
    return n((x) => B.has(x))
  },
}

const atLeast: SuTemplate<{ red: number; white: number; k: number; target: 0 | 1 }> = {
  id: "p1-at-least",
  subject: S,
  unit: UNIT,
  standard: "12확통02-03",
  level: 1,
  count: 50,
  params: (r) => {
    const red = r.int(2, 6)
    const white = r.int(2, 6)
    const k = r.int(2, 3)
    const target = r.pick([0, 1] as const)
    const other = target === 0 ? white : red
    if (other < k) return null
    return { red, white, k, target }
  },
  build: ({ red, white, k, target }, r) => {
    const n = red + white
    const color = target === 0 ? "빨간 공" : "흰 공"
    const other = target === 0 ? white : red
    const otherName = target === 0 ? "흰 공" : "빨간 공"
    const none = q(C(other, k), C(n, k))
    const ans = q(1).sub(none)
    return {
      text: `빨간 공 $${red}$ 개와 흰 공 $${white}$ 개가 들어 있는 주머니에서 임의로 $${k}$ 개의 공을 동시에 꺼낼 때, 꺼낸 공 중 ${color}이 적어도 한 개 있을 확률은?`,
      ...fracMc(r, ans, [none, q(C(target === 0 ? red : white, k), C(n, k)), q(1).sub(q(C(other, k - 1), C(n, k))), q(target === 0 ? red : white, n), ans.sub(q(1, C(n, k)))]),
      solution: lines(
        `여사건은 꺼낸 $${k}$ 개가 모두 ${otherName}인 사건이고, 그 확률은 $\\frac{${nC(other, k)}}{${nC(n, k)}} = \\frac{${C(other, k)}}{${C(n, k)}}$ 이다.`,
        `따라서 구하는 확률은 $1 - \\frac{${C(other, k)}}{${C(n, k)}} = ${ans.tex()}$`
      ),
      score: 2,
    }
  },
  verify: ({ red, white, k, target }) => {
    const balls = [...Array(red).fill("R"), ...Array(white).fill("W")].map((c, i) => ({ c, i }))
    const want = target === 0 ? "R" : "W"
    let all = 0
    let good = 0
    for (const s of combos(balls, k)) {
      all++
      if (s.some((b) => b.c === want)) good++
    }
    return good / all
  },
}

type NumSet = { kind: number; v: number }
const numSetText = ({ kind, v }: NumSet) => [`$${v}$ 의 배수`, `$${v}$ 이하`, `$${v}$ 이상`, `홀수`, `소수`][kind]
const numSetHas = ({ kind, v }: NumSet) => (x: number) => [x % v === 0, x <= v, x >= v, x % 2 === 1, isPrime(x)][kind]
function isPrime(x: number) {
  if (x < 2) return false
  for (let d = 2; d * d <= x; d++) if (x % d === 0) return false
  return true
}
const josaSet = (s: NumSet) => (s.kind === 1 || s.kind === 2 ? "인 수" : "")

const cardCond: SuTemplate<{ N: number; A: NumSet; B: NumSet }> = {
  id: "p1-card-cond",
  subject: S,
  unit: UNIT,
  standard: "12확통02-04",
  level: 1,
  count: 44,
  params: (r) => {
    const N = r.int(8, 20)
    const mk = (): NumSet => {
      const kind = r.int(0, 4)
      return { kind, v: kind === 0 ? r.int(2, 5) : kind === 1 || kind === 2 ? r.int(3, N - 2) : 0 }
    }
    const A = mk()
    const B = mk()
    if (A.kind === B.kind) return null
    const xs = range(1, N)
    const nA = xs.filter(numSetHas(A)).length
    const nAB = xs.filter((x) => numSetHas(A)(x) && numSetHas(B)(x)).length
    if (nAB === 0 || nAB === nA || nA < 3) return null
    return { N, A, B }
  },
  build: ({ N, A, B }, r) => {
    const xs = range(1, N)
    const inA = xs.filter(numSetHas(A))
    const inAB = inA.filter(numSetHas(B))
    const ans = q(inAB.length, inA.length)
    return {
      text: `$1$ 부터 $${N}$ 까지의 자연수가 하나씩 적혀 있는 $${N}$ 장의 카드 중에서 임의로 한 장을 꺼낸다. 꺼낸 카드에 적힌 수가 ${numSetText(A)}${josaSet(A)}일 때, 이 수가 ${numSetText(B)}${josaSet(B)}일 확률은?`,
      ...fracMc(r, ans, [q(inAB.length, N), q(xs.filter(numSetHas(B)).length, N), q(inA.length - inAB.length, inA.length), q(inAB.length, xs.filter(numSetHas(B)).length), q(inAB.length + 1, inA.length)]),
      solution: lines(
        `꺼낸 수가 ${numSetText(A)}${josaSet(A)}인 사건을 $A$, ${numSetText(B)}${josaSet(B)}인 사건을 $B$ 라 하자.`,
        `$A = \\{${inA.join(", ")}\\}$ 이고, 이 중 $B$ 에도 속하는 것은 $${inAB.join(", ")}$ 이다.`,
        `따라서 $P(B \\mid A) = \\frac{n(A \\cap B)}{n(A)} = ${fracEq(inAB.length, inA.length)}$`
      ),
      score: 2,
    }
  },
  verify: ({ N, A, B }) => {
    let pa = q(0)
    let pab = q(0)
    for (let x = N; x >= 1; x--) {
      if (numSetHas(A)(x)) {
        pa = pa.add(q(1, N))
        if (numSetHas(B)(x)) pab = pab.add(q(1, N))
      }
    }
    return pab.div(pa).value
  },
}

const SIMPLE = [q(1, 2), q(1, 3), q(2, 3), q(1, 4), q(3, 4), q(1, 5), q(2, 5), q(3, 5), q(4, 5), q(1, 6), q(5, 6)]
const indepBasic: SuTemplate<{ ia: number; ib: number; kind: number }> = {
  id: "p1-indep",
  subject: S,
  unit: UNIT,
  standard: "12확통02-05",
  level: 1,
  count: 40,
  params: (r) => {
    const ia = r.int(0, SIMPLE.length - 1)
    const ib = r.int(0, SIMPLE.length - 1)
    if (ia === ib) return null
    return { ia, ib, kind: r.int(0, 2) }
  },
  build: ({ ia, ib, kind }, r) => {
    const a = SIMPLE[ia]
    const b = SIMPLE[ib]
    const ab = a.mul(b)
    const ask = ["P(A \\cup B)", "P(A \\cap B^{C})", "P(A^{C} \\cap B^{C})"][kind]
    let ans: Q
    let sol: string[]
    if (kind === 0) {
      ans = a.add(b).sub(ab)
      sol = [`두 사건이 서로 독립이므로 $P(A \\cap B) = P(A)P(B) = ${a.tex()} \\times ${b.tex()} = ${ab.tex()}$`, `$P(A \\cup B) = ${a.tex()} + ${b.tex()} - ${ab.tex()} = ${ans.tex()}$`]
    } else if (kind === 1) {
      ans = a.mul(q(1).sub(b))
      sol = [`$A$ 와 $B$ 가 서로 독립이면 $A$ 와 $B^{C}$ 도 서로 독립이다.`, `$P(A \\cap B^{C}) = P(A)\\{1 - P(B)\\} = ${a.tex()} \\times ${q(1).sub(b).tex()} = ${ans.tex()}$`]
    } else {
      ans = q(1).sub(a).mul(q(1).sub(b))
      sol = [`$A$ 와 $B$ 가 서로 독립이면 $A^{C}$ 와 $B^{C}$ 도 서로 독립이다.`, `$P(A^{C} \\cap B^{C}) = \\{1 - P(A)\\}\\{1 - P(B)\\} = ${q(1).sub(a).tex()} \\times ${q(1).sub(b).tex()} = ${ans.tex()}$`]
    }
    return {
      text: `두 사건 $A, B$ 가 서로 독립이고 $P(A) = ${a.tex()},\\ P(B) = ${b.tex()}$ 일 때, $${ask}$ 의 값은?${["", " (단, $B^{C}$ 은 $B$ 의 여사건이다.)", " (단, $A^{C}$, $B^{C}$ 은 각각 $A$, $B$ 의 여사건이다.)"][kind]}`,
      ...fracMc(r, ans, [a.add(b), ab, q(1).sub(ab), a.sub(ab).add(q(1, 12)), q(1).sub(a.add(b).sub(ab)), a.mul(b.sub(q(0))).add(b.mul(q(1).sub(a)))]),
      solution: lines(...sol),
      score: 2,
    }
  },
  // 가로 dA칸 × 세로 dB칸의 격자 표본공간에서 직접 센다
  verify: ({ ia, ib, kind }) => {
    const a = SIMPLE[ia]
    const b = SIMPLE[ib]
    let cnt = 0
    for (let i = 0; i < a.d; i++)
      for (let j = 0; j < b.d; j++) {
        const inA = i < a.n
        const inB = j < b.n
        if ((kind === 0 && (inA || inB)) || (kind === 1 && inA && !inB) || (kind === 2 && !inA && !inB)) cnt++
      }
    return cnt / (a.d * b.d)
  },
}

// ═════════════════ 2단계 ═════════════════

const drawSeq: SuTemplate<{ red: number; white: number; kind: number }> = {
  id: "p2-draw-seq",
  subject: S,
  unit: UNIT,
  standard: "12확통02-06",
  level: 2,
  count: 64,
  params: (r) => ({ red: r.int(2, 7), white: r.int(2, 7), kind: r.int(0, 3) }),
  build: ({ red, white, kind }, r) => {
    const n = red + white
    const rr = q(red, n).mul(q(red - 1, n - 1))
    const rw = q(red, n).mul(q(white, n - 1))
    const wr = q(white, n).mul(q(red, n - 1))
    const ww = q(white, n).mul(q(white - 1, n - 1))
    const lead = `빨간 공 $${red}$ 개와 흰 공 $${white}$ 개가 들어 있는 주머니에서 임의로 공을 한 개씩 두 번 꺼낼 때,`
    const tail = `(단, 꺼낸 공은 다시 넣지 않는다.)`
    let ask: string
    let ans: Q
    let sol: string[]
    let wrongs: Q[]
    if (kind === 0) {
      ans = rr.add(wr)
      ask = `두 번째에 꺼낸 공이 빨간 공일 확률은? ${tail}`
      sol = [
        `첫 번째에 빨간 공, 두 번째에 빨간 공: $\\frac{${red}}{${n}} \\times \\frac{${red - 1}}{${n - 1}} = ${rr.tex()}$`,
        `첫 번째에 흰 공, 두 번째에 빨간 공: $\\frac{${white}}{${n}} \\times \\frac{${red}}{${n - 1}} = ${wr.tex()}$`,
        `두 사건은 서로 배반사건이므로 구하는 확률은 $${rr.tex()} + ${wr.tex()} = ${ans.tex()}$`,
      ]
      wrongs = [q(red - 1, n - 1), q(red, n - 1), rr, wr, q(white, n)]
    } else if (kind === 1) {
      ans = rr.add(ww)
      ask = `꺼낸 두 공의 색이 서로 같을 확률은? ${tail}`
      sol = [
        `두 공이 모두 빨간 공일 확률: $\\frac{${red}}{${n}} \\times \\frac{${red - 1}}{${n - 1}} = ${rr.tex()}$`,
        `두 공이 모두 흰 공일 확률: $\\frac{${white}}{${n}} \\times \\frac{${white - 1}}{${n - 1}} = ${ww.tex()}$`,
        `따라서 구하는 확률은 $${rr.tex()} + ${ww.tex()} = ${ans.tex()}$`,
      ]
      wrongs = [q(red * red + white * white, n * n), rw.add(wr), rr, ww, q(1, 2)]
    } else if (kind === 2) {
      ans = rw
      ask = `첫 번째에 빨간 공, 두 번째에 흰 공을 꺼낼 확률은? ${tail}`
      sol = [`첫 번째에 빨간 공을 꺼낼 확률은 $\\frac{${red}}{${n}}$, 그 후 남은 $${n - 1}$ 개 중 흰 공은 $${white}$ 개이다.`, `따라서 첫 번째에 빨간 공을 꺼냈을 때 두 번째에 흰 공을 꺼낼 조건부확률은 $${fracEq(white, n - 1)}$ 이다.`, `곱셈정리에 의하여 $\\frac{${red}}{${n}} \\times \\frac{${white}}{${n - 1}} = ${ans.tex()}$`]
      wrongs = [q(red * white, n * n), rw.add(wr), q(red * (white - 1), n * (n - 1)), q(white, n - 1), q(red, n)]
    } else {
      ans = rw.add(wr)
      ask = `꺼낸 두 공의 색이 서로 다를 확률은? ${tail}`
      sol = [
        `빨간 공 다음 흰 공: $\\frac{${red}}{${n}} \\times \\frac{${white}}{${n - 1}} = ${rw.tex()}$`,
        `흰 공 다음 빨간 공: $\\frac{${white}}{${n}} \\times \\frac{${red}}{${n - 1}} = ${wr.tex()}$`,
        `따라서 구하는 확률은 $${rw.tex()} + ${wr.tex()} = ${ans.tex()}$`,
      ]
      wrongs = [rw, q(2 * red * white, n * n), rr.add(ww), q(red * white, n * (n - 1) * 2), q(1, 2)]
    }
    return { text: `${lead} ${ask}`, ...fracMc(r, ans, wrongs), solution: lines(...sol), score: kind === 2 ? 2 : 3 }
  },
  verify: ({ red, white, kind }) => {
    const balls = [...Array(red).fill("R"), ...Array(white).fill("W")]
    let all = 0
    let good = 0
    for (let i = 0; i < balls.length; i++)
      for (let j = 0; j < balls.length; j++) {
        if (i === j) continue
        all++
        const [x, y] = [balls[i], balls[j]]
        if ((kind === 0 && y === "R") || (kind === 1 && x === y) || (kind === 2 && x === "R" && y === "W") || (kind === 3 && x !== y)) good++
      }
    return good / all
  },
}

type Trial = { name: string; die: boolean; faces: number[]; pn: number; pd: number }
const TRIALS: Trial[] = [
  { name: "동전의 앞면", die: false, faces: [1], pn: 1, pd: 2 },
  { name: "$3$ 의 배수의 눈", die: true, faces: [3, 6], pn: 1, pd: 3 },
  { name: "$4$ 이하의 눈", die: true, faces: [1, 2, 3, 4], pn: 2, pd: 3 },
  { name: "$6$ 의 약수의 눈", die: true, faces: [1, 2, 3, 6], pn: 2, pd: 3 },
  { name: "$5$ 이상의 눈", die: true, faces: [5, 6], pn: 1, pd: 3 },
  { name: "짝수의 눈", die: true, faces: [2, 4, 6], pn: 1, pd: 2 },
]
const binomTrial: SuTemplate<{ ti: number; n: number; k: number; kind: number }> = {
  id: "p2-binom-trial",
  subject: S,
  unit: UNIT,
  standard: "12확통02-06",
  level: 2,
  count: 66,
  params: (r) => {
    const ti = r.int(0, TRIALS.length - 1)
    const t = TRIALS[ti]
    const n = t.die ? r.int(3, 5) : r.int(3, 7)
    const kind = r.int(0, 2)
    const k = kind === 0 ? r.int(1, n - 1) : kind === 1 ? r.int(2, n - 1) : 1
    return { ti, n, k, kind }
  },
  build: ({ ti, n, k, kind }, r) => {
    const t = TRIALS[ti]
    const p = q(t.pn, t.pd)
    const qq = q(1).sub(p)
    const pk = (j: number) => p.pow(j).mul(qq.pow(n - j)).mul(C(n, j))
    const act = t.die ? `한 개의 주사위를 $${n}$ 번 던질 때,` : `한 개의 동전을 $${n}$ 번 던질 때,`
    let ans: Q
    let ask: string
    let sol: string[]
    const one = t.die ? `한 번 던질 때 ${t.name}이 나올 확률은 $${p.tex()}$ 이다.` : `한 번 던질 때 앞면이 나올 확률은 $${p.tex()}$ 이다.`
    const term = (j: number) => `${nC(n, j)} \\left(${p.tex()}\\right)^{${j}} \\left(${qq.tex()}\\right)^{${n - j}}`
    if (kind === 0) {
      ans = pk(k)
      ask = `${t.name}이 나오는 횟수가 $${k}$ 일 확률`
      sol = [one, `$${n}$ 번 중 $${k}$ 번 나오는 경우는 $${nC(n, k)}$ 가지이고, 각 경우의 확률은 $\\left(${p.tex()}\\right)^{${k}} \\left(${qq.tex()}\\right)^{${n - k}}$ 이다.`, `독립시행의 확률에 의하여 구하는 확률은 $${term(k)} = ${ans.tex()}$`]
    } else if (kind === 1) {
      ans = range(k, n).reduce((s, j) => s.add(pk(j)), q(0))
      ask = `${t.name}이 $${k}$ 번 이상 나올 확률`
      sol = [one, ...range(k, n).map((j) => `$${j}$ 번 나올 확률: $${term(j)} = ${pk(j).tex()}$`), `따라서 구하는 확률은 $${range(k, n).map((j) => pk(j).tex()).join(" + ")} = ${ans.tex()}$`]
    } else {
      ans = q(1).sub(pk(0))
      ask = `${t.name}이 적어도 한 번 나올 확률`
      sol = [one, `여사건은 한 번도 나오지 않는 사건이고, 그 확률은 $\\left(${qq.tex()}\\right)^{${n}} = ${pk(0).tex()}$`, `따라서 구하는 확률은 $1 - ${pk(0).tex()} = ${ans.tex()}$`]
    }
    const { last, ...res } = askProb(r, `${act} ${ask}`, ans, [pk(k).div(C(n, k)), pk(Math.min(n, k + 1)), q(k, n), pk(0), ans.mul(2), q(1).sub(ans)], (n + k + ti) % 3 === 0)
    return { ...res, solution: lines(...sol, last), score: 3 }
  },
  // 실제 눈(또는 면)의 모든 경우를 나열
  verify: ({ ti, n, k, kind }) => {
    const t = TRIALS[ti]
    const faces = t.die ? DICE : [0, 1]
    let all = 0
    let good = 0
    for (const s of tuples(faces, n)) {
      all++
      const c = s.filter((f) => t.faces.includes(f)).length
      if ((kind === 0 && c === k) || (kind === 1 && c >= k) || (kind === 2 && c >= 1)) good++
    }
    return pqOrValue(good / all, (n + k + ti) % 3 === 0)
  },
}

const TABLE_CTX = [
  { rows: ["남학생", "여학생"], cols: ["A", "B"], who: "학생", intro: (N: number) => `어느 학교 학생 $${N}$ 명을 대상으로 두 체험 활동 A, B 중 하나를 선택하게 하였더니 다음 표와 같았다.`, colWord: (c: string) => `체험 활동 ${c}를 선택한 학생` },
  { rows: ["1학년", "2학년"], cols: ["수학", "과학"], who: "학생", intro: (N: number) => `어느 동아리 학생 $${N}$ 명을 대상으로 더 좋아하는 과목을 수학과 과학 중 하나만 고르게 하였더니 다음 표와 같았다.`, colWord: (c: string) => `${c}을 고른 학생` },
  { rows: ["남자", "여자"], cols: ["찬성", "반대"], who: "사람", intro: (N: number) => `어느 마을 주민 $${N}$ 명이 새 공원 조성안에 대하여 찬성과 반대 중 하나에 투표하였더니 다음 표와 같았다.`, colWord: (c: string) => `${c}에 투표한 사람` },
]
const tableCond: SuTemplate<{ ci: number; t: number[]; byRow: boolean; ri: number; cj: number }> = {
  id: "p2-table-cond",
  subject: S,
  unit: UNIT,
  standard: "12확통02-04",
  level: 2,
  count: 60,
  params: (r) => {
    const t = [r.int(4, 30), r.int(4, 30), r.int(4, 30), r.int(4, 30)]
    const ci = r.int(0, 2)
    const byRow = r.chance(0.5)
    const ri = r.int(0, 1)
    const cj = r.int(0, 1)
    const num = t[ri * 2 + cj]
    const den = byRow ? t[ri * 2] + t[ri * 2 + 1] : t[cj] + t[2 + cj]
    const a = q(num, den)
    if (a.n + a.d > 999 || a.d < 3) return null
    return { ci, t, byRow, ri, cj }
  },
  build: ({ ci, t, byRow, ri, cj }) => {
    const ctx = TABLE_CTX[ci]
    const N = t.reduce((a, b) => a + b, 0)
    const rowSum = [t[0] + t[1], t[2] + t[3]]
    const colSum = [t[0] + t[2], t[1] + t[3]]
    const num = t[ri * 2 + cj]
    const den = byRow ? rowSum[ri] : colSum[cj]
    const ans = q(num, den)
    const figure = tableFigure([
      ["", ...ctx.cols, "합계"],
      [ctx.rows[0], String(t[0]), String(t[1]), String(rowSum[0])],
      [ctx.rows[1], String(t[2]), String(t[3]), String(rowSum[1])],
      ["합계", String(colSum[0]), String(colSum[1]), String(N)],
    ])
    const rowW = `${ctx.rows[ri]}`
    const colW = ctx.colWord(ctx.cols[cj])
    const given = byRow ? `${rowW}일 때, 이 ${ctx.who}이 ${colW}일` : `${colW}일 때, 이 ${ctx.who}이 ${rowW}일`
    const text = `${ctx.intro(N)} 이 $${N}$ 명 중에서 임의로 선택한 한 ${ctx.who}이 ${given} 확률을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`
    return {
      text,
      figure,
      answer: String(ans.n + ans.d),
      value: ans.n + ans.d,
      solution: lines(
        byRow ? `선택한 ${ctx.who}이 ${rowW}인 사건을 $E$, ${colW}인 사건을 $F$ 라 하면 구하는 확률은 $P(F \\mid E)$ 이다.` : `선택한 ${ctx.who}이 ${colW}인 사건을 $E$, ${rowW}인 사건을 $F$ 라 하면 구하는 확률은 $P(F \\mid E)$ 이다.`,
        `표에서 $n(E) = ${den}$, $n(E \\cap F) = ${num}$ 이므로 $P(F \\mid E) = ${fracEq(num, den)}$`,
        `$p = ${ans.d},\\ q = ${ans.n}$ 이므로 $p + q = ${ans.n + ans.d}$`
      ),
      score: 3,
    }
  },
  // 사람 목록을 만들어 직접 센다
  verify: ({ t, byRow, ri, cj }) => {
    const people: [number, number][] = []
    t.forEach((c, idx) => {
      for (let i = 0; i < c; i++) people.push([Math.floor(idx / 2), idx % 2])
    })
    const given = people.filter(([a, b]) => (byRow ? a === ri : b === cj))
    const both = given.filter(([a, b]) => a === ri && b === cj)
    const x = q(both.length, given.length)
    return x.n + x.d
  },
}

const indepFind: SuTemplate<{ ia: number; ib: number; kind: number }> = {
  id: "p2-indep-find",
  subject: S,
  unit: UNIT,
  standard: "12확통02-05",
  level: 2,
  count: 50,
  params: (r) => {
    const ia = r.int(0, SIMPLE.length - 1)
    const ib = r.int(0, SIMPLE.length - 1)
    if (ia === ib) return null
    return { ia, ib, kind: r.int(0, 2) }
  },
  build: ({ ia, ib, kind }, r) => {
    const a = SIMPLE[ia]
    const b = SIMPLE[ib]
    let given: string
    let sol: string[]
    if (kind === 0) {
      const u = a.add(b).sub(a.mul(b))
      given = `P(A \\cup B) = ${u.tex()}`
      sol = [
        `$P(B) = p$ 라 하면 두 사건이 서로 독립이므로 $P(A \\cap B) = ${a.tex()}p$`,
        `$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ 에서 $${u.tex()} = ${a.tex()} + p - ${a.tex()}p = ${a.tex()} + ${q(1).sub(a).tex()}p$`,
        `따라서 $p = \\left(${u.tex()} - ${a.tex()}\\right) \\div ${q(1).sub(a).tex()} = ${b.tex()}$`,
      ]
    } else if (kind === 1) {
      const v = a.mul(q(1).sub(b))
      given = `P(A \\cap B^{C}) = ${v.tex()}`
      sol = [
        `$A$ 와 $B$ 가 서로 독립이면 $A$ 와 $B^{C}$ 도 서로 독립이므로 $P(A \\cap B^{C}) = P(A)P(B^{C})$`,
        `$${v.tex()} = ${a.tex()} \\times P(B^{C})$ 에서 $P(B^{C}) = ${q(1).sub(b).tex()}$`,
        `따라서 $P(B) = 1 - ${q(1).sub(b).tex()} = ${b.tex()}$`,
      ]
    } else {
      const v = q(1).sub(a).mul(b)
      given = `P(A^{C} \\cap B) = ${v.tex()}`
      sol = [
        `$A$ 와 $B$ 가 서로 독립이면 $A^{C}$ 와 $B$ 도 서로 독립이므로 $P(A^{C} \\cap B) = P(A^{C})P(B)$`,
        `$P(A^{C}) = 1 - ${a.tex()} = ${q(1).sub(a).tex()}$ 이므로 $${v.tex()} = ${q(1).sub(a).tex()} \\times P(B)$`,
        `따라서 $P(B) = ${b.tex()}$`,
      ]
    }
    return {
      text: `두 사건 $A, B$ 가 서로 독립이고 $P(A) = ${a.tex()},\\ ${given}$ 일 때, $P(B)$ 의 값은?${["", " (단, $B^{C}$ 은 $B$ 의 여사건이다.)", " (단, $A^{C}$ 은 $A$ 의 여사건이다.)"][kind]}`,
      ...fracMc(r, b, [q(1).sub(b), a.mul(b), b.mul(a).add(q(1, 10)), b.div(q(2)), a, b.add(q(1, b.d * 2))]),
      solution: lines(...sol),
      score: 3,
    }
  },
  // 주어진 조건식을 P(B)=x 에 대한 방정식으로 보고 수치로 근을 찾는다
  verify: ({ ia, ib, kind }) => {
    const a = SIMPLE[ia].value
    const b = SIMPLE[ib].value
    const g = [a + b - a * b, a * (1 - b), (1 - a) * b][kind]
    const f = (x: number) => [a + x - a * x, a * (1 - x), (1 - a) * x][kind] - g
    const rs = roots(f, -0.0001, 1.0001, 2000)
    return rs.length === 1 ? rs[0] : NaN
  },
}

const arrange: SuTemplate<{ kind: number; n: number; m: number; f: number }> = {
  id: "p2-arrange",
  subject: S,
  unit: UNIT,
  standard: "12확통02-01",
  level: 2,
  count: 40,
  params: (r) => {
    const kind = r.int(0, 5)
    if (kind <= 2) return { kind, n: r.int(4, 7), m: 0, f: 0 }
    const m = r.int(2, 4)
    const f = r.int(2, 4)
    if (kind === 5 && f > m + 1) return null
    return { kind, n: m + f, m, f }
  },
  build: ({ kind, n, m, f }, r) => {
    let ans: Q
    let stem: string
    let sol: string[]
    const total = `$${n}$ 명을 일렬로 세우는 모든 경우의 수는 $${n}!$ 이다.`
    const fct = (x: number) => range(1, x).reduce((a, b) => a * b, 1)
    if (kind === 0) {
      ans = q(2, n)
      stem = `A, B 를 포함한 $${n}$ 명의 학생이 임의로 일렬로 설 때, A 와 B 가 서로 이웃하여 설 확률은?`
      sol = [total, `A, B 를 한 묶음으로 보면 $${n - 1}$ 명을 세우는 경우 $${n - 1}!$, 묶음 안에서 자리를 바꾸는 경우 $2$ 가지이다.`, `따라서 구하는 확률은 $\\frac{${n - 1}! \\times 2}{${n}!} = ${ans.tex()}$`]
    } else if (kind === 1) {
      ans = q(2, n * (n - 1))
      stem = `A, B 를 포함한 $${n}$ 명의 학생이 임의로 일렬로 설 때, A 와 B 가 양 끝에 설 확률은?`
      sol = [total, `양 끝에 A, B 를 세우는 경우 $2$ 가지, 가운데에 나머지 $${n - 2}$ 명을 세우는 경우 $${n - 2}!$ 가지이다.`, `따라서 구하는 확률은 $\\frac{2 \\times ${n - 2}!}{${n}!} = ${ans.tex()}$`]
    } else if (kind === 2) {
      ans = q(2 * (n - 2), n * (n - 1))
      stem = `A, B 를 포함한 $${n}$ 명의 학생이 임의로 일렬로 설 때, A 와 B 사이에 정확히 한 명의 학생이 설 확률은?`
      sol = [total, `A, B 사이에 설 학생을 고르는 경우 $${n - 2}$ 가지, A, B 의 순서 $2$ 가지, 이 세 명을 한 묶음으로 보고 $${n - 2}$ 개를 세우는 경우 $${n - 2}!$ 가지이다.`, `따라서 구하는 확률은 $\\frac{${n - 2} \\times 2 \\times ${n - 2}!}{${n}!} = ${ans.tex()}$`]
    } else if (kind === 3) {
      ans = q(fct(f) * fct(m + 1), fct(n))
      stem = `남학생 $${m}$ 명과 여학생 $${f}$ 명이 임의로 일렬로 설 때, 여학생끼리 모두 이웃하여 설 확률은?`
      sol = [total, `여학생 $${f}$ 명을 한 묶음으로 보면 $${m + 1}$ 개를 세우는 경우 $${m + 1}!$, 묶음 안의 순서 $${f}!$ 가지이다.`, `따라서 구하는 확률은 $\\frac{${m + 1}! \\times ${f}!}{${n}!} = ${ans.tex()}$`]
    } else if (kind === 4) {
      ans = q(m * (m - 1), n * (n - 1))
      stem = `남학생 $${m}$ 명과 여학생 $${f}$ 명이 임의로 일렬로 설 때, 양 끝에 모두 남학생이 설 확률은?`
      sol = [total, `양 끝에 남학생 $2$ 명을 세우는 경우 $${m} \\times ${m - 1}$ 가지, 가운데 $${n - 2}$ 명을 세우는 경우 $${n - 2}!$ 가지이다.`, `따라서 구하는 확률은 $\\frac{${m * (m - 1)} \\times ${n - 2}!}{${n}!} = ${ans.tex()}$`]
    } else {
      // 여학생끼리 이웃하지 않음
      ans = f > m + 1 ? q(0) : q(fct(m) * (fct(m + 1) / fct(m + 1 - f)), fct(n))
      stem = `남학생 $${m}$ 명과 여학생 $${f}$ 명이 임의로 일렬로 설 때, 여학생끼리는 서로 이웃하지 않을 확률은?`
      sol = [total, `남학생을 먼저 세우는 경우 $${m}!$ 가지, 남학생 사이사이와 양 끝 $${m + 1}$ 곳 중 $${f}$ 곳에 여학생을 세우는 경우 $${`{}_{${m + 1}}\\mathrm{P}_{${f}}`} = ${fct(m + 1) / fct(m + 1 - f)}$ 가지이다.`, `따라서 구하는 확률은 $\\frac{${m}! \\times ${fct(m + 1) / fct(m + 1 - f)}}{${n}!} = ${ans.tex()}$`]
    }
    if (ans.n === 0) throw new Error("확률 0")
    return { text: stem, ...fracMc(r, ans, [ans.mul(2), ans.div(q(2)), q(1, n), q(1).sub(ans), q(2, n - 1), q(1, n - 1)]), solution: lines(...sol), score: 3 }
  },
  verify: ({ kind, n, m }) => {
    let all = 0
    let good = 0
    for (const p of perms(range(0, n - 1))) {
      all++
      // kind 0~2: 0=A, 1=B / kind 3~5: 0..m-1 남, m.. 여
      const ia = p.indexOf(0)
      const ib = p.indexOf(1)
      const girl = (x: number) => x >= m
      let ok = false
      if (kind === 0) ok = Math.abs(ia - ib) === 1
      else if (kind === 1) ok = Math.min(ia, ib) === 0 && Math.max(ia, ib) === n - 1
      else if (kind === 2) ok = Math.abs(ia - ib) === 2
      else if (kind === 3) {
        const pos = p.map((x, i) => (girl(x) ? i : -1)).filter((i) => i >= 0)
        ok = pos[pos.length - 1] - pos[0] === pos.length - 1
      } else if (kind === 4) ok = !girl(p[0]) && !girl(p[n - 1])
      else ok = p.every((x, i) => i === 0 || !(girl(x) && girl(p[i - 1])))
      if (ok) good++
    }
    return good / all
  },
}

// ═════════════════ 3단계 ═════════════════

const twoBags: SuTemplate<{ k: number; A: [number, number]; B: [number, number]; draw2: boolean; askA: boolean; coin: boolean }> = {
  id: "p3-two-bags",
  subject: S,
  unit: UNIT,
  standard: "12확통02-06",
  level: 3,
  count: 70,
  params: (r) => {
    const coin = r.chance(0.25)
    const k = coin ? 1 : r.int(1, 5)
    const A: [number, number] = [r.int(1, 5), r.int(1, 5)]
    const B: [number, number] = [r.int(1, 5), r.int(1, 5)]
    const draw2 = r.chance(0.4)
    if (draw2 && (A[1] < 2 || B[1] < 2)) return null
    if (A[0] === B[0] && A[1] === B[1]) return null
    const askA = r.chance(0.5)
    const pA = coin ? q(1, 2) : q(k, 6)
    const w = (bag: [number, number]) => (draw2 ? q(C(bag[1], 2), C(bag[0] + bag[1], 2)) : q(bag[1], bag[0] + bag[1]))
    const jA = pA.mul(w(A))
    const jB = q(1).sub(pA).mul(w(B))
    const v = (askA ? jA : jB).div(jA.add(jB))
    if (v.n === 0 || v.n === v.d || v.n + v.d > 999) return null
    return { k, A, B, draw2, askA, coin }
  },
  build: ({ k, A, B, draw2, askA, coin }) => {
    const pA = coin ? q(1, 2) : q(k, 6)
    const pB = q(1).sub(pA)
    const nA = A[0] + A[1]
    const nB = B[0] + B[1]
    const wA = draw2 ? q(C(A[1], 2), C(nA, 2)) : q(A[1], nA)
    const wB = draw2 ? q(C(B[1], 2), C(nB, 2)) : q(B[1], nB)
    const jA = pA.mul(wA)
    const jB = pB.mul(wB)
    const ans = (askA ? jA : jB).div(jA.add(jB))
    const choose = coin
      ? `한 개의 동전을 던져 앞면이 나오면 주머니 A 에서, 뒷면이 나오면 주머니 B 에서`
      : `한 개의 주사위를 던져 ${k === 1 ? "$1$ 의 눈이 나오면" : `나온 눈의 수가 $${k}$ 이하이면`} 주머니 A 에서, ${k === 5 ? "$6$ 의 눈이 나오면" : `$${k + 1}$ 이상의 눈이 나오면`} 주머니 B 에서`
    const act = draw2 ? `임의로 $2$ 개의 공을 동시에 꺼낸다.` : `임의로 한 개의 공을 꺼낸다.`
    const cond = draw2 ? `꺼낸 공이 모두 흰 공일 때` : `꺼낸 공이 흰 공일 때`
    const text = `주머니 A 에는 검은 공 $${A[0]}$ 개와 흰 공 $${A[1]}$ 개, 주머니 B 에는 검은 공 $${B[0]}$ 개와 흰 공 $${B[1]}$ 개가 들어 있다. ${choose} ${act} 이 시행에서 ${cond}, 꺼낸 공이 주머니 ${askA ? "A" : "B"} 의 공일 확률을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`
    const wTex = (bag: [number, number], n: number) => (draw2 ? `\\frac{${nC(bag[1], 2)}}{${nC(n, 2)}}` : `\\frac{${bag[1]}}{${n}}`)
    return {
      text,
      ...{ answer: String(ans.n + ans.d), value: ans.n + ans.d },
      solution: lines(
        `${draw2 ? "모두 흰 공을 꺼내는" : "흰 공을 꺼내는"} 사건을 $E$ 라 하자.`,
        `주머니 A 를 택하고 $E$ 가 일어날 확률: $${pA.tex()} \\times ${wTex(A, nA)} = ${jA.tex()}$`,
        `주머니 B 를 택하고 $E$ 가 일어날 확률: $${pB.tex()} \\times ${wTex(B, nB)} = ${jB.tex()}$`,
        `$P(E) = ${jA.tex()} + ${jB.tex()} = ${jA.add(jB).tex()}$ 이므로 구하는 확률은 $${ratioTex((askA ? jA : jB), jA.add(jB))}$`,
        `$p = ${ans.d},\\ q = ${ans.n}$ 이므로 $p + q = ${ans.n + ans.d}$`
      ),
      score: 4,
    }
  },
  // (주사위 눈, 꺼낸 공들)을 모두 나열해 가중치로 센다
  verify: ({ k, A, B, draw2, askA, coin }) => {
    const firsts = coin ? [1, 2] : DICE
    let num = q(0)
    let den = q(0)
    for (const d of firsts) {
      const useA = coin ? d === 1 : d <= k
      const bag = useA ? A : B
      const balls = [...Array(bag[0]).fill("K"), ...Array(bag[1]).fill("W")].map((c, i) => ({ c, i }))
      const draws = [...combos(balls, draw2 ? 2 : 1)]
      for (const s of draws) {
        const w = q(1, firsts.length * draws.length)
        if (s.every((b) => b.c === "W")) {
          den = den.add(w)
          if (useA === askA) num = num.add(w)
        }
      }
    }
    const x = num.div(den)
    return x.n + x.d
  },
}

type DEv = { kind: number; v: number }
const condEvText = (e: DEv) =>
  [`$a + b \\ge ${e.v}$`, `$a + b$ 가 짝수`, `$ab$ 가 짝수`, `$a \\ne b$`, `$a$ 와 $b$ 중 큰 값이 $${e.v}$`, `$|a - b| \\le ${e.v}$`, `$a + b$ 가 $${e.v}$ 의 배수`][e.kind]
const condEv = (e: DEv) => (a: number, b: number) =>
  [a + b >= e.v, (a + b) % 2 === 0, (a * b) % 2 === 0, a !== b, Math.max(a, b) === e.v, Math.abs(a - b) <= e.v, (a + b) % e.v === 0][e.kind]
const targetText = (e: DEv) => [`$a < b$`, `$a = ${e.v}$`, `$a$ 와 $b$ 중 적어도 하나가 $${e.v}$`, `$a \\times b \\ge ${e.v}$`, `$b$ 가 $a$ 의 배수`][e.kind]
const target = (e: DEv) => (a: number, b: number) => [a < b, a === e.v, a === e.v || b === e.v, a * b >= e.v, b % a === 0][e.kind]

const diceCond: SuTemplate<{ E: DEv; F: DEv }> = {
  id: "p3-dice-cond",
  subject: S,
  unit: UNIT,
  standard: "12확통02-04",
  level: 3,
  count: 60,
  params: (r) => {
    const ek = r.int(0, 6)
    const E = { kind: ek, v: [r.int(6, 10), 0, 0, 0, r.int(3, 6), r.int(1, 3), r.int(3, 5)][ek] }
    const fk = r.int(0, 4)
    const F = { kind: fk, v: [0, r.int(1, 6), r.int(1, 6), r.int(6, 20), 0][fk] }
    let nE = 0
    let nEF = 0
    for (const a of DICE)
      for (const b of DICE)
        if (condEv(E)(a, b)) {
          nE++
          if (target(F)(a, b)) nEF++
        }
    if (nEF === 0 || nEF === nE) return null
    return { E, F }
  },
  build: ({ E, F }) => {
    const ev = condEv(E)
    const tg = target(F)
    const eList: [number, number][] = []
    for (const a of DICE) for (const b of DICE) if (ev(a, b)) eList.push([a, b])
    const ef = eList.filter(([a, b]) => tg(a, b))
    const ans = q(ef.length, eList.length)
    const listTex = (xs: [number, number][]) => xs.map(([a, b]) => `(${a}, ${b})`).join(", ")
    return {
      text: `한 개의 주사위를 두 번 던져 나온 눈의 수를 차례로 $a, b$ 라 하자. ${condEvText(E)}${condEvText(E).endsWith("$") ? " " : ""}일 때, ${targetText(F)}${targetText(F).endsWith("$") ? " " : ""}일 확률을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`,
      answer: String(ans.n + ans.d),
      value: ans.n + ans.d,
      solution: lines(
        `${condEvText(E)}${condEvText(E).endsWith("$") ? " " : ""}인 사건을 $E$, ${targetText(F)}${targetText(F).endsWith("$") ? " " : ""}인 사건을 $F$ 라 하면 구하는 확률은 $P(F \\mid E) = \\frac{n(E \\cap F)}{n(E)}$ 이다.`,
        eList.length <= 15 ? `$E$ 의 원소는 $${listTex(eList)}$ 로 $${eList.length}$ 개이다.` : `$E$ 의 원소를 $a$ 의 값별로 세면 ${DICE.map((a) => `$${DICE.filter((b) => ev(a, b)).length}$`).join(", ")} 개이므로 $n(E) = ${eList.length}$ 이다.`,
        ef.length <= 15 ? `이 중 $F$ 에도 속하는 것은 $${listTex(ef)}$ 로 $${ef.length}$ 개이다.` : `이 중 $F$ 에도 속하는 것을 $a$ 의 값별로 세면 ${DICE.map((a) => `$${DICE.filter((b) => ev(a, b) && tg(a, b)).length}$`).join(", ")} 개이므로 $n(E \\cap F) = ${ef.length}$ 이다.`,
        `따라서 $P(F \\mid E) = ${fracEq(ef.length, eList.length)}$ 이고, $p + q = ${ans.d} + ${ans.n} = ${ans.n + ans.d}$`
      ),
      score: 3,
    }
  },
  verify: ({ E, F }) => {
    let pE = 0
    let pEF = 0
    for (const [a, b] of tuples(DICE, 2)) {
      if (!condEv(E)(a, b)) continue
      pE += 1 / 36
      if (target(F)(a, b)) pEF += 1 / 36
    }
    // 분수로 되돌리기
    const x = pEF / pE
    for (let d = 1; d <= 36; d++) {
      const n = Math.round(x * d)
      if (Math.abs(n / d - x) < 1e-9) return n + d
    }
    return NaN
  },
}

const walk: SuTemplate<{ ti: number; n: number; a: number; b: number; c: number; atLeast: boolean }> = {
  id: "p3-walk",
  subject: S,
  unit: UNIT,
  standard: "12확통02-06",
  level: 3,
  count: 64,
  params: (r) => {
    const ti = r.int(0, TRIALS.length - 1)
    const n = TRIALS[ti].die ? r.int(4, 5) : r.int(4, 8)
    const a = r.int(1, 3)
    const b = r.int(1, 2)
    const atLeast = r.chance(0.35)
    const s = r.int(1, n - 1)
    const c = s * a - (n - s) * b
    return { ti, n, a, b, c, atLeast }
  },
  build: ({ ti, n, a, b, c, atLeast }, r) => {
    const t = TRIALS[ti]
    const p = q(t.pn, t.pd)
    const qq = q(1).sub(p)
    const pk = (j: number) => p.pow(j).mul(qq.pow(n - j)).mul(C(n, j))
    const ks = range(0, n).filter((j) => (atLeast ? j * a - (n - j) * b >= c : j * a - (n - j) * b === c))
    const ans = ks.reduce((s, j) => s.add(pk(j)), q(0))
    const act = t.die ? `한 개의 주사위를 던져 ${t.name}이 나오면` : `한 개의 동전을 던져 앞면이 나오면`
    const fail = t.die ? `그 외의 눈이 나오면` : `뒷면이 나오면`
    const stem = `수직선 위의 원점에 점 $\\mathrm{P}$ 가 있다. ${act} 점 $\\mathrm{P}$ 를 양의 방향으로 $${a}$ 만큼, ${fail} 음의 방향으로 $${b}$ 만큼 이동시키는 시행을 한다. 이 시행을 $${n}$ 번 반복한 후 점 $\\mathrm{P}$ 의 좌표가 $${c}$ ${atLeast ? "이상일" : "일"} 확률`
    const { last, ...res } = askProb(r, stem, ans, [pk(ks[0]).div(C(n, ks[0])), q(C(n, ks[0]), 2 ** n), ans.mul(2), q(1).sub(ans), pk(Math.min(n, ks[0] + 1))], (n + a + b) % 2 === 0)
    const term = (j: number) => `${nC(n, j)} \\left(${p.tex()}\\right)^{${j}} \\left(${qq.tex()}\\right)^{${n - j}}`
    return {
      ...res,
      solution: lines(
        `$${n}$ 번 중 ${t.die ? t.name : "앞면"}이 $k$ 번 나오면 점 $\\mathrm{P}$ 의 좌표는 $${a === 1 ? "" : a}k - ${b === 1 ? "" : b}(${n} - k) = ${a + b}k - ${n * b}$ 이다.`,
        atLeast ? `$${a + b}k - ${n * b} \\ge ${c}$ 에서 $k \\ge ${q(c + n * b, a + b).tex()}$ 이므로 $k = ${ks.join(", ")}$` : `$${a + b}k - ${n * b} = ${c}$ 에서 $k = ${ks[0]}$`,
        `한 번의 시행에서 ${t.die ? t.name : "앞면"}이 나올 확률은 $${p.tex()}$ 이므로 독립시행의 확률에 의하여`,
        `$${ks.map(term).join(" + ")} = ${ans.tex()}$`,
        last
      ),
      score: 3,
    }
  },
  // 성공/실패 수열을 모두 나열하고 실제로 이동시켜 본다
  verify: ({ ti, n, a, b, c, atLeast }) => {
    const t = TRIALS[ti]
    const p = t.pn / t.pd
    let s = 0
    for (const seq of tuples([0, 1], n)) {
      let x = 0
      let w = 1
      for (const v of seq) {
        x += v ? a : -b
        w *= v ? p : 1 - p
      }
      if (atLeast ? x >= c : x === c) s += w
    }
    return pqOrValue(s, (n + a + b) % 2 === 0)
  },
}

const indepSets: SuTemplate<{ N: number; kindA: number; m: number }> = {
  id: "p3-indep-sets",
  subject: S,
  unit: UNIT,
  standard: "12확통02-05",
  level: 3,
  count: 60,
  params: (r) => {
    const N = r.int(6, 15)
    const kindA = r.int(0, 4)
    const A = indepA(N, kindA)
    if (A.length < 2 || A.length >= N - 1) return null
    const m = r.int(2, N - 2)
    if ((A.length * m) % N !== 0) return null
    const v = indepSetsValue(N, A.length, m)
    if (v < 2 || v > 999) return null
    return { N, kindA, m }
  },
  build: ({ N, kindA, m }) => {
    const A = indepA(N, kindA)
    const a = A.length
    const t = (a * m) / N
    const ans = indepSetsValue(N, a, m)
    const desc = [`$${A.length}$ 이하의 자연수`, `짝수`, `$3$ 의 배수`, `$${N}$ 의 약수`, `홀수`][kindA]
    return {
      text: `표본공간 $S = \\{1, 2, 3, \\cdots, ${N}\\}$ 에서 ${desc}인 원소로 이루어진 사건을 $A$ 라 하자. 사건 $A$ 와 서로 독립이고 $n(B) = ${m}$ 인 사건 $B$ 의 개수를 구하시오. (단, 각 근원사건이 일어날 확률은 모두 같다.)`,
      answer: String(ans),
      value: ans,
      solution: lines(
        `$A = \\{${A.join(", ")}\\}$ 이므로 $P(A) = \\frac{${a}}{${N}}$ 이고 $P(B) = \\frac{${m}}{${N}}$ 이다.`,
        `$A$ 와 $B$ 가 서로 독립이려면 $P(A \\cap B) = P(A)P(B)$, 즉 $\\frac{n(A \\cap B)}{${N}} = \\frac{${a}}{${N}} \\times \\frac{${m}}{${N}}$ 이어야 하므로 $n(A \\cap B) = ${t}$`,
        `$B$ 는 $A$ 의 원소 중 $${t}$ 개, $A$ 에 속하지 않는 $${N - a}$ 개의 원소 중 $${m - t}$ 개로 이루어져야 한다.`,
        `따라서 사건 $B$ 의 개수는 $${nC(a, t)} \\times ${nC(N - a, m - t)} = ${C(a, t)} \\times ${C(N - a, m - t)} = ${ans}$`
      ),
      score: 4,
    }
  },
  // 크기 m 인 부분집합을 모두 나열해 독립인지 분수로 확인한다
  verify: ({ N, kindA, m }) => {
    const A = new Set(indepA(N, kindA))
    const pA = q(A.size, N)
    let cnt = 0
    for (const B of combos(range(1, N), m)) {
      const inter = B.filter((x) => A.has(x)).length
      if (q(inter, N).eq(pA.mul(q(m, N)))) cnt++
    }
    return cnt
  },
}
function indepA(N: number, kind: number) {
  const xs = range(1, N)
  if (kind === 0) return range(1, Math.max(2, Math.floor(N / 2) + (N % 3 === 0 ? 1 : 0)))
  if (kind === 1) return xs.filter((x) => x % 2 === 0)
  if (kind === 2) return xs.filter((x) => x % 3 === 0)
  if (kind === 3) return xs.filter((x) => N % x === 0)
  return xs.filter((x) => x % 2 === 1)
}
function indepSetsValue(N: number, a: number, m: number) {
  const t = (a * m) / N
  if (!Number.isInteger(t)) return 0
  return C(a, t) * C(N - a, m - t)
}

// ═════════════════ 4단계 ═════════════════

type Rule = { kind: number; c: number }
/** 첫 공 색에 따른 주머니 변화 [빨강 변화, 흰색 변화] (꺼낸 공을 넣었다고 본 뒤의 변화) */
function ruleDelta(rule: Rule, first: "R" | "W"): [number, number] {
  if (rule.kind === 0) return first === "R" ? [-1, 0] : [rule.c, 0]
  if (rule.kind === 1) return first === "R" ? [rule.c, 0] : [0, rule.c]
  return first === "R" ? [0, rule.c] : [0, -1]
}
const ruleText = (rule: Rule) =>
  [
    `꺼낸 공이 빨간 공이면 그 공을 다시 넣지 않고, 흰 공이면 그 공을 다시 넣고 빨간 공 $${rule.c}$ 개를 더 넣는다.`,
    `꺼낸 공을 다시 넣고, 꺼낸 공과 같은 색의 공 $${rule.c}$ 개를 더 넣는다.`,
    `꺼낸 공이 빨간 공이면 그 공을 다시 넣고 흰 공 $${rule.c}$ 개를 더 넣으며, 흰 공이면 그 공을 다시 넣지 않는다.`,
  ][rule.kind]

const polya: SuTemplate<{ red: number; white: number; rule: Rule; same: boolean; askRed: boolean }> = {
  id: "p4-polya",
  subject: S,
  unit: UNIT,
  standard: "12확통02-06",
  level: 4,
  count: 45,
  params: (r) => {
    const red = r.int(2, 5)
    const white = r.int(2, 5)
    const rule = { kind: r.int(0, 2), c: r.int(1, 3) }
    const same = r.chance(0.5)
    const askRed = r.chance(0.5)
    if (rule.kind === 1 && red === white) return null
    const v = polyaAns(red, white, rule, same, askRed)
    if (!v || v.n === 0 || v.n === v.d || v.n + v.d > 999) return null
    return { red, white, rule, same, askRed }
  },
  build: ({ red, white, rule, same, askRed }) => {
    const n = red + white
    const ans = polyaAns(red, white, rule, same, askRed)!
    const after = (f: "R" | "W") => {
      const [dr, dw] = ruleDelta(rule, f)
      return [red + dr, white + dw] as const
    }
    const [rR, wR] = after("R")
    const [rW, wW] = after("W")
    const ev = (rr: number, ww: number) => (same ? q(C(rr, 2) + C(ww, 2), C(rr + ww, 2)) : q(C(rr, 2), C(rr + ww, 2)))
    const jR = q(red, n).mul(ev(rR, wR))
    const jW = q(white, n).mul(ev(rW, wW))
    const c2 = (x: number) => (x >= 2 ? nC(x, 2) : "0")
    const evTex = (rr: number, ww: number) => (same ? `\\frac{${c2(rr)} + ${c2(ww)}}{${nC(rr + ww, 2)}}` : `\\frac{${c2(rr)}}{${nC(rr + ww, 2)}}`)
    const ones = [
      ...[rR, rW].filter((x) => x < 2).map((x) => `빨간 공이 $${x}$ 개뿐인 경우에는 빨간 공 $2$ 개를 꺼내는 경우가 없으므로 그 경우의 수를 $0$ 으로 센다.`),
      ...(same ? [wR, wW].filter((x) => x < 2).map((x) => `흰 공이 $${x}$ 개뿐인 경우에는 흰 공 $2$ 개를 꺼내는 경우가 없으므로 그 경우의 수를 $0$ 으로 센다.`) : []),
    ]
    const cond = same ? "두 번째 시행에서 꺼낸 $2$ 개의 공의 색이 서로 같았을 때" : "두 번째 시행에서 꺼낸 $2$ 개의 공이 모두 빨간 공이었을 때"
    return {
      text: `주머니에 빨간 공 $${red}$ 개와 흰 공 $${white}$ 개가 들어 있다. 이 주머니를 사용하여 다음 시행을 한다.\n첫 번째 시행: 주머니에서 임의로 한 개의 공을 꺼내어 색을 확인한 후, ${ruleText(rule)}\n두 번째 시행: 주머니에서 임의로 $2$ 개의 공을 동시에 꺼낸다.\n${cond}, 첫 번째 시행에서 꺼낸 공이 ${askRed ? "빨간 공" : "흰 공"}이었을 확률을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`,
      answer: String(ans.n + ans.d),
      value: ans.n + ans.d,
      solution: lines(
        `첫 번째 시행 후 주머니의 공은 빨간 공이 나온 경우 빨간 공 $${rR}$ 개, 흰 공 $${wR}$ 개이고, 흰 공이 나온 경우 빨간 공 $${rW}$ 개, 흰 공 $${wW}$ 개이다.`,
        ...[...new Set(ones)],
        `두 번째 시행의 사건을 $E$ 라 하면`,
        `(i) 첫 번째에 빨간 공: $\\frac{${red}}{${n}} \\times ${evTex(rR, wR)} = ${jR.tex()}$`,
        `(ii) 첫 번째에 흰 공: $\\frac{${white}}{${n}} \\times ${evTex(rW, wW)} = ${jW.tex()}$`,
        `$P(E) = ${jR.tex()} + ${jW.tex()} = ${jR.add(jW).tex()}$ 이므로 구하는 확률은 $${ratioTex((askRed ? jR : jW), jR.add(jW))}$`,
        `$p = ${ans.d},\\ q = ${ans.n}$ 이므로 $p + q = ${ans.n + ans.d}$`
      ),
      score: 4,
    }
  },
  // 실제 공 목록으로 첫 공, 두 번째 두 공을 모두 나열
  verify: ({ red, white, rule, same, askRed }) => {
    const bag0 = [...Array(red).fill("R"), ...Array(white).fill("W")] as ("R" | "W")[]
    let num = q(0)
    let den = q(0)
    bag0.forEach((first, i) => {
      let bag = [...bag0]
      if (rule.kind === 0) bag = first === "R" ? bag.filter((_, j) => j !== i) : [...bag, ...Array(rule.c).fill("R")]
      else if (rule.kind === 1) bag = [...bag, ...Array(rule.c).fill(first)]
      else bag = first === "R" ? [...bag, ...Array(rule.c).fill("W")] : bag.filter((_, j) => j !== i)
      const pairs = [...combos(bag.map((c, j) => ({ c, j })), 2)]
      for (const [x, y] of pairs) {
        const ok = same ? x.c === y.c : x.c === "R" && y.c === "R"
        if (!ok) continue
        const w = q(1, bag0.length * pairs.length)
        den = den.add(w)
        if ((first === "R") === askRed) num = num.add(w)
      }
    })
    const v = num.div(den)
    return v.n + v.d
  },
}
function polyaAns(red: number, white: number, rule: Rule, same: boolean, askRed: boolean): Q | null {
  const n = red + white
  const ev = (rr: number, ww: number) => (rr + ww < 2 ? q(0) : same ? q(C(rr, 2) + C(ww, 2), C(rr + ww, 2)) : q(C(rr, 2), C(rr + ww, 2)))
  const [a1, b1] = ruleDelta(rule, "R")
  const [a2, b2] = ruleDelta(rule, "W")
  const jR = q(red, n).mul(ev(red + a1, white + b1))
  const jW = q(white, n).mul(ev(red + a2, white + b2))
  if (jR.add(jW).n === 0) return null
  return (askRed ? jR : jW).div(jR.add(jW))
}

const walkCond: SuTemplate<{ ti: number; n: number; a: number; b: number; c: number; m: number; d: number }> = {
  id: "p4-walk-cond",
  subject: S,
  unit: UNIT,
  standard: "12확통02-04",
  level: 4,
  count: 45,
  params: (r) => {
    const ti = r.int(0, TRIALS.length - 1)
    const n = TRIALS[ti].die ? r.int(5, 6) : r.int(5, 8)
    const a = r.int(1, 2)
    const b = r.int(1, 2)
    const s = r.int(2, n - 2)
    const c = s * a - (n - s) * b
    const m = r.int(2, n - 2)
    const s1 = r.int(Math.max(0, s - (n - m)), Math.min(m, s))
    const d = s1 * a - (m - s1) * b
    const v = q(C(m, s1) * C(n - m, s - s1), C(n, s))
    if (v.n === v.d || v.n + v.d > 999) return null
    return { ti, n, a, b, c, m, d }
  },
  build: ({ ti, n, a, b, c, m, d }) => {
    const t = TRIALS[ti]
    const s = (c + n * b) / (a + b)
    const s1 = (d + m * b) / (a + b)
    const ans = q(C(m, s1) * C(n - m, s - s1), C(n, s))
    const p = q(t.pn, t.pd)
    const act = t.die ? `한 개의 주사위를 던져 ${t.name}이 나오면` : `한 개의 동전을 던져 앞면이 나오면`
    const fail = t.die ? `그 외의 눈이 나오면` : `뒷면이 나오면`
    const succ = t.die ? t.name : "앞면"
    return {
      text: `수직선 위의 원점에 점 $\\mathrm{P}$ 가 있다. ${act} 점 $\\mathrm{P}$ 를 양의 방향으로 $${a}$ 만큼, ${fail} 음의 방향으로 $${b}$ 만큼 이동시키는 시행을 한다. 이 시행을 $${n}$ 번 반복한 후 점 $\\mathrm{P}$ 의 좌표가 $${c}$ 이었을 때, $${m}$ 번째 시행 후 점 $\\mathrm{P}$ 의 좌표가 $${d}$ 이었을 확률을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`,
      answer: String(ans.n + ans.d),
      value: ans.n + ans.d,
      solution: lines(
        `$k$ 번 시행 중 ${succ}이 $j$ 번 나오면 점의 좌표는 $${a === 1 ? "" : a}j - ${b === 1 ? "" : b}(k - j) = ${a + b === 1 ? "" : a + b}j - ${b === 1 ? "" : b}k$ 이다.`,
        `$${n}$ 번 후 좌표가 $${c}$ 이려면 ${succ}이 $${s}$ 번, $${m}$ 번 후 좌표가 $${d}$ 이려면 처음 $${m}$ 번 중 ${succ}이 $${s1}$ 번 나와야 한다.`,
        `${succ}이 $${s}$ 번 나오는 결과는 어느 것이나 확률이 $\\left(${p.tex()}\\right)^{${s}}\\left(${q(1).sub(p).tex()}\\right)^{${n - s}}$ 로 같으므로, 조건부확률은 경우의 수의 비로 구할 수 있다.`,
        `$${n}$ 번 중 ${succ}이 나오는 $${s}$ 번을 정하는 경우는 $${nC(n, s)} = ${C(n, s)}$ 가지이고, 그중 처음 $${m}$ 번에 $${s1}$ 번, 나머지 $${n - m}$ 번에 $${s - s1}$ 번인 경우는 $${nC(m, s1)} \\times ${nC(n - m, s - s1)} = ${C(m, s1) * C(n - m, s - s1)}$ 가지이다.`,
        `따라서 구하는 확률은 $${fracEq(C(m, s1) * C(n - m, s - s1), C(n, s))}$ 이고, $p + q = ${ans.n + ans.d}$`
      ),
      score: 4,
    }
  },
  // 실제 확률 가중치로 모든 수열을 나열 (확률이 같다는 관찰을 쓰지 않는다)
  verify: ({ ti, n, a, b, c, m, d }) => {
    const t = TRIALS[ti]
    const p = t.pn / t.pd
    let den = 0
    let num = 0
    for (const seq of tuples([0, 1], n)) {
      let x = 0
      let w = 1
      let xm = 0
      seq.forEach((v, i) => {
        x += v ? a : -b
        w *= v ? p : 1 - p
        if (i === m - 1) xm = x
      })
      if (x !== c) continue
      den += w
      if (xm === d) num += w
    }
    const v = num / den
    for (let dd = 1; dd <= 999; dd++) {
      const nn = Math.round(v * dd)
      if (Math.abs(nn / dd - v) < 1e-9) return nn + dd
    }
    return NaN
  },
}

const sameColorFind: SuTemplate<{ a: number; n: number }> = {
  id: "p4-same-color-find",
  subject: S,
  unit: UNIT,
  standard: "12확통02-04",
  level: 4,
  count: 40,
  params: (r) => {
    const a = r.int(2, 9)
    const n = r.int(a + 1, 24)
    const P = q(C(a, 2) + C(n, 2), C(a + n, 2))
    const ans = q(C(a, 2), C(a, 2) + C(n, 2))
    if (P.d > 200 || ans.n + ans.d > 999) return null
    return { a, n }
  },
  build: ({ a, n }) => {
    const P = q(C(a, 2) + C(n, 2), C(a + n, 2))
    const [u, v] = [P.n, P.d]
    // (v-u) x^2 - (v + u(2a-1)) x + (v-u) a(a-1) = 0
    const A2 = v - u
    const A1 = -(v + u * (2 * a - 1))
    const A0 = (v - u) * a * (a - 1)
    const g = [A2, A1, A0].reduce((x, y) => gcdN(x, y))
    const other = q(a * (a - 1), n)
    const ans = q(C(a, 2), C(a, 2) + C(n, 2))
    const quad = `${A2 / g === 1 ? "" : A2 / g}x^{2} - ${-A1 / g}x + ${A0 / g}`
    return {
      text: `흰 공 $${a}$ 개와 검은 공 $x$ 개가 들어 있는 주머니에서 임의로 $2$ 개의 공을 동시에 꺼낼 때, 꺼낸 두 공의 색이 서로 같을 확률이 $${P.tex()}$ 이다. 이 주머니에서 임의로 $2$ 개의 공을 동시에 꺼낼 때, 꺼낸 두 공의 색이 서로 같았을 때 두 공이 모두 흰 공일 확률을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $x > ${a}$ 이고, $p$ 와 $q$ 는 서로소인 자연수이다.)`,
      answer: String(ans.n + ans.d),
      value: ans.n + ans.d,
      solution: lines(
        `두 공의 색이 같을 확률은 $\\frac{${nC(a, 2)} + {}_{x}\\mathrm{C}_{2}}{{}_{${a} + x}\\mathrm{C}_{2}} = \\frac{${a * (a - 1)} + x(x - 1)}{(x + ${a})(x + ${a - 1})} = ${P.tex()}$`,
        `분모를 없애고 정리하면 $${quad} = 0$`,
        `두 근의 곱이 $${a * (a - 1)}$ 이고 한 근이 $x = ${n}$ 이므로 다른 근은 $${other.tex()}$ 이다. $x > ${a}$ 이므로 $x = ${n}$`,
        `두 공의 색이 같은 경우의 수는 $${nC(a, 2)} + ${nC(n, 2)} = ${C(a, 2)} + ${C(n, 2)} = ${C(a, 2) + C(n, 2)}$ 이고, 이 중 모두 흰 공인 경우는 $${C(a, 2)}$ 이다.`,
        `따라서 구하는 확률은 $${fracEq(C(a, 2), C(a, 2) + C(n, 2))}$ 이고, $p + q = ${ans.n + ans.d}$`
      ),
      score: 4,
    }
  },
  // x 를 a+1 부터 하나씩 대입해 조건을 만족시키는 값이 유일한지 확인한 뒤, 공 목록으로 확률을 센다
  verify: ({ a, n }) => {
    const P = q(C(a, 2) + C(n, 2), C(a + n, 2))
    const sols: number[] = []
    for (let x = a + 1; x <= 200; x++) {
      const p = q(a * (a - 1) + x * (x - 1), (a + x) * (a + x - 1))
      if (p.eq(P)) sols.push(x)
    }
    if (sols.length !== 1) return NaN
    const x = sols[0]
    const balls = [...Array(a).fill("W"), ...Array(x).fill("K")].map((c, i) => ({ c, i }))
    let same = 0
    let ww = 0
    for (const [u, v] of combos(balls, 2)) {
      if (u.c !== v.c) continue
      same++
      if (u.c === "W") ww++
    }
    const v = q(ww, same)
    return v.n + v.d
  },
}
function gcdN(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}

const PS = [q(1, 3), q(1, 2), q(2, 3), q(1, 4), q(3, 4), q(2, 5), q(3, 5)]
const match: SuTemplate<{ ip: number; w: number; kind: number; L: number }> = {
  id: "p4-match",
  subject: S,
  unit: UNIT,
  standard: "12확통02-06",
  level: 4,
  count: 37,
  params: (r) => {
    const ip = r.int(0, PS.length - 1)
    const w = r.int(3, 4)
    const kind = r.int(0, 2)
    const L = r.int(w + 1, 2 * w - 1)
    const v = matchAns(PS[ip], w, kind, L)
    if (v.n === 0 || v.n === v.d || v.n + v.d > 999) return null
    return { ip, w, kind, L }
  },
  build: ({ ip, w, kind, L }) => {
    const p = PS[ip]
    const qq = q(1).sub(p)
    const ans = matchAns(p, w, kind, L)
    const winIn = (P: Q, l: number) => P.pow(w).mul(q(1).sub(P).pow(l - w)).mul(C(l - 1, w - 1))
    const lead = `두 사람 A, B 가 경기를 반복하여 먼저 $${w}$ 번 이긴 사람이 우승하고 경기를 끝낸다. 한 번의 경기에서 A 가 이길 확률은 $${p.tex()}$, B 가 이길 확률은 $${qq.tex()}$ 이고, 각 경기의 결과는 서로 독립이다. (비기는 경우는 없다.)`
    const ftex = (who: string, P: Q, l: number) => `${nC(l - 1, w - 1)} \\left(${P.tex()}\\right)^{${w}} \\left(${q(1).sub(P).tex()}\\right)^{${l - w}}`
    let ask: string
    let sol: string[]
    if (kind === 0) {
      ask = `A 가 우승하였을 때, A 가 첫 번째 경기에서 이겼을 확률`
      const ls = range(w, 2 * w - 1)
      const tot = ls.reduce((s, l) => s.add(winIn(p, l)), q(0))
      // 첫 경기 승리 후 나머지에서 w-1승 먼저
      const after = ls.reduce((s, l) => s.add(l - 1 >= w - 1 && l >= w ? p.mul(p.pow(w - 1).mul(qq.pow(l - w)).mul(C(l - 2, w - 2))) : q(0)), q(0))
      sol = [
        `A 가 $l$ 번째 경기에서 우승하려면 처음 $l - 1$ 번 중 $${w - 1}$ 번 이기고 $l$ 번째 경기에서 이겨야 한다.`,
        `A 가 우승할 확률: $${ls.map((l) => ftex("A", p, l)).join(" + ")} = ${tot.tex()}$`,
        `A 가 첫 경기에서 이기고 우승할 확률은 첫 경기 이후 A 가 B 보다 먼저 $${w - 1}$ 번 이길 확률에 $${p.tex()}$ 를 곱한 것이므로 $${after.tex()}$`,
        `따라서 구하는 확률은 $${ratioTex(after, tot)}$`,
      ]
    } else if (kind === 1) {
      ask = `$${L}$ 번째 경기에서 우승자가 정해졌을 때, 우승한 사람이 A 일 확률`
      const a = winIn(p, L)
      const b = winIn(qq, L)
      sol = [
        `$${L}$ 번째 경기에서 A 가 우승하려면 처음 $${L - 1}$ 번 중 A 가 $${w - 1}$ 번 이기고 $${L}$ 번째 경기에서 A 가 이겨야 한다.`,
        `A 가 $${L}$ 번째에 우승: $${ftex("A", p, L)} = ${a.tex()}$, B 가 $${L}$ 번째에 우승: $${ftex("B", qq, L)} = ${b.tex()}$`,
        `따라서 구하는 확률은 $${ratioTex(a, a.add(b))}$`,
      ]
    } else {
      ask = `A 가 우승하였을 때, 경기가 $${L}$ 번째에 끝났을 확률`
      const ls = range(w, 2 * w - 1)
      const tot = ls.reduce((s, l) => s.add(winIn(p, l)), q(0))
      sol = [
        `A 가 $l$ 번째 경기에서 우승할 확률은 $${nC("l - 1", w - 1)} \\left(${p.tex()}\\right)^{${w}} \\left(${qq.tex()}\\right)^{l - ${w}}$ 이다.`,
        `A 가 우승할 확률: $${ls.map((l) => winIn(p, l).tex()).join(" + ")} = ${tot.tex()}$`,
        `A 가 $${L}$ 번째에 우승할 확률: $${ftex("A", p, L)} = ${winIn(p, L).tex()}$`,
        `따라서 구하는 확률은 $${ratioTex(winIn(p, L), tot)}$`,
      ]
    }
    return {
      text: `${lead} ${ask}을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`,
      answer: String(ans.n + ans.d),
      value: ans.n + ans.d,
      solution: lines(...sol, `$p = ${ans.d},\\ q = ${ans.n}$ 이므로 $p + q = ${ans.n + ans.d}$`),
      score: 4,
    }
  },
  // 2w-1 경기까지의 모든 승패 결과를 나열해 실제로 경기를 진행시켜 본다
  verify: ({ ip, w, kind, L }) => {
    const p = PS[ip]
    let num = q(0)
    let den = q(0)
    for (const seq of tuples([1, 0], 2 * w - 1)) {
      let a = 0
      let b = 0
      let end = 0
      let weight = q(1)
      for (let i = 0; i < seq.length; i++) {
        if (seq[i]) a++
        else b++
        weight = weight.mul(seq[i] ? p : q(1).sub(p))
        if (a === w || b === w) {
          end = i + 1
          break
        }
      }
      // 끝난 뒤의 경기는 실제로 하지 않으므로, 남은 자리는 한 가지(모두 1)로만 센다
      if (seq.slice(end).some((x) => x === 0)) continue
      const aWin = a === w
      if (kind === 0) {
        if (!aWin) continue
        den = den.add(weight)
        if (seq[0] === 1) num = num.add(weight)
      } else if (kind === 1) {
        if (end !== L) continue
        den = den.add(weight)
        if (aWin) num = num.add(weight)
      } else {
        if (!aWin) continue
        den = den.add(weight)
        if (end === L) num = num.add(weight)
      }
    }
    const v = num.div(den)
    return v.n + v.d
  },
}
function matchAns(p: Q, w: number, kind: number, L: number): Q {
  const qq = q(1).sub(p)
  const winIn = (P: Q, l: number) => P.pow(w).mul(q(1).sub(P).pow(l - w)).mul(C(l - 1, w - 1))
  const ls = range(w, 2 * w - 1)
  const tot = ls.reduce((s, l) => s.add(winIn(p, l)), q(0))
  if (kind === 0) {
    const after = ls.reduce((s, l) => s.add(p.mul(p.pow(w - 1).mul(qq.pow(l - w)).mul(C(l - 2, w - 2)))), q(0))
    return after.div(tot)
  }
  if (kind === 1) return winIn(p, L).div(winIn(p, L).add(winIn(qq, L)))
  return winIn(p, L).div(tot)
}

export const PROBABILITY: SuTemplate[] = [diceBasic, addRule, atLeast, cardCond, indepBasic, drawSeq, binomTrial, tableCond, indepFind, arrange, twoBags, diceCond, walk, indepSets, polya, walkCond, sameColorFind, match].map(polish)
