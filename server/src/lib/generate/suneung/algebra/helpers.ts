// 대수 템플릿 공용 도구: 무리수 꼴(a + b√k), 특수각 삼각함수 값, π 배수 TeX, 수치 검산(접하는 근 포함)
import type { Rng } from "../../types"
import { intChoice, isShortOk, lcm, mc, q, Q, qChoice, short, sqrtParts, term } from "../kit"
import type { Choice, SuProblem } from "../types"

// ───────── a + b√k ─────────

export type Sd = { a: Q; b: Q; k: number }

/** a + b√k (k는 제곱 인수를 빼서 정리) */
export function sd(a: number | Q, b: number | Q = 0, k = 1): Sd {
  const A = Q.of(a)
  let B = Q.of(b)
  if (k < 1 || !Number.isInteger(k)) throw new Error(`√ 안이 자연수가 아니에요: ${k}`)
  const [o, i] = sqrtParts(k)
  B = B.mul(o)
  if (i === 1 || B.n === 0) return { a: A.add(i === 1 ? B : 0), b: q(0), k: 1 }
  return { a: A, b: B, k: i }
}
export const sdVal = (s: Sd) => s.a.value + s.b.value * Math.sqrt(s.k)
export const sdIsRat = (s: Sd) => s.b.n === 0
export const sdNeg = (s: Sd): Sd => ({ a: s.a.neg(), b: s.b.neg(), k: s.k })
export const sdScale = (s: Sd, c: number | Q): Sd => sd(s.a.mul(c), s.b.mul(c), s.k)
export function sdAdd(x: Sd, y: Sd): Sd {
  if (sdIsRat(y)) return sd(x.a.add(y.a), x.b, x.k)
  if (sdIsRat(x)) return sd(x.a.add(y.a), y.b, y.k)
  if (x.k !== y.k) throw new Error("서로 다른 √ 는 더할 수 없어요")
  return sd(x.a.add(y.a), x.b.add(y.b), x.k)
}
export const sdSub = (x: Sd, y: Sd) => sdAdd(x, sdNeg(y))
export function sdMul(x: Sd, y: Sd): Sd {
  if (sdIsRat(x)) return sdScale(y, x.a)
  if (sdIsRat(y)) return sdScale(x, y.a)
  if (x.k === y.k) return sd(x.a.mul(y.a).add(x.b.mul(y.b).mul(x.k)), x.a.mul(y.b).add(y.a.mul(x.b)), x.k)
  if (x.a.n === 0 && y.a.n === 0) return sd(0, x.b.mul(y.b), x.k * y.k)
  throw new Error("곱할 수 없는 꼴")
}
/** 나누는 수는 유리수이거나 b√k 꼴 */
export function sdDiv(x: Sd, y: Sd): Sd {
  if (sdIsRat(y)) return sdScale(x, q(1).div(y.a))
  if (y.a.n !== 0) throw new Error("a + b√k 로는 나누지 않아요")
  // x / (b√k) = x √k / (b k)
  return sdMul(x, sd(0, q(1).div(y.b.mul(y.k)), y.k))
}
export function sdTex(s: Sd): string {
  if (sdIsRat(s)) return s.a.tex()
  const D = lcm(s.a.d, s.b.d)
  const A = s.a.n * (D / s.a.d)
  const B = s.b.n * (D / s.b.d)
  const rt = `\\sqrt{${s.k}}`
  if (A === 0) {
    if (D === 1) return term(B, rt, true)
    return `${B < 0 ? "-" : ""}\\frac{${term(Math.abs(B), rt, true)}}{${D}}`
  }
  const num = `${A}${term(B, rt)}`
  return D === 1 ? num : `\\frac{${num}}{${D}}`
}
export const sdChoice = (s: Sd): Choice => ({ tex: sdTex(s), value: sdVal(s) })
/** 정답 근처의 a + b√k 꼴 보기 채우기 */
export const sdFill = (s: Sd) => (k: number) => sdChoice(sdAdd(s, sd(q((k % 2 ? 1 : -1) * Math.ceil(k / 2), 2))))

