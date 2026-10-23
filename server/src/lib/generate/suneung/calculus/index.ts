import type { SuTemplate } from "../types"
import { DERIVATIVE } from "./derivative"
import { LIMITS } from "./limits"

export const CALCULUS: SuTemplate[] = [...LIMITS, ...DERIVATIVE]
