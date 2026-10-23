// 답 입력: 객관식은 ①~⑤ 버튼, 주관식은 입력칸
import { Pressable, TextInput, View } from "react-native"
import { choiceLabels } from "@/lib/answers"
import { Text } from "@/ui/Text"
import { color, font, radius, space } from "@/ui/theme"

export function AnswerPad({
  choice,
  value,
  onChange,
  onSubmit,
  disabled,
  compact,
  onToggleType,
}: {
  choice: boolean
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
  compact?: boolean
  onToggleType: () => void
}) {
  const size = compact ? 46 : 52
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="small" weight="medium" tone="soft">
          내 답
        </Text>
        <Pressable onPress={onToggleType} accessibilityRole="button" hitSlop={8} disabled={disabled}>
          <Text variant="small" tone="blue" weight="medium">
            {choice ? "주관식으로 입력" : "객관식으로 입력"}
          </Text>
        </Pressable>
      </View>
      {choice ? (
        <View style={{ flexDirection: "row", gap: space.sm, justifyContent: "space-between" }} accessibilityRole="radiogroup">
          {choiceLabels.map((label, i) => {
            const v = String(i + 1)
            const selected = value === v
            return (
              <Pressable
                key={v}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: !!disabled }}
                accessibilityLabel={`${v}번`}
                onPress={() => onChange(selected ? "" : v)}
                style={({ pressed }) => ({
                  width: size,
                  height: size,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: selected ? color.blue : color.gridStrong,
                  backgroundColor: selected ? color.blue : color.sheet,
                  opacity: disabled && !selected ? 0.5 : pressed ? 0.8 : 1,
                })}
              >
                <Text variant="title" weight="bold" tone={selected ? "white" : "ink"}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={!disabled}
          placeholder="예: 12, 3/4, -2"
          placeholderTextColor={color.inkFaint}
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          accessibilityLabel="주관식 답"
          style={{
            height: size,
            borderRadius: radius.control,
            borderWidth: 1.5,
            borderColor: value ? color.blue : color.gridStrong,
            backgroundColor: color.sheet,
            paddingHorizontal: space.md,
            fontFamily: font.bold,
            fontSize: 20,
            color: color.blue,
          }}
        />
      )}
    </View>
  )
}
