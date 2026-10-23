// 확률과 통계 공용 도구
import type { Rng } from "../../types"
import { intChoice, NORMAL_TABLE, q, Q, qChoice, short } from "../kit"
import type { SuProblem } from "../types"
import type { Choice, SuTemplate } from "../types"

/** 기약분수 p/q 일 때 p+q (단답형) */
export const pqShort = (x: Q) => short(x.n + x.d)
export const pqOk = (x: Q) => x.n > 0 && x.n + x.d <= 999

/** 분수 객관식: 오답 후보 중 0 초과 1 이하(확률) 또는 양수만 남기고, 부족하면 분자를 1씩 움직인다 */
export function fracMc(r: Rng, ans: Q, wrongs: Q[], prob = true) {
  const ok = (x: Q) => x.n > 0 && (!prob || x.value < 1)
  const extra: Q[] = []
  for (let k = 1; k <= 60; k++) {
    const co = q(1).sub(ans)
    for (const x of [q(ans.n + k, ans.d), q(ans.n - k, ans.d), q(ans.n, ans.d + k), q(ans.n * (k + 1), ans.d), q(ans.n, ans.d * (k + 1)), ...(co.n > 0 ? [q(1).sub(co.div(k + 1)), q(1).sub(co.mul(q(k + 1, k)))] : [])]) {
      if (x.d > 0 && ok(x)) extra.push(x)
    }
  }
  return mcBal(
    r,
    qChoice(ans),
    wrongs.filter(ok).map(qChoice),
    (k) => qChoice(extra[Math.min(k - 1, extra.length - 1)] ?? q(k, k + 1)),
    (c) => c.value > 0 && (!prob || c.value < 1)
  )
}

/** 소수 보기 (자릿수 고정) */
export const decChoice = (x: number, digits = 4): Choice => {
  const v = Math.round(x * 10 ** digits) / 10 ** digits
  return { tex: v.toFixed(digits), value: v }
}

/** 소수 객관식 (확률: 0~1 사이만) */
export function decMc(r: Rng, ans: number, wrongs: number[], digits = 4) {
  const okw = wrongs.filter((w) => w > 0 && w < 1)
  // 표 값으로 만들 수 있는 그럴듯한 확률들 (정답에 가까운 것부터)
  const ts = Object.values(NORMAL_TABLE)
  const pool = new Set<number>()
  for (const a of ts) {
    pool.add(r4(0.5 + a))
    pool.add(r4(0.5 - a))
    pool.add(a)
    for (const b of ts) {
      pool.add(r4(a + b))
      pool.add(r4(Math.abs(a - b)))
    }
  }
  const cand = [...pool].filter((x) => x > 0 && x < 1 && Math.abs(x - ans) > 1e-9).sort((x, y) => Math.abs(x - ans) - Math.abs(y - ans))
  return mcBal(r, decChoice(ans, digits), okw.map((w) => decChoice(w, digits)), (k) => decChoice(cand[Math.min(k - 1, cand.length - 1)], digits), (c) => c.value > 0 && c.value < 1)
}

/** 표 값 P(0 ≤ Z ≤ z), z = 0, 0.5, ..., 3.0 */
export function T(z: number): number {
  const a = Math.abs(z)
  if (a < 1e-9) return 0
  const key = a.toFixed(1)
  const v = NORMAL_TABLE[key]
  if (v === undefined || Math.abs(Number(key) - a) > 1e-9) throw new Error(`표에 없는 z: ${z}`)
  return v
}
export const inTable = (z: number) => {
  const a = Math.abs(z)
  return a < 1e-9 || (Math.abs(Math.round(a * 2) / 2 - a) < 1e-9 && a <= 3)
}
/** P(Z ≤ z) — 표 값으로 */
export const F = (z: number) => (z >= 0 ? 0.5 + T(z) : 0.5 - T(z))
export const r4 = (x: number) => Math.round(x * 10000) / 10000

/** z 값 TeX (정수면 정수, .5면 소수) */
export const zt = (z: number) => (Number.isInteger(z) ? String(z) : z.toFixed(1))

/** 표 figure에 넣을 z 키 */
export const zKeys = (...zs: number[]) => {
  const s = new Set<string>()
  for (const z of zs) if (Math.abs(z) > 1e-9) s.add(Math.abs(z).toFixed(1))
  return [...s].sort((a, b) => Number(a) - Number(b))
}

