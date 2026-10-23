// 답 입력: 객관식은 ①~⑤ 버튼, 주관식은 입력칸
import { Pressable, TextInput, View } from "react-native"
import { choiceLabels } from "@/lib/answers"
import { Text } from "@/ui/Text"
import { font, LIP, radius, space } from "@/ui/theme"
import { useColors } from "@/ui/ThemeProvider"

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
  const color = useColors()
  const size = compact ? 54 : 60
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="small" weight="display" tone="soft">
          내 답
        </Text>
        <Pressable onPress={onToggleType} accessibilityRole="button" hitSlop={8} disabled={disabled}>
          <Text variant="small" tone="primary" weight="display">
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
                style={{ flex: 1, maxWidth: 76, opacity: disabled && !selected ? 0.5 : 1 }}
              >
                {({ pressed }) => (
                  <View style={{ paddingTop: pressed ? LIP : 0 }}>
                    <View
                      style={{
                        height: size,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: selected ? color.primaryDeep : color.line,
                        borderBottomWidth: pressed ? 2 : 2 + LIP,
                        backgroundColor: selected ? color.primary : color.surface,
                      }}
                    >
                      <Text variant="headline" weight="display" tone={selected ? "white" : "ink"}>
                        {label}
                      </Text>
                    </View>
                  </View>
                )}
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
            borderWidth: 2,
            borderBottomWidth: 2 + LIP,
            borderColor: value ? color.primary : color.line,
            backgroundColor: color.surface,
            paddingHorizontal: space.md,
            fontFamily: font.display,
            fontSize: 24,
            color: color.primary,
          }}
        />
      )}
    </View>
  )
}
