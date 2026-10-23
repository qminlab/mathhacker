// 정답 보기·고치기: 답지 OCR이 틀렸거나 비어 있는 번호를 직접 채운다
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { Pressable, TextInput, View } from "react-native"
import { notify } from "@/features/practice/useStartPractice"
import { choiceLabels, displayAnswer, isChoiceProblem } from "@/lib/answers"
import { backend, invalidateProgress, useWorkbook } from "@/lib/data"
import { Button, ErrorNote, Sheet } from "@/ui/controls"
import { Icon } from "@/ui/Icon"
import { useFormFactor } from "@/ui/layout"
import { Screen } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { font, radius, space } from "@/ui/theme"
import { useColors } from "@/ui/ThemeProvider"

export default function AnswersScreen() {
  const color = useColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const workbookId = Number(id)
  const q = useWorkbook(workbookId)
  const qc = useQueryClient()
  const { isPhone } = useFormFactor()
  const [draft, setDraft] = useState<Record<string, string>>({})

  const problems = q.data?.problems ?? []
  const changed = Object.entries(draft).filter(([pid, v]) => (problems.find((p) => p.id === pid)?.answer ?? "") !== v)

  const save = useMutation({
    mutationFn: () => backend.saveAnswers(workbookId, changed.map(([problemId, answer]) => ({ problemId, answer }))),
    onSuccess: (r) => {
      setDraft({})
      invalidateProgress(qc)
      notify("저장했어요", r.regraded ? `채점을 기다리던 풀이 ${r.regraded}개를 채점했어요.` : undefined)
    },
    onError: (e) => notify("저장하지 못했어요", e instanceof Error ? e.message : undefined),
  })

  const back = (
    <Pressable onPress={() => router.back()} accessibilityRole="link" style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 4 }}>
      <Icon name="chevronLeft" size={18} tint={color.inkSoft} />
      <Text tone="soft">{q.data?.workbook.title ?? "문제집"}</Text>
    </Pressable>
  )

  return (
    <Screen
      title="정답"
      subtitle="답지에서 읽은 정답이 맞는지 확인하고, 비어 있으면 직접 넣어 주세요."
      back={back}
      action={
        <Button label={changed.length ? `${changed.length}개 저장` : "저장"} disabled={!changed.length} loading={save.isPending} onPress={() => save.mutate()} />
      }
    >
      {q.error ? <ErrorNote message={(q.error as Error).message} onRetry={() => q.refetch()} /> : null}
      <Sheet padded={false}>
        {problems.map((p, i) => {
          const choice = isChoiceProblem(p.raw_text)
          const value = draft[p.id] ?? p.answer ?? ""
          const set = (v: string) => setDraft((d) => ({ ...d, [p.id]: v }))
          return (
            <View
              key={p.id}
              style={{
                flexDirection: isPhone ? "column" : "row",
                alignItems: isPhone ? "stretch" : "center",
                gap: space.md,
                paddingHorizontal: space.lg,
                paddingVertical: space.md,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: color.grid,
              }}
            >
              <View style={{ width: isPhone ? undefined : 120, flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
                <Text weight="bold" tabular>
                  {String(p.workbook_number ?? "").padStart(3, "0")}
                </Text>
                <Text variant="caption" tone="faint">
                  {p.answer_source === "manual" ? "직접 입력" : p.answer_source === "ocr" ? "답지" : "없음"}
                </Text>
              </View>
              {choice ? (
                <View style={{ flexDirection: "row", gap: space.xs }} accessibilityRole="radiogroup">
                  {choiceLabels.map((label, k) => {
                    const v = String(k + 1)
                    const selected = value === v
                    return (
                      <Pressable
                        key={v}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`${v}번`}
                        onPress={() => set(selected ? "" : v)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: radius.pill,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: selected ? color.blue : color.gridStrong,
                          backgroundColor: selected ? color.blue : color.sheet,
                        }}
                      >
                        <Text weight="bold" tone={selected ? "white" : "soft"}>
                          {label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : (
                <TextInput
                  value={value}
                  onChangeText={set}
                  placeholder="정답"
                  placeholderTextColor={color.inkFaint}
                  accessibilityLabel={`${p.workbook_number}번 정답`}
                  style={{
                    height: 44,
                    width: isPhone ? "100%" : 200,
                    borderRadius: radius.control,
                    borderWidth: 1,
                    borderColor: color.gridStrong,
                    paddingHorizontal: space.md,
                    fontFamily: font.medium,
                    fontSize: 16,
                    color: color.ink,
                  }}
                />
              )}
              {!isPhone && value ? (
                <Text tone="faint" variant="small" style={{ marginLeft: "auto" }}>
                  {displayAnswer(value, choice)}
                </Text>
              ) : null}
            </View>
          )
        })}
      </Sheet>
    </Screen>
  )
}