/** 받침 있는 수인지 (조사 고르기) */
export function hasBatchim(n: number) {
  const s = String(Math.abs(n))
  if (/0+$/.test(s) && s !== "0") {
    // 10, 100, 1000 … 십·백·천 모두 받침 있음 (만은 받침 있음)
    return true
  }
  const d = s[s.length - 1]
  return "013678".includes(d)
}
export const eunNeun = (n: number) => (hasBatchim(n) ? "은" : "는")
export const iGa = (n: number) => (hasBatchim(n) ? "이" : "가")
export const eulReul = (n: number) => (hasBatchim(n) ? "을" : "를")

/** 확률 Q 를 숫자로 */
export const sumQ = (xs: Q[]) => xs.reduce((a, b) => a.add(b), q(0))

/** 다중집합의 서로 다른 순열을 직접 나열해서 센다 (검산용) */
export function countDistinctPerms(s: string, pred?: (w: string) => boolean): number {
  const chars = s.split("").sort()
  const used = Array(chars.length).fill(false)
  let cnt = 0
  const cur: string[] = []
  const rec = () => {
    if (cur.length === chars.length) {
      if (!pred || pred(cur.join(""))) cnt++
      return
    }
    for (let i = 0; i < chars.length; i++) {
      if (used[i]) continue
      if (i > 0 && chars[i] === chars[i - 1] && !used[i - 1]) continue
      used[i] = true
      cur.push(chars[i])
      rec()
      cur.pop()
      used[i] = false
    }
  }
  rec()
  return cnt
}

/** 다항식 계수 (낮은 차수부터) 곱 — 검산용 */
export function polyMulLow(a: number[], b: number[]) {
  const out = Array(a.length + b.length - 1).fill(0)
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] += x * y)))
  return out
}
export function polyPowLow(a: number[], n: number) {
  let r = [1]
  for (let i = 0; i < n; i++) r = polyMulLow(r, a)
  return r
}

/**
 * 확률을 묻는 문장 마무리: stem 은 "~일 확률" 로 끝난다.
 * useShort 이면 q/p 꼴의 p+q 단답형, 아니면 분수 객관식
 */
export function askProb(r: Rng, stem: string, ans: Q, wrongs: Q[], useShort: boolean) {
  if (useShort && ans.n + ans.d <= 999 && ans.d > 1) {
    return {
      text: `${stem}을 $\\frac{q}{p}$ 라 할 때, $p + q$ 의 값을 구하시오. (단, $p$ 와 $q$ 는 서로소인 자연수이다.)`,
      ...short(ans.n + ans.d),
      last: `$p = ${ans.d},\\ q = ${ans.n}$ 이므로 $p + q = ${ans.n + ans.d}$`,
    }
  }
  return { text: `${stem}은?`, ...fracMc(r, ans, wrongs), last: "" }
}

/** 간단한 표 그림 (첫 행·첫 열이 머리글). "3/4" 꼴 칸은 분수로 그린다 */
export function tableFigure(rows: string[][], firstW = 120, cellW = 96) {
  const cw = rows[0].map((_, j) => (j === 0 ? firstW : cellW))
  const w = cw.reduce((a, b) => a + b, 0)
  const hasFrac = (row: string[]) => row.some((c) => /^-?\d+\/\d+$/.test(c))
  const rhs = rows.map((row) => (hasFrac(row) ? 60 : 40))
  const h = rhs.reduce((a, b) => a + b, 0)
  const ink = "#1F1A3D"
  const txt = (x: number, y: number, t: string, size = 19) =>
    `<text x="${x}" y="${y}" font-size="${size}" font-family="PlexKR" text-anchor="middle" fill="${ink}">${t.replace(/</g, "&lt;")}</text>`
  let body = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="#FFFFFF" stroke="${ink}" stroke-width="2"/>`
  let x = 0
  cw.forEach((c, j) => {
    if (j > 0) body += `<line x1="${x}" y1="1" x2="${x}" y2="${h - 1}" stroke="${ink}" stroke-width="${j === 1 ? 2 : 1}"/>`
    let y = 0
    rows.forEach((row, i) => {
      const cell = row[j]
      const m = /^(-?\d+)\/(\d+)$/.exec(cell)
      const cx = x + c / 2
      if (m) {
        const lw = Math.max(m[1].length, m[2].length) * 11 + 6
        body += txt(cx, y + 25, m[1], 18)
        body += `<line x1="${cx - lw / 2}" y1="${y + 31}" x2="${cx + lw / 2}" y2="${y + 31}" stroke="${ink}" stroke-width="1.3"/>`
        body += txt(cx, y + 51, m[2], 18)
      } else body += txt(cx, y + rhs[i] / 2 + 7, cell)
      y += rhs[i]
    })
    x += c
  })
  let y = 0
  rows.forEach((_, i) => {
    if (i > 0) body += `<line x1="1" y1="${y}" x2="${w - 1}" y2="${y}" stroke="${ink}" stroke-width="${i === 1 ? 2 : 1}"/>`
    y += rhs[i]
  })
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}">${body}</svg>`, width: w, height: h }
}

