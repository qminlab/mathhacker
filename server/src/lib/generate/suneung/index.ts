// 수능 문제 은행: 템플릿 등록과 생성
import { hashSeed, rng } from "../lib"
import { stableUuid } from "../stable"
import { ALGEBRA } from "./algebra"
import { CALCULUS } from "./calculus"
import { STATS } from "./stats"
import { LEVEL_LABEL, LEVEL_TAG, SUBJECT_UNITS, type Level, type Subject, type SuProblem, type SuTemplate } from "./types"

export const TEMPLATES: SuTemplate[] = [...ALGEBRA, ...CALCULUS, ...STATS]

export type SuItem = SuProblem & {
  id: string
  template: SuTemplate
  params: unknown
  /** 템플릿 안에서 몇 번째 */
  k: number
}

export type SuWorkbook = {
  key: string
  title: string
  subject: Subject
  unit: string
  level: Level
  levelTag: string
  problems: (SuItem & { number: number })[]
}

const keyOf = (p: SuProblem) => `${p.text}|${(p.choices ?? []).join("|")}|${p.figure?.svg ?? ""}`

/** 템플릿 하나로 count개 (서로 다른 문제만). 시도가 너무 많으면 만든 데까지 */
export function generateTemplate(t: SuTemplate, seen = new Set<string>()): SuItem[] {
  const out: SuItem[] = []
  const maxTries = t.count * 40 + 200
  for (let tries = 0; out.length < t.count && tries < maxTries; tries++) {
    const r = rng(hashSeed(`su/${t.subject}/${t.id}/${tries}`))
    const params = t.params(r)
    if (params == null) continue
    const p = t.build(params, r)
    const key = keyOf(p)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...p, id: stableUuid(`su/${t.subject}/${t.id}/${out.length}`), template: t, params, k: out.length })
  }
  return out
}

export function buildSuneung(templates = TEMPLATES): SuWorkbook[] {
  const seen = new Set<string>()
  const items = templates.flatMap((t) => generateTemplate(t, seen))
  const books: SuWorkbook[] = []
  for (const subject of Object.keys(SUBJECT_UNITS) as Subject[]) {
    for (const unit of SUBJECT_UNITS[subject]) {
      for (const level of [1, 2, 3, 4] as Level[]) {
        const list = items.filter((i) => i.template.subject === subject && i.template.unit === unit && i.template.level === level)
        if (!list.length) continue
        // 같은 유형이 몰리지 않게 템플릿을 번갈아 배치
        const byT = new Map<string, SuItem[]>()
        for (const it of list) byT.set(it.template.id, [...(byT.get(it.template.id) ?? []), it])
        const queues = [...byT.values()]
        const ordered: SuItem[] = []
        while (queues.some((q) => q.length)) for (const q of queues) if (q.length) ordered.push(q.shift()!)
        books.push({
          key: `su/${subject}/${unit}/${level}`,
          title: `수능 · ${subject} · ${unit} · ${LEVEL_LABEL[level]}`,
          subject,
          unit,
          level,
          levelTag: LEVEL_TAG[level],
          problems: ordered.map((p, i) => ({ ...p, number: i + 1 })),
        })
      }
    }
  }
  return books
}
