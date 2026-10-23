// 게임 요소: XP·레벨·뱃지 (XP 계산 규칙은 supabase/schema.sql의 my_progress()와 같다)
import type { Result } from "./types"

export type Progress = {
  xp: number
  solved: number
  correct: number
  streak: number
  best_streak: number
  active_today: boolean
  today_solved: number
  week: { day: string; active: boolean }[]
  perfect_sets: number
  comebacks: number
  no_hint_correct: number
  days_active: number
}

export const EMPTY_PROGRESS: Progress = {
  xp: 0, solved: 0, correct: 0, streak: 0, best_streak: 0, active_today: false, today_solved: 0,
  week: [], perfect_sets: 0, comebacks: 0, no_hint_correct: 0, days_active: 0,
}

/** 한 번 제출로 얻는 XP */
export function xpFor(result: Result, hintUsed: boolean) {
  if (result === "correct") return 10 + (hintUsed ? 0 : 5)
  if (result === "wrong") return 2
  return 0
}

/** 레벨 L이 되는 데 필요한 누적 XP: 0, 60, 180, 360, 600 … (레벨이 오를수록 조금씩 더) */
export function xpToReach(level: number) {
  return 30 * (level - 1) * level
}

export function levelInfo(xp: number) {
  let level = 1
  while (xpToReach(level + 1) <= xp) level++
  const floor = xpToReach(level)
  const next = xpToReach(level + 1)
  return { level, into: xp - floor, need: next - floor, ratio: (xp - floor) / (next - floor) }
}

const TITLES = ["새싹 해커", "연습생 해커", "꾸준한 해커", "문제 사냥꾼", "풀이 장인", "수학 해커", "전설의 해커"]
export function levelTitle(level: number) {
  return TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))]
}

export type Badge = {
  id: string
  emoji: string
  name: string
  how: string
  /** 현재 값 / 목표 */
  value: (p: Progress) => number
  goal: number
}

export const BADGES: Badge[] = [
  { id: "first", emoji: "🎯", name: "첫 정답", how: "문제를 처음 맞혀요", value: (p) => p.correct, goal: 1 },
  { id: "solve10", emoji: "✏️", name: "열 문제", how: "10문제를 풀어요", value: (p) => p.solved, goal: 10 },
  { id: "solve100", emoji: "📚", name: "백 문제", how: "100문제를 풀어요", value: (p) => p.solved, goal: 100 },
  { id: "solve500", emoji: "🏆", name: "오백 문제", how: "500문제를 풀어요", value: (p) => p.solved, goal: 500 },
  { id: "streak3", emoji: "🔥", name: "3일 연속", how: "3일 연속으로 풀어요", value: (p) => p.best_streak, goal: 3 },
  { id: "streak7", emoji: "⚡", name: "일주일 개근", how: "7일 연속으로 풀어요", value: (p) => p.best_streak, goal: 7 },
  { id: "streak30", emoji: "👑", name: "한 달 개근", how: "30일 연속으로 풀어요", value: (p) => p.best_streak, goal: 30 },
  { id: "perfect", emoji: "💯", name: "만점 세트", how: "3문제 이상 세트를 다 맞혀요", value: (p) => p.perfect_sets, goal: 1 },
  { id: "comeback", emoji: "🔁", name: "오답 정복", how: "틀린 문제를 다시 풀어 맞혀요", value: (p) => p.comebacks, goal: 1 },
  { id: "comeback20", emoji: "🛡️", name: "오답 사냥꾼", how: "틀린 문제 20개를 정복해요", value: (p) => p.comebacks, goal: 20 },
  { id: "nohint50", emoji: "🧠", name: "힌트 없이", how: "힌트 없이 50문제를 맞혀요", value: (p) => p.no_hint_correct, goal: 50 },
]

export function badgeState(p: Progress) {
  return BADGES.map((b) => {
    const v = b.value(p)
    return { ...b, current: Math.min(v, b.goal), earned: v >= b.goal }
  })
}

/** 방금 풀이로 새로 딴 뱃지 */
export function newlyEarned(before: Progress, after: Progress) {
  return BADGES.filter((b) => b.value(before) < b.goal && b.value(after) >= b.goal)
}
