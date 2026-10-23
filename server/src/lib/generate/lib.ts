// 생성기 공용 도구: 시드 난수, 객관식 보기 만들기, 분수, 그림
import type { Figure, GeneratedProblem, Rng } from "./types"

/** 같은 시드면 항상 같은 문제가 나온다 (다시 넣어도 문제가 바뀌지 않게) */
export function rng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  return {
    int,
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    shuffle: (xs) => {
      const a2 = [...xs]
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a2[i], a2[j]] = [a2[j], a2[i]]
      }
      return a2
    },
    chance: (p) => next() < p,
  }
}

export function hashSeed(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b)

/** 기약분수 [분자, 분모] (분모는 양수) */
export function reduce(n: number, d: number): [number, number] {
  if (d < 0) {
    n = -n
    d = -d
  }
  const g = gcd(n, d) || 1
  return [n / g, d / g]
}

/** 답 문자열: 정수면 "3", 아니면 "3/4" */
export function fracAnswer(n: number, d: number) {
  const [a, b] = reduce(n, d)
  return b === 1 ? String(a) : `${a}/${b}`
}

/** TeX 분수 (정수면 정수) */
export function frac(n: number, d: number) {
  const [a, b] = reduce(n, d)
  if (b === 1) return String(a)
  return a < 0 ? `-\\frac{${-a}}{${b}}` : `\\frac{${a}}{${b}}`
}

/** 수 표기 (세 자리마다 쉼표) */
export const fmt = (n: number) => n.toLocaleString("en-US")

/**
 * 숫자 답 객관식: 정답과 그럴듯한 오답 4개를 작은 수부터 늘어놓는다 (수능처럼).
 * wrongs가 모자라면 정답 근처 수로 채운다.
 */
export function numberChoices(
  r: Rng,
  answer: number,
  wrongs: number[],
  show: (n: number) => string = (n) => `$${n}$`,
  step = 1
): Pick<GeneratedProblem, "choices" | "answer"> {
  const set = new Set<number>([answer])
  for (const w of r.shuffle(wrongs)) {
    if (set.size >= 5) break
    if (Number.isFinite(w)) set.add(w)
  }
  let k = 1
  while (set.size < 5) {
    const cand = answer + (r.chance(0.5) ? k : -k) * step
    if (!set.has(cand) && cand >= 0) set.add(cand)
    else if (!set.has(answer + k * step)) set.add(answer + k * step)
    k++
  }
  const sorted = [...set].sort((a, b) => a - b)
  return { choices: sorted.map(show), answer: String(sorted.indexOf(answer) + 1) }
}

/** 글자 보기 객관식: 정답과 오답을 섞는다 */
export function textChoices(r: Rng, answer: string, wrongs: string[], keepOrder?: string[]): Pick<GeneratedProblem, "choices" | "answer"> {
  const uniq = [...new Set(wrongs.filter((w) => w !== answer))]
  const picked = r.shuffle(uniq).slice(0, 4)
  let list = [answer, ...picked]
  list = keepOrder ? keepOrder.filter((k) => list.includes(k)) : r.shuffle(list)
  if (list.length !== 5) throw new Error(`보기가 5개가 아니에요: ${list.join(",")}`)
  return { choices: list, answer: String(list.indexOf(answer) + 1) }
}

/** 분수 보기 (값이 같은 보기가 없게) */
export function fracChoices(r: Rng, ans: [number, number], wrongs: [number, number][]) {
  const key = ([n, d]: [number, number]) => reduce(n, d).join("/")
  const seen = new Set([key(ans)])
  const ws: [number, number][] = []
  for (const w of r.shuffle(wrongs)) {
    if (w[1] === 0 || seen.has(key(w))) continue
    seen.add(key(w))
    ws.push(w)
    if (ws.length === 4) break
  }
  let k = 1
  while (ws.length < 4) {
    const w: [number, number] = [ans[0] + k * ans[1], ans[1]]
    if (!seen.has(key(w))) {
      seen.add(key(w))
      ws.push(w)
    }
    k++
  }
  const all = [ans, ...ws].sort((a, b) => a[0] / a[1] - b[0] / b[1])
  return { choices: all.map(([n, d]) => `$${frac(n, d)}$`), answer: String(all.findIndex((x) => key(x) === key(ans)) + 1) }
}

// ───────── 그림 (SVG) ─────────

const svg = (w: number, h: number, body: string): Figure => ({
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  width: w,
  height: h,
})

export type Thing = "apple" | "star" | "fish" | "ball" | "flower" | "car"
export const THING_NAME: Record<Thing, string> = { apple: "사과", star: "별", fish: "물고기", ball: "공", flower: "꽃", car: "자동차" }
export const THING_UNIT: Record<Thing, string> = { apple: "개", star: "개", fish: "마리", ball: "개", flower: "송이", car: "대" }

