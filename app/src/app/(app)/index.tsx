// 홈: 오늘의 퀘스트, 연속 학습, 레벨, 바로가기
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { Pressable, View } from "react-native"
import { IngestList } from "@/features/IngestList"
import { useStartPractice } from "@/features/practice/useStartPractice"
import { useDaily, useProfile, useProgress, useWorkbooks, useWrongNotes } from "@/lib/data"
import { badgeState, EMPTY_PROGRESS, xpFor } from "@/lib/progress"
import { Button, ErrorNote, Progress, Sheet } from "@/ui/controls"
import { BadgeTile, LevelBar, LevelChip, StreakChip, WeekFlames } from "@/ui/game"
import { Icon, type IconName } from "@/ui/Icon"
import { useFormFactor } from "@/ui/layout"
import { Mascot, MascotSays } from "@/ui/Mascot"
import { Screen } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { color, LIP, radius, space, tones, type Tone } from "@/ui/theme"

function greeting(name: string | null | undefined) {
  const h = new Date().getHours()
  const hello = h < 6 ? "늦게까지 열공 중" : h < 12 ? "좋은 아침" : h < 18 ? "안녕" : "오늘도 수고했어"
  return name ? `${hello}, ${name}!` : `${hello}!`
}

function QuestCard() {
  const daily = useDaily()
  const { isPhone } = useFormFactor()

  if (daily.isLoading) return <View style={{ height: 230, borderRadius: radius.card, backgroundColor: color.primarySoft }} />
  if (daily.error) return <ErrorNote message={(daily.error as Error).message} onRetry={() => daily.refetch()} />

  const bundle = daily.data!
  const total = bundle.problems.length
  const results = new Map(bundle.attempts.map((a) => [a.problem_id, a]))
  const done = bundle.problems.filter((p) => results.has(p.id)).length
  const finished = total > 0 && done === total
  const nextIndex = bundle.problems.findIndex((p) => !results.has(p.id))
  const earned = bundle.attempts.reduce((s, a) => s + xpFor(a.result, a.hint_used), 0)
  const reward = total * 15

  return (
    <View style={{ borderRadius: radius.card, backgroundColor: color.primaryDeep, paddingBottom: LIP }}>
      <LinearGradient
        colors={["#8A6BFF", color.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius.card, padding: isPhone ? space.lg : space.xl, overflow: "hidden", gap: space.lg }}
      >
        {/* 장식 원 */}
        <View style={{ position: "absolute", right: -40, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "#FFFFFF", opacity: 0.08 }} />
        <View style={{ position: "absolute", right: 60, bottom: -70, width: 140, height: 140, borderRadius: 70, backgroundColor: "#FFFFFF", opacity: 0.06 }} />

        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="body" weight="display" style={{ color: "#E3DCFF" }}>
              오늘의 퀘스트
            </Text>
            {total === 0 ? (
              <Text variant="headline" weight="display" tone="white">
                문제지를 올리면 퀘스트가 생겨요
              </Text>
            ) : finished ? (
              <Text variant="headline" weight="display" tone="white">
                퀘스트 완료! +{earned} XP
              </Text>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <Text variant="number" weight="display" tone="white" tabular>
                  {done}/{total}
                </Text>
                <Text variant="bodyLarge" weight="display" style={{ color: "#E3DCFF" }}>
                  문제
                </Text>
              </View>
            )}
          </View>
          {/* 보라 위에서 묻히지 않게 흰 원 위에 */}
          <View style={{ width: isPhone ? 88 : 112, height: isPhone ? 88 : 112, borderRadius: 60, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
            <Mascot mood={finished ? "cheer" : total === 0 ? "think" : "happy"} size={isPhone ? 72 : 92} />
          </View>
        </View>

        {total > 0 ? (
          <View style={{ gap: 6 }}>
            <Progress value={done} total={total} tone="sun" height={16} />
            <Text variant="small" weight="bold" style={{ color: "#E3DCFF" }}>
              {finished ? "내일 새 퀘스트가 열려요" : `다 풀면 최대 ${reward} XP`}
            </Text>
          </View>
        ) : null}

        {total === 0 ? (
          <Button label="문제지 올리기" icon="upload" kind="secondary" size="lg" onPress={() => router.push("/upload")} />
        ) : !finished ? (
          <Button
            label={done === 0 ? "퀘스트 시작" : "이어서 풀기"}
            icon="play"
            kind="sun"
            size="lg"
            onPress={() => router.push(`/practice/${bundle.session.id}${nextIndex > 0 ? `?at=${nextIndex}` : ""}`)}
          />
        ) : null}
      </LinearGradient>
    </View>
  )
}

function StreakCard() {
  const { data } = useProgress()
  const p = data ?? EMPTY_PROGRESS
  return (
    <Sheet style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="title" weight="display">
          {p.streak > 0 ? `${p.streak}일 연속 불꽃` : "불꽃을 켜 보자"}
        </Text>
        {p.best_streak > 1 ? (
          <Text variant="small" tone="soft">
            최고 {p.best_streak}일
          </Text>
        ) : null}
      </View>
      {p.week.length ? <WeekFlames week={p.week} /> : null}
      <Text variant="small" tone={p.active_today ? "flame" : "soft"} weight="bold">
        {p.active_today ? `오늘 ${p.today_solved}문제로 불꽃을 켰어요` : "오늘 한 문제만 풀어도 불꽃이 이어져요"}
      </Text>
    </Sheet>
  )
}

function LevelCard() {
  const { data } = useProgress()
  const p = data ?? EMPTY_PROGRESS
  const next = badgeState(p).find((b) => !b.earned)
  return (
    <Sheet style={{ gap: space.lg }}>
      <LevelBar xp={p.xp} />
      {next ? (
        <Pressable onPress={() => router.push("/stats")} accessibilityRole="link" style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <BadgeTile {...next} size="sm" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="small" tone="soft">
              다음 뱃지
            </Text>
            <Text weight="display">{next.how}</Text>
            <Progress value={next.current} total={next.goal} height={10} tone="primary" />
          </View>
          <Icon name="chevronRight" tint={color.inkFaint} />
        </Pressable>
      ) : null}
    </Sheet>
  )
}

function Tile({
  tone,
  icon,
  title,
  body,
  onPress,
  loading,
}: {
  tone: Tone
  icon: IconName
  title: string
  body: string
  onPress: () => void
  loading?: boolean
}) {
  const t = tones[tone]
  return (
    <Pressable onPress={onPress} disabled={loading} accessibilityRole="button" accessibilityLabel={`${title}, ${body}`} style={{ flex: 1, minWidth: 150 }}>
      {({ pressed }) => (
        <View style={{ paddingBottom: pressed ? 0 : LIP, paddingTop: pressed ? LIP : 0 }}>
          <View
            style={{
              borderRadius: radius.card,
              backgroundColor: t.soft,
              borderWidth: 2,
              borderColor: t.soft,
              borderBottomWidth: pressed ? 2 : 2 + LIP,
              borderBottomColor: t.face,
              padding: space.lg,
              gap: space.sm,
              minHeight: 132,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.face, alignItems: "center", justifyContent: "center" }}>
              <Icon name={icon} tint="#FFFFFF" size={24} strokeWidth={2.4} />
            </View>
            <Text variant="bodyLarge" weight="display">
              {title}
            </Text>
            <Text variant="small" tone="soft" numberOfLines={2}>
              {body}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  )
}

function Shortcuts() {
  const wrong = useWrongNotes()
  const books = useWorkbooks()
  const start = useStartPractice()
  const next = (books.data ?? []).find((w) => w.total > 0 && w.solved < w.total)
  const wrongCount = wrong.data?.length ?? 0
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
      <Tile
        tone="coral"
        icon="refresh"
        title="오답 정복"
        body={wrongCount ? `틀린 ${wrongCount}문제가 기다려요` : "아직 틀린 문제가 없어요"}
        loading={start.isPending && start.variables?.mode === "wrong"}
        onPress={() => start.mutate({ mode: "wrong" })}
      />
      <Tile
        tone="sky"
        icon="books"
        title="이어 풀기"
        body={next ? `${next.title}, ${next.total - next.solved}문제 남음` : "문제집을 골라 처음부터"}
        loading={start.isPending && start.variables?.mode === "sequence"}
        onPress={() => (next ? start.mutate({ mode: "sequence", workbookId: next.id }) : router.push("/library"))}
      />
      <Tile tone="mint" icon="upload" title="문제지 올리기" body="PDF를 올리면 문제가 한 장씩 잘려요" onPress={() => router.push("/upload")} />
    </View>
  )
}

export default function HomeScreen() {
  const profile = useProfile()
  const progress = useProgress()
  const daily = useDaily()
  const { isPhone, width } = useFormFactor()
  const twoColumn = !isPhone && width >= 960
  const p = progress.data ?? EMPTY_PROGRESS

  const top = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
      <Text variant={isPhone ? "title" : "headline"} weight="display" style={{ flexShrink: 1 }}>
        {greeting(profile.data?.nickname)}
      </Text>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <StreakChip streak={p.streak} activeToday={p.active_today} />
        <LevelChip xp={p.xp} />
      </View>
    </View>
  )

  return (
    <Screen
      top={top}
      refreshing={daily.isRefetching}
      onRefresh={() => {
        daily.refetch()
        progress.refetch()
      }}
    >
      <IngestList />
      <View style={{ flexDirection: twoColumn ? "row" : "column", gap: space.lg, alignItems: "flex-start" }}>
        <View style={{ flex: twoColumn ? 3 : undefined, width: twoColumn ? undefined : "100%", gap: space.lg }}>
          <QuestCard />
          <Shortcuts />
        </View>
        <View style={{ flex: twoColumn ? 2 : undefined, width: twoColumn ? undefined : "100%", gap: space.lg }}>
          <StreakCard />
          <LevelCard />
          {!p.active_today && p.streak > 0 ? (
            <MascotSays mood="wow" size={60}>
              <Text variant="small" weight="bold">
                {p.streak}일 불꽃이 꺼지기 전에 한 문제만!
              </Text>
            </MascotSays>
          ) : null}
        </View>
      </View>
      {/* 떠 있는 탭 막대에 가리지 않게 */}
      {isPhone ? <View style={{ height: 72 }} /> : null}
    </Screen>
  )
}
