import type { SuTemplate } from "../types"
import { EXAMPLES } from "./examples"
import { EXP } from "./exp"
import { SEQS } from "./seq"
import { TRIGS } from "./trig"

/** 대수: 지수함수와 로그함수 / 삼각함수 / 수열 */
export const ALGEBRA: SuTemplate[] = [...EXAMPLES, ...EXP, ...TRIGS, ...SEQS]
