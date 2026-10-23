// 문제지·답지 PDF 올리기 (시트로 열림)
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as DocumentPicker from "expo-document-picker"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { backend, keys, useWorkbooks } from "@/lib/data"
import type { PickedFile } from "@/lib/types"
import { Button, Field, IconButton, Segmented, Sheet, type PressState } from "@/ui/controls"
import { Icon } from "@/ui/Icon"
import { useFormFactor } from "@/ui/layout"
import { Text } from "@/ui/Text"
import { color, radius, space } from "@/ui/theme"

type Kind = "problems" | "answers"

function sizeLabel(bytes?: number) {
  if (!bytes) return ""
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`
}

export default function UploadScreen() {
  const params = useLocalSearchParams<{ kind?: string; workbookId?: string }>()
  const insets = useSafeAreaInsets()
  const { isPhone } = useFormFactor()
  const qc = useQueryClient()
  const books = useWorkbooks()

  const [kind, setKind] = useState<Kind>(params.kind === "answers" ? "answers" : "problems")
  const [file, setFile] = useState<PickedFile | null>(null)
  const [title, setTitle] = useState("")
  const [unit, setUnit] = useState("")
  const [chapter, setChapter] = useState("")
  const [workbookId, setWorkbookId] = useState<number | null>(params.workbookId ? Number(params.workbookId) : null)
  const [stage, setStage] = useState<"uploading" | "starting" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mine = (books.data ?? []).filter((w) => w.is_mine)

  async function pick() {
    setError(null)
    const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true, multiple: false })
    if (res.canceled) return
    const a = res.assets[0]
    if (a.size && a.size > 50 * 1024 * 1024) {
      setError("PDF는 50MB 이하만 올릴 수 있어요.")
      return
    }
    setFile({ name: a.name, size: a.size, uri: a.uri, file: a.file })
    if (kind === "problems" && !title) setTitle(a.name.replace(/\.pdf$/i, ""))
  }

  const upload = useMutation({
    mutationFn: () =>
      backend.upload(
        {
          kind,
          file: file!,
          title: kind === "problems" ? title : undefined,
          unit: kind === "problems" ? unit : undefined,
          chapter: kind === "problems" ? chapter : undefined,
          workbookId: kind === "answers" ? workbookId ?? undefined : undefined,
        },
        setStage
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.ingests })
      router.back()
    },
    onError: (e) => {
      setStage(null)
      setError(e instanceof Error ? e.message : "올리지 못했어요.")
    },
  })

  const ready = !!file && (kind === "problems" ? !!title.trim() : workbookId !== null)

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: isPhone ? space.lg : space.xxl,
          paddingTop: (Platform.OS === "web" ? insets.top : 0) + (isPhone ? space.lg : space.xl),
          paddingBottom: insets.bottom + space.xxl,
          gap: space.xl,
          maxWidth: 640,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="headline" weight="bold" accessibilityRole="header">
            PDF 올리기
          </Text>
          <IconButton icon="close" label="닫기" onPress={() => router.back()} />
        </View>

        <Segmented<Kind>
          value={kind}
          onChange={(k) => {
            setKind(k)
            setError(null)
          }}
          options={[
            { value: "problems", label: "문제지" },
            { value: "answers", label: "답지 (빠른정답)" },
          ]}
        />

        <Text tone="soft">
          {kind === "problems"
            ? "문제 번호가 011, 012처럼 숫자로만 적힌 문제지를 올리면 번호마다 잘라서 문제로 만들어요. 40쪽까지 한 번에 처리해요."
            : "번호와 정답이 함께 적힌 빠른정답 페이지를 올리면 그 문제집의 정답으로 넣어요. 잘못 읽은 정답은 나중에 고칠 수 있어요."}
        </Text>

        <Pressable
          onPress={pick}
          accessibilityRole="button"
          accessibilityLabel={file ? `선택한 파일 ${file.name}, 다른 파일 고르기` : "PDF 파일 고르기"}
          style={({ pressed, hovered }: PressState) => ({
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: hovered ? color.blue : color.gridStrong,
            borderRadius: radius.sheet,
            backgroundColor: color.sheet,
            padding: space.xl,
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name={file ? "check" : "upload"} tint={color.blue} size={28} />
          <View style={{ flex: 1 }}>
            <Text weight="bold" numberOfLines={1}>
              {file ? file.name : "PDF 파일 고르기"}
            </Text>
            <Text variant="small" tone="soft">
              {file ? `${sizeLabel(file.size)}, 눌러서 바꾸기` : "파일 앱, iCloud, 구글 드라이브에서 고를 수 있어요"}
            </Text>
          </View>
        </Pressable>

        {kind === "problems" ? (
          <View style={{ gap: space.md }}>
            <Field label="문제집 이름" value={title} onChangeText={setTitle} placeholder="예: 수학Ⅰ 지수와 로그 1회" maxLength={100} />
            <View style={{ flexDirection: isPhone ? "column" : "row", gap: space.md }}>
              <View style={{ flex: 1 }}>
                <Field label="단원 (선택)" value={unit} onChangeText={setUnit} placeholder="예: 지수함수와 로그함수" hint="기록 화면에서 단원별 정답률로 묶여요" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="소단원 (선택)" value={chapter} onChangeText={setChapter} placeholder="예: 기본 다지기" />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: space.sm }}>
            <Text variant="small" weight="medium" tone="soft">
              어느 문제집의 답지인가요?
            </Text>
            {mine.length === 0 ? (
              <Sheet>
                <Text tone="soft">먼저 문제지를 올려 문제집을 만들어 주세요.</Text>
              </Sheet>
            ) : (
              <Sheet padded={false}>
                {mine.map((w, i) => {
                  const selected = w.id === workbookId
                  return (
                    <Pressable
                      key={w.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => setWorkbookId(w.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: space.md,
                        padding: space.lg,
                        borderTopWidth: i ? 1 : 0,
                        borderTopColor: color.grid,
                        backgroundColor: selected ? color.blueSoft : "transparent",
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: selected ? 6 : 1.5,
                          borderColor: selected ? color.blue : color.gridStrong,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text weight={selected ? "bold" : "medium"} numberOfLines={1}>
                          {w.title}
                        </Text>
                        <Text variant="small" tone="soft">
                          문제 {w.total}개, 정답 {w.with_answer}개
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </Sheet>
            )}
          </View>
        )}

        {error ? <Text tone="red">{error}</Text> : null}

        <Button
          label={stage === "uploading" ? "올리는 중" : stage === "starting" ? "처리 시작하는 중" : kind === "problems" ? "문제지 올리기" : "답지 올리기"}
          size="lg"
          icon="upload"
          disabled={!ready}
          loading={upload.isPending}
          onPress={() => upload.mutate()}
        />
        <Text variant="small" tone="faint">
          올린 뒤에는 화면을 닫아도 서버에서 계속 처리해요. 진행 상황은 오늘·문제집 화면에 보여요.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
