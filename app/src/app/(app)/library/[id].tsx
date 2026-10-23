// 문제집 상세: 문제 격자, 순서대로 풀기, 답지·정답 관리
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { Pressable, View } from "react-native"
import { ProblemThumb } from "@/features/ProblemThumb"
import { confirmAsync, notify, useStartPractice } from "@/features/practice/useStartPractice"
import { backend, keys, useImageSources, useWorkbook } from "@/lib/data"
import { Button, ErrorNote, Progress, Segmented, Sheet } from "@/ui/controls"
import { Grid } from "@/ui/Grid"
import { Icon } from "@/ui/Icon"
import { useFormFactor } from "@/ui/layout"
import { Screen } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { color, space } from "@/ui/theme"

type Filter = "all" | "todo" | "wrong"

export default function WorkbookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const workbookId = Number(id)
  const q = useWorkbook(workbookId)
  const images = useImageSources(q.data?.problems.map((p) => p.image_path) ?? [])
  const start = useStartPractice()
  const qc = useQueryClient()
  const { isPhone } = useFormFactor()
  const [filter, setFilter] = useState<Filter>("all")

  const remove = useMutation({
    mutationFn: () => backend.deleteWorkbook(workbookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.workbooks })
      router.back()
    },
    onError: (e) => notify("지우지 못했어요", e instanceof Error ? e.message : undefined),
  })

  const back = (
    <Pressable onPress={() => router.back()} accessibilityRole="link" style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 4 }}>
      <Icon name="chevronLeft" size={18} tint={color.inkSoft} />
      <Text tone="soft">문제집</Text>
    </Pressable>
  )

  if (q.error) {
    return (
      <Screen title="문제집" back={back}>
        <ErrorNote message={(q.error as Error).message} onRetry={() => q.refetch()} />
      </Screen>
    )
  }
  if (!q.data) return <Screen title=" " back={back}>{null}</Screen>

  const { workbook: w, problems } = q.data
  const wrongIds = problems.filter((p) => p.last_result === "wrong" || p.last_result === "gave_up").map((p) => p.id)
  const shown = problems.filter((p) =>
    filter === "todo" ? !p.last_result : filter === "wrong" ? p.last_result === "wrong" || p.last_result === "gave_up" : true
  )
  const missing = problems.filter((p) => !p.answer).length

  return (
    <Screen
      title={w.title}
      subtitle={[w.unit, w.chapter].filter(Boolean).join(", ") || undefined}
      back={back}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
    >
      <Sheet style={{ gap: space.lg }}>
        <View style={{ flexDirection: isPhone ? "column" : "row", gap: space.lg, alignItems: isPhone ? "stretch" : "center" }}>
          <View style={{ flex: 1, gap: space.sm }}>
            <Text tabular>
              <Text weight="bold">{w.solved}</Text>
              <Text tone="soft">/{w.total}문제 풂</Text>
              {w.solved ? <Text tone="soft">, {w.correct}문제 맞음</Text> : null}
            </Text>
            <Progress value={w.solved} total={w.total} />
          </View>
          <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
            <Button
              label={w.solved === 0 ? "처음부터 풀기" : "이어서 풀기"}
              icon="play"
              disabled={w.solved >= w.total}
              loading={start.isPending && start.variables?.mode === "sequence"}
              onPress={() => start.mutate({ mode: "sequence", workbookId })}
            />
            {wrongIds.length ? (
              <Button
                label={`틀린 ${wrongIds.length}문제`}
                kind="secondary"
                icon="refresh"
                loading={start.isPending && start.variables?.mode === "wrong"}
                onPress={() => start.mutate({ mode: "wrong", workbookId, problemIds: wrongIds })}
              />
            ) : null}
          </View>
        </View>

        {w.is_mine ? (
          <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap", paddingTop: space.md, borderTopWidth: 1, borderTopColor: color.grid }}>
            <Button
              label={missing ? `답지 올리기 (정답 없음 ${missing})` : "답지 다시 올리기"}
              kind="secondary"
              size="sm"
              icon="upload"
              onPress={() => router.push({ pathname: "/upload", params: { kind: "answers", workbookId: String(workbookId) } })}
            />
            <Button label="정답 보기·고치기" kind="secondary" size="sm" icon="key" onPress={() => router.push(`/library/answers/${workbookId}`)} />
            <Button
              label="문제집 지우기"
              kind="danger"
              size="sm"
              icon="trash"
              loading={remove.isPending}
              onPress={async () => {
                const ok = await confirmAsync(
                  "문제집을 지울까요?",
                  `"${w.title}"의 문제 ${w.total}개와 풀이 기록이 모두 지워지고 되돌릴 수 없어요.`,
                  "지우기",
                  true
                )
                if (ok) remove.mutate()
              }}
            />
          </View>
        ) : null}
      </Sheet>

      <View style={{ maxWidth: 420 }}>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `전체 ${problems.length}` },
            { value: "todo", label: `안 푼 ${problems.length - w.solved}` },
            { value: "wrong", label: `틀린 ${wrongIds.length}` },
          ]}
        />
      </View>

      {shown.length === 0 ? (
        <Text tone="soft">{filter === "wrong" ? "틀린 문제가 없어요." : "다 풀었어요."}</Text>
      ) : (
        <Grid
          items={shown}
          minWidth={isPhone ? 150 : 200}
          gap={space.md}
          keyOf={(p) => p.id}
          render={(p) => (
            <ProblemThumb
              number={p.workbook_number}
              source={p.image_path ? images.data?.[p.image_path] : undefined}
              result={p.last_result}
              hasAnswer={!!p.answer}
              onPress={() => start.mutate({ mode: "sequence", workbookId, problemIds: [p.id] })}
            />
          )}
        />
      )}
    </Screen>
  )
}
