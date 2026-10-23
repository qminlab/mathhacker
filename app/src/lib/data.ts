// 화면에서 쓰는 데이터 훅 (react-query로 캐시·다시 불러오기)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Backend } from "./backend"
import { demoBackend } from "./demoBackend"
import { env } from "./env"
import { supabaseBackend } from "./supabaseBackend"
import type { Settings } from "./types"

export const backend: Backend = env.demo ? demoBackend : supabaseBackend

export const keys = {
  profile: ["profile"] as const,
  settings: ["settings"] as const,
  workbooks: ["workbooks"] as const,
  workbook: (id: number) => ["workbook", id] as const,
  ingests: ["ingests"] as const,
  session: (id: number) => ["session", id] as const,
  wrong: ["wrong"] as const,
  stats: (days: number) => ["stats", days] as const,
  images: (paths: string[]) => ["images", ...paths] as const,
  daily: ["daily"] as const,
}

export function useProfile() {
  return useQuery({ queryKey: keys.profile, queryFn: () => backend.profile() })
}

export function useSettings() {
  return useQuery({ queryKey: keys.settings, queryFn: () => backend.settings() })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (s: Settings) => backend.saveSettings(s),
    onMutate: async (s) => {
      await qc.cancelQueries({ queryKey: keys.settings })
      const prev = qc.getQueryData<Settings>(keys.settings)
      qc.setQueryData(keys.settings, s)
      return { prev }
    },
    onError: (_e, _s, ctx) => ctx?.prev && qc.setQueryData(keys.settings, ctx.prev),
  })
}

export function useWorkbooks() {
  return useQuery({ queryKey: keys.workbooks, queryFn: () => backend.workbooks() })
}

export function useWorkbook(id: number) {
  return useQuery({ queryKey: keys.workbook(id), queryFn: () => backend.workbook(id), enabled: Number.isFinite(id) })
}

/** 업로드 처리 상태. 처리 중인 것이 있으면 3초마다 새로 읽는다. */
export function useIngests() {
  return useQuery({
    queryKey: keys.ingests,
    queryFn: () => backend.ingests(),
    refetchInterval: (q) => (q.state.data?.some((s) => s.status === "processing" || s.status === "uploaded") ? 3000 : false),
  })
}

/** 오늘의 데일리 세트 (없으면 만든다) + 그 세트의 풀이 기록 */
export function useDaily() {
  return useQuery({
    queryKey: keys.daily,
    queryFn: async () => backend.sessionBundle((await backend.startDaily()).id),
  })
}

export function useSessionBundle(id: number) {
  return useQuery({
    queryKey: keys.session(id),
    queryFn: () => backend.sessionBundle(id),
    enabled: Number.isFinite(id),
    // 풀이 중에는 화면 상태가 기준이라 다시 읽지 않고, 화면을 닫으면 캐시를 버려서
    // 다음에 열 때 그사이 제출한 풀이까지 새로 읽는다
    staleTime: Infinity,
    gcTime: 0,
  })
}

export function useWrongNotes() {
  return useQuery({ queryKey: keys.wrong, queryFn: () => backend.wrongNotes() })
}

export function useStats(days: number) {
  return useQuery({ queryKey: keys.stats(days), queryFn: () => backend.stats(days) })
}

/** 문제 이미지 주소 (서명 URL은 1시간 유효, 50분마다 새로 받는다) */
export function useImageSources(paths: (string | null | undefined)[]) {
  const list = [...new Set(paths.filter((p): p is string => !!p))].sort()
  return useQuery({
    queryKey: keys.images(list),
    queryFn: () => backend.imageSources(list),
    enabled: list.length > 0,
    staleTime: 50 * 60_000,
    refetchInterval: 50 * 60_000,
  })
}

/** 풀이 기록이 바뀌면 다시 읽어야 하는 것들 */
export function invalidateProgress(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.workbooks })
  qc.invalidateQueries({ queryKey: ["workbook"] })
  qc.invalidateQueries({ queryKey: keys.wrong })
  qc.invalidateQueries({ queryKey: ["stats"] })
  qc.invalidateQueries({ queryKey: keys.daily })
}
