// 확률과 통계 · 경우의 수 (12확통01-01~03): 중복순열, 같은 것이 있는 순열, 중복조합, 이항정리
import { C, fact, intChoice, ints, mc, Pm, short, signed, term, tuples, isShortOk } from "../kit"
import type { SuProblem, SuTemplate } from "../types"
import { countDistinctPerms, polyPowLow, polyMulLow, sol as lines , polish } from "./helpers"

const UNIT = "경우의 수"
const H = (n: number, r: number) => (r < 0 ? 0 : r === 0 ? 1 : C(n + r - 1, r))
const nC = (n: number | string, k: number | string) => `{}_{${n}}\\mathrm{C}_{${k}}`
const nH = (n: number | string, k: number | string) => `{}_{${n}}\\mathrm{H}_{${k}}`
const nPi = (n: number | string, k: number | string) => `{}_{${n}}\\Pi_{${k}}`
const setTex = (xs: (number | string)[]) => `\\{${xs.join(", ")}\\}`
const intW = (ws: number[]) => ws.filter((w) => Number.isInteger(w) && w > 0)
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const DIGIT_WORD: Record<number, string> = { 2: "두", 3: "세", 4: "네", 5: "다섯", 6: "여섯", 7: "일곱", 8: "여덟", 9: "아홉" }

/** 정수 답: 1~999면 단답형, 아니면 객관식 */
function intAnswer(r: Parameters<SuTemplate["build"]>[1], ans: number, wrongs: number[]): Pick<SuProblem, "choices" | "answer" | "value" | "choiceValues"> {
  if (isShortOk(ans)) return short(ans)
  return mc(r, intChoice(ans), ints(...intW(wrongs)))
}

/** 단조증가(같아도 됨) 수열을 직접 나열 (검산용) */
function countMonotone(n: number, m: number, pred: (s: number[]) => boolean, strict = false) {
  let cnt = 0
  const cur: number[] = []
  const rec = (lo: number) => {
    if (cur.length === n) {
      if (pred(cur)) cnt++
      return
    }
    for (let v = lo; v <= m; v++) {
      cur.push(v)
      rec(strict ? v + 1 : v)
      cur.pop()
    }
  }
  rec(1)
  return cnt
}

/** 합이 s 인 길이 k 의 정수 순서쌍 (각 성분 lo 이상) 을 세기 (검산용) */
function countSum(k: number, s: number, ok: (x: number[]) => boolean, lo = 0) {
  let cnt = 0
  const cur: number[] = []
  const rec = (left: number) => {
    if (cur.length === k - 1) {
      if (left >= lo) {
        cur.push(left)
        if (ok(cur)) cnt++
        cur.pop()
      }
      return
    }
    for (let v = lo; v <= left; v++) {
      cur.push(v)
      rec(left - v)
      cur.pop()
    }
  }
  rec(s)
  return cnt
}

/** 격자 최단 경로 DP (검산용): blocked 점, 막힌 가로 간선 */
function gridPaths(a: number, b: number, opts: { mustPass?: [number, number][]; avoid?: [number, number][]; cutEdge?: [number, number] }) {
  // 상태: (x, y, 지나야 할 점을 지난 집합 비트)
  const must = opts.mustPass ?? []
  const full = (1 << must.length) - 1
  const dp = new Map<string, number>()
  const key = (x: number, y: number, m: number) => `${x},${y},${m}`
  const markAt = (x: number, y: number, m: number) => {
    let mm = m
    must.forEach(([px, py], i) => {
      if (px === x && py === y) mm |= 1 << i
    })
    return mm
  }
  dp.set(key(0, 0, markAt(0, 0, 0)), 1)
  for (let s = 0; s < a + b; s++) {
    for (let x = 0; x <= a; x++) {
      const y = s - x
      if (y < 0 || y > b) continue
      for (let m = 0; m <= full; m++) {
        const v = dp.get(key(x, y, m))
        if (!v) continue
        const moves: [number, number][] = [
          [x + 1, y],
          [x, y + 1],
        ]
        for (const [nx, ny] of moves) {
          if (nx > a || ny > b) continue
          if (opts.avoid?.some(([px, py]) => px === nx && py === ny)) continue
          if (opts.cutEdge && opts.cutEdge[0] === x && opts.cutEdge[1] === y && nx === x + 1) continue
          const nm = markAt(nx, ny, m)
          dp.set(key(nx, ny, nm), (dp.get(key(nx, ny, nm)) ?? 0) + v)
        }
      }
    }
  }
  return dp.get(key(a, b, full)) ?? 0
}
const bat = (n: number) => "013678".includes(String(Math.abs(n)).slice(-1))
/** 점 좌표 뒤 조사: (1, 3)을 / (1, 2)를 */
const eul = (p: [number, number]) => (bat(p[1]) ? "을" : "를")
const eun = (p: [number, number]) => (bat(p[1]) ? "은" : "는")
const iga = (n: number) => (bat(n) ? "이" : "가")
const wa = (n: number) => (bat(n) ? "과" : "와")
/** f(a), …, f(b) 나열 */
const fRange = (a: number, b: number) => (a === b ? `f(${a})` : b === a + 1 ? `f(${a}), f(${b})` : `f(${a}), \\cdots, f(${b})`)
const fChain = (n: number, rel: string) => (n <= 3 ? range(1, n).map((i) => `f(${i})`).join(` ${rel} `) : `f(1) ${rel} f(2) ${rel} \\cdots ${rel} f(${n})`)
const pathC = (dx: number, dy: number) => (dx < 0 || dy < 0 ? 0 : C(dx + dy, dx))
const ptT = (p: [number, number]) => `(${p[0]}, ${p[1]})`

// ═════════════════ 1단계 ═════════════════

const repPermBasic: SuTemplate<{ kind: number; n: number; k: number }> = {
  id: "c1-rep-perm",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-01",
  level: 1,
  count: 44,
  params: (r) => {
    const kind = r.int(0, 2)
    const n = kind === 1 ? r.int(2, 9) : r.int(2, 6)
    const k = kind === 1 ? r.int(2, 4) : r.int(2, 5)
    if (n ** k > 8000) return null
    if (kind !== 1 && n === k) return null
    return { kind, n, k }
  },
  build: ({ kind, n, k }, r) => {
    const ans = n ** k
    let text: string
    let first: string
    if (kind === 0) {
      text = `두 집합 $X = ${setTex(range(1, k))}$, $Y = ${setTex(range(1, n))}$ 에 대하여 $X$ 에서 $Y$ 로의 함수의 개수는?`
      first = `$X$ 의 원소 $${k}$ 개 각각에 대하여 $Y$ 의 원소 $${n}$ 개 중 하나를 대응시키면 되므로, 중복을 허락하여 $${n}$ 개에서 $${k}$ 개를 택하는 중복순열의 수와 같다.`
    } else if (kind === 1) {
      text = `$${n}$ 개의 숫자 $${range(1, n).join(", ")}$ 중에서 중복을 허락하여 $${k}$ 개를 택해 일렬로 나열하여 만들 수 있는 ${DIGIT_WORD[k]} 자리 자연수의 개수는?`
      first = `각 자리에 $${n}$ 개의 숫자 중 하나씩 올 수 있고 같은 숫자를 여러 번 써도 되므로 중복순열의 수와 같다.`
    } else {
      text = `서로 다른 $${k}$ 개의 공을 서로 다른 $${n}$ 개의 상자에 남김없이 넣는 경우의 수는? (단, 빈 상자가 있을 수 있다.)`
      first = `공 $${k}$ 개 각각이 들어갈 상자를 $${n}$ 개 중에서 하나씩 고르면 되므로 중복순열의 수와 같다.`
    }
    return {
      text,
      ...mc(r, intChoice(ans), ints(k ** n, Pm(n, Math.min(k, n)), C(n + k - 1, k), n * k, ans - 1)),
      solution: lines(first, `따라서 구하는 경우의 수는 $${nPi(n, k)} = ${n}^{${k}} = ${ans}$`),
      score: 2,
    }
  },
  verify: ({ n, k }) => [...tuples(range(1, n), k)].length,
}

