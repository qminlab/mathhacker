// Mathpix OCR 호출 (이미지 1장 → 텍스트·수식·줄 좌표)
import "server-only"
import type { MathpixResult } from "./mathpix-types"

const ENDPOINT = "https://api.mathpix.com/v3/text"

export class MathpixError extends Error {}

function credentials() {
  const appId = process.env.MATHPIX_APP_ID
  const appKey = process.env.MATHPIX_APP_KEY
  if (!appId || !appKey) {
    throw new MathpixError("MATHPIX_APP_ID / MATHPIX_APP_KEY 환경변수가 없습니다.")
  }
  return { appId, appKey }
}

export async function ocrPage(png: Buffer, opts: { lineData: boolean }): Promise<MathpixResult> {
  const { appId, appKey } = credentials()

  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { app_id: appId, app_key: appKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          src: `data:image/png;base64,${png.toString("base64")}`,
          formats: ["text"],
          include_line_data: opts.lineData,
          rm_spaces: true,
        }),
        signal: AbortSignal.timeout(45_000),
      })
      if (res.status === 429 || res.status >= 500) {
        lastError = new MathpixError(`Mathpix ${res.status}`)
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        continue
      }
      const json = (await res.json()) as MathpixResult
      if (!res.ok || json.error) {
        throw new MathpixError(json.error ?? `Mathpix ${res.status}`)
      }
      return json
    } catch (e) {
      if (e instanceof MathpixError) throw e
      lastError = e
    }
  }
  throw lastError instanceof Error ? lastError : new MathpixError("Mathpix 호출 실패")
}
