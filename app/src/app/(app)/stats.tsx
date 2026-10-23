// 성장: 레벨, 뱃지, 날짜별 푼 양, 단원별 정답률
import { useState } from "react"
import { View } from "react-native"
import { DailyBars, UnitBars } from "@/features/charts"
import { formatMinutes } from "@/lib/answers"
import { useProgress, useStats } from "@/lib/data"
import { badgeState, EMPTY_PROGRESS, levelInfo, levelTitle } from "@/lib/progress"
import { Empty, ErrorNote, Segmented, Sheet } from "@/ui/controls"
import { BadgeTile, FlameIcon, LevelBar, StarIcon } from "@/ui/game"
import { Grid } from "@/ui/Grid"
import { useFormFactor } from "@/ui/layout"
import { Mascot } from "@/ui/Mascot"
import { Screen, SectionTitle } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { space } from "@/ui/theme"

function Fact({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 130, gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon}
        <Text variant="small" tone="soft" weight="bold">
          {label}
        </Text>
      </View>
      <Text variant="headline" weight="display" tabular>
        {value}
      </Text>
    </View>
  )
}

export default function GrowthScreen() {
  const [days, setDays] = useState<7 | 14 | 30>(14)
  const q = useStats(days)
  const progress = useProgress()
  const { isPhone, width } = useFormFactor()
  const twoColumn = !isPhone && width >= 1000
  const p = progress.data ?? EMPTY_PROGRESS
  const t = q.data?.totals
  const badges = badgeState(p)
  const earned = badges.filter((b) => b.earned).length
  const info = levelInfo(p.xp)

  return (
    <Screen title="성장" refreshing={q.isRefetching} onRefresh={() => { q.refetch(); progress.refetch() }}>
      {/* 레벨 */}
      <Sheet style={{ flexDirection: isPhone ? "column" : "row", alignItems: isPhone ? "stretch" : "center", gap: space.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
          <Mascot mood={info.level >= 5 ? "cheer" : "happy"} size={isPhone ? 84 : 110} />
          <View>
            <Text variant="small" tone="soft" weight="bold">
              {levelTitle(info.level)}
            </Text>
            <Text style={{ fontSize: isPhone ? 44 : 56, lineHeight: isPhone ? 50 : 62 }} weight="display" tone="primary">
              Lv.{info.level}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: space.lg }}>
          <LevelBar xp={p.xp} compact />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.lg }}>
            <Fact icon={<StarIcon size={18} />} label="모은 XP" value={`${p.xp}`} />
            <Fact icon={<FlameIcon size={18} />} label="최고 연속" value={`${p.best_streak}일`} />
            <Fact label="공부한 날" value={`${p.days_active}일`} />
          </View>
        </View>
      </Sheet>

      {/* 뱃지 */}
      <SectionTitle aside={<Text weight="display" tone="sun">{earned}/{badges.length}</Text>}>뱃지</SectionTitle>
      <Sheet>
        <Grid
          items={badges}
          minWidth={isPhone ? 96 : 120}
          gap={space.lg}
          keyOf={(b) => b.id}
          render={(b) => <BadgeTile {...b} />}
        />
      </Sheet>

      {/* 기록 */}
      <SectionTitle
        aside={
          <View style={{ width: isPhone ? 200 : 260 }}>
            <Segmented
              value={days}
              onChange={setDays}
              options={[
                { value: 7, label: "7일" },
                { value: 14, label: "14일" },
                { value: 30, label: "30일" },
              ]}
            />
          </View>
        }
      >
        기록
      </SectionTitle>

      {q.error ? <ErrorNote message={(q.error as Error).message} onRetry={() => q.refetch()} /> : null}

      {t && t.total === 0 ? <Empty title="아직 기록이 없어요" body="문제를 풀고 채점하면 날짜별, 단원별로 쌓여요." mood="sleepy" /> : null}

      {t && t.total > 0 ? (
        <>
          <Sheet style={{ flexDirection: "row", flexWrap: "wrap", gap: space.lg }}>
            <Fact label="푼 문제" value={`${t.total}`} />
            <Fact label="정답률" value={`${Math.round((t.correct / t.total) * 100)}%`} />
            <Fact label="틀리거나 포기" value={`${t.wrong}`} />
            <Fact label="공부한 시간" value={formatMinutes(t.time_sec)} />
          </Sheet>

          <View style={{ flexDirection: twoColumn ? "row" : "column", gap: space.lg, alignItems: "flex-start" }}>
            <Sheet style={{ flex: twoColumn ? 3 : undefined, width: twoColumn ? undefined : "100%", gap: space.md }}>
              <Text variant="title" weight="display">
                날짜별 푼 문제
              </Text>
              <DailyBars key={days} data={q.data!.daily} />
            </Sheet>
            <Sheet style={{ flex: twoColumn ? 2 : undefined, width: twoColumn ? undefined : "100%", gap: space.md }}>
              <Text variant="title" weight="display">
                단원별 정답률
              </Text>
              <Text variant="small" tone="soft">
                약한 단원이 위에 있어요
              </Text>
              <UnitBars data={q.data!.by_unit} />
            </Sheet>
          </View>
        </>
      ) : null}
      {isPhone ? <View style={{ height: 72 }} /> : null}
    </Screen>
  )
}
