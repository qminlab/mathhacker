// 채점 표시: 맞으면 빨간 동그라미, 틀리면 빗금. 선생님이 빨간펜으로 긋듯이 그려진다.
// 이 앱에서 가장 눈에 띄어야 하는 요소이고, 빨간색은 여기에만 쓴다.
import { useEffect } from "react"
import { View } from "react-native"
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated"
import Svg, { Path } from "react-native-svg"
import { color } from "./theme"

const AnimatedPath = Animated.createAnimatedComponent(Path)

// 시작점을 지나쳐 조금 더 돌아가는 손 동그라미 (viewBox 100)
const CIRCLE = "M 58 9 C 30 4, 8 22, 9 49 C 10 76, 33 93, 57 90 C 82 87, 95 66, 92 42 C 89 20, 70 7, 46 10 C 40 11, 35 13, 31 16"
const CIRCLE_LENGTH = 330
// 왼쪽 아래에서 오른쪽 위로 긋는 빗금
const SLASH = "M 18 86 C 40 62, 62 38, 86 12"
const SLASH_LENGTH = 110

export type MarkKind = "correct" | "wrong" | "gave_up"

export function GradeMark({
  kind,
  size = 96,
  animate = true,
  delay = 0,
  strokeWidth,
}: {
  kind: MarkKind
  size?: number
  animate?: boolean
  delay?: number
  strokeWidth?: number
}) {
  const reduced = useReducedMotion()
  const isCircle = kind === "correct"
  const length = isCircle ? CIRCLE_LENGTH : SLASH_LENGTH
  const progress = useSharedValue(animate && !reduced ? 0 : 1)

  useEffect(() => {
    if (!animate || reduced) {
      progress.value = 1
      return
    }
    progress.value = 0
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: isCircle ? 520 : 260, easing: Easing.out(Easing.cubic) })
    )
  }, [kind, animate, reduced, delay, isCircle, progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }))

  const width = strokeWidth ?? (size >= 64 ? 6 : 4)
  const tint = kind === "gave_up" ? color.inkFaint : color.red

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <AnimatedPath
          d={isCircle ? CIRCLE : SLASH}
          fill="none"
          stroke={tint}
          strokeWidth={width * (100 / size)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[length, length]}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  )
}
