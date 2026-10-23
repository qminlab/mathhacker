// API 응답·에러·CORS 공통 처리
import { NextResponse } from "next/server"
import { HttpError } from "./auth"

// 앱(네이티브)은 CORS와 무관하고, 웹 빌드(Expo web)만 다른 출처에서 호출한다.
// 쿠키가 아니라 Bearer 토큰을 쓰므로 모든 출처를 허용해도 된다.
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/** 라우트 핸들러를 감싸서 HttpError는 그 상태 코드로, 나머지는 500으로 돌려준다 */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status)
      console.error("[api] unexpected error", e)
      return json({ error: "서버 에러가 발생했습니다." }, 500)
    }
  }
}
