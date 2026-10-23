// 수능 템플릿 공용 도구
// - Q: 정확한 유리수 (분모·분자 정수), 다항식 계수 계산에 쓴다
// - tex*: 수식 문자열 만들기 (부호·계수 1·0 처리)
// - mc: 객관식 보기 5개 (값 순서대로, 서로 다른 값만)
// - 수치 검산: 미분·적분·근 찾기·극한 (verify에서만 쓴다)
import type { Rng } from "../types"
import type { Choice, SuProblem } from "./types"

// ───────── 유리수 ─────────

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}
export const lcm = (a: number, b: number) => (a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b))

export class Q {
  readonly n: number
  readonly d: number
  constructor(n: number, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`유리수가 아니에요: ${n}/${d}`)
    if (d < 0) {
      n = -n
      d = -d
    }
    const g = gcd(n, d) || 1
    this.n = n / g
    this.d = d / g
  }
  static of(x: number | Q) {
    return x instanceof Q ? x : new Q(x)
  }
  add(o: number | Q) {
    const b = Q.of(o)
    return new Q(this.n * b.d + b.n * this.d, this.d * b.d)
  }
  sub(o: number | Q) {
    return this.add(Q.of(o).neg())
  }
  mul(o: number | Q) {
    const b = Q.of(o)
    return new Q(this.n * b.n, this.d * b.d)
  }
  div(o: number | Q) {
    const b = Q.of(o)
    if (b.n === 0) throw new Error("0으로 나눌 수 없어요")
    return new Q(this.n * b.d, this.d * b.n)
  }
  neg() {
    return new Q(-this.n, this.d)
  }
  pow(k: number) {
    let r = new Q(1)
    for (let i = 0; i < Math.abs(k); i++) r = r.mul(this)
    return k < 0 ? new Q(1).div(r) : r
  }
  eq(o: number | Q) {
    const b = Q.of(o)
    return this.n === b.n && this.d === b.d
  }
  get isInt() {
    return this.d === 1
  }
  get value() {
    return this.n / this.d
  }
  /** TeX: 정수면 정수, 아니면 \frac (음수는 앞에 -) */
  tex() {
    if (this.d === 1) return String(this.n)
    return `${this.n < 0 ? "-" : ""}\\frac{${Math.abs(this.n)}}{${this.d}}`
  }
  toString() {
    return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`
  }
}
export const q = (n: number, d = 1) => new Q(n, d)

// ───────── 수식 문자열 ─────────

/** 계수 c와 변수 부분 v ("x^2", "x", "")를 붙인다. first면 맨 앞 항 */
export function term(c: number | Q, v: string, first = false): string {
  const k = Q.of(c)
  if (k.n === 0) return ""
  const neg = k.n < 0
  const abs = neg ? k.neg() : k
  let body: string
  if (v === "") body = abs.tex()
  else if (abs.eq(1)) body = v
  else body = `${abs.tex()}${v}`
  if (first) return `${neg ? "-" : ""}${body}`
  return ` ${neg ? "-" : "+"} ${body}`
}

/** 다항식 (계수: 최고차부터) → TeX. 예: [1,-3,0,2] → x^3 - 3x^2 + 2 */
export function texPoly(coeffs: (number | Q)[], x = "x"): string {
  const deg = coeffs.length - 1
  let s = ""
  coeffs.forEach((c, i) => {
    const p = deg - i
    const v = p === 0 ? "" : p === 1 ? x : `${x}^{${p}}`
    const t = term(c, v, s === "")
    s += t
  })
  return s || "0"
}

/** (x - a) 꼴: a=0 → x, a<0 → x + |a| */
export function texShift(a: number | Q, x = "x") {
  const k = Q.of(a)
  if (k.n === 0) return x
  return k.n > 0 ? `${x} - ${k.tex()}` : `${x} + ${k.neg().tex()}`
}

/** 부호 붙여 이어 쓰기: +3 → "+ 3", -3 → "- 3" */
export const signed = (n: number | Q) => {
  const k = Q.of(n)
  return k.n < 0 ? `- ${k.neg().tex()}` : `+ ${k.tex()}`
}
/** 괄호가 필요한 음수 */
export const paren = (n: number | Q) => {
  const k = Q.of(n)
  return k.n < 0 ? `(${k.tex()})` : k.tex()
}

/** a√b 꼴 (b는 제곱 인수가 없게 정리) */
export function sqrtParts(n: number): [number, number] {
  let out = 1
  let inside = n
  for (let k = 2; k * k <= inside; k++) {
    while (inside % (k * k) === 0) {
      out *= k
      inside /= k * k
    }
  }
  return [out, inside]
}
export function texSqrt(n: number) {
  const [a, b] = sqrtParts(n)
  if (b === 1) return String(a)
  return a === 1 ? `\\sqrt{${b}}` : `${a}\\sqrt{${b}}`
}

// ───────── 다항식 (유리수 계수, 최고차부터) ─────────

export type Poly = Q[]
export const P = (...cs: (number | Q)[]): Poly => cs.map(Q.of)

export function pTrim(p: Poly): Poly {
  let i = 0
  while (i < p.length - 1 && p[i].n === 0) i++
  return p.slice(i)
}
export function pAdd(a: Poly, b: Poly): Poly {
  const n = Math.max(a.length, b.length)
  const A = [...Array(n - a.length).fill(q(0)), ...a]
  const B = [...Array(n - b.length).fill(q(0)), ...b]
  return pTrim(A.map((x, i) => x.add(B[i])))
}
export function pScale(a: Poly, k: number | Q): Poly {
  return pTrim(a.map((x) => x.mul(k)))
}
export function pMul(a: Poly, b: Poly): Poly {
  const out: Q[] = Array(a.length + b.length - 1).fill(q(0))
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] = out[i + j].add(x.mul(y)))))
  return pTrim(out)
}
export function pDeriv(a: Poly): Poly {
  const deg = a.length - 1
  if (deg === 0) return [q(0)]
  return pTrim(a.slice(0, -1).map((c, i) => c.mul(deg - i)))
}
/** 부정적분 (적분상수 0) */
export function pInteg(a: Poly): Poly {
  const deg = a.length - 1
  return [...a.map((c, i) => c.div(deg - i + 1)), q(0)]
}
export function pEval(a: Poly, x: number | Q): Q {
  const X = Q.of(x)
  return a.reduce((acc, c) => acc.mul(X).add(c), q(0))
}
export const pEvalNum = (a: Poly, x: number) => a.reduce((acc, c) => acc * x + c.value, 0)
/** 근들로 다항식: k(x-r1)(x-r2)... */
export function pFromRoots(k: number | Q, roots: (number | Q)[]): Poly {
  return roots.reduce<Poly>((acc, r) => pMul(acc, [q(1), Q.of(r).neg()]), [Q.of(k)])
}
export const texP = (a: Poly, x = "x") => texPoly(a, x)

// ───────── 객관식 ─────────

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))

/**
 * 정답 보기와 오답 보기 후보로 5개 보기를 만든다.
 * - 값이 같은 보기는 하나만 남긴다
 * - 오답이 모자라면 fill(k)로 채운다 (k = 1, 2, ... 정답에서 멀어지는 쪽)
 * - 수능처럼 값이 작은 것부터 늘어놓는다
 */
export function mc(
  r: Rng,
  correct: Choice,
  wrongs: Choice[],
  fill?: (k: number) => Choice
): Pick<SuProblem, "choices" | "answer" | "value" | "choiceValues"> {
  const picked: Choice[] = [correct]
  const has = (c: Choice) => picked.some((p) => near(p.value, c.value) || p.tex === c.tex)
  for (const w of r.shuffle(wrongs)) {
    if (picked.length >= 5) break
    if (Number.isFinite(w.value) && !has(w)) picked.push(w)
  }
  const step = Math.max(1, Math.abs(correct.value) >= 20 ? Math.round(Math.abs(correct.value) / 10) : 1)
  const auto = fill ?? ((k: number) => intChoice(correct.value + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step))
  for (let k = 1; picked.length < 5 && k < 200; k++) {
    const c = auto(k)
    if (Number.isFinite(c.value) && !has(c)) picked.push(c)
  }
  if (picked.length < 5) throw new Error("보기 5개를 만들지 못했어요")
  picked.sort((a, b) => a.value - b.value)
  const idx = picked.findIndex((c) => c === correct)
  return { choices: picked.map((c) => `$${c.tex}$`), answer: String(idx + 1), value: correct.value, choiceValues: picked.map((c) => c.value) }
}

export const intChoice = (n: number): Choice => ({ tex: String(n), value: n })
export const qChoice = (x: Q): Choice => ({ tex: x.tex(), value: x.value })
/** 수 보기 여러 개 */
export const ints = (...ns: number[]) => ns.map(intChoice)

/** 단답형: 자연수 1~999만 허용 */
export function short(value: number): Pick<SuProblem, "answer" | "value"> {
  if (!Number.isInteger(value) || value < 1 || value > 999) throw new Error(`단답형 정답은 1~999 자연수여야 해요: ${value}`)
  return { answer: String(value), value }
}
export const isShortOk = (v: number) => Number.isInteger(v) && v >= 1 && v <= 999

// ───────── 수치 검산 (verify 전용) ─────────

/** 심프슨 적분 */
export function integrate(f: (x: number) => number, a: number, b: number, n = 2000) {
  if (n % 2) n++
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}
/** 중심 차분 미분 */
export const deriv = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h)

/** [a, b]를 잘게 나눠 부호가 바뀌는 곳(과 0이 되는 곳)을 찾아 이분법으로 근을 구한다 */
export function roots(f: (x: number) => number, a: number, b: number, n = 20000): number[] {
  const out: number[] = []
  const h = (b - a) / n
  let x0 = a
  let y0 = f(a)
  if (Math.abs(y0) < 1e-12) out.push(a)
  for (let i = 1; i <= n; i++) {
    const x1 = a + i * h
    const y1 = f(x1)
    if (Math.abs(y1) < 1e-12) {
      if (!out.length || Math.abs(out[out.length - 1] - x1) > h * 1.5) out.push(x1)
    } else if (y0 * y1 < 0 && Math.abs(y0) > 1e-12) {
      let lo = x0
      let hi = x1
      for (let k = 0; k < 80; k++) {
        const m = (lo + hi) / 2
        if (f(lo) * f(m) <= 0) hi = m
        else lo = m
      }
      out.push((lo + hi) / 2)
    }
    x0 = x1
    y0 = y1
  }
  return out
}

/** x → a 일 때 극한값 (양쪽에서 다가가 평균, 양쪽이 다르면 NaN) */
export function limitAt(f: (x: number) => number, a: number) {
  const hs = [1e-3, 1e-4, 1e-5]
  const left = hs.map((h) => f(a - h))
  const right = hs.map((h) => f(a + h))
  const L = left[2]
  const R = right[2]
  if (Math.abs(L - R) > 1e-3 * Math.max(1, Math.abs(L))) return NaN
  // 리처드슨 외삽처럼 마지막 두 값으로 보정
  return (L + R) / 2
}

/** 가까운 유리수로 (분모 ≤ maxD) — 수치 결과를 정답과 비교할 때 */
export function closeTo(x: number, target: number, tol = 1e-6) {
  return Math.abs(x - target) <= tol * Math.max(1, Math.abs(target))
}

/** n개에서 k개 고르는 모든 조합 (완전 탐색용) */
export function* combos<T>(xs: T[], k: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === k) {
    yield [...acc]
    return
  }
  for (let i = start; i < xs.length; i++) {
    acc.push(xs[i])
    yield* combos(xs, k, i + 1, acc)
    acc.pop()
  }
}
/** 길이 k의 모든 순서쌍 (중복 허용) */
export function* tuples<T>(xs: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield []
    return
  }
  for (const x of xs) for (const rest of tuples(xs, k - 1)) yield [x, ...rest]
}
/** 모든 순열 */
export function* perms<T>(xs: T[]): Generator<T[]> {
  if (xs.length <= 1) {
    yield [...xs]
    return
  }
  for (let i = 0; i < xs.length; i++) {
    const rest = [...xs.slice(0, i), ...xs.slice(i + 1)]
    for (const p of perms(rest)) yield [xs[i], ...p]
  }
}

export const C = (n: number, k: number) => {
  if (k < 0 || k > n) return 0
  let v = 1
  for (let i = 0; i < k; i++) v = (v * (n - i)) / (i + 1)
  return Math.round(v)
}
export const Pm = (n: number, k: number) => {
  let v = 1
  for (let i = 0; i < k; i++) v *= n - i
  return v
}
export const fact = (n: number) => Pm(n, n)

// ───────── 표준정규분포표 ─────────

/** 교과서·수능에서 쓰는 표준정규분포표 값 P(0 ≤ Z ≤ z) */
export const NORMAL_TABLE: Record<string, number> = {
  "0.5": 0.1915,
  "1.0": 0.3413,
  "1.5": 0.4332,
  "2.0": 0.4772,
  "2.5": 0.4938,
  "3.0": 0.4987,
}
/** 표 그림 (문제 아래에 붙는다) */
export function normalTableFigure(zs: string[]) {
  const rows = zs.map((z) => [z, NORMAL_TABLE[z].toFixed(4)])
  const w = 300
  const rh = 40
  const h = rh * (rows.length + 1)
  let body = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="#FFFFFF" stroke="#1F1A3D" stroke-width="2"/>`
  body += `<line x1="${w / 2}" y1="1" x2="${w / 2}" y2="${h - 1}" stroke="#1F1A3D" stroke-width="1.5"/>`
  body += `<text x="${w / 4}" y="27" font-size="22" font-family="PlexKR" text-anchor="middle" fill="#1F1A3D">z</text>`
  body += `<text x="${(3 * w) / 4}" y="27" font-size="20" font-family="PlexKR" text-anchor="middle" fill="#1F1A3D">P(0 ≤ Z ≤ z)</text>`
  rows.forEach(([z, p], i) => {
    const y = rh * (i + 1)
    body += `<line x1="1" y1="${y}" x2="${w - 1}" y2="${y}" stroke="#1F1A3D" stroke-width="${i === 0 ? 2 : 1}"/>`
    body += `<text x="${w / 4}" y="${y + 27}" font-size="22" font-family="PlexKR" text-anchor="middle" fill="#1F1A3D">${z}</text>`
    body += `<text x="${(3 * w) / 4}" y="${y + 27}" font-size="22" font-family="PlexKR" text-anchor="middle" fill="#1F1A3D">${p}</text>`
  })
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}">${body}</svg>`, width: w, height: h }
}
/** 표준정규분포 누적 (verify에서 표 값 확인용) */
export function phi(z: number) {
  // Abramowitz–Stegun 7.1.26 보다 정확한 erf 근사 대신 적분
  return 0.5 + integrate((t) => Math.exp((-t * t) / 2) / Math.sqrt(2 * Math.PI), 0, z, 4000)
}

// ───────── 조립 ─────────

/** 해설 줄 묶기 */
export const lines = (...ls: (string | false | null | undefined)[]) => ls.filter(Boolean).join("\n")
