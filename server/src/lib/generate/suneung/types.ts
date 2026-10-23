// 수능 문제 은행 (2028학년도~ 수능 범위: 대수, 미적분Ⅰ, 확률과 통계 / 2022 개정 교육과정)
//
// 모든 템플릿은 세 부분으로 나뉜다.
//   params(r)  : 난수로 문제의 수치를 고른다. 문제가 성립하지 않으면 null (다시 뽑는다)
//   build(p)   : 문제 문장·보기·정답·해설을 만든다 (사람이 읽는 풀이 흐름대로 계산)
//   verify(p)  : 같은 수치로 정답을 "다른 방법"으로 다시 구한다 (완전 탐색, 수치 미분·적분, 직접 나열 등)
// 테스트가 모든 문제에서 build의 정답과 verify의 결과가 같은지 확인한다.

import type { Figure, Rng } from "../types"

export type Subject = "대수" | "미적분Ⅰ" | "확률과 통계"

export const SUBJECT_UNITS: Record<Subject, readonly string[]> = {
  대수: ["지수함수와 로그함수", "삼각함수", "수열"],
  "미적분Ⅰ": ["함수의 극한과 연속", "미분", "적분"],
  "확률과 통계": ["경우의 수", "확률", "통계"],
} as const

/**
 * 1 기초       : 개념 확인, 한두 단계 계산 (교과서 예제 수준)
 * 2 수능 기본  : 수능 2·3점 (1~15번, 16~20번 단답 앞쪽 수준)
 * 3 수능 4점   : 수능 4점 중 보통~어려운 문항 (조건 해석, 2~3단계 연결)
 * 4 고난도     : 수능 최상위·사설 모의고사 고난도 (여러 조건 결합, 경우 나누기)
 */
export type Level = 1 | 2 | 3 | 4
export const LEVEL_LABEL: Record<Level, string> = { 1: "기초", 2: "수능 기본", 3: "수능 4점", 4: "고난도" }
export const LEVEL_TAG: Record<Level, string> = { 1: "basic", 2: "standard", 3: "hard", 4: "killer" }

/** 보기 하나: 화면에 보이는 TeX와 그 값 (서로 다른 값인지 검사에 쓴다) */
export type Choice = { tex: string; value: number }

export type SuProblem = {
  /** 문제 문장. 수식은 $...$, 줄바꿈은 \n */
  text: string
  /** 객관식이면 보기 5개 (값이 작은 것부터) */
  choices?: string[]
  /** 객관식: "1"~"5", 단답형: 자연수 문자열 (1~999) */
  answer: string
  /** 정답의 실제 값 (객관식이면 정답 보기의 값) */
  value: number
  /** 객관식이면 보기마다의 값 */
  choiceValues?: number[]
  /** 해설: 풀이 순서대로, 문단은 \n */
  solution: string
  hint?: string
  figure?: Figure
  /** 배점 2·3·4 */
  score: 2 | 3 | 4
}

// 템플릿마다 매개변수 모양이 달라 목록에서는 any로 받는다
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SuTemplate<P = any> = {
  /** 과목 안에서 겹치지 않는 이름 (문제 id의 일부, 바꾸면 id가 바뀐다) */
  id: string
  subject: Subject
  unit: string
  /** 성취기준 코드 (예: 12대수01-04) */
  standard: string
  level: Level
  /** 이 템플릿으로 만들 문제 수 */
  count: number
  params: (r: Rng) => P | null
  build: (p: P, r: Rng) => SuProblem
  /** build와 다른 방법으로 구한 정답 값 */
  verify: (p: P) => number
}
