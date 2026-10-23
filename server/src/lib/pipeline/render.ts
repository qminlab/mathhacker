// PDF 페이지 → PNG (서버에서 렌더링)
// pdfjs-dist(legacy 빌드)로 그리고 @napi-rs/canvas로 PNG를 만든다.
import "server-only"
import { createCanvas } from "@napi-rs/canvas"
import path from "node:path"
import { pathToFileURL } from "node:url"

// 216dpi 정도. Mathpix 인식에 충분하고 메모리를 아낀다.
export const RENDER_SCALE = 3

export type RenderedPage = {
  pageNumber: number
  png: Buffer
  width: number
  height: number
}

// 글꼴이 들어 있지 않은 PDF(특히 한글 CID 글꼴)를 그리려면 pdfjs의 CMap·표준 글꼴 파일이 필요하다.
// next.config.ts의 outputFileTracingIncludes로 배포본에 함께 넣는다.
const PDFJS_DIR = path.join(process.cwd(), "node_modules", "pdfjs-dist")
const CMAP_URL = pathToFileURL(path.join(PDFJS_DIR, "cmaps") + path.sep).href
const STANDARD_FONT_URL = pathToFileURL(path.join(PDFJS_DIR, "standard_fonts") + path.sep).href

async function loadPdfjs() {
  // Node에서는 legacy 빌드를 써야 한다 (DOM API 없음)
  return import("pdfjs-dist/legacy/build/pdf.mjs")
}

export async function openPdf(data: Uint8Array) {
  const pdfjs = await loadPdfjs()
  const task = pdfjs.getDocument({
    data,
    // 서버에는 글꼴이 없으니 PDF에 들어 있는 글꼴만 쓴다
    disableFontFace: true,
    useSystemFonts: false,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_URL,
  })
  const doc = await task.promise
  return {
    pageCount: doc.numPages,
    async render(pageNumber: number, scale = RENDER_SCALE): Promise<RenderedPage> {
      const page = await doc.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      const width = Math.ceil(viewport.width)
      const height = Math.ceil(viewport.height)
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise
      page.cleanup()
      return { pageNumber, png: canvas.toBuffer("image/png"), width, height }
    },
    async close() {
      await task.destroy()
    },
  }
}
