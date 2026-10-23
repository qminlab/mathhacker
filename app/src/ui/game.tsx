// 게임 요소 조각: 연속 학습 불꽃, 별(XP), 레벨 막대, 주간 불꽃 달력, 뱃지, XP 팝업, 축하 꽃가루
import { useEffect } from "react"
import { View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle, Path } from "react-native-svg"
import type { Progress as ProgressData } from "@/lib/progress"
import { levelInfo, levelTitle } from "@/lib/progress"
import { Chip, Progress } from "./controls"
import { Text } from "./Text"
import { schemes } from "./theme"
import { useColors } from "./ThemeProvider"

export function FlameIcon({ size = 20, lit = true }: { size?: number; lit?: boolean }) {
  const color = useColors()
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5c.6 3-1.4 4.6-2.8 6.2C7.6 10.5 6 12.4 6 15.2 6 18.8 8.7 21.5 12 21.5s6-2.7 6-6.3c0-3.3-2-5.3-3.2-6.7-.2 1.7-1 2.7-2 3.2.6-3-.1-6.4-.8-9.2z"
        fill={lit ? color.flame : color.lineStrong}
      />
      <Path d="M12 21.5c-1.9 0-3.3-1.4-3.3-3.3 0-2 1.6-3 2.4-4.3.5 1.1 1.3 1.6 2 1.9.9.4 2.2 1 2.2 2.6 0 1.7-1.4 3.1-3.3 3.1z" fill={lit ? color.sun : color.line} />
    </Svg>
  )
}

export function StarIcon({ size = 20, filled = true }: { size?: number; filled?: boolean }) {
  const color = useColors()
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"
        fill={filled ? color.sun : color.line}
        stroke={filled ? color.sunDeep : color.lineStrong}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function StreakChip({ streak, activeToday }: { streak: number; activeToday: boolean }) {
  return (
    <Chip tone={activeToday ? "flame" : "white"}>
      <FlameIcon size={20} lit={streak > 0} />
      <Text variant="body" weight="display" tone={streak > 0 ? "flame" : "faint"} tabular>
        {streak}일
      </Text>
    </Chip>
  )
}

export function LevelChip({ xp }: { xp: number }) {
  const { level } = levelInfo(xp)
  return (
    <Chip tone="sun">
      <StarIcon size={20} />
      <Text variant="body" weight="display" tone="sun" tabular>
        Lv.{level}
      </Text>
    </Chip>
  )
}

/** 레벨 카드 안의 진행 막대 */
export function LevelBar({ xp, compact }: { xp: number; compact?: boolean }) {
  const info = levelInfo(xp)
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text variant={compact ? "body" : "title"} weight="display">
          Lv.{info.level} {levelTitle(info.level)}
        </Text>
        <Text variant="small" weight="bold" tone="soft" tabular>
          {info.into}/{info.need} XP
        </Text>
      </View>
      <Progress value={info.into} total={info.need} tone="sun" height={compact ? 12 : 16} />
    </View>
  )
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"]

/** 최근 7일: 푼 날은 불꽃 */
export function WeekFlames({ week }: { week: ProgressData["week"] }) {
  const color = useColors()
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {week.map((d, i) => {
        const date = new Date(`${d.day}T00:00:00`)
        const isToday = i === week.length - 1
        return (
          <View key={d.day} style={{ alignItems: "center", gap: 4, flex: 1 }} accessible accessibilityLabel={`${WEEKDAY[date.getDay()]}요일 ${d.active ? "풀었음" : "안 풂"}`}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: d.active ? color.flameSoft : color.bg,
                borderWidth: isToday ? 2 : 0,
                borderColor: d.active ? color.flame : color.lineStrong,
                borderStyle: isToday && !d.active ? "dashed" : "solid",
              }}
            >
              <FlameIcon size={22} lit={d.active} />
            </View>
            <Text variant="caption" weight={isToday ? "bold" : "medium"} tone={isToday ? "ink" : "faint"}>
              {isToday ? "오늘" : WEEKDAY[date.getDay()]}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

/** 뱃지 한 칸 */
export function BadgeTile({
  emoji,
  name,
  how,
  earned,
  current,
  goal,
  size = "md",
}: {
  emoji: string
  name: string
  how: string
  earned: boolean
  current: number
  goal: number
  size?: "sm" | "md"
}) {
  const color = useColors()
  const disc = size === "sm" ? 56 : 72
  return (
    <View style={{ alignItems: "center", gap: 6, opacity: earned ? 1 : 0.9 }} accessible accessibilityLabel={`${name} 뱃지 ${earned ? "획득" : `${current}/${goal}`}`}>
      <View
        style={{
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: earned ? color.sunSoft : color.bg,
          borderWidth: 3,
          borderColor: earned ? color.sun : color.line,
          borderBottomWidth: 6,
          borderBottomColor: earned ? color.sunDeep : color.lineStrong,
        }}
      >
        <Text style={{ fontSize: disc * 0.45, lineHeight: disc * 0.6, opacity: earned ? 1 : 0.25 }}>{emoji}</Text>
      </View>
      <Text variant="small" weight="display" align="center" numberOfLines={1}>
        {name}
      </Text>
      {size === "md" ? (
        <Text variant="caption" tone="faint" align="center" numberOfLines={2} style={{ maxWidth: 120 }}>
          {earned ? how : `${current}/${goal}`}
        </Text>
      ) : null}
    </View>
  )
}

/** 정답 때 떠오르는 +XP */
export function XpPop({ amount, visible }: { amount: number; visible: boolean }) {
  const reduced = useReducedMotion()
  const y = useSharedValue(0)
  const o = useSharedValue(0)
  useEffect(() => {
    if (!visible || amount <= 0) return
    o.value = 1
    y.value = 0
    if (reduced) return
    y.value = withTiming(-36, { duration: 900, easing: Easing.out(Easing.cubic) })
    o.value = withDelay(700, withTiming(0, { duration: 400 }))
  }, [visible, amount, reduced, y, o])
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }))
  if (!visible || amount <= 0) return null
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", right: 0, top: -8 }, style]}>
      <Chip tone="sun">
        <StarIcon size={18} />
        <Text weight="display" tone="sun">
          +{amount} XP
        </Text>
      </Chip>
    </Animated.View>
  )
}

