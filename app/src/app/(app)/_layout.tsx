// 앱 뼈대: 패드·컴퓨터는 왼쪽 레일, 폰은 아래 탭 막대
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from "expo-router/ui"
import type { ComponentRef, Ref } from "react"
import { Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useProfile } from "@/lib/data"
import type { PressState } from "@/ui/controls"
import { Icon, type IconName } from "@/ui/Icon"
import { useFormFactor } from "@/ui/layout"
import { Text } from "@/ui/Text"
import { color, font, space } from "@/ui/theme"

const TABS: { name: string; href: "/" | "/library" | "/wrong" | "/stats" | "/settings"; label: string; icon: IconName }[] = [
  { name: "index", href: "/", label: "오늘", icon: "today" },
  { name: "library", href: "/library", label: "문제집", icon: "books" },
  { name: "wrong", href: "/wrong", label: "오답노트", icon: "wrong" },
  { name: "stats", href: "/stats", label: "기록", icon: "stats" },
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
  const tint = isFocused ? color.blue : color.inkSoft
  if (variant === "bar") {
    return (
      <Pressable
        ref={ref}
        {...props}
        accessibilityRole="tab"
        accessibilityState={{ selected: !!isFocused }}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6, gap: 2 }}
      >
        <Icon name={icon} tint={tint} size={24} />
        <Text variant="caption" weight={isFocused ? "bold" : "medium"} style={{ color: tint }}>
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
        paddingVertical: wide ? 11 : 10,
        paddingHorizontal: wide ? space.md : 0,
        borderRadius: 10,
        backgroundColor: isFocused ? color.blueSoft : hovered ? color.paper : "transparent",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} tint={tint} size={wide ? 22 : 24} />
      <Text variant={wide ? "body" : "caption"} weight={isFocused ? "bold" : "medium"} style={{ color: tint }}>
        {label}
      </Text>
    </Pressable>
  )
}

function RailHeader({ wide }: { wide: boolean }) {
  return (
    <View style={{ paddingHorizontal: wide ? space.md : 0, paddingTop: space.sm, paddingBottom: space.xl, alignItems: wide ? "flex-start" : "center" }}>
      <Text style={{ fontFamily: font.bold, fontSize: wide ? 22 : 18, color: color.blue, letterSpacing: -0.5 }}>
        {wide ? "Math Hacker" : "MH"}
      </Text>
    </View>
  )
}

function RailFooter({ wide }: { wide: boolean }) {
  const { data } = useProfile()
  if (!wide || !data) return null
  return (
    <View style={{ marginTop: "auto", paddingHorizontal: space.md, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: color.grid }}>
      <Text weight="bold" numberOfLines={1}>
        {data.nickname ?? "이름 없음"}
      </Text>
      <Text variant="small" tone="faint" numberOfLines={1}>
        {data.email}
      </Text>
    </View>
  )
}

export default function AppLayout() {
  const { form, landscape } = useFormFactor()
  const insets = useSafeAreaInsets()
  const variant: Variant = form === "phone" ? "bar" : form === "desktop" || landscape ? "sidebar" : "rail"
  const side = variant !== "bar"

  return (
    <Tabs style={{ flex: 1, flexDirection: side ? "row-reverse" : "column", backgroundColor: color.paper }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          style={
            side
              ? {
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  width: variant === "sidebar" ? 232 : 92,
                  paddingTop: insets.top + space.lg,
                  paddingBottom: insets.bottom + space.lg,
                  paddingLeft: Math.max(insets.left, space.md),
                  paddingRight: space.md,
                  backgroundColor: color.sheet,
                  borderRightWidth: 1,
                  borderRightColor: color.grid,
                  gap: space.xs,
                }
              : {
                  flexDirection: "row",
                  alignItems: "stretch",
                  justifyContent: "space-around",
                  paddingBottom: insets.bottom,
                  paddingHorizontal: space.sm,
                  backgroundColor: color.sheet,
                  borderTopWidth: 1,
                  borderTopColor: color.grid,
                }
          }
        >
          {side ? <RailHeader wide={variant === "sidebar"} /> : null}
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild resetOnFocus={t.name === "library"}>
              <TabButton label={t.label} icon={t.icon} variant={variant} />
            </TabTrigger>
          ))}
          {side ? <RailFooter wide={variant === "sidebar"} /> : null}
        </View>
      </TabList>
    </Tabs>
  )
}
