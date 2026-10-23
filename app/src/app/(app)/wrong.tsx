// 오답노트: 마지막으로 틀리거나 포기한 문제
import { View } from "react-native"
import { ProblemThumb } from "@/features/ProblemThumb"
import { useStartPractice } from "@/features/practice/useStartPractice"
import { useImageSources, useWrongNotes } from "@/lib/data"
import { Button, Empty, ErrorNote } from "@/ui/controls"
import { Grid } from "@/ui/Grid"
import { useFormFactor } from "@/ui/layout"
import { Screen, SectionTitle } from "@/ui/Screen"
import { space } from "@/ui/theme"

export default function WrongScreen() {
  const q = useWrongNotes()
  const images = useImageSources(q.data?.map((p) => p.image_path) ?? [])
  const start = useStartPractice()
  const { isPhone } = useFormFactor()
  const items = q.data ?? []

  // 문제집별로 묶는다
  const groups = new Map<string, typeof items>()
  for (const p of items) groups.set(p.workbook_title, [...(groups.get(p.workbook_title) ?? []), p])

  return (
    <Screen
      title="오답노트"
      subtitle={items.length ? `다시 맞힐 때까지 여기 남아 있어요. ${items.length}문제` : undefined}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      action={
        items.length ? (
          <Button
            label="전부 다시 풀기"
            icon="refresh"
            size={isPhone ? "sm" : "md"}
            loading={start.isPending && !start.variables?.problemIds?.length}
            onPress={() => start.mutate({ mode: "wrong" })}
          />
        ) : undefined
      }
    >
      {q.error ? <ErrorNote message={(q.error as Error).message} onRetry={() => q.refetch()} /> : null}
      {q.data && !items.length ? (
        <Empty title="틀린 문제가 없어요" body="틀리거나 포기한 문제는 여기 모여요. 다시 풀어서 맞히면 빠져요." />
      ) : null}
      {[...groups].map(([title, list]) => (
        <View key={title} style={{ gap: space.md }}>
          <SectionTitle
            aside={
              <Button
                label={`${list.length}문제 풀기`}
                kind="secondary"
                size="sm"
                onPress={() => start.mutate({ mode: "wrong", workbookId: list[0].workbook_id, problemIds: list.map((p) => p.id) })}
              />
            }
          >
            {title}
          </SectionTitle>
          <Grid
            items={list}
            minWidth={isPhone ? 150 : 200}
            gap={space.md}
            keyOf={(p) => p.id}
            render={(p) => (
              <ProblemThumb
                number={p.workbook_number}
                source={p.image_path ? images.data?.[p.image_path] : undefined}
                result="wrong"
                hasAnswer={!!p.answer}
                onPress={() => start.mutate({ mode: "wrong", workbookId: p.workbook_id, problemIds: [p.id] })}
              />
            )}
          />
        </View>
      ))}
    </Screen>
  )
}
