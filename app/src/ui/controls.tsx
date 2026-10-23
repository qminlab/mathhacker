// 버튼·입력·면 같은 기본 조각
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
import { Text } from "./Text"
import { color, font, radius, space } from "./theme"

/** 웹(react-native-web)은 hovered·focused도 넘겨 준다 */
export type PressState = PressableStateCallbackType & { hovered?: boolean; focused?: boolean }

export type TextInputRef = ComponentRef<typeof TextInput>

type ButtonKind = "primary" | "secondary" | "quiet" | "danger"

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
  const palette = {
    primary: { bg: color.blue, fg: "#FFFFFF", border: color.blue },
    secondary: { bg: color.sheet, fg: color.blue, border: color.gridStrong },
    quiet: { bg: "transparent", fg: color.inkSoft, border: "transparent" },
    danger: { bg: color.sheet, fg: color.red, border: color.gridStrong },
  }[kind]
  const height = { sm: 36, md: 46, lg: 56 }[size]
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      {...rest}
      style={({ pressed, hovered, focused }: PressState) => [
        {
          height,
          paddingHorizontal: size === "sm" ? space.md : space.lg,
          borderRadius: radius.control,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: focused ? color.blueDeep : palette.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space.sm,
          opacity: isDisabled ? 0.45 : pressed ? 0.8 : 1,
          transform: [{ translateY: pressed ? 1 : 0 }],
        },
        hovered && kind === "primary" ? { backgroundColor: color.blueDeep } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={size === "sm" ? 18 : 20} tint={palette.fg} /> : null}
          <Text variant={size === "lg" ? "bodyLarge" : size === "sm" ? "small" : "body"} weight="bold" style={{ color: palette.fg }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}

/** 아이콘만 있는 둥근 버튼 (도구 막대 등) */
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
          borderRadius: radius.control,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? color.blueSoft : "transparent",
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} tint={tint ?? (active ? color.blue : color.inkSoft)} />
    </Pressable>
  )
}

/** 종이 한 장 같은 면. 그림자 대신 얇은 테두리와 아래쪽 한 줄로 두께를 준다. */
export function Sheet({ style, children, padded = true, ...rest }: ViewProps & { padded?: boolean }) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: color.sheet,
          borderRadius: radius.sheet,
          borderWidth: 1,
          borderColor: color.grid,
          borderBottomWidth: 2,
          borderBottomColor: color.gridStrong,
          padding: padded ? space.lg : 0,
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
    return (
      <View style={{ gap: space.xs }}>
        <Text variant="small" weight="medium" tone="soft">
          {label}
        </Text>
        <TextInput
          ref={ref}
          placeholderTextColor={color.inkFaint}
          {...rest}
          style={[
            {
              height: 48,
              borderRadius: radius.control,
              borderWidth: 1,
              borderColor: error ? color.red : color.gridStrong,
              backgroundColor: color.sheet,
              paddingHorizontal: space.md,
              fontFamily: font.regular,
              fontSize: 16,
              color: color.ink,
            },
            style,
          ]}
        />
        {error ? (
          <Text variant="small" tone="red">
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

/** 진행 막대: 푼 비율은 파랑, 맞은 비율은 그 위에 진하게 */
export function Progress({ value, total, height = 6 }: { value: number; total: number; height?: number }) {
  const ratio = total > 0 ? Math.min(1, value / total) : 0
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
      style={{ height, borderRadius: height, backgroundColor: color.grid, overflow: "hidden" }}
    >
      <View style={{ width: `${ratio * 100}%`, height: "100%", backgroundColor: color.blue, borderRadius: height }} />
    </View>
  )
}

/** 세그먼트 선택 (설정 등) */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: "row", backgroundColor: color.paper, borderRadius: radius.control, padding: 3, borderWidth: 1, borderColor: color.grid }}
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
              height: 38,
              borderRadius: radius.control - 3,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? color.sheet : "transparent",
              borderWidth: selected ? 1 : 0,
              borderColor: color.gridStrong,
            }}
          >
            <Text variant="small" weight={selected ? "bold" : "medium"} tone={selected ? "blue" : "soft"}>
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/** 빈 화면 안내: 무엇을 하면 되는지 한 줄 + 행동 버튼 */
export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: "flex-start", gap: space.sm, paddingVertical: space.xl }}>
      <Text variant="title" weight="bold">
        {title}
      </Text>
      {body ? (
        <Text tone="soft" style={{ maxWidth: 520 }}>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: space.sm }}>{action}</View> : null}
    </View>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Sheet style={{ borderColor: color.redSoft, gap: space.sm }}>
      <Text weight="medium">{message}</Text>
      {onRetry ? <Button label="다시 불러오기" kind="secondary" size="sm" icon="refresh" onPress={onRetry} style={{ alignSelf: "flex-start" }} /> : null}
    </Sheet>
  )
}
