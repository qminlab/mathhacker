// 학년 고르기: 유아 / 초등 / 중등 / 고등 묶음으로 통통한 칩
import { Pressable, View } from "react-native"
import { GRADE_GROUPS, GRADE_LABEL, type Grade } from "@/lib/grades"
import { Text } from "@/ui/Text"
import { LIP, space } from "@/ui/theme"
import { useColors } from "@/ui/ThemeProvider"

export function GradeChip({ label, selected, onPress, accessibilityLabel }: { label: string; selected: boolean; onPress: () => void; accessibilityLabel?: string }) {
  const color = useColors()
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={accessibilityLabel ?? label} hitSlop={4}>
      {({ pressed }) => (
        <View style={{ paddingTop: pressed ? 3 : 0 }}>
          <View
            style={{
              minWidth: 56,
              height: 42,
              paddingHorizontal: 14,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? color.primary : color.surface,
              borderWidth: 2,
              borderColor: selected ? color.primaryDeep : color.line,
              borderBottomWidth: pressed ? 2 : 2 + LIP - 1,
            }}
          >
            <Text weight="display" tone={selected ? "white" : "ink"}>
              {label}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  )
}

export function GradePicker({ value, onChange, allowNone = true }: { value: Grade | null; onChange: (g: Grade | null) => void; allowNone?: boolean }) {
  return (
    <View style={{ gap: space.md }} accessibilityRole="radiogroup">
      {GRADE_GROUPS.map((g) => (
        <View key={g.label} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}>
          <Text variant="small" tone="soft" weight="display" style={{ width: 36 }}>
            {g.label}
          </Text>
          {g.grades.map((gr) => (
            <GradeChip key={gr} label={GRADE_LABEL[gr]} selected={value === gr} onPress={() => onChange(gr)} />
          ))}
        </View>
      ))}
      {allowNone ? (
        <View style={{ flexDirection: "row", gap: space.sm, paddingLeft: 36 + space.sm }}>
          <GradeChip label="공용 문제 안 풀기" selected={value === null} onPress={() => onChange(null)} />
        </View>
      ) : null}
    </View>
  )
}
