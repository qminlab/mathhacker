// 대수 · 수열
import { closeTo, isShortOk, mc, q, Q, qChoice, roots, short, signed, term, texPoly, texShift } from "../kit"
import type { SuTemplate } from "../types"
import { autoInt, autoQ, qFill, sol, mcBal } from "./helpers"

const U = "수열"
const S = (n: number | string, body: string, from: number | string = 1) => `\\sum_{k=${from}}^{${n}} ${body}`
const sumTo = (n: number, f: (k: number) => number, from = 1) => {
  let s = 0
  for (let k = from; k <= n; k++) s += f(k)
  return s
}
const pr = (n: number) => (n < 0 ? `(${n})` : String(n))
const seqName = "수열 $\\{a_n\\}$"
/** a_i + … + a_j (세 항 이하면 나열) */
const span = (i: number, j: number, v = "a") => (j - i <= 2 ? Array.from({ length: j - i + 1 }, (_, t) => `${v}_{${i + t}}`).join(" + ") : `${v}_{${i}} + ${v}_{${i + 1}} + \\cdots + ${v}_{${j}}`)

// ═════════ 1단계 ═════════

/** 등차수열의 합 */
const arithSum: SuTemplate<{ mode: "d" | "last"; a: number; d: number; n: number }> = {
  id: "seq-arith-sum",
  subject: "대수",
  unit: U,
  standard: "12대수03-02",
  level: 1,
  count: 70,
  params: (r) => {
    const a = r.int(-10, 20)
    const d = r.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5, 6])
    const n = r.int(5, 20)
    const s = (n * (2 * a + (n - 1) * d)) / 2
    if (Math.abs(s) > 999 || s === 0) return null
    return { mode: r.chance(0.5) ? "d" : "last", a, d, n }
  },
  build: ({ mode, a, d, n }, r) => {
    const an = a + (n - 1) * d
    const s = (n * (a + an)) / 2
    const text =
      mode === "d"
        ? `첫째항이 $${a}$ 이고 공차가 $${d}$ 인 등차수열의 첫째항부터 제${n}항까지의 합${isShortOk(s) ? "을 구하시오." : "은?"}`
        : `첫째항이 $${a}$ 이고 제${n}항이 $${an}$ 인 등차수열의 첫째항부터 제${n}항까지의 합${isShortOk(s) ? "을 구하시오." : "은?"}`
    return {
      text,
      ...autoInt(r, s, [(n * (2 * a + n * d)) / 2, n * (a + an), s + an, s - a, ((n - 1) * (a + an)) / 2].filter(Number.isInteger)),
      solution: sol(
        mode === "d" ? `제${n}항은 $${a} + ${n - 1} \\times ${pr(d)} = ${an}$ 이다.` : `첫째항이 $a$, 제$n$항이 $l$ 인 등차수열의 합은 $\\frac{n(a + l)}{2}$ 이다.`,
        `구하는 합은 $\\frac{${n}(${a} ${signed(an)})}{2} = ${s}$`
      ),
      score: 2,
    }
  },
  verify: ({ a, d, n }) => sumTo(n, (k) => a + (k - 1) * d),
}