/** 표준정규분포 누적 (검산용 빠른 근사, 오차 1e-7 정도: A&S 7.1.26) */
export function ncdf(z: number) {
  const x = Math.abs(z) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y)
}

/**
 * 해설 줄 묶기
 * - 다음 줄이 "$= …$" 로 이어지면 앞 줄의 수식에 붙여 한 줄로 만든다
 * - 수식으로 끝난 줄 다음 줄이 수식으로 시작하면 마침표로 구분한다
 */
export const sol = (...ls: (string | false | null | undefined)[]) => {
  const xs = ls.filter(Boolean) as string[]
  const out: string[] = []
  for (const l of xs) {
    const prev = out[out.length - 1]
    if (prev !== undefined && /^\s*\$\s*=/.test(l) && /\$\s*$/.test(prev)) {
      out[out.length - 1] = `${prev.replace(/\$\s*$/, "")} ${l.replace(/^\s*\$\s*/, "")}`
      continue
    }
    if (prev !== undefined && /\$\s*$/.test(prev) && /^\s*\$/.test(l)) out[out.length - 1] = `${prev}.`
    out.push(l)
  }
  return out.join("\n")
}

/** 숫자를 읽었을 때 마지막 소리: 받침 여부, ㄹ 받침 여부 */
export function numSound(num: string) {
  const d = num.replace(/\D/g, "")
  if (!d || /^0+$/.test(d)) return { batchim: true, rieul: false }
  const nz = d.replace(/0+$/, "")
  if (nz.length < d.length) return { batchim: true, rieul: false }
  const last = nz[nz.length - 1]
  return { batchim: "013678".includes(last), rieul: "178".includes(last) }
}
/** 숫자 뒤 조사 고르기: josa(9, "을", "를") → "를" */
export function josa(n: number | string, withB: string, without: string) {
  return numSound(String(n)).batchim ? withB : without
}
/** 숫자 뒤 으로/로 */
export const euro = (n: number | string) => {
  const { batchim, rieul } = numSound(String(n))
  return batchim && !rieul ? "으로" : "로"
}
const JOSA_PAIRS: [string, string][] = [["을", "를"], ["은", "는"], ["이었", "였"], ["이라", "라"], ["이", "가"], ["과", "와"]]
/** 숫자(또는 숫자로 끝나는 괄호)로 끝나는 수식 바로 뒤의 조사를 받침에 맞게 고친다. "(t > 0)$ 로" 같은 괄호 안 조건은 그대로 둔다 */
export function fixJosa(s: string) {
  return s.replace(
    // 이었/였 은 뒤에 을·다·고 가 붙고, 나머지는 조사 다음이 띄어쓰기·문장부호일 때만 (이다·이고 같은 서술격은 건드리지 않는다)
    /(\d+(?:\.\d+)?)((?:\)|\\right\))?)\$( ?)(?:(이었|였)(?=[을다고])|(으로|로|이라|라|을|를|은|는|이|가|과|와)(?=[\s,.)]|$))/g,
    (all, n: string, close: string, sp: string, j1: string | undefined, j2: string | undefined, idx: number) => {
      const j = (j1 ?? j2)!
      if (close) {
        const before = s.slice(Math.max(0, idx - 20), idx + n.length + 8)
        if (/(>|<|\\ne|\\ge|\\le|\\geq|\\leq)\s*-?\d+(?:\.\d+)?\s*(\)|\\right\))\$/.test(before)) return all
      }
      const head = `${n}${close}$${sp}`
      if (j === "으로" || j === "로") return head + euro(n)
      for (const [w, wo] of JOSA_PAIRS) if (j === w || j === wo) return head + josa(n, w, wo)
      return all
    }
  )
}

