// GET /api/health — 앱이 서버 주소가 맞는지 확인할 때 쓴다
import { json, preflight } from "@/lib/http"

export const OPTIONS = preflight

export function GET() {
  return json({
    ok: true,
    service: "squoo",
    ocr: Boolean(process.env.MATHPIX_APP_ID && process.env.MATHPIX_APP_KEY),
  })
}