/** 등비수열의 일반항 */
const geoTerm: SuTemplate<{ mode: "r" | "two"; a: number; r: number; i: number; k: number }> = {
  id: "seq-geo-term",
  subject: "대수",
  unit: U,
  standard: "12대수03-03",
  level: 1,
  count: 70,
  params: (r) => {
    const mode = r.chance(0.5) ? "r" : "two"
    const a = r.pick([1, 2, 3, 4, 5, 6, 7, -1, -2, -3])
    const rr = mode === "r" ? r.pick([2, 3, -2, -3, 4]) : r.pick([2, 3, 4])
    const i = r.int(1, 3)
    const k = r.int(i + 3, i + 6)
    const v = a * rr ** (k - 1)
    if (Math.abs(v) > 999 || Math.abs(a * rr ** (i + 1)) > 999) return null
    if (mode === "two" && a < 0) return null
    return { mode, a, r: rr, i, k }
  },
  build: ({ mode, a, r: rr, i, k }, r) => {
    const t = (n: number) => a * rr ** (n - 1)
    const ans = t(k)
    if (mode === "r") {
      return {
        text: `첫째항이 $${a}$ 이고 공비가 $${rr}$ 인 등비수열 $\\{a_n\\}$ 에 대하여 $a_{${k}}$ 의 값${isShortOk(ans) ? "을 구하시오." : "은?"}`,
        ...autoInt(r, ans, [t(k + 1), t(k - 1), -ans, a * rr * (k - 1), a + (k - 1) * rr]),
        solution: sol(`$a_n = ${a} \\times ${pr(rr)}^{n-1}$ 이므로`, `$a_{${k}} = ${a} \\times ${pr(rr)}^{${k - 1}} = ${ans}$`),
        score: 2,
      }
    }
    return {
      text: `공비가 양수인 등비수열 $\\{a_n\\}$ 에 대하여 $a_{${i}} = ${t(i)}$, $a_{${i + 2}} = ${t(i + 2)}$ 일 때, $a_{${k}}$ 의 값을 구하시오.`,
      ...short(ans),
      solution: sol(
        `공비를 $r$ 라 하면 $a_{${i + 2}} = a_{${i}} r^{2}$ 이므로 $r^{2} = \\frac{${t(i + 2)}}{${t(i)}} = ${rr * rr}$, $r > 0$ 이므로 $r = ${rr}$`,
        `$a_{${k}} = a_{${i}} r^{${k - i}} = ${t(i)} \\times ${rr}^{${k - i}} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ mode, a, r: rr, i, k }) => {
    if (mode === "r") {
      let x = a
      for (let n = 1; n < k; n++) x *= rr
      return x
    }
    const ai = a * rr ** (i - 1)
    const ai2 = a * rr ** (i + 1)
    const ratio = Math.sqrt(ai2 / ai)
    let x = ai
    for (let n = i; n < k; n++) x *= ratio
    return x
  },
}

/** Σ 계산 (Σk, Σk²) */
const sigmaCalc: SuTemplate<{ mode: "lin" | "quad" | "prod" | "sq"; p: number; c: number; n: number }> = {
  id: "seq-sigma-calc",
  subject: "대수",
  unit: U,
  standard: "12대수03-05",
  level: 1,
  count: 80,
  params: (r) => {
    const mode = r.pick(["lin", "quad", "prod", "sq"] as const)
    const n = mode === "lin" ? r.int(5, 25) : r.int(4, 12)
    const p = mode === "lin" ? r.pick([-3, -2, 2, 3, 4, 5]) : r.int(-4, 5)
    const c = r.int(-6, 6)
    if (mode !== "lin" && p === 0) return null
    const v = sigVal(mode, p, c, n)
    if (Math.abs(v) > 999 || v === 0) return null
    return { mode, p, c, n }
  },
  build: ({ mode, p, c, n }, r) => {
    const v = sigVal(mode, p, c, n)
    const s1 = (n * (n + 1)) / 2
    const s2 = (n * (n + 1) * (2 * n + 1)) / 6
    let body: string
    let step: string
    if (mode === "lin") {
      body = `(${texPoly([p, c], "k")})`
      step = `$${p}${S(n, "k")} ${c ? `+ ${S(n, pr(c))}` : ""} = ${p} \\times ${s1} ${signed(c * n)} = ${v}$`
    } else if (mode === "quad") {
      body = `(${texPoly([1, p, c], "k")})`
      step = `$${S(n, "k^{2}")} ${signed(p)}${S(n, "k")}${c ? ` ${signed(c)} \\times ${n}` : ""} = ${s2} ${signed(p * s1)}${c ? ` ${signed(c * n)}` : ""} = ${v}$`
    } else if (mode === "prod") {
      body = `k(${texShift(-p, "k")})`
      step = `$k(${texShift(-p, "k")}) = ${texPoly([1, p, 0], "k")}$ 이므로 $${S(n, "k^{2}")} ${signed(p)}${S(n, "k")} = ${s2} ${signed(p * s1)} = ${v}$`
    } else {
      body = `(${texShift(-p, "k")})^{2}`
      step = `$(${texShift(-p, "k")})^{2} = ${texPoly([1, 2 * p, p * p], "k")}$ 이므로 $${s2} ${signed(2 * p * s1)} + ${p * p} \\times ${n} = ${v}$`
    }
    return {
      text: `$${S(n, body)}$ 의 값${isShortOk(v) ? "을 구하시오." : "은?"}`,
      ...autoInt(r, v, [v + n, v - n, sigVal(mode, p, c, n - 1), sigVal(mode, p, c, n + 1), -v]),
      solution: sol(`$${S(n, "k")} = \\frac{${n} \\times ${n + 1}}{2} = ${s1}$, $${S(n, "k^{2}")} = \\frac{${n} \\times ${n + 1} \\times ${2 * n + 1}}{6} = ${s2}$`, `Σ 의 성질을 이용하면`, step),
      score: 2,
    }
  },
  verify: ({ mode, p, c, n }) =>
    sumTo(n, (k) => (mode === "lin" ? p * k + c : mode === "quad" ? k * k + p * k + c : mode === "prod" ? k * (k + p) : (k + p) ** 2)),
}
function sigVal(mode: string, p: number, c: number, n: number) {
  const s1 = (n * (n + 1)) / 2
  const s2 = (n * (n + 1) * (2 * n + 1)) / 6
  if (mode === "lin") return p * s1 + c * n
  if (mode === "quad") return s2 + p * s1 + c * n
  if (mode === "prod") return s2 + p * s1
  return s2 + 2 * p * s1 + p * p * n
}

/** Σ 의 성질 */
const sigmaProps: SuTemplate<{ mode: "lin" | "pm"; n: number; A: number; B: number; p: number; qq: number; c: number; askA: boolean }> = {
  id: "seq-sigma-props",
  subject: "대수",
  unit: U,
  standard: "12대수03-04",
  level: 1,
  count: 60,
  params: (r) => {
    const mode = r.chance(0.6) ? "lin" : "pm"
    const n = r.pick([5, 8, 10, 12, 15, 20])
    const A = r.int(-10, 30)
    const B = r.int(-10, 30)
    const p = r.int(1, 5)
    const qq = r.int(-4, 4)
    const c = r.int(-3, 4)
    if (mode === "pm" && A === B) return null
    if (mode === "lin" && (qq === 0 || A === 0 || B === 0)) return null
    return { mode, n, A, B, p, qq, c, askA: r.chance(0.5) }
  },
  build: ({ mode, n, A, B, p, qq, c, askA }, r) => {
    if (mode === "lin") {
      const ans = p * A + qq * B + c * n
      const body = `(${term(p, "a_k", true)}${term(qq, "b_k")}${term(c, "")})`
      return {
        text: `$${S(n, "a_k")} = ${A}$, $${S(n, "b_k")} = ${B}$ 일 때, $${S(n, body)}$ 의 값${isShortOk(ans) ? "을 구하시오." : "은?"}`,
        ...autoInt(r, ans, [p * A + qq * B + c, p * A - qq * B + c * n, ans + n, ans - c * n + c, p * A + qq * B]),
        solution: sol(
          `Σ 의 성질에 의하여 $${S(n, body)} = ${p === 1 ? "" : p}${S(n, "a_k")} ${qq < 0 ? "-" : "+"} ${Math.abs(qq) === 1 ? "" : Math.abs(qq)}${S(n, "b_k")}${c ? ` ${signed(c)} \\times ${n}` : ""}$`,
          `계산하면 $${p} \\times ${pr(A)} ${signed(qq * B)}${c ? ` ${signed(c * n)}` : ""} = ${ans}$`
        ),
        score: 2,
      }
    }
    // Σ(a+b) = A+B, Σ(a−b) = A−B
    const X = A + B
    const Y = A - B
    const ans = askA ? A : B
    return {
      text: `$${S(n, "(a_k + b_k)")} = ${X}$, $${S(n, "(a_k - b_k)")} = ${Y}$ 일 때, $${S(n, askA ? "a_k" : "b_k")}$ 의 값${isShortOk(ans) ? "을 구하시오." : "은?"}`,
      ...autoInt(r, ans, [askA ? B : A, X, Y, -ans, X + Y]),
      solution: sol(
        `$${S(n, "a_k")} = P$, $${S(n, "b_k")} = Q$ 라 하면 Σ 의 성질에 의하여 $P + Q = ${X}$ 이고 $P - Q = ${Y}$`,
        `두 식을 ${askA ? "더하면 $2P" : "빼면 $2Q"} = ${askA ? X + Y : X - Y}$ 이므로 구하는 값은 $${ans}$`
      ),
      score: 2,
    }
  },
  // 조건에 맞는 실제 수열을 만들어 직접 더한다
  verify: ({ mode, n, A, B, p, qq, c, askA }) => {
    const a = Array.from({ length: n }, (_, i) => (i === 0 ? A - (n - 1) : 1))
    const b = Array.from({ length: n }, (_, i) => (i === n - 1 ? B - 2 * (n - 1) : 2))
    if (mode === "lin") return a.reduce((s, x, i) => s + p * x + qq * b[i] + c, 0)
    const X = a.reduce((s, x, i) => s + x + b[i], 0)
    const Y = a.reduce((s, x, i) => s + x - b[i], 0)
    return askA ? (X + Y) / 2 : (X - Y) / 2
  },
}

/** 등차중항·등비중항 */
const means: SuTemplate<{ g: number; u: number; v: number; swap: boolean }> = {
  id: "seq-means",
  subject: "대수",
  unit: U,
  standard: "12대수03-03",
  level: 1,
  count: 40,
  params: (r) => {
    const g = r.int(1, 6)
    const u = r.int(1, 5)
    const v = r.int(u + 1, 7)
    const a = g * u * u
    const b = g * v * v
    if ((a + b) % 2 || b > 300) return null
    return { g, u, v, swap: r.chance(0.5) }
  },
  build: ({ g, u, v, swap }) => {
    const [a, b] = swap ? [g * v * v, g * u * u] : [g * u * u, g * v * v]
    const x = (a + b) / 2
    const y = g * u * v
    return {
      text: `세 수 $${a}$, $x$, $${b}$ 가 이 순서대로 등차수열을 이루고, 세 수 $${a}$, $y$, $${b}$ 가 이 순서대로 등비수열을 이룰 때, $x + y$ 의 값을 구하시오. (단, $y > 0$)`,
      ...short(x + y),
      solution: sol(`$x$ 는 $${a}$ 와 $${b}$ 의 등차중항이므로 $2x = ${a} + ${b}$, 즉 $x = ${x}$`, `$y$ 는 등비중항이므로 $y^{2} = ${a} \\times ${b} = ${a * b}$, $y > 0$ 이므로 $y = ${y}$`, `따라서 $x + y = ${x + y}$`),
      score: 2,
    }
  },
  verify: ({ g, u, v }) => {
    const a = g * u * u
    const b = g * v * v
    let x = NaN
    for (let t = -500; t <= 500; t++) if (t - a === b - t) x = t
    let y = NaN
    for (let t = 1; t <= 999; t++) if (t * t === a * b) y = t
    return x + y
  },
}

// ═════════ 2단계 ═════════

/** S_n 과 a_n 의 관계 */
const snToAn: SuTemplate<{ kind: "poly" | "geo"; p: number; qq: number; c: number; m: number; ask: "one" | "both" | "pair" }> = {
  id: "seq-sn-to-an",
  subject: "대수",
  unit: U,
  standard: "12대수03-02",
  level: 2,
  count: 70,
  params: (r) => {
    const kind = r.chance(0.65) ? "poly" : "geo"
    // poly: S_n = p n² + qq n + c,  geo: S_n = p·qq^n + c (qq = 2, 3)
    const p = kind === "poly" ? r.pick([-3, -2, -1, 1, 2, 3, 4, 5]) : r.pick([-3, -2, -1, 1, 2, 3])
    const qq = kind === "poly" ? r.int(-9, 9) : r.pick([2, 3])
    const c = r.int(-7, 7)
    const m = kind === "poly" ? r.int(3, 14) : r.int(2, qq === 2 ? 7 : 5)
    const ask = c !== 0 && r.chance(0.6) ? "both" : r.pick(["one", "pair"] as const)
    return { kind, p, qq, c, m, ask }
  },
  build: ({ kind, p, qq, c, m, ask }, r) => {
    const Sn = (n: number) => (kind === "poly" ? p * n * n + qq * n + c : p * qq ** n + c)
    const gen = (n: number) => (kind === "poly" ? 2 * p * n - p + qq : p * (qq - 1) * qq ** (n - 1))
    const a1 = Sn(1)
    const ans = ask === "both" ? a1 + gen(m) : ask === "pair" ? gen(m) + gen(m + 1) : gen(m)
    const sTex = kind === "poly" ? texPoly([p, qq, c], "n") : `${term(p, `${qq}^{n}`, true)}${c ? ` ${signed(c)}` : ""}`
    const gTex = kind === "poly" ? texPoly([2 * p, -p + qq], "n") : `${term(p * (qq - 1), `${qq}^{n-1}`, true)}`
    const target = ask === "both" ? `a_1 + a_{${m}}` : ask === "pair" ? `a_{${m}} + a_{${m + 1}}` : `a_{${m}}`
    const wrong1 = ask === "both" ? gen(1) + gen(m) : ans + p
    return {
      text: `수열 $\\{a_n\\}$ 의 첫째항부터 제$n$항까지의 합 $S_n$ 이 $S_n = ${sTex}$ 일 때, $${target}$ 의 값${isShortOk(ans) ? "을 구하시오." : "은?"}`,
      ...autoInt(r, ans, [wrong1, Sn(m), Sn(m + 1) - Sn(m - 1) + 1, ans + 2 * p, ans - c]),
      solution: sol(
        `$n \\ge 2$ 일 때 $a_n = S_n - S_{n-1} = ${gTex}$`,
        ask === "both"
          ? `$a_1 = S_1 = ${a1}$ (${c ? "상수항 때문에 $a_1$ 은 위의 식에 $n = 1$ 을 넣은 값과 다르다" : "위의 식에 $n = 1$ 을 넣은 값과 같다"})`
          : ask === "pair"
            ? `$a_{${m}} + a_{${m + 1}} = S_{${m + 1}} - S_{${m - 1}}$ 으로 구해도 된다.`
            : `$${m} \\ge 2$ 이므로 위의 식을 쓸 수 있다.`,
        ask === "both"
          ? `$a_{${m}} = ${gen(m)}$ 이므로 $a_1 + a_{${m}} = ${a1} ${signed(gen(m))} = ${ans}$`
          : ask === "pair"
            ? `$a_{${m}} = ${gen(m)}$, $a_{${m + 1}} = ${gen(m + 1)}$ 이므로 구하는 값은 $${ans}$`
            : `따라서 $a_{${m}} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ kind, p, qq, c, m, ask }) => {
    const Sn = (n: number) => (kind === "poly" ? p * n * n + qq * n + c : p * qq ** n + c)
    const a = (n: number) => (n === 1 ? Sn(1) : Sn(n) - Sn(n - 1))
    return ask === "both" ? a(1) + a(m) : ask === "pair" ? a(m) + a(m + 1) : a(m)
  },
}

/** 등비수열의 합: S_k, S_2k 에서 S_3k */
const geoSum: SuTemplate<{ a: number; r: number; k: number; ask: "s3" | "tail" }> = {
  id: "seq-geo-sum-blocks",
  subject: "대수",
  unit: U,
  standard: "12대수03-03",
  level: 2,
  count: 70,
  params: (r) => {
    const a = r.pick([1, 2, 3, 4, 5, 6, -1, -2, -3])
    const rr = r.pick([2, 3, -2, -3, 2])
    const k = r.int(2, 4)
    const Sk = (a * (rr ** k - 1)) / (rr - 1)
    const s3 = Sk * (1 + rr ** k + rr ** (2 * k))
    const ask = r.chance(0.5) ? "s3" : "tail"
    const v = ask === "s3" ? s3 : Sk * rr ** (2 * k)
    if (Math.abs(v) > 999 || Sk === 0) return null
    if (rr ** k === -1) return null
    return { a, r: rr, k, ask }
  },
  build: ({ a, r: rr, k, ask }, r) => {
    const Sk = (a * (rr ** k - 1)) / (rr - 1)
    const S2 = (a * (rr ** (2 * k) - 1)) / (rr - 1)
    const t = rr ** k
    const s3 = Sk * (1 + t + t * t)
    const ans = ask === "s3" ? s3 : Sk * t * t
    const target = ask === "s3" ? `S_{${3 * k}}` : span(2 * k + 1, 3 * k)
    return {
      text: `등비수열 $\\{a_n\\}$ 의 첫째항부터 제$n$항까지의 합을 $S_n$ 이라 하자. $S_{${k}} = ${Sk}$, $S_{${2 * k}} = ${S2}$ 일 때, $${target}$ 의 값${isShortOk(ans) ? "을 구하시오." : "은?"}`,
      ...autoInt(r, ans, [S2 * t, Sk * t, s3 - Sk, S2 + Sk * t, ans + Sk]),
      solution: sol(
        `공비를 $r$ 라 하면 $${span(k + 1, 2 * k)} = r^{${k}}(${span(1, k)})$ 이므로 $S_{${2 * k}} - S_{${k}} = r^{${k}} S_{${k}}$`,
        `$${S2 - Sk} = ${pr(Sk)} r^{${k}}$ 에서 $r^{${k}} = ${t}$`,
        ask === "s3"
          ? `$S_{${3 * k}} = S_{${2 * k}} + r^{${2 * k}} S_{${k}} = ${S2} ${signed(t * t * Sk)} = ${ans}$`
          : `$${span(2 * k + 1, 3 * k)} = r^{${2 * k}} S_{${k}} = ${t * t} \\times ${pr(Sk)} = ${ans}$`
      ),
      score: 3,
    }
  },
  // 첫째항(정수)과 공비(정수)를 모두 시험해 조건을 만족하는 수열을 찾는다
  verify: ({ a, r: rr, k, ask }) => {
    const Sk = (a * (rr ** k - 1)) / (rr - 1)
    const S2 = (a * (rr ** (2 * k) - 1)) / (rr - 1)
    for (let R = -6; R <= 6; R++) {
      if (R === 0 || R === 1) continue
      for (let A = -50; A <= 50; A++) {
        if (!A) continue
        const terms: number[] = []
        let x = A
        for (let i = 0; i < 3 * k; i++) {
          terms.push(x)
          x *= R
        }
        const s = (n: number) => terms.slice(0, n).reduce((p, c) => p + c, 0)
        if (s(k) === Sk && s(2 * k) === S2) return ask === "s3" ? s(3 * k) : s(3 * k) - s(2 * k)
      }
    }
    return NaN
  },
}

/** 여러 가지 수열의 합: 망원 합 */
const telescope: SuTemplate<{ mode: "frac" | "sqrt" | "log"; a: number; b: number; n: number }> = {
  id: "seq-telescoping",
  subject: "대수",
  unit: U,
  standard: "12대수03-05",
  level: 2,
  count: 80,
  params: (r) => {
    const mode = r.pick(["frac", "frac", "sqrt", "log"] as const)
    if (mode === "frac") {
      const a = r.int(1, 3)
      const b = r.int(1 - a, 4)
      return { mode, a, b, n: r.int(5, 30) }
    }
    if (mode === "sqrt") {
      const u = r.int(1, 5)
      const v = r.int(u + 1, u + 9)
      const n = v * v - u * u
      if (n > 150) return null
      return { mode, a: u, b: v, n }
    }
    const base = r.pick([2, 3])
    const m = r.int(1, 4)
    const e = r.int(1, base === 2 ? 6 : 4)
    const n = m * base ** e - 1
    if (n < m + 2 || n > 300) return null
    return { mode, a: base, b: m, n }
  },
  build: ({ mode, a, b, n }, r) => {
    if (mode === "frac") {
      const f1 = b === 0 ? (a === 1 ? "k" : `${a}k`) : `(${texPoly([a, b], "k")})`
      const f2 = `(${texPoly([a, b + a], "k")})`
      const ans = q(1, a).mul(q(1, a + b).sub(q(1, a * n + a + b)))
      const wr = [ans.mul(a), q(1, a + b).sub(q(1, a * n + b)).div(a), q(1, a).mul(q(1, a + b).sub(q(1, a * n + 2 * a + b))), q(1, a + b).sub(q(1, a * n + a + b)).mul(a)]
      return {
        text: `$${S(n, `\\frac{1}{${f1}${f2}}`)}$ 의 값은?`,
        ...mcBal(r, qChoice(ans), wr.map(qChoice), qFill(ans)),
        solution: sol(
          `$\\frac{1}{${f1}${f2}} = ${a === 1 ? `\\frac{1}{${texPoly([a, b], "k")}} - \\frac{1}{${texPoly([a, a + b], "k")}}` : `\\frac{1}{${a}}\\left(\\frac{1}{${texPoly([a, b], "k")}} - \\frac{1}{${texPoly([a, a + b], "k")}}\\right)`}$`,
          `$k = 1, 2, \\cdots, ${n}$ 을 대입하여 더하면 가운데 항이 모두 지워져 $${a === 1 ? `\\frac{1}{${a + b}} - \\frac{1}{${n + 1 + b}}` : `\\frac{1}{${a}}\\left(\\frac{1}{${a + b}} - \\frac{1}{${a * n + a + b}}\\right)`}$ 만 남는다.`,
          `따라서 구하는 값은 $${ans.tex()}$`
        ),
        score: 3,
      }
    }
    if (mode === "sqrt") {
      const u = a
      const v = b
      const c = u * u - 1
      const k1 = texPoly([1, c], "k")
      const k2 = texPoly([1, c + 1], "k")
      return {
        text: `$${S(n, `\\frac{1}{\\sqrt{${k1}} + \\sqrt{${k2}}}`)}$ 의 값을 구하시오.`,
        ...short(v - u),
        solution: sol(
          `분모를 유리화하면 $\\frac{1}{\\sqrt{${k1}} + \\sqrt{${k2}}} = \\sqrt{${k2}} - \\sqrt{${k1}}$`,
          `$k = 1, 2, \\cdots, ${n}$ 을 대입하여 더하면 $\\sqrt{${n + c + 1}} - \\sqrt{${c + 1}}$ 만 남는다.`,
          `따라서 구하는 값은 $${v} - ${u} = ${v - u}$`
        ),
        score: 3,
      }
    }
    const base = a
    const m = b
    const e = Math.round(Math.log((n + 1) / m) / Math.log(base))
    return {
      text: `$${S(n, `\\log_{${base}}\\left(1 + \\frac{1}{k}\\right)`, m)}$ 의 값을 구하시오.`,
      ...short(e),
      solution: sol(
        `$\\log_{${base}}\\left(1 + \\frac{1}{k}\\right) = \\log_{${base}}\\frac{k + 1}{k} = \\log_{${base}}(k + 1) - \\log_{${base}} k$`,
        `$k = ${m}, ${m + 1}, \\cdots, ${n}$ 을 대입하여 더하면 $\\log_{${base}} ${n + 1} - \\log_{${base}} ${m} = \\log_{${base}} ${(n + 1) / m}$`,
        `따라서 구하는 값은 $${e}$`
      ),
      score: 3,
    }
  },
  verify: ({ mode, a, b, n }) => {
    if (mode === "frac") return sumTo(n, (k) => 1 / ((a * k + b) * (a * k + b + a)))
    if (mode === "sqrt") {
      const c = a * a - 1
      return sumTo(n, (k) => 1 / (Math.sqrt(k + c) + Math.sqrt(k + c + 1)))
    }
    return sumTo(n, (k) => Math.log(1 + 1 / k) / Math.log(a), b)
  },
}

/** Σk², Σk³ 응용 */
const sigmaPoly: SuTemplate<{ mode: "prod" | "range" | "cube"; p: number; c: number; m: number; n: number }> = {
  id: "seq-sigma-poly",
  subject: "대수",
  unit: U,
  standard: "12대수03-05",
  level: 2,
  count: 70,
  params: (r) => {
    const mode = r.pick(["prod", "range", "cube"] as const)
    if (mode === "prod") {
      const p = r.int(1, 5)
      const c = r.int(1, 5)
      const n = r.int(5, 12)
      const v = sumTo(n, (k) => (k + p) * (k - c))
      if (!isShortOk(v)) return null
      return { mode, p, c, m: 1, n }
    }
    if (mode === "range") {
      const m = r.int(3, 8)
      const n = r.int(m + 3, 14)
      const c = r.int(-5, 9)
      const v = sumTo(n, (k) => k * k - c, m)
      if (!isShortOk(v)) return null
      return { mode, p: 0, c, m, n }
    }
    const n = r.int(3, 8)
    const c = r.int(-6, 9)
    if (c === 0) return null
    const v = sumTo(n, (k) => k ** 3 - c * k)
    if (!isShortOk(v)) return null
    return { mode, p: 0, c, m: 1, n }
  },
  build: ({ mode, p, c, m, n }) => {
    const s1 = (x: number) => (x * (x + 1)) / 2
    const s2 = (x: number) => (x * (x + 1) * (2 * x + 1)) / 6
    const s3 = (x: number) => s1(x) ** 2
    if (mode === "prod") {
      const v = s2(n) + (p - c) * s1(n) - p * c * n
      return {
        text: `$${S(n, `(k + ${p})(k - ${c})`)}$ 의 값을 구하시오.`,
        ...short(v),
        solution: sol(
          `$(k + ${p})(k - ${c}) = ${texPoly([1, p - c, -p * c], "k")}$`,
          `$${S(n, "k^{2}")} = ${s2(n)}$, $${S(n, "k")} = ${s1(n)}$ 이므로`,
          `(주어진 식) $= ${s2(n)}${p - c ? ` ${signed((p - c) * s1(n))}` : ""} ${signed(-p * c * n)} = ${v}$`
        ),
        score: 3,
      }
    }
    if (mode === "range") {
      const v = s2(n) - s2(m - 1) - c * (n - m + 1)
      return {
        text: `$${S(n, `(k^{2} ${signed(-c)})`, m)}$ 의 값을 구하시오.`.replace(" + 0)", ")"),
        ...short(v),
        solution: sol(
          `$${S(n, "k^{2}", m)} = ${S(n, "k^{2}")} - ${S(m - 1, "k^{2}")} = ${s2(n)} - ${s2(m - 1)} = ${s2(n) - s2(m - 1)}$`,
          `더하는 항의 개수는 $${n} - ${m} + 1 = ${n - m + 1}$ 이므로 상수항의 합은 $${-c} \\times ${n - m + 1} = ${-c * (n - m + 1)}$`,
          `따라서 구하는 값은 $${s2(n) - s2(m - 1)} ${signed(-c * (n - m + 1))} = ${v}$`
        ),
        score: 3,
      }
    }
    const v = s3(n) - c * s1(n)
    return {
      text: `$${S(n, `(k^{3} ${signed(-c)}k)`)}$ 의 값을 구하시오.`.replace(/ ([+-]) 1k\)/, " $1 k)"),
      ...short(v),
      solution: sol(
        `$${S(n, "k^{3}")} = \\left\\{\\frac{${n} \\times ${n + 1}}{2}\\right\\}^{2} = ${s3(n)}$`,
        `$${S(n, "k")} = ${s1(n)}$ 이므로`,
        `(주어진 식) $= ${s3(n)} ${signed(-c)} \\times ${s1(n)} = ${v}$`
      ),
      score: 3,
    }
  },
  verify: ({ mode, p, c, m, n }) => {
    if (mode === "prod") return sumTo(n, (k) => (k + p) * (k - c))
    if (mode === "range") return sumTo(n, (k) => k * k - c, m)
    return sumTo(n, (k) => k ** 3 - c * k)
  },
}

