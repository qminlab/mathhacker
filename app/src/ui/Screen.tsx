// 탭 화면 공통 틀: 안전 영역, 스크롤, 최대 폭, 큰 제목
import type { ReactNode } from "react"
import { RefreshControl, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFormFactor } from "./layout"
import { Text } from "./Text"
import { color, space } from "./theme"

export function Screen({
  title,
  subtitle,
  action,
  children,
  refreshing,
  onRefresh,
  back,
  top,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
  back?: ReactNode
  /** 제목 대신 맨 위에 둘 것 (홈의 상태 막대 등) */
  top?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  const { contentMax, gutter, isPhone } = useFormFactor()
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + (isPhone ? space.md : space.xxl),
        paddingBottom: space.xxxl + (isPhone ? 0 : insets.bottom),
        paddingHorizontal: gutter,
      }}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={color.primary} /> : undefined}
    >
      <View style={{ width: "100%", maxWidth: contentMax, alignSelf: "center", gap: isPhone ? space.lg : space.xl }}>
        {back}
        {top}
        {title ? (
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: space.lg, flexWrap: "wrap" }}>
            <View style={{ flexShrink: 1, gap: 2 }}>
              <Text variant={isPhone ? "headline" : "display"} weight="display" accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? (
                <Text tone="soft" variant={isPhone ? "body" : "bodyLarge"}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {action}
          </View>
        ) : null}
        {children}
      </View>
    </ScrollView>
  )
}

/** 화면 안의 소제목 */
export function SectionTitle({ children, aside }: { children: string; aside?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.sm, gap: space.md }}>
      <Text variant="title" weight="display" accessibilityRole="header">
        {children}
      </Text>
      {aside}
    </View>
  )
}
