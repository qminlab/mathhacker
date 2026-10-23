// 기본 조각: 통통한 입체 버튼, 턱 있는 카드, 입력칸, 진행 막대, 칩
import type { ComponentRef, ReactNode, Ref } from "react"
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type TextInputProps,
  type ViewProps,
  type ViewStyle,
} from "react-native"
import { Icon, type IconName } from "./Icon"
import { Mascot, type Mood } from "./Mascot"
import { Text } from "./Text"
import { font, LIP, radius, space, type Tone } from "./theme"
import { useColors, useTones } from "./ThemeProvider"

/** 웹(react-native-web)은 hovered·focused도 넘겨 준다 */
export type PressState = PressableStateCallbackType & { hovered?: boolean; focused?: boolean }

export type TextInputRef = ComponentRef<typeof TextInput>

type ButtonKind = "primary" | "secondary" | "quiet" | "danger" | "success" | "sun"

const KIND_TONE: Record<Exclude<ButtonKind, "quiet">, Tone> = {
  primary: "primary",
  secondary: "white",
  danger: "white",
  success: "mint",
  sun: "sun",
}

/** 누르면 턱만큼 쑥 들어가는 입체 버튼 */
export function Button({
  label,
  kind = "primary",
  icon,
  loading,
  disabled,
  size = "md",
  style,
  ...rest
}: Omit<PressableProps, "style"> & {
  label: string
  kind?: ButtonKind
  icon?: IconName
  loading?: boolean
  size?: "sm" | "md" | "lg"
  style?: StyleProp<ViewStyle>
}) {
  const color = useColors()
  const tones = useTones()
  const height = { sm: 40, md: 50, lg: 60 }[size]
  const isDisabled = disabled || loading
  const textVariant = size === "lg" ? "title" : size === "sm" ? "body" : "bodyLarge"

  if (kind === "quiet") {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        {...rest}
        style={({ pressed }) => [{ height, flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.sm, opacity: isDisabled ? 0.4 : pressed ? 0.6 : 1 }, style]}
      >
        {icon ? <Icon name={icon} size={20} tint={color.inkSoft} /> : null}
        <Text variant="body" weight="bold" tone="soft">
          {label}
        </Text>
      </Pressable>
    )
  }

  const t = tones[KIND_TONE[kind]]
  const fg = kind === "danger" ? color.coral : t.on
  const outline = kind === "secondary" || kind === "danger"

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      {...rest}
      style={[{ opacity: isDisabled ? 0.5 : 1 }, style]}
    >
      {({ pressed, focused }: PressState) => (
        <View style={{ height: height + LIP }}>
          {/* 턱 */}
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height, borderRadius: radius.control, backgroundColor: t.lip }} />
          {/* 윗면 */}
          <View
            style={{
              height,
              marginTop: pressed ? LIP : 0,
              borderRadius: radius.control,
              backgroundColor: t.face,
              borderWidth: outline ? 2 : 0,
              borderColor: focused ? color.primary : color.lineStrong,
              paddingHorizontal: size === "sm" ? space.md : space.xl,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: space.sm,
            }}
          >
            {loading ? (
              <ActivityIndicator color={fg} />
            ) : (
              <>
                {icon ? <Icon name={icon} size={size === "sm" ? 18 : 22} tint={fg} strokeWidth={2.4} /> : null}
                <Text variant={textVariant} weight="display" style={{ color: fg }}>
                  {label}
                </Text>
              </>
            )}
          </View>
        </View>
      )}
    </Pressable>
  )
}

/** 아이콘만 있는 동그란 버튼 */
export function IconButton({
  icon,
  label,
  active,
  tint,
  size = 44,
  style,
  ...rest
}: Omit<PressableProps, "style"> & {
  icon: IconName
  label: string
  active?: boolean
  tint?: string
  size?: number
  style?: StyleProp<ViewStyle>
}) {
  const color = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      hitSlop={6}
      {...rest}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2.6,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? color.primarySoft : "transparent",
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
        style,
      ]}
    >
      <Icon name={icon} tint={tint ?? (active ? color.primary : color.inkSoft)} strokeWidth={2.2} />
    </Pressable>
  )
}

