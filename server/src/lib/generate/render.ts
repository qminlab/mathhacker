// 생성한 문제를 PNG 한 장으로 그린다 (업로드해서 잘라 낸 문제와 같은 모양).
// - 글자: IBM Plex Sans KR (OFL, assets/fonts에 동봉)
// - 수식: 본문의 $...$ 를 MathJax로 SVG로 바꿔 그림으로 붙인다 (시스템 글꼴에 기대지 않음)
// - 그림: 문제마다 SVG 문자열 (유아용 사과·도형, 시계, 도형 등)
import { createCanvas, GlobalFonts, loadImage, type Image, type SKRSContext2D } from "@napi-rs/canvas"
import path from "node:path"
import { mathjax } from "mathjax-full/js/mathjax.js"
import { TeX } from "mathjax-full/js/input/tex.js"
import { SVG } from "mathjax-full/js/output/svg.js"
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js"
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js"
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js"
import type { GeneratedProblem } from "./types"

const FONT_DIR = path.join(process.cwd(), "assets", "fonts")
let fontsReady = false
function ensureFonts() {
  if (fontsReady) return
  GlobalFonts.registerFromPath(path.join(FONT_DIR, "IBMPlexSansKR_400Regular.ttf"), "PlexKR")
  GlobalFonts.registerFromPath(path.join(FONT_DIR, "IBMPlexSansKR_700Bold.ttf"), "PlexKRBold")
  fontsReady = true
}

const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)
const tex = new TeX({ packages: AllPackages })
const svgOut = new SVG({ fontCache: "none" })
const mjDoc = mathjax.document("", { InputJax: tex, OutputJax: svgOut })

const INK = "#1F1A3D"
const NUMBER = "#2B48C8"
const WIDTH = 900
const PAD = 40
const SIZE = 30 // 본문 글자 크기(px)
const LINE = 50 // 줄 높이
const EX = SIZE * 0.47 // MathJax 1ex 를 px로

type MathBox = { img: Image; w: number; h: number; depth: number }
const mathCache = new Map<string, Promise<MathBox>>()

function renderMath(src: string): Promise<MathBox> {
  const hit = mathCache.get(src)
  if (hit) return hit
  const p = (async () => {
    // 분수·극한·합은 크게 (교과서처럼)
    const tex = /\\(frac|lim|sum|int)/.test(src) && !src.includes("\\displaystyle") ? `\\displaystyle ${src}` : src
    // ",\ -3" 의 빼기가 이항 연산처럼 벌어지지 않게 묶는다
    const node = mjDoc.convert(tex.replace(/(,\\? ?)-(\d)/g, "$1{-}$2"), { display: false })
    let svg = adaptor.innerHTML(node)
    const wEx = Number(/width="([\d.]+)ex"/.exec(svg)?.[1] ?? 1)
    const hEx = Number(/height="([\d.]+)ex"/.exec(svg)?.[1] ?? 1)
    const vEx = Number(/vertical-align:\s*(-?[\d.]+)ex/.exec(svg)?.[1] ?? 0)
    const w = wEx * EX
    const h = hEx * EX
    svg = svg
      .replace(/width="[\d.]+ex"/, `width="${w * 2}"`)
      .replace(/height="[\d.]+ex"/, `height="${h * 2}"`)
      .replace(/currentColor/g, INK)
    if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
    const img = await loadImage(Buffer.from(svg))
    return { img, w, h, depth: -vEx * EX }
  })()
  mathCache.set(src, p)
  return p
}

type Token = { kind: "text"; s: string; w: number } | { kind: "math"; box: MathBox; w: number } | { kind: "br" }

async function tokenize(ctx: SKRSContext2D, text: string): Promise<Token[]> {
  const out: Token[] = []
  const parts = text.split(/(\$[^$]+\$)/)
  for (const part of parts) {
    if (!part) continue
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const box = await renderMath(part.slice(1, -1))
      out.push({ kind: "math", box, w: box.w })
      continue
    }
    const lines = part.split("\n")
    lines.forEach((line, i) => {
      if (i > 0) out.push({ kind: "br" })
      // 띄어쓰기 단위로 나누되 공백은 앞 낱말에 붙여 둔다
      for (const m of line.matchAll(/[^ ]+ *| +/g)) out.push({ kind: "text", s: m[0], w: ctx.measureText(m[0]).width })
    })
  }
  return out
}

type Placed = { t: Token; x: number; line: number }

type Layout = { placed: Placed[]; lines: number; tops: number[]; height: number }

function layout(tokens: Token[], width: number): Layout {
  const placed: Placed[] = []
  let x = 0
  let line = 0
  for (const t of tokens) {
    if (t.kind === "br") {
      line++
      x = 0
      continue
    }
    if (x > 0 && x + t.w > width) {
      line++
      x = 0
      if (t.kind === "text" && !t.s.trim()) continue
    }
    placed.push({ t, x, line })
    x += t.w
  }
  return finish(placed, placed.length ? line + 1 : 0)
}

