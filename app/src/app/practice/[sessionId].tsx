// 풀이 화면
//
// 패드 가로·컴퓨터: [ 모눈 풀이판 + 왼쪽 위에 문제 ] [ 오른쪽 답 패널 ]
// 패드 세로·폰:     [ 위 막대 ] [ 모눈 풀이판 + 문제 ] [ 아래 답 패널 ]
import { useQueryClient } from "@tanstack/react-query"
import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { Platform, Pressable, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AnswerStrip } from "@/features/AnswerStrip"
import { AnswerPad } from "@/features/practice/AnswerPad"
import { DrawingCanvas, type Tool } from "@/features/practice/DrawingCanvas"
import { PEN_COLORS, PenToolbar } from "@/features/practice/PenToolbar"
import { notify, useStartPractice } from "@/features/practice/useStartPractice"
import { displayAnswer, formatDuration, isChoiceProblem } from "@/lib/answers"
import { backend, invalidateProgress, useImageSources, useSessionBundle, useSettings } from "@/lib/data"
import { DEFAULT_SETTINGS, type Problem, type Result, type SessionBundle, type Settings, type Stroke } from "@/lib/types"
import { Button, IconButton, Sheet } from "@/ui/controls"
import { GradeMark } from "@/ui/GradeMark"
import { GraphPaper } from "@/ui/GraphPaper"
import { Icon } from "@/ui/Icon"
import { useFormFactor } from "@/ui/layout"
import { PenText, Text } from "@/ui/Text"
import { color, radius, space } from "@/ui/theme"

type Submitted = { result: Result; correctAnswer: string | null; userAnswer: string }

type ProblemState = {
  strokes: Stroke[]
  answer: string
  choice: boolean
  hintUsed: boolean
  hintOpen: boolean
  extraSec: number
  elapsedSec: number
  submitted: Submitted | null
}

function initialState(p: Problem): ProblemState {
  return {
    strokes: [],
    answer: "",
    choice: isChoiceProblem(p.raw_text),
    hintUsed: false,
    hintOpen: false,
    extraSec: 0,
    elapsedSec: 0,
    submitted: null,
  }
}

const MODE_TITLE = { daily: "오늘의 세트", sequence: "순서대로", wrong: "오답 다시 풀기" } as const

export default function PracticeScreen() {
  const { sessionId, at } = useLocalSearchParams<{ sessionId: string; at?: string }>()
  const id = Number(sessionId)
  const bundle = useSessionBundle(id)
  const settingsQ = useSettings()
  const insets = useSafeAreaInsets()

  if (bundle.error) {
    return (
      <GraphPaper style={{ flex: 1, padding: space.xl, paddingTop: insets.top + space.xl, gap: space.lg }}>
        <Text variant="title" weight="bold">풀이를 불러오지 못했어요</Text>
        <Text tone="soft">{(bundle.error as Error).message}</Text>
        <Button label="돌아가기" kind="secondary" onPress={() => router.back()} style={{ alignSelf: "flex-start" }} />
      </GraphPaper>
    )
  }
  if (!bundle.data || settingsQ.isLoading) return <GraphPaper style={{ flex: 1 }} />
  if (!bundle.data.problems.length) {
    return (
      <GraphPaper style={{ flex: 1, padding: space.xl, paddingTop: insets.top + space.xl, gap: space.lg }}>
        <Text variant="title" weight="bold">이 세트에는 문제가 없어요</Text>
        <Button label="돌아가기" kind="secondary" onPress={() => router.back()} style={{ alignSelf: "flex-start" }} />
      </GraphPaper>
    )
  }
  return (
    <PracticeView
      key={bundle.data.session.id}
      bundle={bundle.data}
      settings={settingsQ.data ?? DEFAULT_SETTINGS}
      startAt={at}
    />
  )
}

/** 이미 푼 문제는 결과를 채워 두고, 안 푼 첫 문제(또는 ?at=)에서 시작한다 */
function initialProgress(bundle: SessionBundle, startAt?: string) {
  const done = new Map(bundle.attempts.map((a) => [a.problem_id, a]))
  const states: Record<string, ProblemState> = {}
  for (const p of bundle.problems) {
    const a = done.get(p.id)
    states[p.id] = {
      ...initialState(p),
      ...(a ? { answer: a.user_answer, submitted: { result: a.result, correctAnswer: null, userAnswer: a.user_answer } } : {}),
    }
  }
  const firstTodo = bundle.problems.findIndex((p) => !done.has(p.id))
  const requested = Number(startAt)
  const index =
    Number.isInteger(requested) && requested >= 0 && requested < bundle.problems.length ? requested : Math.max(0, firstTodo)
  return { states, index, summary: firstTodo < 0 && !startAt }
}