/** 등차수열: 두 조건에서 합 */
const arithCond: SuTemplate<{ a: number; d: number; i: number; j: number; k: number; n: number }> = {
  id: "seq-arith-cond",
  subject: "대수",
  unit: U,
  standard: "12대수03-02",
  level: 2,
  count: 70,
  params: (r) => {
    const a = r.int(-15, 20)
    const d = r.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5])
    const i = r.int(1, 5)
    const j = r.int(i + 1, 10)
    const k = r.int(1, 10)
    if (i + j === 2 * k || k === i || k === j) return null
    const n = r.int(6, 20)
    const s = (n * (2 * a + (n - 1) * d)) / 2
    if (Math.abs(s) > 999 || s === 0) return null
    return { a, d, i, j, k, n }
  },
  build: ({ a, d, i, j, k, n }, r) => {
    const t = (x: number) => a + (x - 1) * d
    const X = t(i) + t(j)
    const Y = t(k)
    const s = (n * (2 * a + (n - 1) * d)) / 2
    return {
      text: `등차수열 $\\{a_n\\}$ 에 대하여 $a_{${i}} + a_{${j}} = ${X}$, $a_{${k}} = ${Y}$ 일 때, $${S(n, "a_k")}$ 의 값${isShortOk(s) ? "을 구하시오." : "은?"}`,
      ...autoInt(r, s, [s + n * d, s - n * d, n * t(n), s + a, ((n + 1) * (2 * a + n * d)) / 2].filter(Number.isInteger)),
      solution: sol(
        `첫째항을 $a$, 공차를 $d$ 라 하면 $2a${term(i + j - 2, "d")} = ${X}$, $a${term(k - 1, "d")} = ${Y}$`,
        `두 식을 연립하면 $a = ${a}$, $d = ${d}$`,
        `$${S(n, "a_k")} = \\frac{${n}\\{2 \\times ${pr(a)} + ${n - 1} \\times ${pr(d)}\\}}{2} = ${s}$`
      ),
      score: 3,
    }
  },
  verify: ({ a, d, i, j, k, n }) => {
    const t0 = (x: number, A: number, D: number) => A + (x - 1) * D
    const X = t0(i, a, d) + t0(j, a, d)
    const Y = t0(k, a, d)
    let found = NaN
    let cnt = 0
    for (let A = -60; A <= 60; A++)
      for (let D = -20; D <= 20; D++)
        if (t0(i, A, D) + t0(j, A, D) === X && t0(k, A, D) === Y) {
          found = sumTo(n, (x) => t0(x, A, D))
          cnt++
        }
    return cnt === 1 ? found : NaN
  },
}

