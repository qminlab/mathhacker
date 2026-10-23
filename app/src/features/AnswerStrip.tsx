// 답안지 칸: 문제 번호 칸이 이어지고, 푼 칸에는 채점 표시가 남는다
import { View } from "react-native"
import type { Result } from "@/lib/types"
import { GradeMark } from "@/ui/GradeMark"
import { Text } from "@/ui/Text"
import { color } from "@/ui/theme"

export type StripCell = { key: string; label: string; result: Result | null; current?: boolean }

export function AnswerStrip({ cells, size = 44 }: { cells: StripCell[]; size?: number }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", borderLeftWidth: 1, borderTopWidth: 1, borderColor: color.gridStrong, alignSelf: "flex-start" }}>
      {cells.map((c) => (
        <View
          key={c.key}
          accessible
          accessibilityLabel={`${c.label}번 ${c.result === "correct" ? "맞음" : c.result === "wrong" ? "틀림" : c.result === "gave_up" ? "포기" : c.result === "pending" ? "채점 대기" : "안 풂"}`}
          style={{
            width: size,
            height: size,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderColor: color.gridStrong,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.current ? color.highlighterSoft : color.sheet,
          }}
        >
          <Text variant="small" weight="medium" tone={c.result ? "ink" : "faint"} tabular>
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