function PracticeView({ bundle, settings, startAt }: { bundle: SessionBundle; settings: Settings; startAt?: string }) {
  const id = bundle.session.id
  const images = useImageSources(bundle.problems.map((p) => p.image_path))
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const { form, landscape, isPhone } = useFormFactor()
  const sidePanel = !isPhone && (landscape || form === "desktop")
  const restart = useStartPractice()

  const [initial] = useState(() => initialProgress(bundle, startAt))
  const [index, setIndex] = useState(initial.index)
  const [states, setStates] = useState<Record<string, ProblemState>>(initial.states)
  const [tool, setTool] = useState<Tool>("pen")
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0])
  const [submitting, setSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(initial.summary)
  const [imageScale, setImageScale] = useState(1)
  const [aspects, setAspects] = useState<Record<string, number>>({})

  const problems = bundle.problems
  const problem = problems[index] as Problem | undefined
  const batch = settings.grading_mode === "batch"

  const st = problem ? states[problem.id] ?? initialState(problem) : null
  const update = (patch: Partial<ProblemState>) => {
    if (!problem) return
    setStates((s) => ({ ...s, [problem.id]: { ...(s[problem.id] ?? initialState(problem)), ...patch } }))
  }

  // 타이머: 아직 제출하지 않은 문제를 보고 있을 때만 흐른다
  useEffect(() => {
    if (!problem || st?.submitted || showSummary) return
    const pid = problem.id
    const t = setInterval(() => {
      setStates((s) => {
        const cur = s[pid]
        if (!cur || cur.submitted) return s
        return { ...s, [pid]: { ...cur, elapsedSec: cur.elapsedSec + 1 } }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [problem, st?.submitted, showSummary])

  const limit = settings.time_per_problem_sec + (st?.extraSec ?? 0)
  const remaining = limit - (st?.elapsedSec ?? 0)
  const overtime = remaining < 0

  async function submit(gaveUp = false) {
    if (!problem || !st || st.submitted || submitting) return
    if (!gaveUp && !st.answer.trim()) {
      notify("답을 먼저 골라 주세요", st.choice ? "①~⑤ 중 하나를 누르세요." : "답을 입력하세요.")
      return
    }
    setSubmitting(true)
    try {
      const r = await backend.submit({
        problemId: problem.id,
        answer: gaveUp ? "" : st.answer.trim(),
        gaveUp,
        hintUsed: st.hintUsed,
        timeSpentSec: st.elapsedSec,
        sessionId: id,
        strokes: st.strokes.length ? st.strokes : undefined,
      })
      update({ submitted: { result: r.result, correctAnswer: r.correctAnswer, userAnswer: st.answer } })
      if (!batch && Platform.OS !== "web") {
        Haptics.notificationAsync(
          r.result === "correct" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
        ).catch(() => {})
      }
      invalidateProgress(qc)
      // 일괄 채점이면 바로 다음 문제로
      if (batch) goNext()
    } catch (e) {
      notify("제출하지 못했어요", e instanceof Error ? e.message : undefined)
    } finally {
      setSubmitting(false)
    }
  }

  function goNext() {
    const nextTodo = problems.findIndex((p, i) => i > index && !states[p.id]?.submitted)
    if (nextTodo >= 0) setIndex(nextTodo)
    else if (problems.every((p, i) => i === index || states[p.id]?.submitted)) finish()
    else if (index < problems.length - 1) setIndex(index + 1)
  }

  function finish() {
    backend.finishSession(id).catch(() => {})
    setShowSummary(true)
  }

  const allSubmitted = problems.length > 0 && problems.every((p) => states[p.id]?.submitted)

  // ───────── 렌더 ─────────
  if (!problem || !st) return <GraphPaper style={{ flex: 1 }} />

  const session = bundle.session

  if (showSummary) {
    return (
      <Summary
        problems={problems}
        states={states}
        title={MODE_TITLE[session.mode]}
        onClose={() => router.back()}
        onRetryWrong={(ids) => restart.mutate({ mode: "wrong", problemIds: ids })}
        onReview={(i) => {
          setShowSummary(false)
          setIndex(i)
        }}
        retrying={restart.isPending}
      />
    )
  }

  const imageSource = problem.image_path ? images.data?.[problem.image_path] : undefined
  const showMark = st.submitted && !(batch && !allSubmitted)
  const progressLabel = `${index + 1}/${problems.length}`

  const header = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        paddingHorizontal: space.md,
        paddingTop: insets.top + space.sm,
        paddingBottom: space.sm,
        backgroundColor: color.sheet,
        borderBottomWidth: 1,
        borderBottomColor: color.grid,
      }}
    >
      <IconButton icon="close" label="풀이 그만하기" onPress={() => router.back()} />
      <View style={{ flex: 1 }}>
        <Text variant="small" tone="soft" numberOfLines={1}>
          {MODE_TITLE[session.mode]}
        </Text>
        <Text weight="bold" tabular>
          {String(problem.workbook_number ?? index + 1).padStart(3, "0")}번
          <Text tone="soft" weight="regular">  {progressLabel}</Text>
        </Text>
      </View>
      <IconButton icon="chevronLeft" label="이전 문제" disabled={index === 0} onPress={() => setIndex(index - 1)} style={{ opacity: index === 0 ? 0.3 : 1 }} />
      <IconButton
        icon="chevronRight"
        label="다음 문제"
        disabled={index === problems.length - 1}
        onPress={() => setIndex(index + 1)}
        style={{ opacity: index === problems.length - 1 ? 0.3 : 1 }}
      />
    </View>
  )

  const timer = (
    <View accessibilityLabel={overtime ? `시간 ${formatDuration(-remaining)} 초과` : `남은 시간 ${formatDuration(remaining)}`} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <Icon name="clock" size={20} tint={overtime ? color.red : color.inkSoft} />
      <Text variant="title" weight="bold" tabular tone={overtime ? "red" : "ink"}>
        {overtime ? `+${formatDuration(-remaining)}` : formatDuration(remaining)}
      </Text>
      {!st.submitted ? (
        <Pressable accessibilityRole="button" onPress={() => update({ extraSec: st.extraSec + 60 })} hitSlop={8} style={{ paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: color.gridStrong }}>
          <Text variant="small" weight="bold" tone="soft">+1분</Text>
        </Pressable>
      ) : null}
    </View>
  )

  const hintText = problem.hint ?? [problem.unit && `단원: ${problem.unit}`, problem.score && `${problem.score}점 문제`].filter(Boolean).join(", ")

  const panel = (
    <View style={{ gap: sidePanel ? space.lg : space.md }}>
      {sidePanel ? timer : null}

      {st.submitted && showMark ? (
        <ResultNote submitted={st.submitted} choice={st.choice} />
      ) : st.submitted ? (
        <Text tone="soft">제출했어요. 다 풀면 한꺼번에 채점해요.</Text>
      ) : (
        <AnswerPad
          choice={st.choice}
          value={st.answer}
          onChange={(v) => update({ answer: v })}
          onSubmit={() => submit()}
          compact={!sidePanel}
          onToggleType={() => update({ choice: !st.choice, answer: "" })}
        />
      )}

      {st.hintOpen ? (
        <Sheet style={{ backgroundColor: color.highlighterSoft, borderColor: color.highlighter, gap: 4 }}>
          <Text variant="small" weight="bold">힌트</Text>
          <Text variant="small">{hintText || "이 문제에는 힌트가 없어요."}</Text>
        </Sheet>
      ) : null}

      {st.submitted ? (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {allSubmitted ? (
            <Button label="결과 보기" icon="check" style={{ flex: 1 }} onPress={finish} />
          ) : (
            <Button label="다음 문제" icon="chevronRight" style={{ flex: 1 }} onPress={goNext} />
          )}
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          <Button label={batch ? "제출" : "채점하기"} icon="check" size="lg" loading={submitting} onPress={() => submit()} />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button
              label="힌트"
              kind="secondary"
              size="sm"
              icon="hint"
              style={{ flex: 1 }}
              onPress={() => update({ hintOpen: !st.hintOpen, hintUsed: true })}
            />
            <Button label="포기" kind="secondary" size="sm" icon="flag" style={{ flex: 1 }} disabled={submitting} onPress={() => submit(true)} />
          </View>
        </View>
      )}

      {sidePanel ? (
        <View style={{ marginTop: space.md }}>
          <AnswerStrip
            size={36}
            cells={problems.map((p, i) => {
              const s = states[p.id]?.submitted
              return {
                key: p.id,
                label: String(p.workbook_number ?? i + 1),
                result: s ? (batch && !allSubmitted ? "pending" : s.result) : null,
                current: i === index,
              }
            })}
          />
        </View>
      ) : null}
    </View>
  )

  // 폰은 문제를 폭에 맞추고 도구 막대를 아래로 내린다
  const imageWidth: number | `${number}%` = isPhone ? `${Math.round(Math.min(100, 92 * imageScale))}%` : (sidePanel ? 560 : 520) * imageScale

  const board = (
    <GraphPaper style={{ flex: 1, overflow: "hidden" }} base={color.sheet}>
      {/* 문제는 왼쪽 위에 고정, 나머지 전부가 풀이 공간 */}
      <View
        style={{ position: "absolute", left: isPhone ? space.md : space.lg, top: isPhone ? space.md : space.lg, width: imageWidth, maxWidth: isPhone ? "92%" : "70%" }}
        pointerEvents="none"
      >
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: radius.sheet, borderWidth: 1, borderColor: color.grid, overflow: "hidden" }}>
          {imageSource ? (
            <Image
              source={imageSource}
              contentFit="contain"
              contentPosition="top left"
              style={{ width: "100%", aspectRatio: aspects[problem.id] ?? 2.4 }}
              onLoad={(e) => {
                const { width, height } = e.source
                if (width && height) setAspects((a) => ({ ...a, [problem.id]: width / height }))
              }}
              accessibilityLabel={`${problem.workbook_number}번 문제`}
            />
          ) : (
            <View style={{ padding: space.lg }}>
              <Text>{problem.raw_text || "문제 이미지를 불러오는 중이에요."}</Text>
            </View>
          )}
        </View>
        {showMark && st.submitted ? (
          <View style={{ position: "absolute", left: -18, top: -22 }}>
            <GradeMark kind={st.submitted.result === "pending" ? "gave_up" : st.submitted.result} size={130} />
          </View>
        ) : null}
      </View>

      <DrawingCanvas
        strokes={st.strokes}
        onChange={(strokes) => update({ strokes })}
        tool={tool}
        penColor={penColor}
        penWidth={isPhone ? 2.2 : 2.6}
        stylusOnly={settings.stylus_only}
      />

      <View
        style={
          isPhone
            ? { position: "absolute", left: space.sm, right: space.sm, bottom: space.sm, flexDirection: "row", gap: space.xs, justifyContent: "center" }
            : { position: "absolute", right: space.md, top: space.md, gap: space.sm, alignItems: "flex-end" }
        }
      >
        <PenToolbar
          vertical={sidePanel}
          compact={isPhone}
          tool={tool}
          setTool={setTool}
          penColor={penColor}
          setPenColor={setPenColor}
          canUndo={st.strokes.length > 0}
          onUndo={() => update({ strokes: st.strokes.slice(0, -1) })}
          onClear={() => update({ strokes: [] })}
        />
        {!isPhone ? (
          <View style={{ flexDirection: sidePanel ? "column" : "row", gap: space.xs, backgroundColor: color.sheet, borderRadius: radius.control, borderWidth: 1, borderColor: color.grid }}>
            <IconButton icon="plus" label="문제 크게" onPress={() => setImageScale((s) => Math.min(1.8, s + 0.2))} size={40} />
            <IconButton icon="minus" label="문제 작게" onPress={() => setImageScale((s) => Math.max(0.6, s - 0.2))} size={40} />
          </View>
        ) : null}
      </View>
    </GraphPaper>
  )

  if (sidePanel) {
    return (
      <View style={{ flex: 1, backgroundColor: color.paper }}>
        {header}
        <View style={{ flex: 1, flexDirection: "row" }}>
          {board}
          <ScrollView
            style={{ width: 340, flexGrow: 0, backgroundColor: color.paper, borderLeftWidth: 1, borderLeftColor: color.grid }}
            contentContainerStyle={{ padding: space.xl, paddingBottom: insets.bottom + space.xl }}
            keyboardShouldPersistTaps="handled"
          >
            {panel}
          </ScrollView>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {header}
      <View style={{ paddingHorizontal: space.md, paddingVertical: space.sm, backgroundColor: color.paper }}>{timer}</View>
      {board}
      <View
        style={{
          padding: space.md,
          paddingBottom: insets.bottom + space.md,
          backgroundColor: color.paper,
          borderTopWidth: 1,
          borderTopColor: color.grid,
        }}
      >
        {panel}
      </View>
    </View>
  )
}

function ResultNote({ submitted, choice }: { submitted: Submitted; choice: boolean }) {
  const answer = displayAnswer(submitted.correctAnswer, choice)
  if (submitted.result === "pending") {
    return (
      <Sheet style={{ gap: 4 }}>
        <Text weight="bold">채점 대기</Text>
        <Text variant="small" tone="soft">이 문제는 아직 정답이 없어요. 답지를 올리거나 정답을 넣으면 채점돼요.</Text>
      </Sheet>
    )
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <PenText size={40}>{submitted.result === "correct" ? "맞았어요" : submitted.result === "gave_up" ? "다음엔 끝까지" : "아쉬워요"}</PenText>
      {submitted.result !== "correct" && answer ? <PenText size={34}>정답 {answer}</PenText> : null}
    </View>
  )
}

function Summary({
  problems,
  states,
  title,
  onClose,
  onRetryWrong,
  onReview,
  retrying,
}: {
  problems: Problem[]
  states: Record<string, ProblemState>
  title: string
  onClose: () => void
  onRetryWrong: (ids: string[]) => void
  onReview: (index: number) => void
  retrying: boolean
}) {
  const insets = useSafeAreaInsets()
  const { isPhone } = useFormFactor()
  const graded = problems.map((p) => states[p.id]?.submitted?.result ?? null)
  const correct = graded.filter((r) => r === "correct").length
  const wrongIds = problems.filter((_, i) => graded[i] === "wrong" || graded[i] === "gave_up").map((p) => p.id)
  const time = problems.reduce((s, p) => s + (states[p.id]?.elapsedSec ?? 0), 0)

  return (
    <GraphPaper style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: isPhone ? space.lg : space.xxxl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xxl, gap: space.xl, maxWidth: 760, width: "100%", alignSelf: "center" }}>
        <View style={{ gap: space.xs }}>
          <Text tone="soft">{title} 채점 결과</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.md }}>
            <Text style={{ fontSize: 64, lineHeight: 72 }} weight="bold" tabular>
              {correct}/{problems.length}
            </Text>
            <PenText size={36}>{correct === problems.length ? "다 맞았어요" : correct >= problems.length / 2 ? "잘했어요" : "다시 보면 돼요"}</PenText>
          </View>
          {time ? <Text tone="soft">{formatDuration(time)} 동안 풀었어요</Text> : null}
        </View>

        <Sheet style={{ gap: space.md }}>
          <Text variant="small" tone="soft">문제를 누르면 다시 볼 수 있어요</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {problems.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => onReview(i)}
                accessibilityRole="button"
                accessibilityLabel={`${p.workbook_number}번 다시 보기`}
                style={{ width: 64, height: 64, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color.gridStrong, backgroundColor: color.sheet }}
              >
                <Text weight="bold" tabular>{p.workbook_number ?? i + 1}</Text>
                {graded[i] && graded[i] !== "pending" ? (
                  <View style={{ position: "absolute" }}>
                    <GradeMark kind={graded[i] as "correct" | "wrong" | "gave_up"} size={60} delay={i * 140} strokeWidth={3.5} />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        </Sheet>

        <View style={{ flexDirection: isPhone ? "column" : "row", gap: space.md }}>
          {wrongIds.length ? (
            <Button label={`틀린 ${wrongIds.length}문제 다시 풀기`} icon="refresh" size="lg" loading={retrying} onPress={() => onRetryWrong(wrongIds)} style={{ flex: isPhone ? undefined : 1 }} />
          ) : null}
          <Button label="끝내기" kind="secondary" size="lg" onPress={onClose} style={{ flex: isPhone ? undefined : 1 }} />
        </View>
      </ScrollView>
    </GraphPaper>
  )
}
