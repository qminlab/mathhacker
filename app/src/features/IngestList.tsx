// 올린 문제지·답지 처리 상태
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { backend, keys, useIngests } from "@/lib/data"
import type { IngestSession } from "@/lib/types"
import { Button, Progress, Sheet } from "@/ui/controls"
import { Text } from "@/ui/Text"
import { space } from "@/ui/theme"
import { useColors } from "@/ui/ThemeProvider"

function describe(s: IngestSession) {
  const what = s.kind === "answers" ? "답지" : "문제지"
  const name = s.title ?? what
  if (s.status === "failed") return { title: `${name} 처리 실패`, body: s.error ?? "다시 시도해 주세요." }
  if (s.status === "done") {
    const body =
      s.kind === "answers"
        ? `정답 ${s.result?.matched ?? 0}개를 넣었어요${s.result?.missing?.length ? `, 못 찾은 번호 ${s.result.missing.length}개` : ""}`
        : `문제 ${s.result?.problems ?? s.problem_count}개를 찾았어요${s.result?.truncated ? ". 40쪽까지만 처리했어요" : ""}`
    return { title: `${name} 완료`, body }
  }
  const pages = s.page_count ? `${s.processed_pages}/${s.page_count}쪽` : "준비 중"
  return { title: `${name} 읽는 중`, body: `${pages}${s.kind === "problems" && s.problem_count ? `, 문제 ${s.problem_count}개` : ""}` }
}

/** 최근 24시간 안의 처리 기록만 보여 준다 */
export function IngestList({ limit = 3 }: { limit?: number }) {
  const color = useColors()
  const { data } = useIngests()
  const qc = useQueryClient()
  const retry = useMutation({
    mutationFn: (id: number) => backend.retryIngest(id),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.ingests }),
  })

  // 처리가 끝나면 문제집 목록을 새로 읽는다
  const doneIds = useRef(new Set<number>())
  useEffect(() => {
    let changed = false
    for (const s of data ?? []) {
      if (s.status === "done" && !doneIds.current.has(s.id)) {
        doneIds.current.add(s.id)
        changed = true
      }
    }
    if (changed) {
      qc.invalidateQueries({ queryKey: keys.workbooks })
      qc.invalidateQueries({ queryKey: ["workbook"] })
      qc.invalidateQueries({ queryKey: keys.daily })
    }
  }, [data, qc])

  // 1분마다 갱신되는 현재 시각 (멈춘 세션 판단용)
  const [openedAt, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  const recent = (data ?? []).filter((s) => openedAt - new Date(s.created_at).getTime() < 24 * 3600_000).slice(0, limit)
  if (!recent.length) return null

  return (
    <View style={{ gap: space.sm }}>
      {recent.map((s) => {
        const d = describe(s)
        const quietFor = openedAt - new Date(s.updated_at ?? s.created_at).getTime()
        // 처리 중인데 6분 넘게 진행이 없거나, 올리기만 하고 시작을 못 한 세션은 다시 시도할 수 있게
        const stuck =
          (s.status === "processing" && quietFor > 6 * 60_000) || (s.status === "uploaded" && quietFor > 60_000)
        const busy = !stuck && (s.status === "processing" || s.status === "uploaded")
        return (
          <Sheet key={s.id} style={{ gap: space.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              {busy ? <ActivityIndicator color={color.blue} size="small" /> : null}
              <Text weight="display" style={{ flex: 1 }} numberOfLines={1}>
                {d.title}
              </Text>
              {s.status === "failed" || stuck ? (
                <Button label="다시 시도" kind="secondary" size="sm" icon="refresh" loading={retry.isPending && retry.variables === s.id} onPress={() => retry.mutate(s.id)} />
              ) : null}
            </View>
            <Text variant="small" tone={s.status === "failed" ? "red" : s.status === "done" ? "mint" : "soft"}>
              {stuck ? "진행이 멈췄어요. 다시 시도하면 읽은 쪽 다음부터 이어서 해요." : d.body}
            </Text>
            {busy && s.page_count ? <Progress value={s.processed_pages} total={s.page_count} height={10} tone="primary" /> : null}
          </Sheet>
        )
      })}
    </View>
  )
}
