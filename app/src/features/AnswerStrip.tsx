// 답안지 칸: 문제 번호 칸이 이어지고, 푼 칸에는 채점 표시가 남는다
import { View } from "react-native"
import type { Result } from "@/lib/types"
import { GradeMark } from "@/ui/GradeMark"
import { Text } from "@/ui/Text"
import { useColors, useTones } from "@/ui/ThemeProvider"

export type StripCell = { key: string; label: string; result: Result | null; current?: boolean }

export function AnswerStrip({ cells, size = 44 }: { cells: StripCell[]; size?: number }) {
  const color = useColors()
  const tones = useTones()
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, alignSelf: "flex-start" }}>
      {cells.map((c) => (
        <View
          key={c.key}
          accessible
          accessibilityLabel={`${c.label}번 ${c.result === "correct" ? "맞음" : c.result === "wrong" ? "틀림" : c.result === "gave_up" ? "포기" : c.result === "pending" ? "채점 대기" : "안 풂"}`}
          style={{
            width: size,
            height: size,
            borderRadius: 14,
            borderWidth: 2,
            borderBottomWidth: 4,
            borderColor: c.current ? color.primary : c.result === "correct" ? tones.mint.face : c.result === "wrong" || c.result === "gave_up" ? tones.coral.face : color.line,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.current ? color.primarySoft : c.result === "correct" ? tones.mint.soft : c.result === "wrong" || c.result === "gave_up" ? tones.coral.soft : color.surface,
          }}
        >
          <Text variant="small" weight="display" tone={c.result ? "ink" : "faint"} tabular>
            {c.label}
          </Text>
          {c.result && c.result !== "pending" ? (
            <View style={{ position: "absolute" }}>
              <GradeMark kind={c.result} size={size - 4} animate={false} strokeWidth={2.5} />
            </View>
          ) : null}
          {c.result === "pending" ? (
            <View style={{ position: "absolute", bottom: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: color.inkFaint }} />
          ) : null}
        </View>
      ))}
    </View>
  )
}
