// 문제 썸네일 (잘라 둔 문제 이미지 + 번호 + 채점 표시)
import { Image } from "expo-image"
import { Pressable, View } from "react-native"
import type { Result } from "@/lib/types"
import type { PressState } from "@/ui/controls"
import { GradeMark } from "@/ui/GradeMark"
import { Text } from "@/ui/Text"
import { LIP, radius, space } from "@/ui/theme"
import { useColors, useTones } from "@/ui/ThemeProvider"

export function ProblemThumb({
  number,
  source,
  result,
  hasAnswer,
  onPress,
  height = 150,
}: {
  number: number | null
  source: string | number | undefined
  result: Result | null
  hasAnswer: boolean
  onPress?: () => void
  height?: number
}) {
  const color = useColors()
  const tones = useTones()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${number ?? ""}번 문제 ${result === "correct" ? "맞음" : result === "wrong" ? "틀림" : result === "gave_up" ? "포기" : "안 풂"}`}
      style={({ pressed, hovered }: PressState) => {
        const t = result === "correct" ? tones.mint : result === "wrong" || result === "gave_up" ? tones.coral : null
        return {
          backgroundColor: color.surface,
          borderRadius: radius.card,
          borderWidth: 2,
          borderColor: hovered ? color.primary : t ? t.face : color.line,
          borderBottomWidth: pressed ? 2 : 2 + LIP,
          marginTop: pressed ? LIP : 0,
          overflow: "hidden",
        }
      }}
    >
      <View style={{ height, backgroundColor: "#FFFFFF" }}>
        {source ? (
          <Image source={source} contentFit="cover" contentPosition="top left" style={{ width: "100%", height: "100%" }} transition={120} />
        ) : null}
        {result && result !== "pending" ? (
          <View style={{ position: "absolute", left: 4, top: 2 }}>
            <GradeMark kind={result} size={64} animate={false} strokeWidth={4} />
          </View>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          borderTopWidth: 2,
          borderTopColor: color.line,
        }}
      >
        <Text weight="display" tabular>
          {number != null ? String(number).padStart(3, "0") : "–"}
        </Text>
        {!hasAnswer ? (
          <Text variant="caption" tone="faint">
            정답 없음
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}
