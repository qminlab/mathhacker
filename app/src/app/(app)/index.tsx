// 오늘: 오늘의 세트를 바로 이어서 풀 수 있게
import { router } from "expo-router"
import { View } from "react-native"
import { AnswerStrip } from "@/features/AnswerStrip"
import { IngestList } from "@/features/IngestList"
import { useStartPractice } from "@/features/practice/useStartPractice"
import { formatMinutes } from "@/lib/answers"
import { useDaily, useProfile, useStats, useWorkbooks, useWrongNotes } from "@/lib/data"
import { Button, Empty, ErrorNote, Sheet } from "@/ui/controls"
import { useFormFactor } from "@/ui/layout"
import { Screen, SectionTitle } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { color, space } from "@/ui/theme"

function todayLabel() {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(new Date())
}

function DailyCard() {
  const daily = useDaily()
  const start = useStartPractice()
  const { isPhone } = useFormFactor()

  if (daily.isLoading) return <Sheet style={{ height: 200 }} />
  if (daily.error) return <ErrorNote message={(daily.error as Error).message} onRetry={() => daily.refetch()} />

  const bundle = daily.data!
  const total = bundle.problems.length
  const results = new Map(bundle.attempts.map((a) => [a.problem_id, a.result]))
  const done = bundle.problems.filter((p) => results.has(p.id)).length
  const correct = bundle.attempts.filter((a) => a.result === "correct").length
  const finished = total > 0 && done === total
  const nextIndex = bundle.problems.findIndex((p) => !results.has(p.id))

  if (total === 0) {
    return (
      <Sheet>
        <Empty
          title="오늘 풀 문제가 아직 없어요"
          body="문제지 PDF를 올리면 문제를 하나씩 잘라 두고, 매일 안 푼 문제 중에서 골라 드려요."
          action={<Button label="문제지 올리기" icon="upload" onPress={() => router.push("/upload")} />}
        />
      </Sheet>
    )
  }

  return (
    <Sheet style={{ gap: space.lg, padding: isPhone ? space.lg : space.xl }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
        <View style={{ gap: 2 }}>
          <Text variant="small" tone="soft" weight="medium">
            오늘의 세트
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.xs }}>
            {/* 형광펜 밑줄은 오늘 할 양에만 */}
            <View style={{ position: "absolute", left: -4, right: -4, bottom: 4, height: 16, backgroundColor: color.highlighter, opacity: 0.7, borderRadius: 2 }} />
            <Text variant="number" weight="bold" tabular>
              {done}/{total}
            </Text>
            <Text tone="soft">문제</Text>
          </View>
        </View>
        {finished ? (
          <Text tone="soft">
            {correct}문제 맞았어요. 내일 새 세트가 준비돼요.
          </Text>
        ) : (
          <Button
            label={done === 0 ? "풀기 시작" : "이어서 풀기"}
            icon="play"
            size="lg"
            loading={start.isPending}
            onPress={() => router.push(`/practice/${bundle.session.id}${nextIndex > 0 ? `?at=${nextIndex}` : ""}`)}
          />
        )}
      </View>
      <AnswerStrip
        size={isPhone ? 40 : 48}
        cells={bundle.problems.map((p, i) => ({
          key: p.id,
          label: String(p.workbook_number ?? i + 1),
          result: results.get(p.id) ?? null,
          current: i === nextIndex,
        }))}
      />
    </Sheet>
  )
}

function SideFacts() {
  const wrong = useWrongNotes()
  const stats = useStats(7)
  const start = useStartPractice()
  const t = stats.data?.totals
  const rate = t && t.total ? Math.round((t.correct / t.total) * 100) : null

  return (
    <View style={{ gap: space.md }}>
      <Sheet style={{ gap: space.sm }}>
        <Text variant="small" tone="soft" weight="medium">
          오답노트
        </Text>
        <Text variant="headline" weight="bold" tabular>
          {wrong.data?.length ?? "–"}문제
        </Text>
        <Button
          label="틀린 문제 다시 풀기"
          kind="secondary"
          size="sm"
          icon="refresh"
          disabled={!wrong.data?.length}
          loading={start.isPending && start.variables?.mode === "wrong"}
          onPress={() => start.mutate({ mode: "wrong" })}
          style={{ alignSelf: "flex-start" }}
        />
      </Sheet>
      <Sheet style={{ gap: space.xs }}>
        <Text variant="small" tone="soft" weight="medium">
          최근 7일
        </Text>
        <Text variant="headline" weight="bold" tabular>
          {rate === null ? "기록 없음" : `정답률 ${rate}%`}
        </Text>
        {t && t.total ? (
          <Text variant="small" tone="soft">
            {t.total}문제, {formatMinutes(t.time_sec)} 풀었어요
          </Text>
        ) : null}
      </Sheet>
    </View>
  )
}

function ContinueBooks() {
  const books = useWorkbooks()
  const start = useStartPractice()
  const list = (books.data ?? []).filter((w) => w.total > 0 && w.solved < w.total).slice(0, 3)
  if (!list.length) return null
  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>순서대로 이어 풀기</SectionTitle>
      {list.map((w) => (
        <Sheet key={w.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold" numberOfLines={1}>
              {w.title}
            </Text>
            <Text variant="small" tone="soft">
              {w.total - w.solved}문제 남음
            </Text>
          </View>
          <Button
            label="풀기"
            kind="secondary"
            size="sm"
            loading={start.isPending && start.variables?.workbookId === w.id}
            onPress={() => start.mutate({ mode: "sequence", workbookId: w.id })}
          />
        </Sheet>
      ))}
    </View>
  )
}

export default function TodayScreen() {
  const profile = useProfile()
  const daily = useDaily()
  const { isPhone, width } = useFormFactor()
  const twoColumn = !isPhone && width >= 900
  const name = profile.data?.nickname

  return (
    <Screen
      title={todayLabel()}
      subtitle={name ? `${name}님, 오늘도 조금씩.` : undefined}
      refreshing={daily.isRefetching}
      onRefresh={() => daily.refetch()}
      action={!isPhone ? <Button label="문제지 올리기" icon="upload" kind="secondary" onPress={() => router.push("/upload")} /> : undefined}
    >
      <IngestList />
      <View style={{ flexDirection: twoColumn ? "row" : "column", gap: space.lg, alignItems: "flex-start" }}>
        <View style={{ flex: twoColumn ? 2 : undefined, width: twoColumn ? undefined : "100%", gap: space.lg }}>
          <DailyCard />
          <ContinueBooks />
        </View>
        <View style={{ flex: twoColumn ? 1 : undefined, width: twoColumn ? undefined : "100%" }}>
          <SideFacts />
        </View>
      </View>
    </Screen>
  )
}
