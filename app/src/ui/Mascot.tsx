// 마스코트 "모눈이": 모눈종이 한 칸이 살아난 친구. 채점·레벨업 때 표정이 바뀐다.
// 직접 그린 캐릭터 (다른 작품의 캐릭터가 아님)
import { useEffect } from "react"
import { View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg"
import { palette } from "./theme"

export type Mood = "happy" | "cheer" | "sad" | "wow" | "sleepy" | "think"

function Face({ mood }: { mood: Mood }) {
  const ink = palette.ink
  // 눈
  const eyes =
    mood === "sleepy" ? (
      <>
        <Path d="M33 47 q6 5 12 0" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <Path d="M55 47 q6 5 12 0" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      </>
    ) : mood === "cheer" ? (
      <>
        <Path d="M33 49 q6 -8 12 0" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <Path d="M55 49 q6 -8 12 0" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <Ellipse cx={39} cy={46} rx={6.5} ry={mood === "wow" ? 8.5 : 7.5} fill="#FFFFFF" />
        <Ellipse cx={61} cy={46} rx={6.5} ry={mood === "wow" ? 8.5 : 7.5} fill="#FFFFFF" />
        <Circle cx={mood === "think" ? 41 : 40} cy={mood === "sad" ? 48 : 47} r={4} fill={ink} />
        <Circle cx={mood === "think" ? 63 : 62} cy={mood === "sad" ? 48 : 47} r={4} fill={ink} />
        <Circle cx={41.5} cy={45} r={1.4} fill="#FFFFFF" />
        <Circle cx={63.5} cy={45} r={1.4} fill="#FFFFFF" />
      </>
    )
  // 입
  const mouth = {
    happy: <Path d="M42 60 q8 8 16 0" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
    cheer: <Path d="M40 58 q10 14 20 0 z" fill={ink} />,
    sad: <Path d="M43 64 q7 -6 14 0" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
    wow: <Ellipse cx={50} cy={62} rx={5} ry={6} fill={ink} />,
    sleepy: <Path d="M45 61 h10" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />,
    think: <Path d="M44 62 q6 -3 12 1" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
  }[mood]
  return (
    <G>
      {eyes}
      {/* 볼 */}
      <Ellipse cx={30} cy={57} rx={5} ry={3.2} fill="#FF9DB0" opacity={0.85} />
      <Ellipse cx={70} cy={57} rx={5} ry={3.2} fill="#FF9DB0" opacity={0.85} />
      {mouth}
      {mood === "sad" ? <Path d="M33 55 q-3 6 0 8 q3 -2 0 -8" fill={palette.sky} /> : null}
      {mood === "sleepy" ? <Path d="M76 22 h7 l-7 8 h7" stroke={palette.primaryDeep} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </G>
  )
}

export function Mascot({ mood = "happy", size = 96, bounce = true }: { mood?: Mood; size?: number; bounce?: boolean }) {
  const reduced = useReducedMotion()
  const y = useSharedValue(0)
  const pop = useSharedValue(1)

  useEffect(() => {
    if (!bounce || reduced) return
    y.value = withRepeat(
      withSequence(withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })),
      -1
    )
  }, [bounce, reduced, y])

  // 표정이 바뀌면 통 튀어 오른다
  useEffect(() => {
    if (reduced) return
    pop.value = 0.85
    pop.value = withSpring(1, { damping: 7, stiffness: 220 })
  }, [mood, reduced, pop])

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scale: pop.value }] }))
  const arms = mood === "cheer"

  return (
    <Animated.View style={[{ width: size, height: size }, style]} accessible accessibilityLabel="마스코트 모눈이">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="mn-body" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8B6DFF" />
            <Stop offset="1" stopColor={palette.primary} />
          </LinearGradient>
        </Defs>
        {/* 그림자 */}
        <Ellipse cx={50} cy={95} rx={26} ry={3.5} fill={palette.ink} opacity={0.12} />
        {/* 팔 */}
        {arms ? (
          <>
            <Path d="M17 52 q-10 -12 -6 -22" stroke={palette.primaryDeep} strokeWidth={7} fill="none" strokeLinecap="round" />
            <Path d="M83 52 q10 -12 6 -22" stroke={palette.primaryDeep} strokeWidth={7} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <Path d="M17 60 q-8 6 -6 14" stroke={palette.primaryDeep} strokeWidth={7} fill="none" strokeLinecap="round" />
            <Path d="M83 60 q8 6 6 14" stroke={palette.primaryDeep} strokeWidth={7} fill="none" strokeLinecap="round" />
          </>
        )}
        {/* 발 */}
        <Rect x={30} y={84} width={14} height={9} rx={4.5} fill={palette.primaryDeep} />
        <Rect x={56} y={84} width={14} height={9} rx={4.5} fill={palette.primaryDeep} />
        {/* 몸: 모눈종이 한 칸 */}
        <Rect x={14} y={14} width={72} height={74} rx={22} fill={palette.primaryDeep} />
        <Rect x={14} y={12} width={72} height={72} rx={22} fill="url(#mn-body)" />
        <G stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={1.5}>
          <Path d="M38 14 V84 M62 14 V84 M14 36 H86 M14 60 H86" />
        </G>
        {/* 윤기 */}
        <Path d="M26 22 q8 -5 18 -4" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={4} fill="none" strokeLinecap="round" />
        {/* 연필 꽂은 머리 */}
        <G transform="rotate(24 74 14)">
          <Rect x={70} y={4} width={8} height={16} rx={2} fill={palette.sun} />
          <Path d="M70 20 h8 l-4 7 z" fill="#F2D4A8" />
          <Path d="M73 25 h2 l-1 2 z" fill={palette.ink} />
          <Rect x={70} y={1} width={8} height={4} rx={1.5} fill={palette.coral} />
        </G>
        <Face mood={mood} />
      </Svg>
    </Animated.View>
  )
}

/** 마스코트 + 말풍선 */
export function MascotSays({ mood, children, size = 72 }: { mood: Mood; children: React.ReactNode; size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Mascot mood={mood} size={size} />
      <View
        style={{
          flexShrink: 1,
          backgroundColor: palette.surface,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: palette.line,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        {/* 꼬리 */}
        <View
          style={{
            position: "absolute",
            left: -8,
            top: "50%",
            marginTop: -7,
            width: 14,
            height: 14,
            backgroundColor: palette.surface,
            borderLeftWidth: 2,
            borderBottomWidth: 2,
            borderColor: palette.line,
            transform: [{ rotate: "45deg" }],
          }}
        />
        {children}
      </View>
    </View>
  )
}