// ═════════ 3단계 ═════════

/** 절댓값이 있는 등차수열의 합 */
const absArith: SuTemplate<{ a: number; d: number; i: number; j: number; n: number }> = {
  id: "seq-abs-arith",
  subject: "대수",
  unit: U,
  standard: "12대수03-02",
  level: 3,
  count: 70,
  params: (r) => {
    const dec = r.chance(0.6)
    const d = dec ? -r.int(1, 6) : r.int(1, 6)
    const a = dec ? r.int(5, 40) : -r.int(5, 40)
    const z = Math.floor(-a / d) + 1 // 부호가 바뀌는 근처
    const n = r.int(z + 2, z + 14)
    const i = r.int(2, 5)
    const j = r.int(i + 2, i + 8)
    const v = sumTo(n, (k) => Math.abs(a + (k - 1) * d))
    if (!isShortOk(v)) return null
    return { a, d, i, j, n }
  },
  build: ({ a, d, i, j, n }) => {
    const t = (x: number) => a + (x - 1) * d
    const ans = sumTo(n, (k) => Math.abs(t(k)))
    // 부호가 같은 마지막 항
    let z = 0
    for (let k = 1; k <= n; k++) if (Math.sign(t(k)) === Math.sign(t(1)) || t(k) === 0) z = k
    else break
    const Sz = sumTo(z, t)
    const Sn = sumTo(n, t)
    const sg = t(1) > 0 ? 1 : -1
    return {
      text: `등차수열 $\\{a_n\\}$ 에 대하여 $a_{${i}} = ${t(i)}$, $a_{${j}} = ${t(j)}$ 일 때, $${S(n, "|a_k|")}$ 의 값을 구하시오.`,
      ...short(ans),
      solution: sol(
        `공차를 $d$ 라 하면 $${j - i}d = ${t(j)} - ${pr(t(i))} = ${t(j) - t(i)}$ 이므로 $d = ${d}$, $a_1 = ${a}$, 즉 $a_n = ${texPoly([d, a - d], "n")}$`,
        `$a_n ${sg > 0 ? "\\ge" : "\\le"} 0$ 인 $n$ 은 $n \\le ${z}$ 이고, $n \\ge ${z + 1}$ 이면 $a_n ${sg > 0 ? "<" : ">"} 0$`,
        `$${z === 1 ? "a_1" : S(z, "a_k")} = ${Sz}$, $${S(n, "a_k")} = ${Sn}$ 이므로`,
        `$${S(n, "|a_k|")} = ${sg > 0 ? `2 \\times ${pr(Sz)} - ${pr(Sn)}` : `${Sn} - 2 \\times ${pr(Sz)}`} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ a, d, n }) => {
    let s = 0
    let x = a
    for (let k = 1; k <= n; k++) {
      s += Math.abs(x)
      x += d
    }
    return s
  },
}

/** 조건에 따라 갈라지는 점화식의 추적 (주기) */
const RULE_TEX = {
  half: (k: number) => `$a_n$ 이 짝수이면 $a_{n+1} = \\frac{a_n}{2}$, $a_n$ 이 홀수이면 $a_{n+1} = a_n + ${k}$`,
  sub: (p: number, k: number) => `\n$a_{n+1} = \\begin{cases} a_n - ${p} & (a_n > ${p}) \\\\ a_n + ${k} & (a_n \\le ${p}) \\end{cases}$\n`,
}
const recurTrace: SuTemplate<{ rule: "half" | "sub"; p: number; k: number; a1: number; N: number }> = {
  id: "seq-recur-trace",
  subject: "대수",
  unit: U,
  standard: "12대수03-06",
  level: 3,
  count: 60,
  params: (r) => {
    const rule = r.chance(0.5) ? "half" : "sub"
    const k = rule === "half" ? r.pick([1, 3, 5, 7]) : r.int(3, 9)
    const p = rule === "half" ? 0 : r.int(2, 7)
    const a1 = r.int(1, 40)
    const N = r.int(15, 80)
    const st = traceSeq(rule, p, k, a1, N + 2)
    if (st.mu + st.L > 14) return null
    return { rule, p, k, a1, N }
  },
  build: ({ rule, p, k, a1, N }) => {
    const st = traceSeq(rule, p, k, a1, N)
    const ans = st.seq[N - 1]
    const shown = st.seq.slice(0, st.mu + st.L + 1)
    const tex = rule === "half" ? RULE_TEX.half(k) : RULE_TEX.sub(p, k)
    const r0 = (N - 1 - st.mu) % st.L
    return {
      text: `수열 $\\{a_n\\}$ 은 $a_1 = ${a1}$ 이고, 모든 자연수 $n$ 에 대하여 ${tex}${rule === "half" ? " 이다." : "를 만족시킨다."} $a_{${N}}$ 의 값을 구하시오.`,
      ...short(ans),
      solution: sol(
        `차례로 구하면 ${shown.map((v, i) => `$a_{${i + 1}} = ${v}$`).join(", ")}`,
        `$a_{${st.mu + st.L + 1}} = a_{${st.mu + 1}}$ 이므로 제${st.mu + 1}항부터 $${st.L}$ 개의 값 $${st.seq.slice(st.mu, st.mu + st.L).join(", ")}$ 이 이 순서대로 반복된다.`,
        `$${N} - ${st.mu + 1} = ${N - st.mu - 1}$ 을 $${st.L}$ 로 나눈 나머지는 $${r0}$ 이므로 $a_{${N}} = a_{${st.mu + 1 + r0}} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ rule, p, k, a1, N }) => {
    let x = a1
    for (let n = 1; n < N; n++) x = rule === "half" ? (x % 2 === 0 ? x / 2 : x + k) : x > p ? x - p : x + k
    return x
  },
}
function traceSeq(rule: string, p: number, k: number, a1: number, N: number) {
  const seq = [a1]
  const seen = new Map<number, number>([[a1, 0]])
  let mu = -1
  let L = 0
  while (true) {
    const x = seq[seq.length - 1]
    const y = rule === "half" ? (x % 2 === 0 ? x / 2 : x + k) : x > p ? x - p : x + k
    if (seen.has(y)) {
      mu = seen.get(y)!
      L = seq.length - mu
      seq.push(y)
      break
    }
    seen.set(y, seq.length)
    seq.push(y)
  }
  // N 항까지 늘리기 (주기 이용)
  while (seq.length < N) seq.push(seq[mu + ((seq.length - mu) % L)])
  return { seq, mu, L }
}

/** 수학적 귀납법 증명의 빈칸 */
const induction: SuTemplate<{ fam: "A" | "B"; a: number; c: number; x: number; y: number }> = {
  id: "seq-induction-blank",
  subject: "대수",
  unit: U,
  standard: "12대수03-07",
  level: 3,
  count: 60,
  params: (r) => {
    const fam = r.chance(0.55) ? "A" : "B"
    const a = fam === "A" ? r.int(1, 3) : r.int(1, 2)
    const c = fam === "A" ? r.int(1, 7) : r.int(0, 5)
    if (fam === "B" && c === a) return null
    const x = r.int(1, 5)
    const y = r.int(1, 5)
    const v = indF(fam, a, c, x) + indG(fam, a, c, y)
    if (!isShortOk(v)) return null
    return { fam, a, c, x, y }
  },
  build: ({ fam, a, c, x, y }) => {
    const ans = indF(fam, a, c, x) + indG(fam, a, c, y)
    const wrap = (t: string) => (t.includes(" ") ? `(${t})` : t)
    let stmt: string
    let proof: string[]
    let why: string[]
    if (fam === "A") {
      const tk = `k(${texPoly([a, c], "k")})`
      const L = (v: string) => texPoly([2 * a, a + 3 * c], v)
      stmt = `$${S("n", tk)} = \\frac{n(n + 1)(${L("n")})}{6}$`
      proof = [
        `(i) $n = 1$ 일 때, (좌변) $= ${a + c}$, (우변) $= \\frac{1 \\times 2 \\times ${3 * a + 3 * c}}{6} = ${a + c}$ 이므로 성립한다.`,
        `(ii) $n = m$ 일 때 성립한다고 가정하면`,
        `$${S("m+1", tk)} = \\frac{m(m + 1)(${L("m")})}{6} +$ (가)`,
        `$= \\frac{m + 1}{6} \\times$ (나)`,
        `$= \\frac{(m + 1)(m + 2)(${texPoly([2 * a, 3 * a + 3 * c], "m")})}{6}$`,
        `이므로 $n = m + 1$ 일 때도 성립한다.`,
      ]
      why = [
        `(가)는 제$(m + 1)$항이므로 $f(m) = (m + 1)(${texPoly([a, a + c], "m")})$`,
        `(나)는 $\\frac{m + 1}{6}$ 으로 묶고 남은 식 $m(${L("m")}) + 6(${texPoly([a, a + c], "m")})$ 이므로`,
        `$g(m) = ${texPoly([2 * a, 7 * a + 3 * c, 6 * a + 6 * c], "m")} = (m + 2)(${texPoly([2 * a, 3 * a + 3 * c], "m")})$`,
      ]
    } else {
      const k0 = 2 * a - 2 * c
      const K = (t: string) => (k0 ? `${t} ${signed(k0)}` : t)
      const tk = `${wrap(texPoly([a, c], "k"))} \\times 2^{k}`
      const R = (v: string) => wrap(texPoly([a, c - a], v))
      const rhs1 = c === 0 ? `${k0}` : K(`${4 * c}`)
      stmt = `$${S("n", tk)} = ${K(`${R("n")} \\times 2^{n+1}`)}$`
      proof = [
        `(i) $n = 1$ 일 때, (좌변) $= ${2 * (a + c)}$, (우변) $= ${rhs1 === String(2 * (a + c)) ? rhs1 : `${rhs1} = ${2 * (a + c)}`}$ 이므로 성립한다.`,
        `(ii) $n = m$ 일 때 성립한다고 가정하면`,
        `$${S("m+1", tk)} = ${K(`${R("m")} \\times 2^{m+1}`)} +$ (가)`,
        k0 ? `$= ${k0} + 2^{m+1} \\times$ (나)` : `$= 2^{m+1} \\times$ (나)`,
        `$= ${K(`${wrap(texPoly([a, c], "m"))} \\times 2^{m+2}`)}$`,
        `이므로 $n = m + 1$ 일 때도 성립한다.`,
      ]
      why = [
        `(가)는 제$(m + 1)$항이므로 $f(m) = (${texPoly([a, a + c], "m")}) \\times 2^{m+1}$`,
        `(나)는 $2^{m+1}$ 으로 묶고 남은 식 $${R("m")} + (${texPoly([a, a + c], "m")})$ 이므로 $g(m) = ${texPoly([2 * a, 2 * c], "m")}$`,
      ]
    }
    return {
      text: `다음은 모든 자연수 $n$ 에 대하여\n${stmt}\n이 성립함을 수학적 귀납법으로 증명한 것이다.\n\n${proof.join("\n")}\n\n위의 (가), (나)에 알맞은 식을 각각 $f(m)$, $g(m)$ 이라 할 때, $f(${x}) + g(${y})$ 의 값을 구하시오.`,
      ...short(ans),
      solution: sol(...why, `$f(${x}) = ${indF(fam, a, c, x)}$, $g(${y}) = ${indG(fam, a, c, y)}$ 이므로 구하는 값은 $${ans}$`),
      score: 4,
    }
  },
  // (가)는 이웃한 합의 차, (나)는 합을 직접 계산해 거꾸로 구한다
  verify: ({ fam, a, c, x, y }) => {
    const term0 = (k: number) => (fam === "A" ? k * (a * k + c) : (a * k + c) * 2 ** k)
    const Sm = (m: number) => sumTo(m, term0)
    const f = Sm(x + 1) - Sm(x)
    const g = fam === "A" ? (6 * Sm(y + 1)) / (y + 1) : (Sm(y + 1) - (2 * a - 2 * c)) / 2 ** (y + 1)
    return f + g
  },
}
function indF(fam: string, a: number, c: number, m: number) {
  return fam === "A" ? (m + 1) * (a * m + a + c) : (a * m + a + c) * 2 ** (m + 1)
}
function indG(fam: string, a: number, c: number, m: number) {
  return fam === "A" ? (m + 2) * (2 * a * m + 3 * a + 3 * c) : 2 * a * m + 2 * c
}

/** 양수 등비수열: 곱과 차의 조건 */
const RATIOS = [q(2), q(3), q(4), q(1, 2), q(1, 3), q(3, 2), q(2, 3)]
const geoCond: SuTemplate<{ A: number; ri: number; c: number; s: number; t: number }> = {
  id: "seq-geo-cond",
  subject: "대수",
  unit: U,
  standard: "12대수03-03",
  level: 3,
  count: 60,
  params: (r) => {
    const ri = r.int(0, RATIOS.length - 1)
    const R = RATIOS[ri]
    const A = r.int(1, 40)
    const c = r.int(3, 7)
    const s = r.int(1, c - 1)
    const t = r.int(2, 3)
    const ac1 = R.mul(A)
    const acm = q(A).div(R)
    const at = R.pow(t).mul(A)
    if (!ac1.isInt || !acm.isInt || !at.isInt) return null
    if (A * A > 9999 || !isShortOk(at.n)) return null
    return { A, ri, c, s, t }
  },
  build: ({ A, ri, c, s, t }) => {
    const R = RATIOS[ri]
    const Y = R.mul(A).sub(q(A).div(R)).n
    const ans = R.pow(t).mul(A).n
    return {
      text: `모든 항이 양수인 등비수열 $\\{a_n\\}$ 에 대하여 $a_{${c - s}} a_{${c + s}} = ${A * A}$, $a_{${c + 1}} - a_{${c - 1}} = ${Y}$ 일 때, $a_{${c + t}}$ 의 값을 구하시오.`,
      ...short(ans),
      solution: sol(
        `$${c - s} + ${c + s} = 2 \\times ${c}$ 이므로 $a_{${c - s}} a_{${c + s}} = (a_{${c}})^{2} = ${A * A}$, 모든 항이 양수이므로 $a_{${c}} = ${A}$`,
        `공비를 $r \\ (r > 0)$ 라 하면 $a_{${c + 1}} - a_{${c - 1}} = ${A}r - \\frac{${A}}{r} = ${Y}$`,
        `양변에 $r$ 를 곱해 정리하면 $${texPoly([A, -Y, -A], "r")} = 0$ 이고 $r > 0$ 이므로 $r = ${R.tex()}$`,
        `따라서 $a_{${c + t}} = ${A} \\times \\left(${R.tex()}\\right)^{${t}} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ A, ri, t }) => {
    const R = RATIOS[ri].value
    const Y = A * R - A / R
    const ac = Math.sqrt(A * A)
    const rs = roots((x) => ac * (x - 1 / x) - Y, 0.01, 20, 4000)
    if (rs.length !== 1) return NaN
    return ac * rs[0] ** t
  },
}

/** vS_n = u a_n + w 꼴에서 일반항 */
const RHO = [q(2), q(3), q(4), q(1, 2), q(1, 3), q(3, 2), q(2, 3), q(-1), q(-2)]
const snLinear: SuTemplate<{ ri: number; a1: number; k: number; askS: boolean }> = {
  id: "seq-sn-linear",
  subject: "대수",
  unit: U,
  standard: "12대수03-03",
  level: 3,
  count: 60,
  params: (r) => {
    const ri = r.int(0, RHO.length - 1)
    const rho = RHO[ri]
    const k = r.int(3, 6)
    const a1 = r.pick([1, 2, 3, -1, -2, 4, 5]) * rho.d ** (k - 1)
    const ak = rho.pow(k - 1).mul(a1)
    if (!ak.isInt || Math.abs(ak.n) > 999 || Math.abs(a1) > 400) return null
    return { ri, a1, k, askS: r.chance(0.35) }
  },
  build: ({ ri, a1, k, askS }, r) => {
    const rho = RHO[ri]
    const p = rho.div(rho.sub(1)) // S_n = p a_n + q
    const u = p.n
    const v = p.d
    const w = a1 * (v - u)
    const ak = rho.pow(k - 1).mul(a1)
    let Sk = q(0)
    for (let i = 0; i < k; i++) Sk = Sk.add(rho.pow(i).mul(a1))
    const ans = askS ? Sk : ak
    const eq = `${v === 1 ? "" : v}S_n = ${term(u, "a_n", true)}${w ? ` ${signed(w)}` : ""}`
    return {
      text: `수열 $\\{a_n\\}$ 의 첫째항부터 제$n$항까지의 합 $S_n$ 이 모든 자연수 $n$ 에 대하여 $${eq}$ 를 만족시킬 때, $${askS ? `S_{${k}}` : `a_{${k}}`}$ 의 값${ans.isInt && isShortOk(ans.n) ? "을 구하시오." : "은?"}`,
      ...autoQ(r, ans, [ak.mul(rho), ak.div(rho), ans.neg(), askS ? ak : Sk, q(a1 * rho.n ** (k - 1))]),
      solution: sol(
        `$n = 1$ 을 대입하면 $${v === 1 ? "" : v}a_1 = ${term(u, "a_1", true)}${w ? ` ${signed(w)}` : ""}$ 이므로 $a_1 = ${a1}$`,
        `$n \\ge 2$ 일 때 $${v === 1 ? "" : v}S_{n-1} = ${term(u, "a_{n-1}", true)}${w ? ` ${signed(w)}` : ""}$ 를 빼면 $${v === 1 ? "" : v}a_n = ${term(u, "a_n", true)}${term(-u, "a_{n-1}")}$`,
        `정리하면 $a_n = ${term(rho, "a_{n-1}", true)}$ 이므로 $\\{a_n\\}$ 은 첫째항이 $${a1}$, 공비가 $${rho.tex()}$ 인 등비수열이다.`,
        askS
          ? `$a_{${k}} = ${ak.tex()}$ 이고 $S_{${k}} = ${p.tex()} \\times ${ak.n < 0 ? `\\left(${ak.tex()}\\right)` : ak.tex()} ${signed(q(w, v))} = ${Sk.tex()}$`
          : `따라서 $a_{${k}} = ${a1} \\times \\left(${rho.tex()}\\right)^{${k - 1}} = ${ak.tex()}$`
      ),
      score: 3,
    }
  },
  // 관계식만으로 한 항씩 차례로 계산
  verify: ({ ri, a1, k, askS }) => {
    const rho = RHO[ri]
    const p = rho.div(rho.sub(1))
    const u = p.n
    const v = p.d
    const w = a1 * (v - u)
    let Sprev = 0
    let an = 0
    for (let n = 1; n <= k; n++) {
      an = (v * Sprev - w) / (u - v)
      Sprev += an
    }
    return askS ? Sprev : an
  },
}

// ═════════ 4단계 ═════════

/** 점화식 거꾸로: a_m = v 가 되는 모든 a_1 */
type BRule = "half" | "third" | "col"
const BRULE_TEX: Record<BRule, (k: number) => string> = {
  half: (k) => `$a_n$ 이 짝수이면 $a_{n+1} = \\frac{a_n}{2}$, $a_n$ 이 홀수이면 $a_{n+1} = a_n + ${k}$`,
  third: () => `$a_n$ 이 $3$ 의 배수이면 $a_{n+1} = \\frac{a_n}{3}$, $a_n$ 이 $3$ 의 배수가 아니면 $a_{n+1} = a_n + 1$`,
  col: () => `$a_n$ 이 짝수이면 $a_{n+1} = \\frac{a_n}{2}$, $a_n$ 이 홀수이면 $a_{n+1} = 3a_n + 1$`,
}
const fwd = (rule: BRule, k: number, x: number) => (rule === "half" ? (x % 2 === 0 ? x / 2 : x + k) : rule === "third" ? (x % 3 === 0 ? x / 3 : x + 1) : x % 2 === 0 ? x / 2 : 3 * x + 1)
function preds(rule: BRule, k: number, x: number): number[] {
  const out = rule === "third" ? [3 * x] : [2 * x]
  if (rule === "half" && x - k >= 1 && (x - k) % 2 === 1) out.push(x - k)
  if (rule === "third" && x - 1 >= 1 && (x - 1) % 3 !== 0) out.push(x - 1)
  if (rule === "col" && (x - 1) % 3 === 0 && (x - 1) / 3 >= 1 && ((x - 1) / 3) % 2 === 1) out.push((x - 1) / 3)
  return out
}
function backLayers(rule: BRule, k: number, m: number, v: number) {
  const layers: number[][] = [[v]]
  for (let i = 1; i < m; i++) {
    const nxt = new Set<number>()
    for (const x of layers[layers.length - 1]) for (const y of preds(rule, k, x)) nxt.add(y)
    layers.push([...nxt].sort((a, b) => a - b))
  }
  return layers
}
const recurBack: SuTemplate<{ rule: BRule; k: number; m: number; v: number }> = {
  id: "seq-recur-backward",
  subject: "대수",
  unit: U,
  standard: "12대수03-06",
  level: 4,
  count: 70,
  params: (r) => {
    const rule = r.pick(["half", "half", "third", "col"] as const)
    const k = rule === "half" ? r.pick([1, 3, 5, 7]) : 0
    const m = r.int(4, rule === "third" ? 5 : 7)
    const v = r.int(1, 30)
    const L = backLayers(rule, k, m, v)
    const last = L[L.length - 1]
    const s = last.reduce((a, b) => a + b, 0)
    if (last.length < 2 || s > 999) return null
    return { rule, k, m, v }
  },
  build: ({ rule, k, m, v }) => {
    const L = backLayers(rule, k, m, v)
    const last = L[L.length - 1]
    const ans = last.reduce((a, b) => a + b, 0)
    const how =
      rule === "half"
        ? `$a_{n+1} = x$ 일 때 $a_n$ 이 짝수이면 $a_n = 2x$ (항상 가능), $a_n$ 이 홀수이면 $a_n = x - ${k}$ ($x - ${k}$ 가 양의 홀수일 때만 가능)이다.`
        : rule === "third"
          ? `$a_{n+1} = x$ 일 때 $a_n$ 이 3의 배수이면 $a_n = 3x$ (항상 가능), 3의 배수가 아니면 $a_n = x - 1$ ($x - 1$ 이 3의 배수가 아닌 자연수일 때만 가능)이다.`
          : `$a_{n+1} = x$ 일 때 $a_n$ 이 짝수이면 $a_n = 2x$ (항상 가능), $a_n$ 이 홀수이면 $a_n = \\frac{x - 1}{3}$ (이 값이 홀수인 자연수일 때만 가능)이다.`
    return {
      text: `모든 항이 자연수인 수열 $\\{a_n\\}$ 은 모든 자연수 $n$ 에 대하여 ${BRULE_TEX[rule](k)} 이다. $a_{${m}} = ${v}$ 일 때, 가능한 모든 $a_1$ 의 값의 합을 구하시오.`,
      ...short(ans),
      solution: sol(
        how,
        ...L.slice(1).map((ly, i) => `$a_{${m - i - 1}}$ 의 값: $${ly.join(", ")}$`),
        `따라서 가능한 $a_1$ 의 값의 합은 $${last.join(" + ")} = ${ans}$`
      ),
      score: 4,
    }
  },
  // 가능한 a_1 을 모두 대입해 앞으로 계산
  verify: ({ rule, k, m, v }) => {
    const mult = rule === "third" ? 3 : 2
    const hi = v * mult ** (m - 1) + 10
    let s = 0
    for (let a = 1; a <= hi; a++) {
      let x = a
      for (let n = 1; n < m; n++) x = fwd(rule, k, x)
      if (x === v) s += a
    }
    return s
  },
}

/** 부호에 따라 갈라지는 점화식의 합 */
const recurSum: SuTemplate<{ c: number; d: number; a1: number; N: number }> = {
  id: "seq-recur-sum",
  subject: "대수",
  unit: U,
  standard: "12대수03-06",
  level: 4,
  count: 60,
  params: (r) => {
    const c = r.int(2, 7)
    const d = r.int(2, 7)
    if (c === d) return null
    const a1 = r.int(-8, 25)
    const N = r.int(20, 60)
    const st = sumSeq(c, d, a1, N)
    if (st.mu + st.L > 16 || st.L < 2) return null
    const tot = st.seq.slice(0, N).reduce((x, y) => x + y, 0)
    if (Math.abs(tot) > 999 || tot === 0) return null
    return { c, d, a1, N }
  },
  build: ({ c, d, a1, N }, r) => {
    const st = sumSeq(c, d, a1, N)
    const tot = st.seq.slice(0, N).reduce((x, y) => x + y, 0)
    const pre = st.seq.slice(0, st.mu)
    const cyc = st.seq.slice(st.mu, st.mu + st.L)
    const cs = cyc.reduce((x, y) => x + y, 0)
    const rest = N - st.mu
    const full = Math.floor(rest / st.L)
    const rem = rest % st.L
    const remS = cyc.slice(0, rem).reduce((x, y) => x + y, 0)
    const preS = pre.reduce((x, y) => x + y, 0)
    const tex = `a_{n+1} = \\begin{cases} a_n - ${c} & (a_n > 0) \\\\ a_n + ${d} & (a_n \\le 0) \\end{cases}`
    return {
      text: `수열 $\\{a_n\\}$ 은 $a_1 = ${a1}$ 이고, 모든 자연수 $n$ 에 대하여\n$${tex}$\n를 만족시킨다. $${S(N, "a_k")}$ 의 값${isShortOk(tot) ? "을 구하시오." : "은?"}`,
      ...autoInt(r, tot, [tot + cyc[0], tot - st.seq[N - 1], tot + cs, tot - cs, -tot]),
      solution: sol(
        `차례로 구하면 ${st.seq.slice(0, st.mu + st.L + 1).map((v, i) => `$a_{${i + 1}} = ${v}$`).join(", ")}`,
        `$a_{${st.mu + st.L + 1}} = a_{${st.mu + 1}}$ 이므로 제${st.mu + 1}항부터 $${cyc.join(", ")}$ 가 반복되고, 한 주기의 합은 $${cs}$`,
        pre.length ? `처음 $${st.mu}$ 개 항의 합은 $${preS}$` : null,
        `${pre.length ? `나머지 $${rest}$` : `$${N}$`} 개 항은 한 주기($${st.L}$ 개 항)가 $${full}$ 번 반복되고${rem ? ` 그 뒤에 주기의 앞 $${rem}$ 개 항 (합 $${remS}$)이 더해지므로` : " 끝나므로"}`,
        `구하는 합은 $${pre.length ? `${preS} + ` : ""}${pr(cs)} \\times ${full}${rem ? ` ${signed(remS)}` : ""} = ${tot}$`
      ),
      score: 4,
    }
  },
  verify: ({ c, d, a1, N }) => {
    let x = a1
    let s = 0
    for (let n = 1; n <= N; n++) {
      s += x
      x = x > 0 ? x - c : x + d
    }
    return s
  },
}
function sumSeq(c: number, d: number, a1: number, N: number) {
  const seq = [a1]
  const seen = new Map<number, number>([[a1, 0]])
  let mu = 0
  let L = 0
  while (true) {
    const x = seq[seq.length - 1]
    const y = x > 0 ? x - c : x + d
    if (seen.has(y)) {
      mu = seen.get(y)!
      L = seq.length - mu
      seq.push(y)
      break
    }
    seen.set(y, seq.length)
    seq.push(y)
  }
  while (seq.length < N + 1) seq.push(seq[mu + ((seq.length - mu) % L)])
  return { seq, mu, L }
}

/** S_k = S_m, Σ|a_n| 에서 S_n 의 최댓값 */
const snMax: SuTemplate<{ k: number; m: number; N: number; d: number }> = {
  id: "seq-sn-max-abs",
  subject: "대수",
  unit: U,
  standard: "12대수03-02",
  level: 4,
  count: 60,
  params: (r) => {
    const k = r.int(2, 8)
    const m = r.int(k + 2, k + 9)
    const c = q(k + 1 + m, 2)
    const N = r.int(Math.ceil(c.value) + 2, Math.ceil(c.value) + 10)
    const d = -r.int(1, 6)
    const T = absT(c, N)
    const Y = T.mul(-d)
    const P = posP(c)
    const ans = P.mul(-d)
    if (!Y.isInt || !ans.isInt || !isShortOk(ans.n) || Y.n > 2000) return null
    return { k, m, N, d }
  },
  build: ({ k, m, N, d }) => {
    const c = q(k + 1 + m, 2)
    const T = absT(c, N)
    const Y = T.mul(-d).n
    const P = posP(c)
    const ans = P.mul(-d).n
    const a1 = c.sub(1).mul(-d)
    const F = Math.ceil(c.value) - 1
    return {
      text: `첫째항이 양수인 등차수열 $\\{a_n\\}$ 의 첫째항부터 제$n$항까지의 합을 $S_n$ 이라 하자. $S_{${k}} = S_{${m}}$ 이고 $\\sum_{n=1}^{${N}} |a_n| = ${Y}$ 일 때, $S_n$ 의 최댓값을 구하시오.`,
      ...short(ans),
      solution: sol(
        m - k === 2
          ? `$S_{${m}} - S_{${k}} = a_{${k + 1}} + a_{${m}} = 0$`
          : m - k === 3
            ? `$S_{${m}} - S_{${k}} = a_{${k + 1}} + a_{${k + 2}} + a_{${m}} = 3a_{${k + 2}} = 0$ 이므로 $a_{${k + 2}} = 0$, 즉 $a_{${k + 1}} + a_{${m}} = 2a_{${k + 2}} = 0$`
            : `$S_{${m}} - S_{${k}} = a_{${k + 1}} + a_{${k + 2}} + \\cdots + a_{${m}} = \\frac{${m - k}(a_{${k + 1}} + a_{${m}})}{2} = 0$ 이므로 $a_{${k + 1}} + a_{${m}} = 0$`,
        c.isInt
          ? `$a_{${k + 1}} + a_{${m}} = 2a_{${c.n}} = 0$ 이므로 $a_{${c.n}} = 0$ 이고, 공차를 $d$ 라 하면 $a_n = d(n - ${c.n})$ 이다. $a_1 > 0$ 이므로 $d < 0$`
          : `$a_{${k + 1}} + a_{${m}} = a_{${c.n / 2 - 0.5}} + a_{${c.n / 2 + 0.5}} = 0$ 이므로 공차를 $d$ 라 하면 $a_n = d\\left(n - ${c.tex()}\\right)$ 이다. $a_1 > 0$ 이므로 $d < 0$`,
        `$\\sum_{n=1}^{${N}} |a_n| = |d| \\sum_{n=1}^{${N}} \\left|n - ${c.tex()}\\right| = ${T.tex()}|d| = ${Y}$ 이므로 $d = ${d}$, $a_1 = ${a1.tex()}$`,
        c.isInt
          ? `$a_n > 0$ 인 항은 $n \\le ${F}$ 일 때이고 $a_{${F + 1}} = 0$ 이므로 $S_n$ 은 $n = ${F}$ 또는 $n = ${F + 1}$ 일 때 최대이다.`
          : `$a_n > 0$ 인 항은 $n \\le ${F}$ 일 때이므로 $S_n$ 은 $n = ${F}$ 일 때 최대이다.`,
        `최댓값은 $S_{${F}} = ${-d} \\times \\left\\{${Array.from({ length: F }, (_, i) => c.sub(i + 1).tex()).join(" + ")}\\right\\} = ${ans}$`
      ),
      score: 4,
    }
  },
  // 첫째항·공차를 0.5 단위로 모두 시험한다
  verify: ({ k, m, N, d }) => {
    const c = (k + 1 + m) / 2
    const Y = absT(q(k + 1 + m, 2), N).value * -d
    let best = NaN
    let cnt = 0
    for (let ds = 1; ds <= 14; ds++) {
      const D = -ds / 2
      for (let as = 1; as <= 160; as++) {
        const A = as / 2
        const t = (n: number) => A + (n - 1) * D
        const Sn = (n: number) => (n * (2 * A + (n - 1) * D)) / 2
        if (!closeTo(Sn(k), Sn(m), 1e-12)) continue
        let sa = 0
        for (let n = 1; n <= N; n++) sa += Math.abs(t(n))
        if (!closeTo(sa, Y, 1e-12)) continue
        let mx = -Infinity
        for (let n = 1; n <= 200; n++) mx = Math.max(mx, Sn(n))
        best = mx
        cnt++
      }
    }
    void c
    return cnt === 1 ? best : NaN
  },
}
function absT(c: Q, N: number) {
  let s = q(0)
  for (let n = 1; n <= N; n++) {
    const x = q(n).sub(c)
    s = s.add(x.n < 0 ? x.neg() : x)
  }
  return s
}
function posP(c: Q) {
  let s = q(0)
  for (let n = 1; n < c.value; n++) s = s.add(c.sub(n))
  return s
}

/** b^k ≤ n < b^{k+1} 인 k 를 f(n) 이라 할 때 Σ f(n) = S 인 m */
const floorLog: SuTemplate<{ b: number; m: number }> = {
  id: "seq-floor-log-sum",
  subject: "대수",
  unit: U,
  standard: "12대수03-05",
  level: 4,
  count: 50,
  params: (r) => {
    const b = r.pick([2, 3])
    const m = r.int(b + 2, b === 2 ? 160 : 300)
    const s = flSum(b, m)
    if (!isShortOk(s)) return null
    return { b, m }
  },
  build: ({ b, m }) => {
    const Sv = flSum(b, m)
    let K = 0
    while (b ** (K + 1) <= m) K++
    const groups: string[] = []
    let cum = 0
    for (let k = 1; k < K; k++) {
      const cnt = (b - 1) * b ** k
      cum += k * cnt
      groups.push(`$f(n) = ${k}$ 인 $n$ 은 $${b ** k} \\le n \\le ${b ** (k + 1) - 1}$ 의 $${cnt}$ 개 → 합 $${k * cnt}$`)
    }
    const remCnt = m - b ** K + 1
    return {
      text: `자연수 $n$ 에 대하여 $${b}^{k} \\le n < ${b}^{k+1}$ 을 만족시키는 정수 $k$ 를 $f(n)$ 이라 하자. $\\sum_{n=1}^{m} f(n) = ${Sv}$ 를 만족시키는 자연수 $m$ 의 값을 구하시오.`,
      ...short(m),
      solution: sol(
        `${b === 2 ? "$n = 1$" : `$1 \\le n \\le ${b - 1}$`} 이면 $f(n) = 0$ 이고, $n \\ge ${b}$ 이면 $f(n) \\ge 1$ 이므로 $\\sum_{n=1}^{m} f(n)$ 은 $m \\ge ${b - 1}$ 에서 증가하고 $m$ 은 하나로 정해진다.`,
        ...groups,
        `$n = ${b ** (K + 1) - 1}$ 까지 더하면 $${cum + K * (b - 1) * b ** K}$ 이고, $n = ${b ** K - 1}$ 까지의 합은 $${cum}$ 이므로 $m$ 은 $${b ** K}$ 이상 $${b ** (K + 1) - 1}$ 이하이다.`,
        `$${cum} + ${K}(m - ${b ** K - 1}) = ${Sv}$ 에서 $m - ${b ** K - 1} = ${remCnt}$, 즉 $m = ${m}$`
      ),
      score: 4,
    }
  },
  verify: ({ b, m }) => {
    const target = flSum(b, m)
    let s = 0
    for (let n = 1; n <= 2000; n++) {
      s += Math.floor(Math.log(n) / Math.log(b) + 1e-9)
      if (s === target) return n
      if (s > target) return NaN
    }
    return NaN
  },
}
function flSum(b: number, m: number) {
  let s = 0
  for (let k = 1; b ** k <= m; k++) s += k * (Math.min(m, b ** (k + 1) - 1) - b ** k + 1)
  return s
}

export const SEQS: SuTemplate[] = [
  arithSum,
  geoTerm,
  sigmaCalc,
  sigmaProps,
  means,
  snToAn,
  geoSum,
  telescope,
  sigmaPoly,
  arithCond,
  absArith,
  recurTrace,
  induction,
  geoCond,
  snLinear,
  recurBack,
  recurSum,
  snMax,
  floorLog,
]