/** 카드: 흰 면 + 테두리 + 아래 턱 */
export function Sheet({
  style,
  children,
  padded = true,
  tone,
  ...rest
}: ViewProps & { padded?: boolean; tone?: Tone }) {
  const color = useColors()
  const tones = useTones()
  const t = tone ? tones[tone] : null
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: t ? t.face : color.surface,
          borderRadius: radius.card,
          borderWidth: 2,
          borderColor: t ? t.face : color.line,
          borderBottomWidth: 2 + LIP,
          borderBottomColor: t ? t.lip : color.line,
          padding: padded ? space.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

/** 작은 알약 모양 표시 (🔥 12일, ⭐ Lv.3 …) */
export function Chip({
  children,
  tone = "white",
  style,
}: {
  children: ReactNode
  tone?: Tone
  style?: StyleProp<ViewStyle>
}) {
  const color = useColors()
  const tones = useTones()
  const t = tones[tone]
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          height: 36,
          borderRadius: radius.pill,
          backgroundColor: tone === "white" ? color.surface : t.soft,
          borderWidth: 2,
          borderColor: tone === "white" ? color.line : t.soft,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function Field({
  label,
  hint,
  error,
  style,
  ref,
  ...rest
}: TextInputProps & { label: string; hint?: string; error?: string | null; ref?: Ref<TextInputRef> }) {
  const color = useColors()
  return (
    <View style={{ gap: 6 }}>
      <Text variant="small" weight="bold" tone="soft">
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={color.inkFaint}
        {...rest}
        style={[
          {
            height: 52,
            borderRadius: radius.control,
            borderWidth: 2,
            borderColor: error ? color.coral : color.line,
            backgroundColor: color.bg,
            paddingHorizontal: space.lg,
            fontFamily: font.medium,
            fontSize: 16,
            color: color.ink,
          },
          style,
        ]}
      />
      {error ? (
        <Text variant="small" tone="coral">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="faint">
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

/** 두툼한 진행 막대 (윗부분에 윤기) */
export function Progress({
  value,
  total,
  height = 14,
  tone = "primary",
}: {
  value: number
  total: number
  height?: number
  tone?: Tone
}) {
  const color = useColors()
  const tones = useTones()
  const ratio = total > 0 ? Math.min(1, value / total) : 0
  const t = tones[tone]
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
      style={{ height, borderRadius: height, backgroundColor: color.line, overflow: "hidden" }}
    >
      {ratio > 0 ? (
        <View style={{ width: `${Math.max(ratio * 100, 6)}%`, height: "100%", borderRadius: height, backgroundColor: t.face }}>
          <View style={{ position: "absolute", left: height / 2, right: height / 2, top: height * 0.22, height: Math.max(2, height * 0.22), borderRadius: 2, backgroundColor: "#FFFFFF", opacity: 0.35 }} />
        </View>
      ) : null}
    </View>
  )
}

/** 알약 모양 선택 */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const color = useColors()
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: "row", backgroundColor: color.line, borderRadius: radius.pill, padding: 4, gap: 4 }}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              height: 40,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? color.surface : "transparent",
            }}
          >
            <Text variant="body" weight="display" tone={selected ? "primary" : "soft"}>
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/** 빈 화면: 마스코트 + 다음에 할 일 */
export function Empty({ title, body, action, mood = "think" }: { title: string; body?: string; action?: ReactNode; mood?: Mood }) {
  return (
    <View style={{ alignItems: "center", gap: space.md, paddingVertical: space.xxl }}>
      <Mascot mood={mood} size={110} />
      <Text variant="title" weight="display" align="center">
        {title}
      </Text>
      {body ? (
        <Text tone="soft" align="center" style={{ maxWidth: 420 }}>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: space.sm }}>{action}</View> : null}
    </View>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const color = useColors()
  return (
    <Sheet style={{ borderColor: color.coralSoft, borderBottomColor: color.coralSoft, gap: space.sm }}>
      <Text weight="bold">{message}</Text>
      {onRetry ? <Button label="다시 불러오기" kind="secondary" size="sm" icon="refresh" onPress={onRetry} style={{ alignSelf: "flex-start" }} /> : null}
    </Sheet>
  )
}