/** 지름 60 안에 그리는 물건 하나 */
function thing(kind: Thing, x: number, y: number, crossed = false) {
  const c = `translate(${x},${y})`
  const art: Record<Thing, string> = {
    apple: `<circle cx="30" cy="34" r="22" fill="#FF5C6C"/><circle cx="22" cy="28" r="6" fill="#FF9DA8"/><path d="M30 14 q2 -8 8 -10" stroke="#7A4A1E" stroke-width="3" fill="none"/><ellipse cx="40" cy="10" rx="8" ry="4" fill="#19C28C" transform="rotate(-20 40 10)"/>`,
    star: `<path d="M30 6 L37 22 L54 23 L41 34 L45 51 L30 42 L15 51 L19 34 L6 23 L23 22 Z" fill="#FFC233" stroke="#E0A100" stroke-width="2" stroke-linejoin="round"/>`,
    fish: `<ellipse cx="27" cy="30" rx="20" ry="13" fill="#3DB6FF"/><path d="M45 30 L57 20 L57 40 Z" fill="#1A8FD6"/><circle cx="18" cy="27" r="3" fill="#1F1A3D"/>`,
    ball: `<circle cx="30" cy="30" r="22" fill="#6D4AFF"/><path d="M8 30 h44 M30 8 q-14 22 0 44 M30 8 q14 22 0 44" stroke="#FFFFFF" stroke-width="3" fill="none"/>`,
    flower: `<g fill="#FF8AB0"><circle cx="30" cy="16" r="9"/><circle cx="44" cy="27" r="9"/><circle cx="38" cy="43" r="9"/><circle cx="22" cy="43" r="9"/><circle cx="16" cy="27" r="9"/></g><circle cx="30" cy="30" r="8" fill="#FFC233"/>`,
    car: `<rect x="6" y="26" width="48" height="16" rx="6" fill="#19C28C"/><path d="M16 26 L22 14 H40 L46 26 Z" fill="#0E9A6E"/><circle cx="18" cy="44" r="6" fill="#1F1A3D"/><circle cx="42" cy="44" r="6" fill="#1F1A3D"/>`,
  }
  const x2 = crossed ? `<path d="M8 8 L52 52 M52 8 L8 52" stroke="#1F1A3D" stroke-width="4" stroke-linecap="round" opacity="0.75"/>` : ""
  return `<g transform="${c}">${art[kind]}${x2}</g>`
}

/** 물건 n개를 줄 맞춰 그린다 (한 줄 최대 perRow개). crossed개는 X 표시 */
export function things(kind: Thing, n: number, opts: { perRow?: number; crossed?: number } = {}): Figure {
  const perRow = opts.perRow ?? 5
  const cols = Math.min(n, perRow)
  const rows = Math.ceil(n / perRow)
  let body = ""
  for (let i = 0; i < n; i++) body += thing(kind, (i % perRow) * 68, Math.floor(i / perRow) * 68, i >= n - (opts.crossed ?? 0))
  return svg(Math.max(60, cols * 68 - 8), rows * 68 - 8, body)
}

/** 두 묶음 (왼쪽 a개 + 오른쪽 b개) */
export function twoGroups(kind: Thing, a: number, b: number): Figure {
  const w1 = Math.min(a, 5) * 68
  let body = ""
  for (let i = 0; i < a; i++) body += thing(kind, (i % 5) * 68, Math.floor(i / 5) * 68)
  body += `<text x="${w1 + 14}" y="44" font-size="40" font-family="PlexKRBold" fill="#6B6790">+</text>`
  for (let i = 0; i < b; i++) body += thing(kind, w1 + 56 + (i % 5) * 68, Math.floor(i / 5) * 68)
  const rows = Math.max(Math.ceil(a / 5), Math.ceil(b / 5))
  return svg(w1 + 56 + Math.min(b, 5) * 68, rows * 68, body)
}

export type Shape = "circle" | "triangle" | "square" | "star" | "heart"
export const SHAPE_NAME: Record<Shape, string> = { circle: "동그라미", triangle: "세모", square: "네모", star: "별", heart: "하트" }
const SHAPE_COLOR: Record<Shape, string> = { circle: "#3DB6FF", triangle: "#FFC233", square: "#19C28C", star: "#FF8A3D", heart: "#FF5C6C" }

function shape(s: Shape, x: number, y: number, size = 60) {
  const k = size / 60
  const t = `translate(${x},${y}) scale(${k})`
  const f = SHAPE_COLOR[s]
  const art: Record<Shape, string> = {
    circle: `<circle cx="30" cy="30" r="26" fill="${f}"/>`,
    triangle: `<path d="M30 4 L56 54 H4 Z" fill="${f}" stroke-linejoin="round"/>`,
    square: `<rect x="5" y="5" width="50" height="50" rx="4" fill="${f}"/>`,
    star: `<path d="M30 3 L38 21 L57 22 L42 35 L47 55 L30 44 L13 55 L18 35 L3 22 L22 21 Z" fill="${f}"/>`,
    heart: `<path d="M30 54 C6 38 2 22 12 13 C20 6 28 10 30 17 C32 10 40 6 48 13 C58 22 54 38 30 54 Z" fill="${f}"/>`,
  }
  return `<g transform="${t}">${art[s]}</g>`
}

