// 공용 문제 전체 목록: 단원(문제집)마다 템플릿 × perTemplate 문제
import { createHash } from "node:crypto"
import { elementary, kindergarten } from "./curriculum/elementary"
import { high } from "./curriculum/high"
import { middle } from "./curriculum/middle"
import { hashSeed, rng } from "./lib"
import { GRADE_LABEL, type GeneratedProblem, type Unit } from "./types"

export const UNITS: Unit[] = [...kindergarten, ...elementary, ...middle, ...high]

export const DEFAULT_PER_TEMPLATE = 20

export type BuiltProblem = GeneratedProblem & { id: string; number: number; templateId: string }
export type BuiltWorkbook = { key: string; title: string; grade: Unit["grade"]; unit: string; problems: BuiltProblem[] }

/** 같은 키면 같은 uuid (다시 넣어도 문제 id와 풀이 기록이 유지된다) */
export function stableUuid(key: string) {
  const h = createHash("sha1").update(`mathhacker:${key}`).digest("hex")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export function buildAll(perTemplate = DEFAULT_PER_TEMPLATE): BuiltWorkbook[] {
  return UNITS.map((u) => {
    const key = `${u.grade}/${u.slug}`
    const n = u.perTemplate ?? perTemplate
    const problems: BuiltProblem[] = []
    // 템플릿을 번갈아 가며 (한 문제집 안에서 유형이 섞이게)
    for (let i = 0; i < n; i++) {
      for (const t of u.templates) {
        const seenText = new Set(problems.map((p) => p.text + (p.figure?.svg ?? "")))
        let p: GeneratedProblem | null = null
        // 같은 문제가 나오면 다른 시드로 몇 번 더
        for (let tries = 0; tries < 8; tries++) {
          const cand = t.make(rng(hashSeed(`${key}/${t.id}/${i}/${tries}`)))
          if (!seenText.has(cand.text + (cand.figure?.svg ?? ""))) {
            p = cand
            break
          }
        }
        if (!p) continue
        problems.push({ ...p, id: stableUuid(`${key}/${t.id}/${i}`), number: problems.length + 1, templateId: t.id })
      }
    }
    return { key, title: `${GRADE_LABEL[u.grade]} · ${u.unit}`, grade: u.grade, unit: u.unit, problems }
  })
}
