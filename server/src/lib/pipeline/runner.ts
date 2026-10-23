// 응답을 보낸 뒤 처리하고, 함수 시간 제한이 가까우면 멈췄다가 새 함수 호출로 이어 간다.
import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { after } from "next/server"
import { runIngest } from "./engine"
import { productionDeps } from "./supabaseRepo"

/** 라우트의 maxDuration(300초)보다 넉넉히 짧게: 이 시간이 지나면 다음 페이지를 시작하지 않는다 */
const BUDGET_MS = 230_000

function secret() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.")
  return key
}

/** 이어서 처리하기 요청이 서버 자신에게서 왔는지 확인하는 토큰 */
export function continueToken(sessionId: number) {
  return createHmac("sha256", secret()).update(`ingest-continue:${sessionId}`).digest("hex")
}

export function verifyContinueToken(sessionId: number, token: string | null) {
  if (!token) return false
  const expected = Buffer.from(continueToken(sessionId))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export function scheduleIngest(sessionId: number, origin: string) {
  after(async () => {
    const outcome = await runIngest(sessionId, productionDeps(Date.now() + BUDGET_MS))
    if (outcome !== "paused") return
    try {
      await fetch(`${origin}/api/ingest/${sessionId}/continue`, {
        method: "POST",
        headers: { "x-ingest-token": continueToken(sessionId) },
      })
    } catch (e) {
      // 이어 가기를 못 하면 세션은 processing으로 남고, 6분 뒤 앱의 '다시 시도'로 이어진다
      console.error(`[ingest ${sessionId}] continue failed`, e)
    }
  })
}
