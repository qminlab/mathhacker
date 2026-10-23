import type { SuTemplate } from "../types"
import { DERIVATIVE } from "./derivative"
import { withJosa } from "./helpers"
import { INTEGRAL } from "./integral"
import { LIMITS } from "./limits"

export const CALCULUS: SuTemplate[] = [...LIMITS, ...DERIVATIVE, ...INTEGRAL].map(withJosa)