// ───────── 특수각 (t 는 π 의 몇 배인지) ─────────

const REF: Record<number, Sd> = { 0: sd(0), 30: sd(q(1, 2)), 45: sd(0, q(1, 2), 2), 60: sd(0, q(1, 2), 3), 90: sd(1) }

function degOf(t: Q) {
  const d = t.mul(180)
  if (!d.isInt) throw new Error(`특수각이 아니에요: ${t}`)
  return ((d.n % 360) + 360) % 360
}
/** sin(tπ) */
export function sinPi(t: Q): Sd {
  const d = degOf(t)
  let ref = d % 180
  if (ref > 90) ref = 180 - ref
  const v = REF[ref]
  if (!v) throw new Error(`특수각이 아니에요: ${d}°`)
  return d < 180 ? v : sdNeg(v)
}
export const cosPi = (t: Q) => sinPi(t.add(q(1, 2)))
/** tan(tπ), cos = 0 이면 null */
export function tanPi(t: Q): Sd | null {
  const c = cosPi(t)
  if (sdIsRat(c) && c.a.n === 0) return null
  return sdDiv(sinPi(t), c)
}
export const TRIG = { sin: sinPi, cos: cosPi } as const

// ───────── π 배수 ─────────

/** cπ 의 TeX (c 는 유리수) */
export function piTex(c: Q): string {
  if (c.n === 0) return "0"
  const neg = c.n < 0
  const n = Math.abs(c.n)
  let body: string
  if (c.d === 1) body = n === 1 ? "\\pi" : `${n}\\pi`
  else body = n === 1 ? `\\frac{\\pi}{${c.d}}` : `\\frac{${n}}{${c.d}}\\pi`
  return (neg ? "-" : "") + body
}
export const piChoice = (c: Q): Choice => ({ tex: piTex(c), value: c.value * Math.PI })
export const piFill = (c: Q, step: Q) => (k: number) => piChoice(c.add(step.mul((k % 2 ? 1 : -1) * Math.ceil(k / 2))))
/** 각 tπ 를 함수 인자로: 음수면 괄호 */
export const angleArg = (t: Q) => (t.n < 0 ? `\\left(${piTex(t)}\\right)` : ` ${piTex(t)}`)

// ───────── 보기·정답 ─────────

/** 유리수 정답 근처 보기 채우기 */
export const qFill = (x: Q) => (k: number) => qChoice(x.add(q((k % 2 ? 1 : -1) * Math.ceil(k / 2), x.d)))

/** 정답이 1~999 자연수면 단답형, 아니면 정수 보기 객관식 */
export function autoInt(r: Rng, ans: number, wrongs: number[]): Pick<SuProblem, "choices" | "answer" | "value" | "choiceValues"> {
  if (isShortOk(ans)) return short(ans)
  return mcBal(r, intChoice(ans), wrongs.map(intChoice))
}
/** 유리수 정답: 자연수면 단답형, 아니면 객관식 */
export function autoQ(r: Rng, ans: Q, wrongs: Q[]): Pick<SuProblem, "choices" | "answer" | "value" | "choiceValues"> {
  if (ans.isInt && isShortOk(ans.n)) return short(ans.n)
  return mcBal(r, qChoice(ans), wrongs.map(qChoice), qFill(ans))
}

// ───────── 수치 검산 ─────────

/**
 * [a, b] 에서 f 의 근 (부호가 바뀌는 근 + 그래프가 x축에 접하는 근).
 * 접하는 근은 |f| 의 극소를 황금분할로 다듬어 |f| < tol 이면 근으로 본다.
 */
