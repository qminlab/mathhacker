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
import { AnswerPad } from "@/features/practice/AnswerPad"
import { DrawingCanvas, type Tool } from "@/features/practice/DrawingCanvas"
import { PEN_COLORS, PenToolbar } from "@/features/practice/PenToolbar"
import { notify, useStartPractice } from "@/features/practice/useStartPractice"
import { displayAnswer, formatDuration, isChoiceProblem } from "@/lib/answers"
import { backend, invalidateProgress, keys, useImageSources, useProgress, useSessionBundle, useSettings } from "@/lib/data"
import { levelInfo, levelTitle, newlyEarned, xpFor, type Progress as ProgressData } from "@/lib/progress"
import { DEFAULT_SETTINGS, type Problem, type Result, type SessionBundle, type Settings, type Stroke } from "@/lib/types"
import { Button, Chip, IconButton, Sheet } from "@/ui/controls"
import { BadgeTile, Confetti, FlameIcon, LevelBar, PopIn, StarIcon, XpPop } from "@/ui/game"
import { Mascot } from "@/ui/Mascot"
import { GradeMark } from "@/ui/GradeMark"
import { GraphPaper } from "@/ui/GraphPaper"
import { Icon } from "@/ui/Icon"
import { useFormFactor } from "@/ui/layout"
import { Text } from "@/ui/Text"
import { color, LIP, radius, space, tones, type Tone } from "@/ui/theme"

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
      ...(a
        ? {
            answer: a.user_answer,
            elapsedSec: a.time_spent_sec,
            hintUsed: a.hint_used,
            submitted: { result: a.result, correctAnswer: p.answer, userAnswer: a.user_answer },
          }
        : {}),
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
  // 이번에 들어왔을 때의 진행 상황 (레벨업·새 뱃지 판단용)
  const progressQ = useProgress()
  const [startProgress] = useState<ProgressData | undefined>(() => qc.getQueryData<ProgressData>(keys.progress))
  const [gainedHere, setGainedHere] = useState(0)
  const [lastGain, setLastGain] = useState<{ amount: number; key: number }>({ amount: 0, key: 0 })

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
      const gain = xpFor(r.result, st.hintUsed)
      setGainedHere((g) => g + gain)
      if (!batch) setLastGain((l) => ({ amount: gain, key: l.key + 1 }))
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

  /** 다음 안 푼 문제로 (뒤에 없으면 앞에서 건너뛴 문제로). 다 풀었으면 결과로. */
  function goNext() {
    const isOpen = (i: number) => i !== index && !states[problems[i].id]?.submitted
    const after = problems.findIndex((_, i) => i > index && isOpen(i))
    const before = problems.findIndex((_, i) => i < index && isOpen(i))
    const target = after >= 0 ? after : before
    if (target >= 0) setIndex(target)
    else finish()
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
        startProgress={startProgress}
        latestProgress={progressQ.data}
        gainedHere={gainedHere}
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
  const showMark = !!st.submitted && !(batch && !allSubmitted)

  // 맨 위: 닫기, 문제별 칸이 채워지는 진행 막대, 타이머
  const header = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.md,
        paddingTop: insets.top + space.sm,
        paddingBottom: space.sm,
        backgroundColor: color.surface,
        borderBottomWidth: 2,
        borderBottomColor: color.line,
      }}
    >
      <IconButton icon="close" label="풀이 그만하기" onPress={() => router.back()} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {problems.map((p, i) => {
            const sub = states[p.id]?.submitted
            const reveal = sub && !(batch && !allSubmitted)
            const bg = i === index
              ? color.primary
              : !sub
                ? color.line
                : !reveal
                  ? color.sky
                  : sub.result === "correct"
                    ? color.mint
                    : sub.result === "pending"
                      ? color.lineStrong
                      : color.coral
            return (
              <Pressable
                key={p.id}
                onPress={() => setIndex(i)}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1}번째 문제로`}
                hitSlop={{ top: 10, bottom: 10 }}
                style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: bg }}
              />
            )
          })}
        </View>
        <Text variant="small" weight="display" tone="soft" numberOfLines={1}>
          {MODE_TITLE[session.mode]}  {index + 1}/{problems.length}
        </Text>
      </View>
      <Chip tone={overtime ? "coral" : "white"}>
        <Icon name="clock" size={18} tint={overtime ? color.coral : color.inkSoft} strokeWidth={2.4} />
        <Text
          variant="body"
          weight="display"
          tone={overtime ? "coral" : "ink"}
          tabular
          accessibilityLabel={overtime ? `시간 ${formatDuration(-remaining)} 초과` : `남은 시간 ${formatDuration(remaining)}`}
        >
          {overtime ? `+${formatDuration(-remaining)}` : formatDuration(remaining)}
        </Text>
      </Chip>
      {!st.submitted ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="1분 더"
          onPress={() => update({ extraSec: st.extraSec + 60 })}
          hitSlop={8}
          style={{ paddingHorizontal: 10, height: 36, justifyContent: "center", borderRadius: radius.pill, backgroundColor: color.primarySoft }}
        >
          <Text variant="small" weight="display" tone="primary">
            +1분
          </Text>
        </Pressable>
      ) : null}
    </View>
  )

  const hintText = problem.hint ?? [problem.unit && `단원: ${problem.unit}`, problem.score && `${problem.score}점 문제`].filter(Boolean).join(", ")

  const panel = (
    <View style={{ gap: sidePanel ? space.lg : space.md }}>
      {st.submitted && showMark ? (
        <ResultCard
          submitted={st.submitted}
          choice={st.choice}
          gain={xpFor(st.submitted.result, st.hintUsed)}
          popKey={lastGain.key}
          last={allSubmitted}
          onNext={allSubmitted ? finish : goNext}
        />
      ) : st.submitted ? (
        <Sheet style={{ gap: space.md }}>
          <Text weight="display">제출했어요! 다 풀면 한꺼번에 채점해요.</Text>
          <Button label={allSubmitted ? "채점 결과 보기" : "다음 문제"} icon="chevronRight" onPress={allSubmitted ? finish : goNext} />
        </Sheet>
      ) : (
        <>
          <AnswerPad
            choice={st.choice}
            value={st.answer}
            onChange={(v) => update({ answer: v })}
            onSubmit={() => submit()}
            compact={!sidePanel}
            onToggleType={() => update({ choice: !st.choice, answer: "" })}
          />
          {st.hintOpen ? (
            <View style={{ backgroundColor: color.sunSoft, borderRadius: radius.control, padding: space.md, gap: 4 }}>
              <Text variant="small" weight="display" tone="sun">
                힌트
              </Text>
              <Text variant="small">{hintText || "이 문제에는 힌트가 없어요. 문제의 조건을 하나씩 식으로 써 보세요."}</Text>
            </View>
          ) : null}
          <Button label={batch ? "제출" : "확인"} icon="check" size="lg" loading={submitting} disabled={!st.answer.trim()} onPress={() => submit()} />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button
              label={st.hintUsed ? "힌트 보기" : "힌트 (XP -5)"}
              kind="secondary"
              size="sm"
              icon="hint"
              style={{ flex: 1 }}
              onPress={() => update({ hintOpen: !st.hintOpen, hintUsed: true })}
            />
            <Button label="포기" kind="secondary" size="sm" icon="flag" style={{ flex: 1 }} disabled={submitting} onPress={() => submit(true)} />
          </View>
        </>
      )}
    </View>
  )

  const imageWidth: number | `${number}%` = isPhone ? `${Math.round(Math.min(100, 92 * imageScale))}%` : (sidePanel ? 560 : 520) * imageScale

  const board = (
    <GraphPaper style={{ flex: 1, overflow: "hidden" }} base={color.surface}>
      {/* 문제는 왼쪽 위에 고정, 나머지 전부가 풀이 공간 */}
      <View
        style={{ position: "absolute", left: isPhone ? space.md : space.lg, top: isPhone ? space.md : space.lg, width: imageWidth, maxWidth: isPhone ? "92%" : "70%" }}
        pointerEvents="none"
      >
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: radius.control, borderWidth: 2, borderColor: color.line, overflow: "hidden" }}>
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
          <View style={{ flexDirection: sidePanel ? "column" : "row", gap: space.xs, backgroundColor: color.surface, borderRadius: radius.control, borderWidth: 2, borderColor: color.line }}>
            <IconButton icon="plus" label="문제 크게" onPress={() => setImageScale((v) => Math.min(1.8, v + 0.2))} size={40} />
            <IconButton icon="minus" label="문제 작게" onPress={() => setImageScale((v) => Math.max(0.6, v - 0.2))} size={40} />
          </View>
        ) : null}
      </View>
    </GraphPaper>
  )

  if (sidePanel) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        {header}
        <View style={{ flex: 1, flexDirection: "row" }}>
          {board}
          <ScrollView
            style={{ width: 360, flexGrow: 0, backgroundColor: color.bg, borderLeftWidth: 2, borderLeftColor: color.line }}
            contentContainerStyle={{ padding: space.xl, paddingBottom: insets.bottom + space.xl, gap: space.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Text variant="headline" weight="display" tabular>
                {String(problem.workbook_number ?? index + 1).padStart(3, "0")}
              </Text>
              {problem.score ? (
                <Chip tone="primary">
                  <Text variant="small" weight="display" tone="primary">
                    {problem.score}점
                  </Text>
                </Chip>
              ) : null}
            </View>
            {panel}
          </ScrollView>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {header}
      {board}
      <View
        style={{
          padding: space.md,
          paddingBottom: insets.bottom + space.md,
          backgroundColor: color.bg,
          borderTopWidth: 2,
          borderTopColor: color.line,
        }}
      >
        {panel}
      </View>
    </View>
  )
}

/** 채점 결과: 맞으면 민트, 틀리면 코랄 카드에 마스코트와 XP */
function ResultCard({
  submitted,
  choice,
  gain,
  popKey,
  last,
  onNext,
}: {
  submitted: Submitted
  choice: boolean
  gain: number
  popKey: number
  last: boolean
  onNext: () => void
}) {
  const answer = displayAnswer(submitted.correctAnswer, choice)
  const r = submitted.result
  const tone: Tone = r === "correct" ? "mint" : r === "pending" ? "sky" : "coral"
  const t = tones[tone]
  const title =
    r === "correct" ? "정답이에요!" : r === "gave_up" ? "괜찮아, 다음엔 끝까지!" : r === "pending" ? "채점 대기" : "아쉬워요"
  const body =
    r === "pending"
      ? "아직 정답이 없는 문제예요. 답지를 올리면 채점돼요."
      : r === "correct"
        ? undefined
        : answer
          ? `정답은 ${answer}`
          : undefined
  return (
    <View style={{ backgroundColor: t.soft, borderRadius: radius.card, borderWidth: 2, borderColor: t.face, borderBottomWidth: 2 + LIP, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Mascot mood={r === "correct" ? "cheer" : r === "pending" ? "think" : "sad"} size={60} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" weight="display" style={{ color: t.lip }}>
            {title}
          </Text>
          {body ? <Text weight="display">{body}</Text> : null}
        </View>
        <View>
          {gain > 0 ? (
            <Chip tone="sun">
              <StarIcon size={18} />
              <Text weight="display" tone="sun">
                +{gain}
              </Text>
            </Chip>
          ) : null}
          <XpPop key={popKey} amount={gain} visible={popKey > 0} />
        </View>
      </View>
      <Button
        label={last ? "결과 보기" : "계속"}
        kind={r === "correct" ? "success" : r === "pending" ? "primary" : "primary"}
        size="lg"
        icon="chevronRight"
        onPress={onNext}
      />
    </View>
  )
}

function IconDisc({ children }: { children: React.ReactNode }) {
  return <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>{children}</View>
}

function Summary({
  problems,
  states,
  title,
  startProgress,
  latestProgress,
  gainedHere,
  onClose,
  onRetryWrong,
  onReview,
  retrying,
}: {
  problems: Problem[]
  states: Record<string, ProblemState>
  title: string
  startProgress?: ProgressData
  latestProgress?: ProgressData
  gainedHere: number
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
  const sessionXp = problems.reduce((s, p) => {
    const sub = states[p.id]?.submitted
    return s + (sub ? xpFor(sub.result, states[p.id].hintUsed) : 0)
  }, 0)
  const ratio = problems.length ? correct / problems.length : 0
  const great = ratio >= 0.6

  const startXp = startProgress?.xp ?? 0
  const before = levelInfo(startXp)
  const after = levelInfo(startXp + gainedHere)
  const leveledUp = startProgress !== undefined && after.level > before.level
  const badges = startProgress && latestProgress ? newlyEarned(startProgress, latestProgress) : []
  const streak = latestProgress?.streak ?? 0

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {great ? <Confetti /> : null}
      <ScrollView
        contentContainerStyle={{
          padding: isPhone ? space.lg : space.xxxl,
          paddingTop: insets.top + space.xl,
          paddingBottom: insets.bottom + space.xxl,
          gap: space.lg,
          maxWidth: 720,
          width: "100%",
          alignSelf: "center",
          alignItems: "stretch",
        }}
      >
        <View style={{ alignItems: "center", gap: space.sm }}>
          <PopIn>
            <Mascot mood={great ? "cheer" : correct ? "happy" : "sad"} size={isPhone ? 120 : 150} />
          </PopIn>
          <Text tone="soft" weight="display">
            {title} 결과
          </Text>
          <Text style={{ fontSize: isPhone ? 56 : 72, lineHeight: isPhone ? 62 : 80 }} weight="display" tabular>
            {correct}/{problems.length}
          </Text>
          <Text variant="title" weight="display" tone={great ? "mint" : "primary"} align="center">
            {correct === problems.length ? "전부 정답! 완벽해요" : great ? "잘했어요!" : correct ? "조금씩 늘고 있어요" : "오답노트로 다시 도전!"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: space.md }}>
          <Sheet tone="sun" style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <IconDisc><StarIcon size={24} /></IconDisc>
            <Text variant="headline" weight="display" tabular>
              +{sessionXp}
            </Text>
            <Text variant="small" weight="display">
              XP
            </Text>
          </Sheet>
          <Sheet tone="flame" style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <IconDisc><FlameIcon size={24} /></IconDisc>
            <Text variant="headline" weight="display" tone="white" tabular>
              {streak}일
            </Text>
            <Text variant="small" weight="display" tone="white">
              연속
            </Text>
          </Sheet>
          <Sheet tone="sky" style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <IconDisc><Icon name="clock" tint={color.sky} size={22} strokeWidth={2.6} /></IconDisc>
            <Text variant="headline" weight="display" tone="white" tabular>
              {formatDuration(time)}
            </Text>
            <Text variant="small" weight="display" tone="white">
              시간
            </Text>
          </Sheet>
        </View>

        {leveledUp ? (
          <PopIn delay={400}>
            <Sheet style={{ flexDirection: "row", alignItems: "center", gap: space.md, borderColor: color.sun, borderBottomColor: color.sunDeep }}>
              <StarIcon size={36} />
              <View style={{ flex: 1 }}>
                <Text variant="title" weight="display">
                  레벨 업! Lv.{after.level}
                </Text>
                <Text tone="soft">{levelTitle(after.level)}가 됐어요</Text>
              </View>
            </Sheet>
          </PopIn>
        ) : (
          <Sheet>
            <LevelBar xp={startXp + gainedHere} compact />
          </Sheet>
        )}

        {badges.length ? (
          <Sheet style={{ gap: space.md }}>
            <Text variant="title" weight="display">
              새 뱃지!
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.lg }}>
              {badges.map((b, i) => (
                <PopIn key={b.id} delay={600 + i * 150}>
                  <BadgeTile {...b} earned current={b.goal} />
                </PopIn>
              ))}
            </View>
          </Sheet>
        ) : null}

        <Sheet style={{ gap: space.md }}>
          <Text variant="small" tone="soft" weight="bold">
            문제를 누르면 다시 볼 수 있어요
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {problems.map((p, i) => {
              const r = graded[i]
              const t = r === "correct" ? tones.mint : r === "wrong" || r === "gave_up" ? tones.coral : tones.white
              return (
                <Pressable
                  key={p.id}
                  onPress={() => onReview(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.workbook_number}번 다시 보기`}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: r && r !== "pending" ? t.soft : color.bg,
                    borderWidth: 2,
                    borderColor: r && r !== "pending" ? t.face : color.line,
                    borderBottomWidth: 2 + LIP,
                  }}
                >
                  <Text weight="display" tabular>
                    {p.workbook_number ?? i + 1}
                  </Text>
                  {r && r !== "pending" ? (
                    <View style={{ position: "absolute" }}>
                      <GradeMark kind={r as "correct" | "wrong" | "gave_up"} size={54} delay={500 + i * 140} strokeWidth={3.5} />
                    </View>
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        </Sheet>

        <View style={{ gap: space.md }}>
          {wrongIds.length ? (
            <Button label={`틀린 ${wrongIds.length}문제 다시 도전`} icon="refresh" kind="primary" size="lg" loading={retrying} onPress={() => onRetryWrong(wrongIds)} />
          ) : null}
          <Button label="끝내기" kind="secondary" size="lg" onPress={onClose} />
        </View>
      </ScrollView>
    </View>
  )
}
