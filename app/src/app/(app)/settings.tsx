// 설정: 풀이 방식, 내 정보, 로그아웃
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Pressable, Switch, View } from "react-native"
import { confirmAsync, notify } from "@/features/practice/useStartPractice"
import { signOut, useAuth } from "@/lib/auth"
import { backend, keys, useProfile, useSaveSettings, useSettings } from "@/lib/data"
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types"
import { GradePicker } from "@/features/GradePicker"
import { GRADE_LABEL } from "@/lib/grades"
import { Button, Field, Segmented, Sheet } from "@/ui/controls"
import { Screen } from "@/ui/Screen"
import { Text } from "@/ui/Text"
import { radius, space } from "@/ui/theme"
import { setThemePref, useColors, useThemePref, type ThemePref } from "@/ui/ThemeProvider"

function Row({ title, body, children }: { title: string; body?: string; children: React.ReactNode }) {
  const color = useColors()
  return (
    <View style={{ gap: space.sm, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: color.grid }}>
      <View style={{ gap: 2 }}>
        <Text weight="bold">{title}</Text>
        {body ? (
          <Text variant="small" tone="soft">
            {body}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  )
}

function Stepper({ value, onChange, min, max, step, unit }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string }) {
  const color = useColors()
  const btn = (label: string, next: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === "−" ? "줄이기" : "늘리기"}
      disabled={disabled}
      onPress={() => onChange(next)}
      style={{ width: 44, height: 44, borderRadius: radius.control, borderWidth: 1, borderColor: color.gridStrong, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.35 : 1, backgroundColor: color.sheet }}
    >
      <Text variant="title" weight="bold" tone="blue">
        {label}
      </Text>
    </Pressable>
  )
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      {btn("−", Math.max(min, value - step), value <= min)}
      <Text variant="title" weight="bold" tabular style={{ minWidth: 80, textAlign: "center" }} accessibilityLiveRegion="polite">
        {value}
        {unit}
      </Text>
      {btn("+", Math.min(max, value + step), value >= max)}
    </View>
  )
}

function ThemeSheet() {
  const pref = useThemePref()
  return (
    <Sheet style={{ paddingVertical: space.sm }}>
      <Text variant="title" weight="display" style={{ paddingVertical: space.sm }}>
        화면
      </Text>
      <Row title="테마" body={pref === "system" ? "기기 설정에 맞춰 밝게·어둡게 바뀌어요." : "이 기기에서만 적용돼요."}>
        <View style={{ maxWidth: 420 }}>
          <Segmented<ThemePref>
            value={pref}
            onChange={setThemePref}
            options={[
              { value: "system", label: "기기 설정" },
              { value: "light", label: "라이트" },
              { value: "dark", label: "다크" },
            ]}
          />
        </View>
      </Row>
    </Sheet>
  )
}