export function shapes(list: (Shape | "?")[], size = 64): Figure {
  let body = ""
  list.forEach((s, i) => {
    const x = i * (size + 16)
    body +=
      s === "?"
        ? `<rect x="${x + 3}" y="3" width="${size - 6}" height="${size - 6}" rx="12" fill="none" stroke="#A19DBF" stroke-width="3" stroke-dasharray="8 6"/><text x="${x + size / 2 - 10}" y="${size / 2 + 13}" font-size="36" font-family="PlexKRBold" fill="#A19DBF">?</text>`
        : shape(s, x, 0, size)
  })
  return svg(list.length * (size + 16) - 16, size, body)
}

/** 아날로그 시계 */
export function clock(h: number, m: number): Figure {
  const cx = 100
  const cy = 100
  let body = `<circle cx="${cx}" cy="${cy}" r="92" fill="#FFFFFF" stroke="#1F1A3D" stroke-width="5"/>`
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2
    body += `<text x="${cx + Math.sin(a) * 70 - (i >= 10 ? 13 : 7)}" y="${cy - Math.cos(a) * 70 + 9}" font-size="24" font-family="PlexKRBold" fill="#1F1A3D">${i}</text>`
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const r1 = i % 5 === 0 ? 82 : 86
    body += `<line x1="${cx + Math.sin(a) * r1}" y1="${cy - Math.cos(a) * r1}" x2="${cx + Math.sin(a) * 90}" y2="${cy - Math.cos(a) * 90}" stroke="#1F1A3D" stroke-width="${i % 5 === 0 ? 3 : 1.5}"/>`
  }
  const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2
  const ma = (m / 60) * Math.PI * 2
  body += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ha) * 46}" y2="${cy - Math.cos(ha) * 46}" stroke="#1F1A3D" stroke-width="8" stroke-linecap="round"/>`
  body += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ma) * 72}" y2="${cy - Math.cos(ma) * 72}" stroke="#2B48C8" stroke-width="5" stroke-linecap="round"/>`
  body += `<circle cx="${cx}" cy="${cy}" r="7" fill="#1F1A3D"/>`
  return svg(200, 200, body)
}

/** 분수 막대: n칸 중 k칸 색칠 */
export function fractionBar(k: number, n: number): Figure {
  const w = 420
  const cell = w / n
  let body = ""
  for (let i = 0; i < n; i++)
    body += `<rect x="${i * cell + 1}" y="1" width="${cell}" height="60" fill="${i < k ? "#FFC233" : "#FFFFFF"}" stroke="#1F1A3D" stroke-width="2"/>`
  return svg(w + 4, 64, body)
}

/** 세 각 중 두 각이 적힌 삼각형 */
export function triangleAngles(a: number, b: number): Figure {
  const body = `<path d="M20 180 L300 180 L120 30 Z" fill="#ECE7FF" stroke="#1F1A3D" stroke-width="3" stroke-linejoin="round"/>
  <text x="46" y="170" font-size="24" font-family="PlexKR" fill="#1F1A3D">${a}°</text>
  <text x="218" y="170" font-size="24" font-family="PlexKR" fill="#1F1A3D">${b}°</text>
  <text x="110" y="76" font-size="28" font-family="PlexKRBold" fill="#2B48C8">?</text>`
  return svg(320, 200, body)
}

/** 직각삼각형 (두 변 길이 표시) */
export function rightTriangle(labels: { a?: string; b?: string; c?: string }): Figure {
  const body = `<path d="M30 190 L290 190 L30 40 Z" fill="#DFF3FF" stroke="#1F1A3D" stroke-width="3" stroke-linejoin="round"/>
  <path d="M30 170 h20 v20" fill="none" stroke="#1F1A3D" stroke-width="2"/>
  ${labels.a ? `<text x="150" y="222" font-size="24" font-family="PlexKR" fill="#1F1A3D">${labels.a}</text>` : ""}
  ${labels.b ? `<text x="0" y="122" font-size="24" font-family="PlexKR" fill="#1F1A3D">${labels.b}</text>` : ""}
  ${labels.c ? `<text x="168" y="104" font-size="24" font-family="PlexKR" fill="#2B48C8">${labels.c}</text>` : ""}`
  return svg(310, 230, body)
}

/** 직사각형 (가로·세로) */
export function rect(w: string, h: string): Figure {
  const body = `<rect x="80" y="10" width="260" height="140" fill="#DDF7EE" stroke="#1F1A3D" stroke-width="3"/>
  <text x="180" y="182" font-size="24" font-family="PlexKR" fill="#1F1A3D">${w}</text>
  <text x="0" y="88" font-size="24" font-family="PlexKR" fill="#1F1A3D">${h}</text>`
  return svg(350, 190, body)
}
