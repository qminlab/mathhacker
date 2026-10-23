import type { SuTemplate } from "../types"
import { EXAMPLES } from "./examples"
import { EXP } from "./exp"
import { fixJosa } from "./helpers"
import { SEQS } from "./seq"
import { TRIGS } from "./trig"

/** 숫자 뒤 조사를 받침에 맞게 다듬는다 (문장·보기·해설) */
const tidy = (t: SuTemplate): SuTemplate => ({
  ...t,
  build: (p, r) => {
    const out = t.build(p, r)
    return { ...out, text: fixJosa(out.text), solution: fixJosa(out.solution), hint: out.hint && fixJosa(out.hint) }
  },
})

/** 대수: 지수함수와 로그함수 / 삼각함수 / 수열 */
export const ALGEBRA: SuTemplate[] = [...EXAMPLES, ...EXP, ...TRIGS, ...SEQS].map(tidy)
