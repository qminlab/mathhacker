// 문제집 목록
import { Link, router } from "expo-router"
import { Pressable, View } from "react-native"
import { IngestList } from "@/features/IngestList"
import { useWorkbooks } from "@/lib/data"
import type { WorkbookSummary } from "@/lib/types"
import { Button, Empty, ErrorNote, Progress, type PressState } from "@/ui/controls"
import { Grid } from "@/ui/Grid"
import { useFormFactor } from "@/ui/layout"
import { Screen } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { color, radius, space } from "@/ui/theme"

function WorkbookCard({ w }: { w: WorkbookSummary }) {
  const rate = w.solved ? Math.round((w.correct / w.solved) * 100) : null
  const missingAnswers = w.total - w.with_answer
  return (
    <Link href={`/library/${w.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${w.title}, ${w.total}문제 중 ${w.solved}문제 풂`}
        style={({ pressed, hovered }: PressState) => ({
          backgroundColor: color.sheet,
          borderRadius: radius.sheet,
          borderWidth: 1,
          borderColor: hovered ? color.blue : color.grid,
          borderBottomWidth: 2,
          borderBottomColor: hovered ? color.blue : color.gridStrong,
          padding: space.lg,
          gap: space.md,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {/* 책등처럼 왼쪽에 파란 띠 */}
        <View style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 4, backgroundColor: color.blue, borderTopRightRadius: 2, borderBottomRightRadius: 2 }} />
        <View style={{ gap: 2 }}>
          <Text variant="bodyLarge" weight="bold" numberOfLines={2}>
            {w.title}
          </Text>
          {w.unit || w.chapter ? (
            <Text variant="small" tone="soft" numberOfLines={1}>
              {[w.unit, w.chapter].filter(Boolean).join(", ")}
            </Text>
          ) : null}
        </View>
        <Progress value={w.solved} total={w.total} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
          <Text variant="small" tone="soft" tabular>
            {w.solved}/{w.total}문제 풂
          </Text>
          <Text variant="small" tone={rate === null ? "faint" : "ink"} weight="medium" tabular>
            {rate === null ? "아직 안 풂" : `정답률 ${rate}%`}
          </Text>
        </View>
        {w.is_mine && w.total > 0 && missingAnswers > 0 ? (
          <Text variant="small" tone="blue" weight="medium">
            정답 없는 문제 {missingAnswers}개, 답지를 올려 주세요
          </Text>
        ) : null}
      </Pressable>
    </Link>
  )
}

export default function LibraryScreen() {
  const books = useWorkbooks()
  const { isPhone } = useFormFactor()

  return (
    <Screen
      title="문제집"
      subtitle="올린 문제지가 문제 단위로 정리돼 있어요."
      refreshing={books.isRefetching}
      onRefresh={() => books.refetch()}
      action={<Button label="문제지 올리기" icon="upload" onPress={() => router.push("/upload")} size={isPhone ? "sm" : "md"} />}
    >
      <IngestList limit={5} />
      {books.error ? <ErrorNote message={(books.error as Error).message} onRetry={() => books.refetch()} /> : null}
      {books.data && books.data.length === 0 ? (
        <Empty
          title="아직 문제집이 없어요"
          body="가지고 있는 문제지 PDF를 올리면 문제 번호를 찾아 한 문제씩 잘라 둡니다. 빠른정답 PDF도 올리면 자동으로 채점해요."
          action={<Button label="문제지 올리기" icon="upload" onPress={() => router.push("/upload")} />}
        />
      ) : null}
      <Grid items={books.data ?? []} minWidth={280} gap={space.lg} keyOf={(w) => w.id} render={(w) => <WorkbookCard w={w} />} />
    </Screen>
  )
}