/** 줄마다 높이: 기본 LINE, 큰 수식이 있으면 그만큼 넓힌다. baselines[i] = 줄 i의 글자 기준선 */
function finish(placed: Placed[], lines: number): Layout {
  const above = Array(lines).fill(SIZE)
  const below = Array(lines).fill(LINE - SIZE)
  for (const p of placed) {
    if (p.t.kind !== "math") continue
    above[p.line] = Math.max(above[p.line], p.t.box.h - p.t.box.depth + 6)
    below[p.line] = Math.max(below[p.line], p.t.box.depth + 12)
  }
  const tops: number[] = []
  let y = 0
  for (let i = 0; i < lines; i++) {
    tops.push(y + above[i])
    y += above[i] + below[i]
  }
  return { placed, lines, tops, height: y }
}

function drawPlaced(ctx: SKRSContext2D, l: Layout, left: number, top: number) {
  for (const p of l.placed) {
    const baseline = top + l.tops[p.line]
    if (p.t.kind === "text") ctx.fillText(p.t.s, left + p.x, baseline)
    else if (p.t.kind === "math") {
      const b = p.t.box
      ctx.drawImage(b.img, left + p.x, baseline - (b.h - b.depth), b.w, b.h)
    }
  }
}

const CIRCLED = ["①", "②", "③", "④", "⑤"]

/** 해설 그림: 머리에 "해설  정답 ③" */
export async function renderSolution(solution: string, answerLabel: string): Promise<Buffer> {
  return renderProblem({ text: solution, answer: "" }, 0, { header: `해설   정답 ${answerLabel}`, headerColor: "#0E9A6E", headerSize: 34 })
}

export async function renderProblem(
  p: Pick<GeneratedProblem, "text" | "choices" | "figure" | "answer">,
  number: number,
  opts: { header?: string; headerColor?: string; headerSize?: number } = {}
): Promise<Buffer> {
  ensureFonts()
  const measure = createCanvas(10, 10).getContext("2d")
  measure.font = `${SIZE}px PlexKR`
  const inner = WIDTH - PAD * 2

  const body = layout(await tokenize(measure, p.text), inner)

  // 보기: 다섯 개가 한 줄에 들어가면 한 줄, 아니면 두 줄(3+2), 그래도 길면 한 줄에 하나
  let choiceRows: { l: Layout; x: number; row: number }[] = []
  let choiceRowCount = 0
  const rowHeights: number[] = []
  if (p.choices) {
    const items = await Promise.all(p.choices.map((c, i) => tokenize(measure, `${CIRCLED[i]} ${c}`)))
    const widths = items.map((t) => t.reduce((s, k) => s + ("w" in k ? k.w : 0), 0))
    const maxW = Math.max(...widths)
    const perRow = maxW + 24 <= inner / 5 ? 5 : maxW + 24 <= inner / 3 ? 3 : 1
    const colW = inner / perRow
    choiceRows = items.map((t, i) => ({ l: layout(t, colW - 12), x: (i % perRow) * colW, row: Math.floor(i / perRow) }))
    choiceRowCount = Math.ceil(items.length / perRow)
    // 줄마다 그 줄에서 가장 높은 보기 높이
    for (let row = 0; row < choiceRowCount; row++) rowHeights.push(Math.max(...choiceRows.filter((c) => c.row === row).map((c) => c.l.height)) + 6)
  }

  const fig = p.figure ? await loadImage(Buffer.from(p.figure.svg)) : null
  const figH = p.figure ? p.figure.height : 0
  const figW = p.figure ? p.figure.width : 0

  const headerH = 52
  let height = PAD + headerH + body.height
  if (fig) height += 20 + figH
  if (choiceRowCount) height += 24 + rowHeights.reduce((a, b) => a + b, 0)
  height += PAD

  const canvas = createCanvas(WIDTH, Math.ceil(height))
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, WIDTH, height)

  ctx.fillStyle = opts.headerColor ?? NUMBER
  ctx.font = `${opts.headerSize ?? 44}px PlexKRBold`
  ctx.fillText(opts.header ?? String(number).padStart(3, "0"), PAD, PAD + 40)

  ctx.fillStyle = INK
  ctx.font = `${SIZE}px PlexKR`
  let y = PAD + headerH
  drawPlaced(ctx, body, PAD, y)
  y += body.height

  if (fig) {
    y += 20
    ctx.drawImage(fig, PAD + (p.figure!.align === "left" ? 0 : (inner - figW) / 2), y, figW, figH)
    y += figH
  }
  if (choiceRowCount) {
    y += 24
    const rowTop = rowHeights.map((_, i) => rowHeights.slice(0, i).reduce((a, b) => a + b, 0))
    for (const c of choiceRows) drawPlaced(ctx, c.l, PAD + c.x, y + rowTop[c.row])
  }
  return canvas.toBuffer("image/png")
}