const LETTERS = ["a", "b", "c", "d", "e"]
const samePerm: SuTemplate<{ cnts: number[]; digits: boolean }> = {
  id: "c1-same-perm",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-02",
  level: 1,
  count: 50,
  params: (r) => {
    const m = r.int(2, 4)
    const cnts = Array.from({ length: m }, () => r.int(1, 3))
    const n = cnts.reduce((a, b) => a + b, 0)
    if (n < 4 || n > 8 || Math.max(...cnts) < 2) return null
    return { cnts, digits: r.chance(0.4) }
  },
  build: ({ cnts, digits }, r) => {
    const n = cnts.reduce((a, b) => a + b, 0)
    const syms = digits ? ["1", "2", "3", "4"] : LETTERS
    const list = cnts.flatMap((c, i) => Array(c).fill(syms[i]))
    const den = cnts.reduce((a, c) => a * fact(c), 1)
    const ans = fact(n) / den
    const denTex = cnts.filter((c) => c >= 2).map((c) => `${c}!`).join("\\,")
    const text = digits
      ? `$${list.join(", ")}$ 의 $${n}$ 개의 숫자를 모두 일렬로 나열하여 만들 수 있는 ${DIGIT_WORD[n]} 자리 자연수의 개수는?`
      : `$${list.join(", ")}$ 의 $${n}$ 개의 문자를 모두 일렬로 나열하는 경우의 수는?`
    const big = Math.max(...cnts)
    return {
      text,
      ...mc(r, intChoice(ans), ints(...intW([fact(n), fact(n) / fact(big), ans * 2, ans / 2, ans + n, fact(n - 1) / (den / fact(big)) / fact(big - 1)]))),
      solution: lines(
        `같은 ${digits ? "숫자" : "문자"}가 ${cnts
          .map((c, i) => [c, syms[i]] as const)
          .filter(([c]) => c >= 2)
          .map(([c, s]) => `$${s}$ ${digits ? iga(Number(s)) : "가"} $${c}$ 개`)
          .join(", ")} 있으므로 같은 것이 있는 순열의 수를 이용한다.`,
        `$${n}$ 개를 모두 나열하는 경우의 수 $${n}!$ 을 같은 것끼리 자리를 바꾸는 경우의 수로 나누면`,
        `$\\frac{${n}!}{${denTex}} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ cnts }) => countDistinctPerms(cnts.map((c, i) => LETTERS[i].repeat(c)).join("")),
}

const VARS = ["x", "y", "z", "w", "v"]
const repCombBasic: SuTemplate<{ kind: number; k: number; n: number }> = {
  id: "c1-rep-comb",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 1,
  count: 46,
  params: (r) => {
    const kind = r.int(0, 1)
    const k = r.int(3, 5)
    const n = r.int(3, 12)
    if (H(k, n) > 999) return null
    return { kind, k, n }
  },
  build: ({ kind, k, n }, r) => {
    const ans = H(k, n)
    const vs = VARS.slice(0, k)
    const text =
      kind === 0
        ? `방정식 $${vs.join(" + ")} = ${n}$ 을 만족시키는 음이 아닌 정수 $${vs.join(", ")}$ 의 모든 순서쌍 $(${vs.join(", ")})$ 의 개수를 구하시오.`
        : `같은 종류의 사탕 $${n}$ 개를 $${k}$ 명의 학생에게 남김없이 나누어 주는 경우의 수를 구하시오. (단, 사탕을 하나도 받지 못하는 학생이 있을 수 있다.)`
    return {
      text,
      ...short(ans),
      solution: lines(
        kind === 0
          ? `$${vs.join(", ")}$ 의 값의 합이 $${n}$ 이 되도록 하는 것은 $${k}$ 개의 문자 $${vs.join(", ")}$ 중에서 중복을 허락하여 $${n}$ 개를 택하는 경우와 같다.`
          : `학생 $${k}$ 명 중에서 중복을 허락하여 $${n}$ 명을 택하고, 택한 횟수만큼 사탕을 주면 되므로 중복조합의 수와 같다.`,
        `따라서 구하는 경우의 수는 $${nH(k, n)} = ${nC(k + n - 1, n)}${n !== k - 1 ? ` = ${nC(k + n - 1, k - 1)}` : ""} = ${ans}$`
      ),
      score: 2,
    }
  },
  verify: ({ k, n }) => countSum(k, n, () => true),
}

const binomCoef: SuTemplate<{ a: number; b: number; n: number; k: number }> = {
  id: "c1-binom-coef",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 1,
  count: 62,
  params: (r) => {
    const a = r.pick([1, 1, 2, 3])
    const b = r.pick([-3, -2, -1, 1, 2, 3])
    const n = r.int(4, 7)
    const k = r.int(1, n - 1)
    const v = C(n, k) * a ** k * b ** (n - k)
    if (Math.abs(v) > 3000 || (a === 1 && Math.abs(b) === 1 && n < 5)) return null
    return { a, b, n, k }
  },
  build: ({ a, b, n, k }, r) => {
    const v = C(n, k) * a ** k * b ** (n - k)
    const expr = `(${term(a, "x", true)} ${signed(b)})^{${n}}`
    const swap = C(n, k) * a ** (n - k) * b ** k
    const bt = b < 0 ? `(${b})` : String(b)
    return {
      text: `다항식 $${expr}$ 의 전개식에서 $x^{${k}}$ 의 계수는?`,
      ...mc(r, intChoice(v), ints(-v, swap, C(n, k) * a ** k, C(n, k - 1) * a ** k * b ** (n - k), v + C(n, k), C(n, k) * a * b)),
      solution: lines(
        `$${expr}$ 의 전개식의 일반항은 $${nC(n, "r")} (${a === 1 ? "x" : `${a}x`})^{r} (${b})^{${n} - r}$ 이다.`,
        `$x^{${k}}$ 항은 $r = ${k}$ 일 때이므로 계수는`,
        `$${nC(n, k)} \\times ${a}^{${k}} \\times ${bt}^{${n - k}} = ${C(n, k)} \\times ${a ** k} \\times ${b ** (n - k) < 0 ? `(${b ** (n - k)})` : b ** (n - k)} = ${v}$`
      ),
      score: 2,
    }
  },
  verify: ({ a, b, n, k }) => polyPowLow([b, a], n)[k],
}

const binomSum: SuTemplate<{ kind: number; n: number; a: number }> = {
  id: "c1-binom-sum",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 1,
  count: 32,
  params: (r) => {
    const kind = r.int(0, 3)
    const n = r.int(3, 10)
    const a = kind === 0 || kind === 3 ? r.int(1, 4) : 1
    const v = binomSumValue(kind, n, a)
    if (!isShortOk(v) || (kind === 3 && a === 1)) return null
    return { kind, n, a }
  },
  build: ({ kind, n, a }, r) => {
    const v = binomSumValue(kind, n, a)
    let expr: string
    let sol: string[]
    if (kind === 0) {
      expr = a === 1 ? `${nC(n, 0)} + ${nC(n, 1)} + ${nC(n, 2)} + \\cdots + ${nC(n, n)}` : `\\sum_{k=0}^{${n}} ${nC(n, "k")} \\times ${a}^{k}`
      sol = [
        `이항정리에 의하여 $(1 + x)^{${n}} = \\sum_{k=0}^{${n}} ${nC(n, "k")} x^{k}$ 이다.`,
        `양변에 $x = ${a}$ 를 대입하면 주어진 식은 $(1 + ${a})^{${n}} = ${a + 1}^{${n}}$ 과 같다.`,
        `따라서 구하는 값은 $${v}$`,
      ]
    } else if (kind === 1) {
      expr = `${nC(n, 1)} + ${nC(n, 2)} + \\cdots + ${nC(n, n - 1)}`
      sol = [
        `$${nC(n, 0)} + ${nC(n, 1)} + \\cdots + ${nC(n, n)} = 2^{${n}} = ${2 ** n}$ 이다.`,
        `주어진 식은 여기서 $${nC(n, 0)} = 1$ 과 $${nC(n, n)} = 1$ 을 뺀 것이므로`,
        `$${2 ** n} - 2 = ${v}$`,
      ]
    } else if (kind === 2) {
      const odds = range(0, n).filter((k) => k % 2 === 1)
      expr = odds.map((k) => nC(n, k)).join(" + ")
      sol = [
        `$(1 + x)^{${n}}$ 에 $x = 1$ 을 대입하면 $\\sum_{k=0}^{${n}} ${nC(n, "k")} = 2^{${n}}$, $x = -1$ 을 대입하면 $\\sum_{k=0}^{${n}} (-1)^{k} ${nC(n, "k")} = 0$ 이다.`,
        `두 식을 빼면 $k$ 가 홀수인 항만 두 번씩 남으므로 $2(${odds.map((k) => nC(n, k)).slice(0, 2).join(" + ")} + \\cdots) = 2^{${n}}$`,
        `따라서 구하는 값은 $2^{${n - 1}} = ${v}$`,
      ]
    } else {
      expr = `\\sum_{k=1}^{${n}} ${nC(n, "k")} \\times ${a}^{k}`
      sol = [
        `이항정리에 의하여 $\\sum_{k=0}^{${n}} ${nC(n, "k")} \\times ${a}^{k} = (1 + ${a})^{${n}} = ${(a + 1) ** n}$ 이다.`,
        `주어진 식은 여기서 $k = 0$ 인 항 $${nC(n, 0)} \\times ${a}^{0} = 1$ 을 뺀 것이므로`,
        `$${(a + 1) ** n} - 1 = ${v}$`,
      ]
    }
    return { text: `$${expr}$ 의 값을 구하시오.`, ...short(v), solution: lines(...sol), score: 2 }
  },
  verify: ({ kind, n, a }) => {
    let s = 0
    for (let k = 0; k <= n; k++) {
      if (kind === 0) s += C(n, k) * a ** k
      else if (kind === 1 && k >= 1 && k <= n - 1) s += C(n, k)
      else if (kind === 2 && k % 2 === 1) s += C(n, k)
      else if (kind === 3 && k >= 1) s += C(n, k) * a ** k
    }
    return s
  },
}
function binomSumValue(kind: number, n: number, a: number) {
  if (kind === 0) return (a + 1) ** n
  if (kind === 1) return 2 ** n - 2
  if (kind === 2) return 2 ** (n - 1)
  return (a + 1) ** n - 1
}

// ═════════════════ 2단계 ═════════════════

const digitCond: SuTemplate<{ zero: boolean; m: number; k: number; cond: number }> = {
  id: "c2-digit-cond",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-01",
  level: 2,
  count: 50,
  params: (r) => {
    const zero = r.chance(0.5)
    const m = r.int(3, zero ? 6 : 7)
    const k = r.int(3, 4)
    const cond = r.int(0, 2)
    return { zero, m, k, cond }
  },
  build: ({ zero, m, k, cond }, r) => {
    const digits = zero ? range(0, m) : range(1, m)
    const N = digits.length
    const firstN = zero ? m : N
    const evens = digits.filter((d) => d % 2 === 0).length
    const odds = N - evens
    const special = zero ? 0 : 1
    let ans: number
    let condText: string
    let sol: string[]
    if (cond === 0 || cond === 1) {
      const last = cond === 0 ? evens : odds
      ans = (zero ? m * N ** (k - 2) : N ** (k - 1)) * last
      condText = cond === 0 ? "짝수" : "홀수"
      sol = [
        zero ? `맨 앞자리에는 $0$ 이 올 수 없으므로 $${m}$ 가지, 가운데 $${k - 2}$ 개의 자리에는 $${N}$ 가지씩 올 수 있다.` : `일의 자리를 뺀 $${k - 1}$ 개의 자리에는 $${N}$ 개의 숫자가 각각 올 수 있다.`,
        `${condText}이려면 일의 자리에 ${cond === 0 ? "짝수" : "홀수"}인 숫자 $${last}$ 개 중 하나가 와야 한다.`,
        zero ? `따라서 $${m} \\times ${N}^{${k - 2}} \\times ${last} = ${ans}$` : `따라서 $${N}^{${k - 1}} \\times ${last} = ${ans}$`,
      ]
    } else {
      const total = zero ? m * N ** (k - 1) : N ** k
      const none = zero ? m ** k : (N - 1) ** k
      ans = total - none
      condText = `숫자 $${special}$ 을 적어도 하나 포함하는 수`
      sol = [
        `만들 수 있는 ${DIGIT_WORD[k]} 자리 자연수는 ${zero ? `맨 앞자리에 $0$ 이 올 수 없으므로 $${m} \\times ${N}^{${k - 1}} = ${total}$` : `$${N}^{${k}} = ${total}$`} 개이다.`,
        `그중 숫자 $${special}$ 을 하나도 포함하지 않는 수는 $${special}$ 을 뺀 $${N - 1}$ 개의 숫자로 만든 수이므로 $${N - 1}^{${k}} = ${none}$ 개이다.`,
        `따라서 여사건을 이용하면 $${total} - ${none} = ${ans}$`,
      ]
    }
    const lead = `$${N}$ 개의 숫자 $${digits.join(", ")}$ 중에서 중복을 허락하여 만들 수 있는 ${DIGIT_WORD[k]} 자리 자연수 중 ${condText}의 개수`
    const wr = [N ** k, (zero ? m * N ** (k - 1) : N ** k), ans + N ** (k - 2), ans - N ** (k - 2), (cond < 2 ? N ** (k - 1) * (cond === 0 ? evens : odds) : (N - 1) ** k)]
    const res = intAnswer(r, ans, wr)
    return {
      text: res.choices ? `${lead}는?` : `${lead}를 구하시오.`,
      ...res,
      solution: lines(...sol),
      score: 3,
    }
  },
  verify: ({ zero, m, k, cond }) => {
    const allowed = new Set((zero ? range(0, m) : range(1, m)).map(String))
    const special = zero ? "0" : "1"
    let cnt = 0
    for (let x = 10 ** (k - 1); x < 10 ** k; x++) {
      const s = String(x)
      if (![...s].every((c) => allowed.has(c))) continue
      if (cond === 0 && x % 2 !== 0) continue
      if (cond === 1 && x % 2 !== 1) continue
      if (cond === 2 && !s.includes(special)) continue
      cnt++
    }
    return cnt
  },
}

const gridPath: SuTemplate<{ a: number; b: number; P: [number, number]; Q: [number, number]; kind: number }> = {
  id: "c2-grid-path",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-02",
  level: 2,
  count: 76,
  params: (r) => {
    const a = r.int(3, 7)
    const b = r.int(2, 6)
    const kind = r.int(0, 2)
    const P: [number, number] = [r.int(1, a - 1), r.int(0, b)]
    const Q: [number, number] = [r.int(P[0], a), r.int(P[1], b)]
    if ((P[0] === 0 && P[1] === 0) || (Q[0] === a && Q[1] === b) || (Q[0] === P[0] && Q[1] === P[1])) return null
    if (P[1] === b && kind !== 1) return null
    const total = pathC(a, b)
    if (total > 2000) return null
    return { a, b, P, Q, kind }
  },
  build: ({ a, b, P, Q, kind }, r) => {
    const total = pathC(a, b)
    const toP = pathC(P[0], P[1])
    const fromP = pathC(a - P[0], b - P[1])
    const viaP = toP * fromP
    const PQ = pathC(Q[0] - P[0], Q[1] - P[1])
    const fromQ = pathC(a - Q[0], b - Q[1])
    const lead = `좌표평면 위의 원점 $\\mathrm{O}$ 에서 출발하여 $x$ 축의 양의 방향 또는 $y$ 축의 양의 방향으로 한 번에 $1$ 만큼씩 움직여 점 $\\mathrm{A}${ptT([a, b])}$ 까지 최단 거리로 가는 경로 중`
    let ans: number
    let text: string
    let sol: string[]
    const head = `$x$ 축 방향으로 $1$ 만큼 움직이는 것을 $\\rightarrow$, $y$ 축 방향으로 $1$ 만큼 움직이는 것을 $\\uparrow$ 라 하면 최단 경로의 수는 같은 것이 있는 순열의 수이다.`
    if (kind === 0) {
      ans = viaP
      text = `${lead} 점 $\\mathrm{P}${ptT(P)}$${eul(P)} 지나는 경로의 수`
      sol = [
        head,
        `$\\mathrm{O}$ 에서 $\\mathrm{P}$ 까지: $\\frac{${P[0] + P[1]}!}{${P[0]}!\\,${P[1]}!} = ${toP}$, $\\mathrm{P}$ 에서 $\\mathrm{A}$ 까지: $\\frac{${a - P[0] + b - P[1]}!}{${a - P[0]}!\\,${b - P[1]}!} = ${fromP}$`,
        `곱의 법칙에 의하여 $${toP} \\times ${fromP} = ${ans}$`,
      ]
    } else if (kind === 1) {
      ans = total - viaP
      text = `${lead} 점 $\\mathrm{P}${ptT(P)}$${eul(P)} 지나지 않는 경로의 수`
      sol = [
        head,
        `전체 최단 경로의 수는 $\\frac{${a + b}!}{${a}!\\,${b}!} = ${total}$ 이다.`,
        `$\\mathrm{P}$ 를 지나는 경로의 수는 $${toP} \\times ${fromP} = ${viaP}$ 이다.`,
        `따라서 구하는 경로의 수는 $${total} - ${viaP} = ${ans}$`,
      ]
    } else {
      ans = toP * PQ * fromQ
      text = `${lead} 두 점 $\\mathrm{P}${ptT(P)}$, $\\mathrm{Q}${ptT(Q)}$${eul(Q)} 모두 지나는 경로의 수`
      sol = [
        head,
        `$\\mathrm{O} \\to \\mathrm{P}$: $${toP}$ 가지, $\\mathrm{P} \\to \\mathrm{Q}$: $${PQ}$ 가지, $\\mathrm{Q} \\to \\mathrm{A}$: $${fromQ}$ 가지`,
        `곱의 법칙에 의하여 $${toP} \\times ${PQ} \\times ${fromQ} = ${ans}$`,
      ]
    }
    if (ans <= 0) throw new Error("경로 0")
    const res = intAnswer(r, ans, [total, viaP, total - viaP, toP + fromP, ans + toP, toP * fromQ])
    return { text: res.choices ? `${text}는?` : `${text}를 구하시오.`, ...res, solution: lines(...sol), score: kind === 0 ? 2 : 3 }
  },
  verify: ({ a, b, P, Q, kind }) => {
    if (kind === 0) return gridPaths(a, b, { mustPass: [P] })
    if (kind === 1) return gridPaths(a, b, { avoid: [P] })
    return gridPaths(a, b, { mustPass: [P, Q] })
  },
}

const repCombBounds: SuTemplate<{ k: number; n: number; lows: number[] }> = {
  id: "c2-rep-comb-bounds",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 2,
  count: 60,
  params: (r) => {
    const k = r.int(3, 4)
    const allNat = r.chance(0.4)
    const lows = allNat ? Array(k).fill(1) : Array.from({ length: k }, () => r.int(0, 3))
    const n = r.int(6, 16)
    const rest = n - lows.reduce((a, b) => a + b, 0)
    if (rest < 1 || H(k, rest) > 999 || (!allNat && lows.every((l) => l === lows[0]))) return null
    return { k, n, lows }
  },
  build: ({ k, n, lows }) => {
    const vs = VARS.slice(0, k)
    const L = lows.reduce((a, b) => a + b, 0)
    const rest = n - L
    const ans = H(k, rest)
    const allNat = lows.every((l) => l === 1)
    const condTex = lows.map((l, i) => `${vs[i]} \\ge ${l}`).join(",\\ ")
    const text = allNat
      ? `방정식 $${vs.join(" + ")} = ${n}$ 을 만족시키는 자연수 $${vs.join(", ")}$ 의 모든 순서쌍 $(${vs.join(", ")})$ 의 개수를 구하시오.`
      : `방정식 $${vs.join(" + ")} = ${n}$ 을 만족시키는 정수 $${vs.join(", ")}$ 에 대하여 $${condTex}$ 인 모든 순서쌍 $(${vs.join(", ")})$ 의 개수를 구하시오.`
    const sub = vs.map((v, i) => `${v} = ${v}' ${lows[i] ? `+ ${lows[i]}` : ""}`.trim()).join(",\\ ")
    return {
      text,
      ...short(ans),
      solution: lines(
        `$${sub}$ 으로 놓으면 $${vs.map((v) => `${v}'`).join(", ")}$ 은 음이 아닌 정수이다.`,
        `대입하면 $${vs.map((v) => `${v}'`).join(" + ")} = ${n} - ${L} = ${rest}$`,
        `따라서 구하는 순서쌍의 개수는 $${nH(k, rest)} = ${nC(k + rest - 1, rest)} = ${ans}$`
      ),
      score: 3,
    }
  },
  verify: ({ k, n, lows }) => countSum(k, n, (x) => x.every((v, i) => v >= lows[i])),
}

const binomConst: SuTemplate<{ p: number; s: number; c: number; n: number; t: number }> = {
  id: "c2-binom-const",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 2,
  count: 60,
  params: (r) => {
    const p = r.pick([1, 2, 3])
    const s = r.pick([1, 2])
    if (p === s && p !== 1) return null
    const c = r.pick([-3, -2, -1, 1, 2, 3])
    const n = r.int(3, 9)
    // 가능한 지수들
    const exps = range(0, n).map((k) => p * (n - k) - s * k)
    const t = r.chance(0.6) ? 0 : r.pick(exps)
    const k = exps.indexOf(t)
    if (k < 0) return null
    const v = C(n, k) * c ** k
    if (Math.abs(v) > 3000 || Math.abs(v) < 2) return null
    return { p, s, c, n, t }
  },
  build: ({ p, s, c, n, t }, r) => {
    const k = range(0, n).find((kk) => p * (n - kk) - s * kk === t)!
    const v = C(n, k) * c ** k
    const xp = p === 1 ? "x" : `x^{${p}}`
    const xs = s === 1 ? "x" : `x^{${s}}`
    const expr = `\\left(${xp} ${c < 0 ? "-" : "+"} \\frac{${Math.abs(c)}}{${xs}}\\right)^{${n}}`
    const target = t === 0 ? "상수항은" : `$x^{${t}}$ 의 계수는`
    const ct = c < 0 ? `(${c})` : String(c)
    const ex = `${p === 1 ? `${n} - r` : `${p}(${n} - r)`} - ${s === 1 ? "" : s}r`
    return {
      text: `$${expr}$ 의 전개식에서 ${target}?`,
      ...mc(r, intChoice(v), ints(-v, C(n, k), C(n, k) * Math.abs(c) ** (n - k) * Math.sign(c) ** k, C(n, k + 1) * c ** (k + 1), v * 2)),
      solution: lines(
        `일반항은 $${nC(n, "r")} ${p === 1 ? `x^{${n} - r}` : `(${xp})^{${n} - r}`} \\left(\\frac{${c}}{${xs}}\\right)^{r} = ${nC(n, "r")} \\times ${c === 1 ? "" : `(${c})^{r} \\times `}x^{${ex}}$`,
        `${t === 0 ? "상수항" : `$x^{${t}}$ 항`}이려면 $${ex} = ${t}$ 이어야 하므로 $r = ${k}$`,
        `따라서 구하는 값은 $${nC(n, k)} \\times ${ct}^{${k}} = ${C(n, k)} \\times ${c ** k < 0 ? `(${c ** k})` : c ** k} = ${v}$`
      ),
      score: 3,
    }
  },
  verify: ({ p, s, c, n, t }) => {
    // 지수 → 계수 맵으로 n번 곱하기
    let m = new Map<number, number>([[0, 1]])
    for (let i = 0; i < n; i++) {
      const nm = new Map<number, number>()
      for (const [e, v] of m) {
        nm.set(e + p, (nm.get(e + p) ?? 0) + v)
        nm.set(e - s, (nm.get(e - s) ?? 0) + v * c)
      }
      m = nm
    }
    return m.get(t) ?? 0
  },
}

const funcInc: SuTemplate<{ a: number; b: number; strict: boolean }> = {
  id: "c2-func-inc",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 2,
  count: 34,
  params: (r) => {
    const a = r.int(2, 5)
    const b = r.int(3, 8)
    const strict = r.chance(0.4)
    if (strict && a >= b) return null
    const v = strict ? C(b, a) : H(b, a)
    if (v > 999 || v < 3) return null
    return { a, b, strict }
  },
  build: ({ a, b, strict }) => {
    const ans = strict ? C(b, a) : H(b, a)
    return {
      text: `두 집합 $X = ${setTex(range(1, a))}$, $Y = ${setTex(range(1, b))}$ 에 대하여 다음 조건을 만족시키는 함수 $f : X \\to Y$ 의 개수를 구하시오.\n$X$ 의 임의의 두 원소 $x_1, x_2$ 에 대하여 $x_1 < x_2$ 이면 $f(x_1) ${strict ? "<" : "\\le"} f(x_2)$ 이다.`,
      ...short(ans),
      solution: strict
        ? lines(
            `$${fChain(a, "<")}$ 이므로 $Y$ 에서 서로 다른 $${a}$ 개의 원소를 택하면 작은 것부터 차례로 대응시키는 방법은 한 가지뿐이다.`,
            `택한 원소의 모임이 다르면 함수도 다르므로, 함수의 개수는 $Y$ 의 원소 $${b}$ 개 중 $${a}$ 개를 택하는 조합의 수와 같다.`,
            `따라서 함수의 개수는 $${nC(b, a)} = ${ans}$`
          )
        : lines(
            `$${fChain(a, "\\le")}$ 이므로 $Y$ 에서 중복을 허락하여 $${a}$ 개의 원소를 택하면 작은 것부터 차례로 대응시키는 방법은 한 가지뿐이다.`,
            `택한 원소의 모임이 다르면 함수도 다르므로, 함수의 개수는 $${b}$ 개에서 중복을 허락하여 $${a}$ 개를 택하는 중복조합의 수와 같다.`,
            `따라서 함수의 개수는 $${nH(b, a)} = ${nC(a + b - 1, a)} = ${ans}$`
          ),
      score: 3,
    }
  },
  verify: ({ a, b, strict }) => [...tuples(range(1, b), a)].filter((t) => t.every((v, i) => i === 0 || (strict ? t[i - 1] < v : t[i - 1] <= v))).length,
}

// ═════════════════ 3단계 ═════════════════

const funcFix: SuTemplate<{ n: number; m: number; j: number; k: number; strict: boolean }> = {
  id: "c3-func-fix",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 3,
  count: 45,
  params: (r) => {
    const n = r.int(4, 6)
    const m = r.int(5, 9)
    const strict = r.chance(0.35)
    const j = r.int(2, n - 1)
    const k = r.int(2, m - 1)
    const v = funcFixValue(n, m, j, k, strict)
    if (v < 2 || v > 999) return null
    return { n, m, j, k, strict }
  },
  build: ({ n, m, j, k, strict }) => {
    const ans = funcFixValue(n, m, j, k, strict)
    const rel = strict ? "<" : "\\le"
    const left = strict ? C(k - 1, j - 1) : H(k, j - 1)
    const right = strict ? C(m - k, n - j) : H(m - k + 1, n - j)
    return {
      text: `두 집합 $X = ${setTex(range(1, n))}$, $Y = ${setTex(range(1, m))}$ 에 대하여 다음 조건을 만족시키는 함수 $f : X \\to Y$ 의 개수를 구하시오.\n(가) $X$ 의 임의의 두 원소 $x_1, x_2$ 에 대하여 $x_1 < x_2$ 이면 $f(x_1) ${rel} f(x_2)$ 이다.\n(나) $f(${j}) = ${k}$`,
      ...short(ans),
      solution: lines(
        `(가)에서 $${fChain(n, rel)}$ 이고 (나)에서 $f(${j}) = ${k}$ 이므로 $f(${j})$ 의 앞과 뒤를 나누어 센다.`,
        strict
          ? `$${fRange(1, j - 1)}$ 의 값은 $${k}$ 보다 작은 $${k - 1}$ 개의 수 중 ${j - 1 === 1 ? "하나를 고르면" : `서로 다른 $${j - 1}$ 개를 골라 작은 순으로 정하면`} 되므로 $${nC(k - 1, j - 1)} = ${left}$`
          : `$${fRange(1, j - 1)}$ 의 값은 $1$ 부터 $${k}$ 까지의 $${k}$ 개의 수 중 중복을 허락하여 $${j - 1}$ 개를 고르면 되므로 $${nH(k, j - 1)} = ${left}$`,
        strict
          ? `$${fRange(j + 1, n)}$ 의 값은 $${k}$ 보다 큰 $${m - k}$ 개의 수 중 서로 다른 $${n - j}$ 개를 고르면 되므로 $${nC(m - k, n - j)} = ${right}$`
          : `$${fRange(j + 1, n)}$ 의 값은 $${k}$ 부터 $${m}$ 까지의 $${m - k + 1}$ 개의 수 중 중복을 허락하여 $${n - j}$ 개를 고르면 되므로 $${nH(m - k + 1, n - j)} = ${right}$`,
        `곱의 법칙에 의하여 구하는 함수의 개수는 $${left} \\times ${right} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ n, m, j, k, strict }) => countMonotone(n, m, (s) => s[j - 1] === k, strict),
}
function funcFixValue(n: number, m: number, j: number, k: number, strict: boolean) {
  return strict ? C(k - 1, j - 1) * C(m - k, n - j) : H(k, j - 1) * H(m - k + 1, n - j)
}

const repCombCond: SuTemplate<{ kind: number; n: number; k: number }> = {
  id: "c3-rep-comb-cond",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 3,
  count: 64,
  params: (r) => {
    const kind = r.int(0, 2)
    const k = kind === 2 ? 3 : kind === 0 ? r.int(2, 4) : r.int(3, 5)
    const n = r.int(5, 24)
    const v = repCondValue(kind, n, k)
    if (!isShortOk(v) || v < 4) return null
    if (kind === 1 && (n - k) % 2 !== 0) return null
    return { kind, n, k }
  },
  build: ({ kind, n, k }) => {
    const ans = repCondValue(kind, n, k)
    const vs = VARS.slice(0, k)
    let text: string
    let sol: string[]
    if (kind === 0) {
      text = `부등식 $${vs.join(" + ")} \\le ${n}$ 을 만족시키는 음이 아닌 정수 $${vs.join(", ")}$ 의 모든 순서쌍 $(${vs.join(", ")})$ 의 개수를 구하시오.`
      sol = [
        `음이 아닌 정수 $t$ 를 새로 도입하여 $${vs.join(" + ")} + t = ${n}$ 으로 바꾸면, 부등식의 해와 이 방정식의 음이 아닌 정수해가 일대일로 대응한다.`,
        `$t = ${n} - (${vs.join(" + ")})$ 은 부등식을 만족시킬 때 항상 $0$ 이상이기 때문이다.`,
        `따라서 구하는 개수는 $${nH(k + 1, n)} = ${nC(k + n, n)} = ${ans}$`,
      ]
    } else if (kind === 1) {
      const rest = (n - k) / 2
      text = `방정식 $${vs.join(" + ")} = ${n}$ 을 만족시키는 홀수인 자연수 $${vs.join(", ")}$ 의 모든 순서쌍 $(${vs.join(", ")})$ 의 개수를 구하시오.`
      sol = [
        `$${vs.map((v) => `${v} = 2${v}' + 1`).join(",\\ ")}$ ($${vs.map((v) => `${v}'`).join(", ")}$ 은 음이 아닌 정수)로 놓는다.`,
        `대입하면 $2(${vs.map((v) => `${v}'`).join(" + ")}) + ${k} = ${n}$, 즉 $${vs.map((v) => `${v}'`).join(" + ")} = ${rest}$`,
        `따라서 구하는 개수는 $${nH(k, rest)} = ${nC(k + rest - 1, rest)} = ${ans}$`,
      ]
    } else {
      const [x, y] = ["x", "y"]
      const extra = k === 3 ? " + z" : ""
      text = `방정식 $${x}${k === 3 ? " + y" : ""} + 2${k === 3 ? "z" : y} = ${n}$ 을 만족시키는 음이 아닌 정수 $${k === 3 ? "x, y, z" : "x, y"}$ 의 모든 순서쌍 $(${k === 3 ? "x, y, z" : "x, y"})$ 의 개수를 구하시오.`
      void extra
      const zv = k === 3 ? "z" : "y"
      const terms = range(0, Math.floor(n / 2)).map((z) => (k === 3 ? n - 2 * z + 1 : 1))
      sol =
        k === 3
          ? [
              `$z$ 의 값에 따라 나누어 센다. $z = t$ ($0 \\le t \\le ${Math.floor(n / 2)}$) 이면 $x + y = ${n} - 2t$ 이고, 이 방정식의 음이 아닌 정수해는 $${n} - 2t + 1$ 개이다.`,
              `$t = ${range(0, Math.floor(n / 2)).join(", ")}$ 일 때 해의 개수는 각각 ${terms.map((x) => `$${x}$`).join(", ")} 이다.`,
              `따라서 구하는 개수는 $${terms.join(" + ")}$`,
              `$= ${ans}$`,
            ]
          : [
              `$${zv}$ 의 값을 정하면 $x = ${n} - 2${zv}$ 가 하나로 정해지므로, $${n} - 2${zv} \\ge 0$ 인 $${zv}$ 의 개수를 센다.`,
              `$0 \\le ${zv} \\le ${Math.floor(n / 2)}$ 이므로 $${zv}$ 는 $${Math.floor(n / 2) + 1}$ 가지`,
              `따라서 구하는 개수는 $${ans}$`,
            ]
    }
    return { text, ...short(ans), solution: lines(...sol), score: 3 }
  },
  verify: ({ kind, n, k }) => {
    if (kind === 0) {
      let s = 0
      for (let t = 0; t <= n; t++) s += countSum(k, t, () => true)
      return s
    }
    if (kind === 1) return countSum(k, n, (x) => x.every((v) => v % 2 === 1), 1)
    let s = 0
    for (const t of tuples(range(0, n), k)) {
      const sum = t.slice(0, -1).reduce((a, b) => a + b, 0) + 2 * t[t.length - 1]
      if (sum === n) s++
    }
    return s
  },
}
function repCondValue(kind: number, n: number, k: number) {
  if (kind === 0) return C(n + k, k)
  if (kind === 1) return (n - k) % 2 === 0 && n >= k ? H(k, (n - k) / 2) : 0
  if (k === 3) {
    let s = 0
    for (let z = 0; 2 * z <= n; z++) s += n - 2 * z + 1
    return s
  }
  return Math.floor(n / 2) + 1 + 0 // k=2: x + 2y = n
}

const binomProduct: SuTemplate<{ e: number; a: number; b: number; n: number; t: number; inverse: boolean }> = {
  id: "c3-binom-product",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 3,
  count: 60,
  params: (r) => {
    const e = r.int(1, 2)
    const a = r.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5])
    const b = r.pick([-2, -1, 1, 2])
    const n = r.int(4, 7)
    const t = r.int(e, n)
    const inverse = r.chance(0.45)
    const v = bpCoef(e, a, b, n, t)
    if (Math.abs(v) > 1500 || v === 0) return null
    if (inverse && C(n, t) * b ** (n - t) === 0) return null
    if (inverse && t > n) return null
    return { e, a, b, n, t, inverse }
  },
  build: ({ e, a, b, n, t, inverse }, r) => {
    const v = bpCoef(e, a, b, n, t)
    const xe = e === 1 ? "x" : "x^{2}"
    const A = C(n, t - e) * b ** (n - t + e)
    const B = C(n, t) * b ** (n - t)
    const bt = (x: number) => (x < 0 ? `(${x})` : String(x))
    const base = `(x ${signed(b)})^{${n}}`
    const s1 = `$${base}$ 의 전개식의 일반항은 $${nC(n, "r")} x^{r} \\times ${bt(b)}^{${n} - r}$ 이다.`
    const lowT = t - e === 0 ? "상수항" : `$x^{${t - e}}$ 항`
    const lowC = t - e === 0 ? "상수항" : `$x^{${t - e}}$ 의 계수`
    const s2 = `$x^{${t}}$ 항은 $${xe}$ 와 $${base}$ 의 ${lowT}의 곱, 상수 $a$ 와 $x^{${t}}$ 항의 곱에서 나온다.`
    if (!inverse) {
      const s2b = `$x^{${t}}$ 항은 $${xe}$ 와 $${base}$ 의 ${lowT}의 곱, $${a}$ ${wa(a)} $x^{${t}}$ 항의 곱에서 나온다.`
      return {
        text: `다항식 $(${xe} ${signed(a)})${base}$ 의 전개식에서 $x^{${t}}$ 의 계수는?`,
        ...mc(r, intChoice(v), ints(A, a * B, A - a * B, -v, A + B, v + C(n, t))),
        solution: lines(
          s1,
          s2b,
          `${lowC}: $${nC(n, t - e)} \\times ${bt(b)}^{${n - t + e}} = ${A}$, $x^{${t}}$ 의 계수: $${nC(n, t)} \\times ${bt(b)}^{${n - t}} = ${B}$`,
          `따라서 구하는 계수는 $${A} + ${bt(a)} \\times ${bt(B)} = ${v}$`
        ),
        score: 3,
      }
    }
    return {
      text: `다항식 $(${xe} + a)${base}$ 의 전개식에서 $x^{${t}}$ 의 계수가 $${v}$ 일 때, 상수 $a$ 의 값은?`,
      ...mc(r, intChoice(a), ints(-a, a + 1, a - 1, a + 2, a - 2, 2 * a)),
      solution: lines(
        s1,
        s2,
        `${lowC}: $${A}$, $x^{${t}}$ 의 계수: $${nC(n, t)} \\times ${bt(b)}^{${n - t}} = ${B}$`,
        `따라서 $${A} ${B < 0 ? "-" : "+"} ${Math.abs(B)}a = ${v}$ 이므로 $a = ${a}$`
      ),
      score: 3,
    }
  },
  verify: ({ e, a, b, n, t, inverse }) => {
    const pw = polyPowLow([b, 1], n)
    const f = (aa: number) => polyMulLow(e === 1 ? [aa, 1] : [aa, 0, 1], pw)[t] ?? 0
    if (!inverse) return f(a)
    const target = f(a)
    const sols = range(-30, 30).filter((aa) => f(aa) === target)
    return sols.length === 1 ? sols[0] : NaN
  },
}
function bpCoef(e: number, a: number, b: number, n: number, t: number) {
  return C(n, t - e) * (t - e >= 0 ? b ** (n - t + e) : 0) + a * C(n, t) * b ** (n - t)
}

const samePermCond: SuTemplate<{ cnts: number[]; kind: number }> = {
  id: "c3-same-perm-cond",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-02",
  level: 3,
  count: 48,
  params: (r) => {
    const m = r.int(3, 4)
    const cnts = Array.from({ length: m }, (_, i) => (i === 0 ? r.int(2, 3) : r.int(1, 3)))
    const n = cnts.reduce((a, b) => a + b, 0)
    if (n < 6 || n > 9) return null
    const kind = r.int(0, 2)
    if (kind === 1 && cnts[1] < 2) return null
    const v = samePermCondValue(cnts, kind)
    if (v < 2) return null
    return { cnts, kind }
  },
  build: ({ cnts, kind }, r) => {
    const n = cnts.reduce((a, b) => a + b, 0)
    const list = cnts.flatMap((c, i) => Array(c).fill(LETTERS[i]))
    const ans = samePermCondValue(cnts, kind)
    const facts = (cs: number[]) => cs.filter((c) => c >= 2).map((c) => `${c}!`).join("\\,") || "1"
    const lead = `$${list.join(", ")}$ 의 $${n}$ 개의 문자를 모두 일렬로 나열할 때,`
    let text: string
    let sol: string[]
    if (kind === 0) {
      const rest = [cnts[0] - 2, ...cnts.slice(1)]
      text = `${lead} 양 끝에 모두 $a$ 가 오도록 나열하는 경우의 수`
      sol = [`양 끝에 $a$ 를 하나씩 놓으면 가운데의 $${n - 2}$ 개의 자리에 남은 문자 ${rest.map((c, i) => (c ? `$${LETTERS[i]}$ 가 $${c}$ 개` : "")).filter(Boolean).join(", ")}를 나열하면 된다.`, `이 $${n - 2}$ 개를 일렬로 나열하는 같은 것이 있는 순열의 수는`, `$\\frac{${n - 2}!}{${facts(rest)}} = ${ans}$`]
    } else if (kind === 1) {
      const cb = cnts[1]
      const rest = [cnts[0], 1, ...cnts.slice(2)]
      text = `${lead} $b$ 끼리는 모두 이웃하도록 나열하는 경우의 수`
      sol = [`$${cb}$ 개의 $b$ 를 한 묶음으로 생각한다. (묶음 안의 $b$ 는 모두 같으므로 묶음 안에서 바꾸는 경우는 $1$ 가지이다.)`, `묶음 하나와 나머지 $${n - cb}$ 개의 문자, 즉 $${n - cb + 1}$ 개를 일렬로 나열하는 경우의 수는`, `$\\frac{${n - cb + 1}!}{${facts(rest)}} = ${ans}$`]
    } else {
      const ca = cnts[0]
      const others = cnts.slice(1)
      const no = others.reduce((a, b) => a + b, 0)
      const arr = fact(no) / others.reduce((a, c) => a * fact(c), 1)
      text = `${lead} $a$ 끼리는 서로 이웃하지 않도록 나열하는 경우의 수`
      sol = [
        `먼저 $a$ 를 뺀 $${no}$ 개의 문자를 나열하는 경우의 수는 $\\frac{${no}!}{${facts(others)}} = ${arr}$`,
        `나열한 문자들의 사이사이와 양 끝, 모두 $${no + 1}$ 개의 자리 중 $${ca}$ 개를 골라 $a$ 를 하나씩 넣으면 $a$ 끼리 이웃하지 않는다. 이 경우의 수는 $${nC(no + 1, ca)} = ${C(no + 1, ca)}$`,
        `따라서 구하는 경우의 수는 $${arr} \\times ${C(no + 1, ca)} = ${ans}$`,
      ]
    }
    const total = fact(n) / cnts.reduce((a, c) => a * fact(c), 1)
    const res = intAnswer(r, ans, [total, total - ans, ans * 2, ans + n, Math.round(ans / 2)])
    return { text: res.choices ? `${text}는?` : `${text}를 구하시오.`, ...res, solution: lines(...sol), score: 3 }
  },
  verify: ({ cnts, kind }) => {
    const s = cnts.map((c, i) => LETTERS[i].repeat(c)).join("")
    const cb = cnts[1]
    if (kind === 0) return countDistinctPerms(s, (w) => w[0] === "a" && w[w.length - 1] === "a")
    if (kind === 1) return countDistinctPerms(s, (w) => w.includes("b".repeat(cb)))
    return countDistinctPerms(s, (w) => !w.includes("aa"))
  },
}
function samePermCondValue(cnts: number[], kind: number) {
  const n = cnts.reduce((a, b) => a + b, 0)
  const den = (cs: number[]) => cs.reduce((a, c) => a * fact(c), 1)
  if (kind === 0) return fact(n - 2) / den([cnts[0] - 2, ...cnts.slice(1)])
  if (kind === 1) return fact(n - cnts[1] + 1) / den([cnts[0], ...cnts.slice(2)])
  const others = cnts.slice(1)
  const no = others.reduce((a, b) => a + b, 0)
  return (fact(no) / den(others)) * C(no + 1, cnts[0])
}

// ═════════════════ 4단계 ═════════════════

const funcRange: SuTemplate<{ n: number; m: number; k: number; d: number; kind: number }> = {
  id: "c4-func-range",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 4,
  count: 58,
  params: (r) => {
    const n = r.int(4, 6)
    const m = r.int(5, 9)
    const k = r.int(2, Math.min(n, 4))
    const kind = r.int(0, 1)
    const d = kind === 0 ? r.int(k - 1, m - 1) : r.int(4, 2 * m - 2) // kind 1: d = f(1) + f(n)
    const v = funcRangeValue(n, m, k, d, kind)
    if (v < 2 || v > 999) return null
    return { n, m, k, d, kind }
  },
  build: ({ n, m, k, d, kind }) => {
    const ans = funcRangeValue(n, m, k, d, kind)
    const blocks = C(n - 1, k - 1)
    const cond3 = kind === 0 ? `$f(${n}) - f(1) = ${d}$` : `$f(1) + f(${n}) = ${d}$`
    const common = [
      `(가)에서 $f(1) \\le f(2) \\le \\cdots \\le f(${n})$ 이므로 치역의 최솟값은 $f(1)$, 최댓값은 $f(${n})$ 이다.`,
      `치역의 원소를 $${k === 2 ? "y_1 < y_2" : k === 3 ? "y_1 < y_2 < y_3" : `y_1 < y_2 < \\cdots < y_{${k}}`}$ 라 하면, $f(1), \\cdots, f(${n})$ 을 작은 값부터 차례로 채우되 $${k}$ 개의 값이 모두 한 번 이상 나와야 하므로, $${n}$ 개를 순서대로 $${k}$ 개의 비어 있지 않은 묶음으로 나누는 방법의 수 $${nC(n - 1, k - 1)} = ${blocks}$ 가지가 있다.`,
    ]
    let sol: string[]
    if (kind === 0) {
      const ends = m - d
      const mid = C(d - 1, k - 2)
      sol = [
        ...common,
        `(다)에서 $f(${n}) = f(1) + ${d}$ 이므로 $f(1)$ 은 $1$ 부터 $${m - d}$ 까지 $${ends}$ 가지이다.`,
        k === 2 ? `이때 치역은 $\\{f(1), f(1) + ${d}\\}$ 이다.` : `양 끝값 사이에 있는 $${d - 1}$ 개의 수 중 나머지 $${k - 2}$ 개의 치역 원소를 고르는 경우는 $${nC(d - 1, k - 2)} = ${mid}$ 가지이다.`,
        `따라서 구하는 함수의 개수는 $${ends} \\times ${mid} \\times ${blocks} = ${ans}$`,
      ]
    } else {
      const cases = range(1, m).filter((a) => d - a > a && d - a <= m && C(d - 2 * a - 1, k - 2) > 0)
      const terms = cases.map((a) => C(d - 2 * a - 1, k - 2))
      sol = [
        ...common,
        `$f(1) = s$ 라 하면 $f(${n}) = ${d} - s$ 이고, 치역의 원소가 $${k}$ 개이므로 $s < ${d} - s \\le ${m}$ 이어야 한다.`,
        k === 2 ? `이때 치역은 $\\{s, ${d} - s\\}$ 이다.` : `이때 $s$ 와 $${d} - s$ 사이의 $${d} - 2s - 1$ 개의 수 중 $${k - 2}$ 개를 고르는 경우의 수는 $${nC(`${d} - 2s - 1`, k - 2)}$ 이다.`,
        k === 2 ? `가능한 $s$ 의 값은 ${cases.map((a) => `$${a}$`).join(", ")} 의 $${cases.length}$ 가지이다.` : `가능한 $s$ 는 ${cases.map((a) => `$${a}$`).join(", ")} 이고, 각각 ${terms.map((t) => `$${t}$`).join(", ")} 가지이므로 합은 $${terms.reduce((a, b) => a + b, 0)}$`,
        `따라서 구하는 함수의 개수는 $${terms.reduce((a, b) => a + b, 0)} \\times ${blocks} = ${ans}$`,
      ]
    }
    return {
      text: `두 집합 $X = ${setTex(range(1, n))}$, $Y = ${setTex(range(1, m))}$ 에 대하여 다음 조건을 만족시키는 함수 $f : X \\to Y$ 의 개수를 구하시오.\n(가) $X$ 의 임의의 두 원소 $x_1, x_2$ 에 대하여 $x_1 < x_2$ 이면 $f(x_1) \\le f(x_2)$ 이다.\n(나) 함수 $f$ 의 치역의 원소의 개수는 $${k}$ 이다.\n(다) ${cond3}`,
      ...short(ans),
      solution: lines(...sol),
      score: 4,
    }
  },
  verify: ({ n, m, k, d, kind }) =>
    countMonotone(n, m, (s) => new Set(s).size === k && (kind === 0 ? s[n - 1] - s[0] === d : s[n - 1] + s[0] === d)),
}
function funcRangeValue(n: number, m: number, k: number, d: number, kind: number) {
  if (kind === 0) return d > m - 1 ? 0 : (m - d) * C(d - 1, k - 2) * C(n - 1, k - 1)
  let s = 0
  for (let a = 1; a <= m; a++) {
    const b = d - a
    if (b > a && b <= m) s += C(b - a - 1, k - 2)
  }
  return s * C(n - 1, k - 1)
}

const oddCount: SuTemplate<{ k: number; N: number; j: number; kind: number }> = {
  id: "c4-odd-count",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 4,
  count: 56,
  params: (r) => {
    const k = r.int(3, 4)
    const N = r.int(8, 20)
    const kind = r.int(0, 1)
    const j = kind === 0 ? r.int(1, k - 1) : k
    const v = oddCountValue(k, N, j, kind)
    if (!isShortOk(v) || v < 3) return null
    return { k, N, j, kind }
  },
  build: ({ k, N, j, kind }) => {
    const vs = ["a", "b", "c", "d"].slice(0, k)
    const ans = oddCountValue(k, N, j, kind)
    let text: string
    let sol: string[]
    const tup = `(${vs.join(", ")})`
    if (kind === 0) {
      const rest = (N - j - 2 * (k - j)) / 2
      text = `다음 조건을 만족시키는 자연수 $${vs.join(", ")}$ 의 모든 순서쌍 $${tup}$ 의 개수를 구하시오.\n(가) $${vs.join(" + ")} = ${N}$\n(나) $${vs.join(", ")}$ 중에서 홀수는 정확히 $${j}$ 개이다.`
      sol = [
        `홀수가 될 $${j}$ 개의 수를 고르는 경우의 수는 $${nC(k, j)} = ${C(k, j)}$ 이다.`,
        `홀수인 수는 $2x + 1$, 짝수인 수는 $2y + 2$ ($x, y$ 는 음이 아닌 정수) 꼴로 놓으면, 새로 놓은 $${k}$ 개의 음이 아닌 정수의 합을 $S$ 라 할 때 $2S + ${j} + ${2 * (k - j)} = ${N}$`,
        `따라서 $S = ${rest}$ 이고, 그 경우의 수는 $${nH(k, rest)} = ${H(k, rest)}$`,
        `따라서 구하는 개수는 $${C(k, j)} \\times ${H(k, rest)} = ${ans}$`,
      ]
    } else {
      const total = C(N - 1, k - 1)
      const allOdd = (N - k) % 2 === 0 ? H(k, (N - k) / 2) : 0
      text = `다음 조건을 만족시키는 자연수 $${vs.join(", ")}$ 의 모든 순서쌍 $${tup}$ 의 개수를 구하시오.\n(가) $${vs.join(" + ")} = ${N}$\n(나) $${vs.join(" \\times ")}$ 는 짝수이다.`
      sol = [
        `(가)를 만족시키는 자연수의 순서쌍의 개수는 $${nH(k, N - k)} = ${nC(N - 1, k - 1)} = ${total}$ 이다.`,
        `여사건은 곱이 홀수, 즉 $${vs.join(", ")}$ 가 모두 홀수인 경우이다.`,
        (N - k) % 2 === 0
          ? `$${vs.map((v) => `${v} = 2${v}' + 1`).join(",\\ ")}$ 로 놓으면 $${vs.map((v) => `${v}'`).join(" + ")} = ${(N - k) / 2}$ 이므로 $${nH(k, (N - k) / 2)} = ${allOdd}$ 가지`
          : `홀수 $${k}$ 개의 합은 ${k % 2 ? "홀수" : "짝수"}인데 $${N}$ 은 ${N % 2 ? "홀수" : "짝수"}이므로 모두 홀수인 경우는 없다.`,
        `따라서 구하는 개수는 $${total} - ${allOdd} = ${ans}$`,
      ]
    }
    return { text, ...short(ans), solution: lines(...sol), score: 4 }
  },
  verify: ({ k, N, j, kind }) =>
    countSum(
      k,
      N,
      (x) => {
        const odd = x.filter((v) => v % 2 === 1).length
        return kind === 0 ? odd === j : x.reduce((a, b) => a * b, 1) % 2 === 0
      },
      1
    ),
}
function oddCountValue(k: number, N: number, j: number, kind: number) {
  if (kind === 0) {
    const rem = N - j - 2 * (k - j)
    if (rem < 0 || rem % 2) return 0
    return C(k, j) * H(k, rem / 2)
  }
  const allOdd = (N - k) % 2 === 0 ? H(k, (N - k) / 2) : 0
  return C(N - 1, k - 1) - allOdd
}

const pathAvoid: SuTemplate<{ a: number; b: number; P: [number, number]; Q: [number, number]; kind: number }> = {
  id: "c4-path-avoid",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-02",
  level: 4,
  count: 53,
  params: (r) => {
    const a = r.int(4, 7)
    const b = r.int(3, 6)
    const kind = r.int(0, 2)
    const P: [number, number] = [r.int(1, a - 1), r.int(1, b - 1)]
    const Q: [number, number] = [r.int(1, a - 1), r.int(1, b - 1)]
    if (P[0] === Q[0] && P[1] === Q[1]) return null
    if (kind === 2 && (Q[0] >= a || Q[1] > b)) return null
    if (kind === 1 && !((P[0] <= Q[0] && P[1] <= Q[1]) || (Q[0] <= P[0] && Q[1] <= P[1]))) return null
    if (pathC(a, b) > 1500) return null
    const v = pathAvoidValue(a, b, P, Q, kind)
    if (v < 2) return null
    return { a, b, P, Q, kind }
  },
  build: ({ a, b, P, Q, kind }) => {
    const ans = pathAvoidValue(a, b, P, Q, kind)
    const total = pathC(a, b)
    const vP = pathC(P[0], P[1]) * pathC(a - P[0], b - P[1])
    const vQ = pathC(Q[0], Q[1]) * pathC(a - Q[0], b - Q[1])
    const [L, R] = P[0] <= Q[0] && P[1] <= Q[1] ? [P, Q] : [Q, P]
    const ordered = L[0] <= R[0] && L[1] <= R[1]
    const vPQ = ordered ? pathC(L[0], L[1]) * pathC(R[0] - L[0], R[1] - L[1]) * pathC(a - R[0], b - R[1]) : 0
    const lead = `좌표평면 위의 원점 $\\mathrm{O}$ 에서 출발하여 $x$ 축의 양의 방향 또는 $y$ 축의 양의 방향으로 한 번에 $1$ 만큼씩 움직여 점 $(${a}, ${b})$ 까지 최단 거리로 가는 경로 중`
    let text: string
    let sol: string[]
    const pqLine = ordered
      ? `두 점을 모두 지나는 경로는 $\\mathrm{O} \\to ${ptT(L)} \\to ${ptT(R)} \\to (${a}, ${b})$ 순서로 가야 하므로 $${pathC(L[0], L[1])} \\times ${pathC(R[0] - L[0], R[1] - L[1])} \\times ${pathC(a - R[0], b - R[1])} = ${vPQ}$`
      : `두 점 중 한 점이 다른 점의 오른쪽 아래에 있으므로 두 점을 모두 지나는 최단 경로는 없다.`
    if (kind === 0) {
      text = `${lead} 점 $\\mathrm{P}${ptT(P)}$ 도 지나지 않고 점 $\\mathrm{Q}${ptT(Q)}$ 도 지나지 않는 경로의 수를 구하시오.`
      sol = [
        `전체 경로의 수는 $\\frac{${a + b}!}{${a}!\\,${b}!} = ${total}$ 이다.`,
        `$\\mathrm{P}$ 를 지나는 경로: $${pathC(P[0], P[1])} \\times ${pathC(a - P[0], b - P[1])} = ${vP}$, $\\mathrm{Q}$ 를 지나는 경로: $${pathC(Q[0], Q[1])} \\times ${pathC(a - Q[0], b - Q[1])} = ${vQ}$`,
        pqLine,
        `포함배제의 원리에 의하여 $${total} - (${vP} + ${vQ} - ${vPQ}) = ${ans}$`,
      ]
    } else if (kind === 1) {
      text = `${lead} 점 $\\mathrm{P}${ptT(P)}$${eun(P)} 지나고 점 $\\mathrm{Q}${ptT(Q)}$${eun(Q)} 지나지 않는 경로의 수를 구하시오.`
      sol = [
        `$\\mathrm{P}$ 를 지나는 경로의 수는 $${pathC(P[0], P[1])} \\times ${pathC(a - P[0], b - P[1])} = ${vP}$ 이다.`,
        `그중 $\\mathrm{Q}$ 도 지나는 경로를 빼야 한다.`,
        pqLine,
        `따라서 구하는 경로의 수는 $${vP} - ${vPQ} = ${ans}$`,
      ]
    } else {
      const E = Q
      const cutTotal = pathC(E[0], E[1]) * pathC(a - E[0] - 1, b - E[1])
      // P를 지나면서 간선 E→E+(1,0)을 지나는 경로
      const both = viaPAndEdge(a, b, P, E)
      text = `${lead} 점 $\\mathrm{P}${ptT(P)}$${eul(P)} 지나고, 점 $${ptT(E)}$ 에서 점 $(${E[0] + 1}, ${E[1]})$ ${bat(E[1]) ? "으로" : "로"} 가는 길은 지나지 않는 경로의 수를 구하시오.`
      sol = [
        `$\\mathrm{P}$ 를 지나는 경로의 수는 $${pathC(P[0], P[1])} \\times ${pathC(a - P[0], b - P[1])} = ${vP}$ 이다.`,
        `한편 점 $${ptT(E)}$ 에서 점 $(${E[0] + 1}, ${E[1]})$ ${bat(E[1]) ? "으로" : "로"} 가는 길을 지나는 경로의 수는 $${pathC(E[0], E[1])} \\times ${pathC(a - E[0] - 1, b - E[1])} = ${cutTotal}$ 이다.`,
        both.text,
        `따라서 구하는 경로의 수는 $${vP} - ${both.v} = ${ans}$`,
      ]
    }
    return { text, ...short(ans), solution: lines(...sol), score: 4 }
  },
  verify: ({ a, b, P, Q, kind }) => {
    if (kind === 0) return gridPaths(a, b, { avoid: [P, Q] })
    if (kind === 1) return gridPaths(a, b, { mustPass: [P], avoid: [Q] })
    return gridPaths(a, b, { mustPass: [P], cutEdge: Q })
  },
}
/** P를 지나고 E→E+(1,0) 간선을 지나는 경로 수와 설명 */
function viaPAndEdge(a: number, b: number, P: [number, number], E: [number, number]) {
  const E2: [number, number] = [E[0] + 1, E[1]]
  if (E2[0] <= P[0] && E2[1] <= P[1]) {
    const v = pathC(E[0], E[1]) * pathC(P[0] - E2[0], P[1] - E2[1]) * pathC(a - P[0], b - P[1])
    return { v, text: `$\\mathrm{P}$ 와 그 길을 모두 지나는 경로는 $\\mathrm{O} \\to ${ptT(E)} \\to ${ptT(E2)} \\to \\mathrm{P} \\to (${a}, ${b})$ 이므로 $${pathC(E[0], E[1])} \\times ${pathC(P[0] - E2[0], P[1] - E2[1])} \\times ${pathC(a - P[0], b - P[1])} = ${v}$` }
  }
  if (P[0] <= E[0] && P[1] <= E[1]) {
    const v = pathC(P[0], P[1]) * pathC(E[0] - P[0], E[1] - P[1]) * pathC(a - E2[0], b - E2[1])
    return { v, text: `$\\mathrm{P}$ 와 그 길을 모두 지나는 경로는 $\\mathrm{O} \\to \\mathrm{P} \\to ${ptT(E)} \\to ${ptT(E2)} \\to (${a}, ${b})$ 이므로 $${pathC(P[0], P[1])} \\times ${pathC(E[0] - P[0], E[1] - P[1])} \\times ${pathC(a - E2[0], b - E2[1])} = ${v}$` }
  }
  return { v: 0, text: `점 $\\mathrm{P}$ 와 그 길은 하나의 최단 경로에서 함께 지날 수 없다.` }
}
function pathAvoidValue(a: number, b: number, P: [number, number], Q: [number, number], kind: number) {
  const total = pathC(a, b)
  const vP = pathC(P[0], P[1]) * pathC(a - P[0], b - P[1])
  const vQ = pathC(Q[0], Q[1]) * pathC(a - Q[0], b - Q[1])
  const [L, R] = P[0] <= Q[0] && P[1] <= Q[1] ? [P, Q] : [Q, P]
  const ordered = L[0] <= R[0] && L[1] <= R[1]
  const vPQ = ordered ? pathC(L[0], L[1]) * pathC(R[0] - L[0], R[1] - L[1]) * pathC(a - R[0], b - R[1]) : 0
  if (kind === 0) return total - vP - vQ + vPQ
  if (kind === 1) return vP - vPQ
  return vP - viaPAndEdge(a, b, P, Q).v
}

const hockey: SuTemplate<{ kind: number; a: number; b: number; k: number }> = {
  id: "c4-binom-hockey",
  subject: "확률과 통계",
  unit: UNIT,
  standard: "12확통01-03",
  level: 3,
  count: 37,
  params: (r) => {
    const kind = r.int(0, 2)
    if (kind === 2) {
      const n = r.int(4, 7)
      return { kind, a: 0, b: n, k: 1 }
    }
    const k = r.int(2, 4)
    const a = kind === 0 ? r.int(k + 1, 7) : k
    const b = r.int(a + 2, 12)
    const v = hockeyValue(kind, a, b, k)
    if (!isShortOk(v) || v < 5) return null
    return { kind, a, b, k }
  },
  build: ({ kind, a, b, k }) => {
    const ans = hockeyValue(kind, a, b, k)
    if (kind === 2) {
      const n = b
      return {
        text: `$\\sum_{k=1}^{${n}} k \\times ${nC(n, "k")}$ 의 값을 구하시오.`,
        ...short(ans),
        solution: lines(
          `$1 \\le k \\le ${n}$ 일 때 $k \\times ${nC(n, "k")} = k \\times \\frac{${n}!}{k!\\,(${n} - k)!} = ${n} \\times \\frac{${n - 1}!}{(k - 1)!\\,(${n} - k)!} = ${n} \\times ${nC(n - 1, "k - 1")}$`,
          `따라서 $\\sum_{k=1}^{${n}} k \\times ${nC(n, "k")} = ${n} \\sum_{k=1}^{${n}} ${nC(n - 1, "k - 1")} = ${n} \\sum_{j=0}^{${n - 1}} ${nC(n - 1, "j")}$ 이다.`,
          `이항계수의 합 $\\sum_{j=0}^{${n - 1}} ${nC(n - 1, "j")} = 2^{${n - 1}}$ 을 이용하면 구하는 값은 $${n} \\times 2^{${n - 1}}$`,
          `$= ${n} \\times ${2 ** (n - 1)} = ${ans}$`
        ),
        score: 4,
      }
    }
    const steps = [
      `$${nC("n", k)}$ 를 차례로 더할 때 $${nC("r", k + 1)} + ${nC("r", k)} = ${nC("r + 1", k + 1)}$ (파스칼의 삼각형의 성질)을 반복해서 쓴다.`,
    ]
    if (kind === 0) {
      return {
        text: `다항식 $(1 + x)^{${a}} + (1 + x)^{${a + 1}} + \\cdots + (1 + x)^{${b}}$ 의 전개식에서 $x^{${k}}$ 의 계수를 구하시오.`,
        ...short(ans),
        solution: lines(
          `$(1 + x)^{n}$ 의 전개식에서 $x^{${k}}$ 의 계수는 $${nC("n", k)}$ 이므로 구하는 값은 $\\sum_{n=${a}}^{${b}} ${nC("n", k)}$ 이다.`,
          ...steps,
          `$${nC(k, k)} + ${nC(k + 1, k)} + \\cdots + ${nC("m", k)} = ${nC("m + 1", k + 1)}$ 이므로 $\\sum_{n=${a}}^{${b}} ${nC("n", k)} = ${nC(b + 1, k + 1)} - ${nC(a, k + 1)}$`,
          `$= ${C(b + 1, k + 1)} - ${C(a, k + 1)} = ${ans}$`
        ),
        score: 4,
      }
    }
    return {
      text: `$${k}$ 이상인 자연수 $n$ 에 대하여 $(1 + x)^{n}$ 의 전개식에서 $x^{${k}}$ 의 계수를 $a_n$ 이라 할 때, $\\sum_{n=${k}}^{${b}} a_n$ 의 값을 구하시오.`,
      ...short(ans),
      solution: lines(
        `$a_n = ${nC("n", k)}$ 이다.`,
        `$${nC(k, k)} = ${nC(k + 1, k + 1)}$ 임을 이용하여 $${nC(k + 1, k + 1)} + ${nC(k + 1, k)} = ${nC(k + 2, k + 1)}$, $${nC(k + 2, k + 1)} + ${nC(k + 2, k)} = ${nC(k + 3, k + 1)}$, $\\cdots$ 를 반복하면`,
        `$\\sum_{n=${k}}^{${b}} ${nC("n", k)} = ${nC(b + 1, k + 1)} = ${ans}$`
      ),
      score: 4,
    }
  },
  verify: ({ kind, a, b, k }) => {
    if (kind === 2) {
      let s = 0
      for (let i = 1; i <= b; i++) s += i * polyPowLow([1, 1], b)[i]
      return s
    }
    let s = 0
    for (let n = a; n <= b; n++) s += polyPowLow([1, 1], n)[k] ?? 0
    return s
  },
}
function hockeyValue(kind: number, a: number, b: number, k: number) {
  if (kind === 2) return b * 2 ** (b - 1)
  if (kind === 0) return C(b + 1, k + 1) - C(a, k + 1)
  return C(b + 1, k + 1)
}

export const COUNTING: SuTemplate[] = [
  repPermBasic,
  samePerm,
  repCombBasic,
  binomCoef,
  binomSum,
  digitCond,
  gridPath,
  repCombBounds,
  binomConst,
  funcInc,
  funcFix,
  repCombCond,
  binomProduct,
  samePermCond,
  funcRange,
  oddCount,
  pathAvoid,
  hockey,
].map(polish)