const L = schemes.light
const CONFETTI = [L.primary, L.mint, L.coral, L.sun, L.sky, L.flame]

/** 한 번 터지는 꽃가루 (결과 화면 한 곳에서만) */
export function Confetti({ count = 26 }: { count?: number }) {
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1 }}>
      {Array.from({ length: count }, (_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  )
}

function Piece({ index }: { index: number }) {
  // 결정적인 의사 난수 (매 렌더 같은 모양)
  const r = (k: number) => {
    const x = Math.sin(index * 97.13 + k * 13.7) * 43758.5453
    return x - Math.floor(x)
  }
  const left = `${r(1) * 100}%` as const
  const drift = (r(2) - 0.5) * 120
  const fall = 260 + r(3) * 320
  const rot = (r(4) - 0.5) * 720
  const tint = CONFETTI[index % CONFETTI.length]
  const t = useSharedValue(0)
  useEffect(() => {
    t.value = withDelay(r(5) * 250, withTiming(1, { duration: 1400 + r(6) * 900, easing: Easing.out(Easing.quad) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value * t.value,
    transform: [{ translateX: drift * t.value }, { translateY: fall * t.value }, { rotate: `${rot * t.value}deg` }],
  }))
  const round = index % 3 === 0
  return (
    <Animated.View style={[{ position: "absolute", left, top: -10 }, style]}>
      {round ? (
        <Svg width={10} height={10}>
          <Circle cx={5} cy={5} r={5} fill={tint} />
        </Svg>
      ) : (
        <View style={{ width: 8, height: 14, borderRadius: 2, backgroundColor: tint }} />
      )}
    </Animated.View>
  )
}

/** 레벨업 배지 팝 (스프링으로 커졌다 자리 잡기) */
export function PopIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduced = useReducedMotion()
  const s = useSharedValue(reduced ? 1 : 0.4)
  useEffect(() => {
    if (reduced) return
    s.value = withDelay(delay, withSequence(withSpring(1.1, { damping: 6 }), withSpring(1, { damping: 10 })))
  }, [reduced, delay, s])
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: Math.min(1, s.value * 1.5) }))
  return <Animated.View style={style}>{children}</Animated.View>
}

