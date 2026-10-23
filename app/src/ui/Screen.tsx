// 탭 화면 공통 틀: 안전 영역, 스크롤, 최대 폭, 제목
import type { ReactNode } from "react"
import { RefreshControl, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { GraphPaper } from "./GraphPaper"
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
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
  back?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  const { contentMax, gutter, isPhone } = useFormFactor()
  return (
    <GraphPaper style={{ flex: 1 }} faint>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: insets.top + (isPhone ? space.lg : space.xxl),
        paddingBottom: space.xxxl + (isPhone ? 0 : insets.bottom),
        paddingHorizontal: gutter,
      }}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={color.blue} /> : undefined}
    >
      <View style={{ width: "100%", maxWidth: contentMax, alignSelf: "center", gap: isPhone ? space.lg : space.xl }}>
        {back}
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: space.lg, flexWrap: "wrap" }}>
          <View style={{ flexShrink: 1, gap: 2 }}>
            <Text variant={isPhone ? "headline" : "display"} weight="bold" accessibilityRole="header">
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
        {children}
      </View>
    </ScrollView>
    </GraphPaper>
  )
}

/** 화면 안의 소제목 */
export function SectionTitle({ children, aside }: { children: string; aside?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.sm }}>
      <Text variant="title" weight="bold" accessibilityRole="header">
        {children}
      </Text>
      {aside}
    </View>
  )
}