export function zeros(f: (x: number) => number, a: number, b: number, n = 20000, tol = 1e-9): number[] {
  const h = (b - a) / n
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i <= n; i++) {
    xs.push(a + i * h)
    ys.push(f(a + i * h))
  }
  const out: number[] = []
  const add = (x: number) => {
    if (!out.some((r) => Math.abs(r - x) < Math.max(1e-6, h * 0.6))) out.push(x)
  }
  for (let i = 0; i <= n; i++) if (Math.abs(ys[i]) < 1e-13) add(xs[i])
  for (let i = 0; i < n; i++) {
    if (ys[i] * ys[i + 1] < 0) {
      let lo = xs[i]
      let hi = xs[i + 1]
      let flo = ys[i]
      for (let k = 0; k < 80; k++) {
        const m = (lo + hi) / 2
        const fm = f(m)
        if (flo * fm <= 0) hi = m
        else {
          lo = m
          flo = fm
        }
      }
      add((lo + hi) / 2)
    }
  }
  for (let i = 1; i < n; i++) {
    const A = Math.abs(ys[i - 1])
    const B = Math.abs(ys[i])
    const C = Math.abs(ys[i + 1])
    if (B <= A && B <= C && ys[i - 1] * ys[i + 1] > 0 && ys[i - 1] * ys[i] > 0) {
      const x = goldenMin((x) => Math.abs(f(x)), xs[i - 1], xs[i + 1])
      if (Math.abs(f(x)) < tol) add(x)
    }
  }
  return out.sort((x, y) => x - y)
}

export function goldenMin(g: (x: number) => number, a: number, b: number, it = 100) {
  const R = (Math.sqrt(5) - 1) / 2
  let c = b - R * (b - a)
  let d = a + R * (b - a)
  let gc = g(c)
  let gd = g(d)
  for (let i = 0; i < it; i++) {
    if (gc < gd) {
      b = d
      d = c
      gd = gc
      c = b - R * (b - a)
      gc = g(c)
    } else {
      a = c
      c = d
      gc = gd
      d = a + R * (b - a)
      gd = g(d)
    }
  }
  return (a + b) / 2
}

/** [a, b] 에서 f 의 최솟값·최댓값 (격자 + 극점 근처 다듬기) */
export function extrema(f: (x: number) => number, a: number, b: number, n = 4000) {
  const h = (b - a) / n
  let iMin = 0
  let iMax = 0
  let vMin = Infinity
  let vMax = -Infinity
  for (let i = 0; i <= n; i++) {
    const v = f(a + i * h)
    if (v < vMin) {
      vMin = v
      iMin = i
    }
    if (v > vMax) {
      vMax = v
      iMax = i
    }
  }
  const refine = (i: number, sgn: number) => {
    const lo = Math.max(a, a + (i - 1) * h)
    const hi = Math.min(b, a + (i + 1) * h)
    const x = goldenMin((x) => sgn * f(x), lo, hi)
    return Math.min(sgn * f(x), sgn * f(a + i * h)) * sgn
  }
  return { min: refine(iMin, 1), max: refine(iMax, -1) }
}

/** 정수에 가까우면 그 정수 */
export const nearInt = (x: number, tol = 1e-9) => Math.abs(x - Math.round(x)) < tol

/**
 * 해설 줄 묶기: 수식으로 끝나는 줄 다음 줄이 수식으로 시작하면 "$ $" 가 붙지 않게
 * 다음 줄이 "$= …" 이면 한 줄로 잇고, 아니면 마침표를 찍는다.
 */
export function sol(...ls: (string | false | null | undefined)[]) {
  const xs = ls.filter((x): x is string => !!x)
  const out: string[] = []
  for (const l of xs) {
    const prev = out[out.length - 1]
    if (prev !== undefined && /\$\s*$/.test(prev) && /^\s*\$/.test(l)) {
      if (/^\s*\$\s*=/.test(l)) out[out.length - 1] = `${prev.trimEnd().slice(0, -1)} ${l.trimStart().slice(1)}`
      else out[out.length - 1] = `${prev.trimEnd()}.`
      if (!/^\s*\$\s*=/.test(l)) out.push(l)
    } else out.push(l)
  }
  return out.join("\n")
}

// ───────── 숫자 뒤 조사 ─────────