export default function SettingsScreen() {
  const color = useColors()
  const settingsQ = useSettings()
  const save = useSaveSettings()
  const profile = useProfile()
  const { demo } = useAuth()
  const qc = useQueryClient()
  const s = settingsQ.data ?? DEFAULT_SETTINGS
  const set = (patch: Partial<Settings>) => save.mutate({ ...s, ...patch })

  // 고치기 전까지는 저장된 닉네임을 보여 준다
  const [draftNickname, setNickname] = useState<string | null>(null)
  const nickname = draftNickname ?? profile.data?.nickname ?? ""

  const rename = useMutation({
    mutationFn: () => backend.updateNickname(nickname),
    onSuccess: () => {
      setNickname(null)
      qc.invalidateQueries({ queryKey: keys.profile })
      notify("닉네임을 바꿨어요")
    },
    onError: (e) => notify("바꾸지 못했어요", e instanceof Error ? e.message : undefined),
  })

  const removeAccount = useMutation({
    mutationFn: () => backend.deleteAccount(),
    onError: (e) => notify("계정을 지우지 못했어요", e instanceof Error ? e.message : undefined),
  })

  return (
    <Screen title="설정">
      <ThemeSheet />
      <Sheet style={{ paddingVertical: space.sm }}>
        <Text variant="title" weight="bold" style={{ paddingVertical: space.sm }}>
          풀이
        </Text>
        <View style={{ paddingVertical: space.md, gap: space.md }}>
          <View style={{ gap: 2 }}>
            <Text weight="display">학년</Text>
            <Text variant="small" tone="soft">
              {s.grade
                ? `${GRADE_LABEL[s.grade]} 공용 문제가 오늘의 퀘스트에 섞여 나와요. 오늘 세트가 이미 있으면 내일부터 바뀌어요.`
                : "고르면 그 학년의 공용 문제(코드로 만든 오리지널 문제)가 오늘의 퀘스트에 들어가요."}
            </Text>
          </View>
          <GradePicker value={s.grade} onChange={(g) => set({ grade: g })} />
        </View>
        <Row title="오늘의 세트 문제 수" body="매일 안 푼 문제 중에서 이만큼 골라요. 바꾸면 내일 세트부터 적용돼요.">
          <Stepper value={s.daily_count} onChange={(v) => set({ daily_count: v })} min={1} max={50} step={1} unit="문제" />
        </Row>
        <Row title="문제당 제한 시간" body="시간이 지나도 계속 풀 수 있고, 넘긴 시간이 빨갛게 표시돼요.">
          <Stepper
            value={Math.round(s.time_per_problem_sec / 60)}
            onChange={(v) => set({ time_per_problem_sec: v * 60 })}
            min={1}
            max={30}
            step={1}
            unit="분"
          />
        </Row>
        <Row title="채점" body={s.grading_mode === "instant" ? "한 문제 낼 때마다 바로 채점해요." : "세트를 다 푼 뒤 한꺼번에 채점해요. 시험처럼 풀 때 좋아요."}>
          <View style={{ maxWidth: 420 }}>
            <Segmented
              value={s.grading_mode}
              onChange={(v) => set({ grading_mode: v })}
              options={[
                { value: "instant", label: "문제마다 바로" },
                { value: "batch", label: "다 풀고 한꺼번에" },
              ]}
            />
          </View>
        </Row>
        <Row title="펜으로만 쓰기" body="켜면 손가락이나 손바닥이 닿아도 풀이판에 그려지지 않아요. 애플펜슬·S펜을 쓸 때 켜세요.">
          <Switch
            value={s.stylus_only}
            onValueChange={(v) => set({ stylus_only: v })}
            trackColor={{ true: color.blue, false: color.gridStrong }}
            accessibilityLabel="펜으로만 쓰기"
          />
        </Row>
      </Sheet>

      <Sheet style={{ gap: space.md }}>
        <Text variant="title" weight="bold">
          내 정보
        </Text>
        <Text tone="soft">{profile.data?.email}</Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.sm, maxWidth: 520 }}>
          <View style={{ flex: 1 }}>
            <Field label="닉네임" value={nickname} onChangeText={setNickname} maxLength={20} />
          </View>
          <Button
            label="바꾸기"
            kind="secondary"
            disabled={!nickname.trim() || nickname === profile.data?.nickname}
            loading={rename.isPending}
            onPress={() => rename.mutate()}
          />
        </View>
        {!demo ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: color.grid }}>
            <Button label="로그아웃" kind="quiet" icon="logout" onPress={() => signOut()} style={{ paddingHorizontal: 0 }} />
            <Button
              label="계정 삭제"
              kind="quiet"
              icon="trash"
              loading={removeAccount.isPending}
              style={{ paddingHorizontal: 0 }}
              onPress={async () => {
                const ok = await confirmAsync(
                  "계정을 삭제할까요?",
                  "올린 문제지, 문제집, 풀이 기록이 모두 지워지고 되돌릴 수 없어요.",
                  "삭제",
                  true
                )
                if (ok) removeAccount.mutate()
              }}
            />
          </View>
        ) : (
          <Text variant="small" tone="faint">
            체험 모드예요. 기록은 앱을 끄면 사라져요.
          </Text>
        )}
      </Sheet>
    </Screen>
  )
}
