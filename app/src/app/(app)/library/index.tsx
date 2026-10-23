// 문제집 목록
import { Link, router } from "expo-router"
import { useState } from "react"
import { Pressable, ScrollView, View } from "react-native"
import { GradeChip } from "@/features/GradePicker"
import { IngestList } from "@/features/IngestList"
import { useSettings, useWorkbooks } from "@/lib/data"
import { GRADE_LABEL, gradeOrder, GRADES, type Grade } from "@/lib/grades"
import type { WorkbookSummary } from "@/lib/types"
import { Button, Empty, ErrorNote, Progress } from "@/ui/controls"
import { Grid } from "@/ui/Grid"
import { useFormFactor } from "@/ui/layout"
import { Screen, SectionTitle } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { LIP, radius, space, type Tone } from "@/ui/theme"
import { useColors, useTones } from "@/ui/ThemeProvider"

const COVERS: Tone[] = ["primary", "sky", "mint", "coral", "flame", "sun"]

/** 문제집 카드: 색 표지 + 진행 막대. 표지 색은 문제집마다 고정 */
function WorkbookCard({ w }: { w: WorkbookSummary }) {
  const color = useColors()
  const tones = useTones()
  const rate = w.solved ? Math.round((w.correct / w.solved) * 100) : null
  const missingAnswers = w.total - w.with_answer
  const t = tones[COVERS[w.id % COVERS.length]]
  const complete = w.total > 0 && w.solved >= w.total
  return (
    <Link href={`/library/${w.id}`} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={`${w.title}, ${w.total}문제 중 ${w.solved}문제 풂`}>
        {({ pressed }) => (
          <View style={{ paddingTop: pressed ? LIP : 0, paddingBottom: pressed ? 0 : LIP }}>
            <View
              style={{
                backgroundColor: color.surface,
                borderRadius: radius.card,
                borderWidth: 2,
                borderColor: color.line,
                borderBottomWidth: pressed ? 2 : 2 + LIP,
                overflow: "hidden",
              }}
            >
              {/* 표지 */}
              <View style={{ height: 92, backgroundColor: t.face, padding: space.lg, justifyContent: "space-between" }}>
                <View style={{ position: "absolute", right: -24, top: -24, width: 110, height: 110, borderRadius: 55, backgroundColor: "#FFFFFF", opacity: 0.14 }} />
                <View style={{ position: "absolute", right: 28, bottom: -36, width: 70, height: 70, borderRadius: 35, backgroundColor: "#FFFFFF", opacity: 0.1 }} />
                <Text variant="title" weight="display" numberOfLines={2} style={{ color: t.on }}>
                  {w.title}
                </Text>
                {complete ? (
                  <Text variant="small" weight="display" style={{ color: t.on }}>
                    다 풀었어요!
                  </Text>
                ) : null}
              </View>
              <View style={{ padding: space.lg, gap: space.md }}>
                {w.unit || w.chapter ? (
                  <Text variant="small" tone="soft" numberOfLines={1}>
                    {[w.unit, w.chapter].filter(Boolean).join(", ")}
                  </Text>
                ) : null}
                <Progress value={w.solved} total={w.total} tone={COVERS[w.id % COVERS.length]} height={12} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
                  <Text variant="body" weight="display" tabular>
                    {w.solved}/{w.total}
                  </Text>
                  <Text variant="small" tone={rate === null ? "faint" : "ink"} weight="bold" tabular>
                    {rate === null ? "아직 안 풂" : `정답률 ${rate}%`}
                  </Text>
                </View>
                {w.is_mine && w.total > 0 && missingAnswers > 0 ? (
                  <View style={{ backgroundColor: color.sunSoft, borderRadius: radius.chip, paddingHorizontal: space.md, paddingVertical: 8 }}>
                    <Text variant="small" weight="bold" tone="sun">
                      정답 없는 문제 {missingAnswers}개, 답지를 올려 주세요
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  )
}

export default function LibraryScreen() {
  const books = useWorkbooks()
  const settings = useSettings()
  const { isPhone } = useFormFactor()
  const all = books.data ?? []
  // 내 문제집(과 예전 공용 문제집) / 학년별 공용 문제집
  const mine = all.filter((w) => !w.grade)
  const shared = all.filter((w) => w.grade).sort((a, b) => gradeOrder(a.grade) - gradeOrder(b.grade) || a.id - b.id)
  const sharedGrades = GRADES.filter((g) => shared.some((w) => w.grade === g))
  const [picked, setPicked] = useState<Grade | null>(null)
  const grade: Grade | undefined = picked ?? (settings.data?.grade && sharedGrades.includes(settings.data.grade) ? settings.data.grade : sharedGrades[0])
  const gradeBooks = shared.filter((w) => w.grade === grade)

  return (
    <Screen
      title="문제집"
      subtitle="내가 올린 문제지와 학년별 공용 문제집"
      refreshing={books.isRefetching}
      onRefresh={() => books.refetch()}
      action={<Button label="문제지 올리기" icon="upload" onPress={() => router.push("/upload")} size={isPhone ? "sm" : "md"} />}
    >
      <IngestList limit={5} />
      {books.error ? <ErrorNote message={(books.error as Error).message} onRetry={() => books.refetch()} /> : null}

      <SectionTitle>내 문제집</SectionTitle>
      {books.data && mine.length === 0 ? (
        <Empty
          title="아직 올린 문제지가 없어요"
          body="가지고 있는 문제지 PDF를 올리면 문제 번호를 찾아 한 문제씩 잘라 둡니다. 빠른정답 PDF도 올리면 자동으로 채점해요."
          action={<Button label="문제지 올리기" icon="upload" onPress={() => router.push("/upload")} />}
        />
      ) : null}
      <Grid items={mine} minWidth={280} gap={space.lg} keyOf={(w) => w.id} render={(w) => <WorkbookCard w={w} />} />

      {shared.length ? (
        <>
          <SectionTitle>공용 문제집</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingBottom: 4 }}>
            {sharedGrades.map((g) => (
              <GradeChip key={g} label={GRADE_LABEL[g]} selected={g === grade} onPress={() => setPicked(g)} />
            ))}
          </ScrollView>
          <Grid items={gradeBooks} minWidth={280} gap={space.lg} keyOf={(w) => w.id} render={(w) => <WorkbookCard w={w} />} />
        </>
      ) : null}
      {isPhone ? <View style={{ height: 72 }} /> : null}
    </Screen>
  )
}