/** 숫자를 읽었을 때 마지막 소리에 받침이 있는지, 그 받침이 ㄹ 인지 */
export function numSound(num: string) {
  const d = num.replace(/\D/g, "")
  if (!d || /^0+$/.test(d)) return { batchim: true, rieul: false }
  const nz = d.replace(/0+$/, "")
  if (d.length > nz.length) return { batchim: true, rieul: false }
  const last = nz[nz.length - 1]
  return { batchim: "013678".includes(last), rieul: "178".includes(last) }
}
const JOSA: [string, string][] = [
  ["을", "를"],
  ["은", "는"],
  ["이었", "였"],
  ["이라", "라"],
  ["이", "가"],
  ["과", "와"],
]
/**
 * 숫자로 끝나는 수식(괄호로 닫혀도 됨) 바로 뒤의 조사를 받침에 맞게 고친다
 * ("$9$ 을" → "$9$ 를", "점 $(10, 5)$ 을" → "를", "$\log(t + 1)$ 를" → "을").
 * "(t > 0)$ 로" 처럼 괄호 안 조건 뒤의 조사는 앞 글자에 붙으므로 건드리지 않는다.
 */
export function fixJosa(s: string) {
  return s.replace(
    /(\d+(?:\.\d+)?)((?:\)|\\right\))?)\$(\s?)(으로|로|을|를|은|는|이었|였|이라|라|이|가|과|와)(?=[\s,.)]|$)/g,
    (m, num: string, close: string, sp: string, j: string, off: number) => {
      const before = s.slice(Math.max(0, off - 20), off + num.length + 8)
      if (close && /(>|<|\\ne|\\ge|\\le|\\geq|\\leq)\s*-?\d+(?:\.\d+)?\s*(\)|\\right\))\$/.test(before)) return m
      const { batchim, rieul } = numSound(num)
      let out = j
      if (j === "으로" || j === "로") out = batchim && !rieul ? "으로" : "로"
      else for (const [w, wo] of JOSA) if (j === w || j === wo) out = batchim ? w : wo
      return `${num}${close}$${sp}${out}`
    }
  )
}

/**
 * 정답 번호가 한쪽으로 몰리지 않도록 오답을 고르는 객관식.
 * 오답 후보(그럴듯한 실수 값)를 먼저 쓰고, 정답보다 작은 쪽·큰 쪽 개수를 무작위로 정해 모자라면 fill 로 채운다.
 */
export function mcBal(r: Rng, correct: Choice, wrongs: Choice[], fill?: (k: number) => Choice) {
  const f = fill ?? ((k: number) => intChoice(correct.value + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.max(1, Math.abs(correct.value) >= 20 ? Math.round(Math.abs(correct.value) / 10) : 1)))
  const same = (a: Choice, b: Choice) => Math.abs(a.value - b.value) < 1e-9 * Math.max(1, Math.abs(a.value)) || a.tex === b.tex
  const pool: Choice[] = []
  const push = (c: Choice) => {
    if (Number.isFinite(c.value) && !same(c, correct) && !pool.some((p) => same(p, c))) pool.push(c)
  }
  const prim = r.shuffle([...wrongs])
  prim.forEach(push)
  const nPrim = pool.length
  for (let k = 1; k <= 40; k++) push(f(k))
  const lo = pool.filter((c) => c.value < correct.value)
  const hi = pool.filter((c) => c.value > correct.value)
  // 원래 오답을 앞에, 채운 값은 정답에 가까운 순으로
  const order = (xs: Choice[]) => [...xs].sort((a, b) => (pool.indexOf(a) < nPrim ? 0 : 1) - (pool.indexOf(b) < nPrim ? 0 : 1) || Math.abs(a.value - correct.value) - Math.abs(b.value - correct.value))
  const L = order(lo)
  const H = order(hi)
  let below = r.int(0, 4)
  below = Math.min(below, L.length)
  if (4 - below > H.length) below = 4 - H.length
  const chosen = [...L.slice(0, below), ...H.slice(0, 4 - below)]
  return mc(r, correct, chosen, f)
}