/** 약분 전후가 다를 때만 "= 약분값" 을 붙인 분수 */
export function fracEq(n: number, d: number) {
  const x = q(n, d)
  return x.n === n && x.d === d ? x.tex() : `\\frac{${n}}{${d}} = ${x.tex()}`
}
/** 두 확률의 비 x/y 를 겹분수 없이: 공통분모를 곱해 정수비로 쓴 뒤 약분 */
export function ratioTex(x: Q, y: Q) {
  const L = (x.d * y.d) / gcdQ(x.d, y.d)
  const a = x.mul(L).n
  const b = y.mul(L).n
  return fracEq(a, b)
}
const gcdQ = (a: number, b: number): number => (b ? gcdQ(b, a % b) : Math.abs(a))

/** 템플릿 문장·해설의 숫자 뒤 조사를 마지막에 한 번 더 맞춘다 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function polish(t: SuTemplate<any>): SuTemplate<any> {
  return {
    ...t,
    build: (p, r) => {
      const x = t.build(p, r)
      return { ...x, text: fixJosa(x.text), solution: fixJosa(x.solution) }
    },
  }
}

/** 실수를 가까운 분수로 (연분수, 분모 ≤ maxD) */
export function toFrac(x: number, maxD = 1e7): Q {
  let h0 = 0, h1 = 1, k0 = 1, k1 = 0
  let v = x
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(v)
    const h2 = a * h1 + h0
    const k2 = a * k1 + k0
    if (k2 > maxD) break
    h0 = h1; h1 = h2; k0 = k1; k1 = k2
    if (Math.abs(x - h1 / k1) < 1e-12) break
    v = 1 / (v - a)
  }
  return q(h1, k1)
}
/** askProb 와 같은 규칙으로: 단답형이면 p+q, 아니면 확률 값 */
export function pqOrValue(x: number, useShort: boolean) {
  const f = toFrac(x)
  return useShort && f.n + f.d <= 999 && f.d > 1 ? f.n + f.d : x
}

/**
 * 정답 번호가 한쪽으로 몰리지 않는 객관식.
 * 정답보다 작은 보기 개수 t(0~4)를 r 로 정하고, 작은 쪽·큰 쪽에서 그럴듯한 오답(주어진 오답 먼저, 모자라면 fill 로 만든 것 중 정답에 가까운 것)을 고른다.
 * ok: 보기로 쓸 수 있는 값인지 (기본: 정답이 양수면 양수만 — 개수·확률·길이)
 */
export function mcBal(
  r: Rng,
  correct: Choice,
  wrongs: Choice[],
  fill?: (k: number) => Choice,
  ok?: (c: Choice) => boolean
): Pick<SuProblem, "choices" | "answer" | "value" | "choiceValues"> {
  const valid = ok ?? ((c: Choice) => (correct.value > 0 ? c.value > 0 : true))
  const step = Math.max(1, Math.abs(correct.value) >= 20 ? Math.round(Math.abs(correct.value) / 10) : 1)
  const f = fill ?? ((k: number) => intChoice(correct.value + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step))
  const same = (a: Choice, b: Choice) => Math.abs(a.value - b.value) < 1e-9 * Math.max(1, Math.abs(a.value), Math.abs(b.value)) || a.tex === b.tex
  const prim: Choice[] = []
  const extra: Choice[] = []
  const add = (list: Choice[], c: Choice) => {
    if (!Number.isFinite(c.value) || !valid(c) || same(c, correct) || prim.some((p) => same(p, c)) || extra.some((p) => same(p, c))) return
    list.push(c)
  }
  for (const w of r.shuffle([...wrongs])) add(prim, w)
  for (let k = 1; k <= 60; k++) add(extra, f(k))
  const near = (a: Choice, b: Choice) => Math.abs(a.value - correct.value) - Math.abs(b.value - correct.value)
  extra.sort(near)
  const lo = [...prim.filter((c) => c.value < correct.value), ...extra.filter((c) => c.value < correct.value)]
  const hi = [...prim.filter((c) => c.value > correct.value), ...extra.filter((c) => c.value > correct.value)]
  const tMin = Math.max(0, 4 - hi.length)
  const tMax = Math.min(4, lo.length)
  if (tMin > tMax) throw new Error("보기 5개를 만들지 못했어요")
  const t = r.int(tMin, tMax)
  const picked = [...lo.slice(0, t), correct, ...hi.slice(0, 4 - t)].sort((a, b) => a.value - b.value)
  const idx = picked.indexOf(correct)
  return { choices: picked.map((c) => `$${c.tex}$`), answer: String(idx + 1), value: correct.value, choiceValues: picked.map((c) => c.value) }
}
