// 기록: 일별 푼 양, 단원별 정답률, 합계
import { useState } from "react"
import { View } from "react-native"
import { DailyBars, UnitBars } from "@/features/charts"
import { formatMinutes } from "@/lib/answers"
import { useStats } from "@/lib/data"
import { Empty, ErrorNote, Segmented, Sheet } from "@/ui/controls"
import { useFormFactor } from "@/ui/layout"
import { Screen } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { space } from "@/ui/theme"

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 130, gap: 2 }}>
      <Text variant="small" tone="soft">
        {label}
      </Text>
      <Text variant="headline" weight="bold" tabular>
        {value}
      </Text>
    </View>
  )
}

export default function StatsScreen() {
  const [days, setDays] = useState<7 | 14 | 30>(14)
  const q = useStats(days)
  const { isPhone, width } = useFormFactor()
  const twoColumn = !isPhone && width >= 1000
  const t = q.data?.totals

  return (
    <Screen title="기록" subtitle="얼마나 풀었고 어디가 약한지" refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <View style={{ maxWidth: 360 }}>
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

      {q.error ? <ErrorNote message={(q.error as Error).message} onRetry={() => q.refetch()} /> : null}

      {t && t.total === 0 ? (
        <Empty title="아직 기록이 없어요" body="문제를 풀고 채점하면 여기에 날짜별, 단원별로 쌓여요." />
      ) : null}

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
              <Text variant="title" weight="bold">
                날짜별 푼 문제
              </Text>
              <DailyBars key={days} data={q.data!.daily} />
            </Sheet>
            <Sheet style={{ flex: twoColumn ? 2 : undefined, width: twoColumn ? undefined : "100%", gap: space.md }}>
              <Text variant="title" weight="bold">
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
    </Screen>
  )
}
