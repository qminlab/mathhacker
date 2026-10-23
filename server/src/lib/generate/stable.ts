import { createHash } from "node:crypto"

/** 같은 키면 같은 uuid (다시 넣어도 문제 id와 풀이 기록이 유지된다) */
export function stableUuid(key: string) {
  const h = createHash("sha1").update(`mathhacker:${key}`).digest("hex")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`
}
