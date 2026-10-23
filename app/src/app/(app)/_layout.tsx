// 앱 뼈대: 패드·컴퓨터는 왼쪽 메뉴, 폰은 아래에 떠 있는 탭 막대
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from "expo-router/ui"
import type { ComponentRef, Ref } from "react"
import { Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useProfile, useProgress } from "@/lib/data"
import { levelInfo } from "@/lib/progress"
import type { PressState } from "@/ui/controls"
import { StarIcon } from "@/ui/game"
import { Icon, type IconName } from "@/ui/Icon"
import { useFormFactor } from "@/ui/layout"
import { Mascot } from "@/ui/Mascot"
import { Text } from "@/ui/Text"
import { LIP, radius, space } from "@/ui/theme"
import { useColors } from "@/ui/ThemeProvider"

const TABS: { name: string; href: "/" | "/library" | "/wrong" | "/stats" | "/settings"; label: string; icon: IconName }[] = [
  { name: "index", href: "/", label: "홈", icon: "today" },
  { name: "library", href: "/library", label: "문제집", icon: "books" },
  { name: "wrong", href: "/wrong", label: "오답", icon: "wrong" },
  { name: "stats", href: "/stats", label: "성장", icon: "stats" },
  { name: "settings", href: "/settings", label: "설정", icon: "settings" },
]

type Variant = "rail" | "sidebar" | "bar"

type TabButtonProps = Omit<TabTriggerSlotProps, "ref"> & {
  label: string
  icon: IconName
  variant: Variant
  ref?: Ref<ComponentRef<typeof Pressable>>
}

function TabButton({ label, icon, variant, isFocused, ref, ...props }: TabButtonProps) {
  const color = useColors()
  const tint = isFocused ? color.primary : color.inkFaint
  if (variant === "bar") {
    return (
      <Pressable
        ref={ref}
        {...props}
        accessibilityRole="tab"
        accessibilityState={{ selected: !!isFocused }}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 2, paddingVertical: 6 }}
      >
        <View style={{ width: 52, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: isFocused ? color.primarySoft : "transparent" }}>
          <Icon name={icon} tint={tint} size={24} strokeWidth={2.3} />
        </View>
        <Text variant="caption" weight="display" style={{ color: tint, fontSize: 12 }}>
          {label}
        </Text>
      </Pressable>
    )
  }
  const wide = variant === "sidebar"
  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={({ pressed, hovered }: PressState) => ({
        flexDirection: wide ? "row" : "column",
        alignItems: "center",
        gap: wide ? space.md : 4,
        paddingVertical: wide ? 12 : 10,
        paddingHorizontal: wide ? space.lg : 0,
        borderRadius: radius.control,
        backgroundColor: isFocused ? color.primarySoft : hovered ? color.bg : "transparent",
        borderWidth: 2,
        borderColor: isFocused ? color.primarySoft : "transparent",
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Icon name={icon} tint={tint} size={wide ? 24 : 26} strokeWidth={2.3} />
      <Text variant={wide ? "bodyLarge" : "caption"} weight="display" style={{ color: isFocused ? color.primary : color.inkSoft }}>
        {label}
      </Text>
    </Pressable>
  )
}

function RailHeader({ wide }: { wide: boolean }) {
  return (
    <View style={{ flexDirection: wide ? "row" : "column", alignItems: "center", gap: space.sm, paddingHorizontal: wide ? space.sm : 0, paddingBottom: space.xl }}>
      <Mascot size={wide ? 44 : 48} bounce={false} />
      {wide ? (
        <Text variant="title" weight="display" tone="primary">
          Squoo
        </Text>
      ) : null}
    </View>
  )
}

function RailFooter({ wide }: { wide: boolean }) {
  const color = useColors()
  const { data: profile } = useProfile()
  const { data: progress } = useProgress()
  if (!profile) return null
  const level = levelInfo(progress?.xp ?? 0).level
  if (!wide) {
    return (
      <View style={{ marginTop: "auto", alignItems: "center", gap: 2 }}>
        <StarIcon size={22} />
        <Text variant="caption" weight="display" tone="sun">
          Lv.{level}
        </Text>
      </View>
    )
  }
  return (
    <View
      style={{
        marginTop: "auto",
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        padding: space.md,
        borderRadius: radius.control,
        backgroundColor: color.bg,
      }}
    >
      <StarIcon size={26} />
      <View style={{ flex: 1 }}>
        <Text weight="display" numberOfLines={1}>
          {profile.nickname ?? "이름 없음"}
        </Text>
        <Text variant="caption" tone="soft" numberOfLines={1}>
          Lv.{level}  {progress?.xp ?? 0} XP
        </Text>
      </View>
    </View>
  )
}

export default function AppLayout() {
  const color = useColors()
  const { form, landscape } = useFormFactor()
  const insets = useSafeAreaInsets()
  const variant: Variant = form === "phone" ? "bar" : form === "desktop" || landscape ? "sidebar" : "rail"
  const side = variant !== "bar"

  return (
    <Tabs style={{ flex: 1, flexDirection: side ? "row-reverse" : "column", backgroundColor: color.bg }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        {side ? (
          <View
            style={{
              flexDirection: "column",
              alignItems: "stretch",
              justifyContent: "flex-start",
              width: variant === "sidebar" ? 240 : 100,
              paddingTop: insets.top + space.lg,
              paddingBottom: insets.bottom + space.lg,
              paddingLeft: Math.max(insets.left, space.md),
              paddingRight: space.md,
              backgroundColor: color.surface,
              borderRightWidth: 2,
              borderRightColor: color.line,
              gap: space.xs,
            }}
          >
            <RailHeader wide={variant === "sidebar"} />
            {TABS.map((t) => (
              <TabTrigger key={t.name} name={t.name} href={t.href} asChild resetOnFocus={t.name === "library"}>
                <TabButton label={t.label} icon={t.icon} variant={variant} />
              </TabTrigger>
            ))}
            <RailFooter wide={variant === "sidebar"} />
          </View>
        ) : (
          // 폰: 화면 아래에 떠 있는 둥근 막대
          <View
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              justifyContent: "space-around",
              marginHorizontal: space.md,
              marginBottom: Math.max(insets.bottom, space.sm),
              paddingHorizontal: space.xs,
              paddingVertical: 4,
              backgroundColor: color.surface,
              borderRadius: 28,
              borderWidth: 2,
              borderColor: color.line,
              borderBottomWidth: 2 + LIP,
            }}
          >
            {TABS.map((t) => (
              <TabTrigger key={t.name} name={t.name} href={t.href} asChild resetOnFocus={t.name === "library"}>
                <TabButton label={t.label} icon={t.icon} variant={variant} />
              </TabTrigger>
            ))}
          </View>
        )}
      </TabList>
    </Tabs>
  )
}
