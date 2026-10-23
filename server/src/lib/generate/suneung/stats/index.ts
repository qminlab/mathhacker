import type { SuTemplate } from "../types"
import { COUNTING } from "./counting"
import { PROBABILITY } from "./probability"
import { STATISTICS } from "./statistics"

export const STATS: SuTemplate[] = [...COUNTING, ...PROBABILITY, ...STATISTICS]
