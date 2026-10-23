// 해설 보기: 화면 위에 뜨는 카드 (해설은 문제처럼 그림 한 장)
import { Image } from "expo-image"
import { useState } from "react"
import { Modal, Pressable, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { IconButton } from "@/ui/controls"
import { useFormFactor } from "@/ui/layout"
import { Mascot } from "@/ui/Mascot"
import { Text } from "@/ui/Text"
import { LIP, radius, space } from "@/ui/theme"
import { useColors } from "@/ui/ThemeProvider"

export function SolutionSheet({
  visible,
  source,
  onClose,
}: {
  visible: boolean
  source: string | number | undefined
  onClose: () => void
}) {
  const color = useColors()
  const insets = useSafeAreaInsets()
  const { isPhone } = useFormFactor()
  const [aspect, setAspect] = useState(1.6)
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} accessibilityLabel="해설 닫기" style={{ flex: 1, backgroundColor: "rgba(18,15,38,0.55)", justifyContent: isPhone ? "flex-end" : "center", alignItems: "center", padding: isPhone ? 0 : space.xl }}>
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            maxWidth: 720,
            maxHeight: "88%",
            backgroundColor: color.surface,
            borderRadius: radius.card + 6,
            borderBottomLeftRadius: isPhone ? 0 : radius.card + 6,
            borderBottomRightRadius: isPhone ? 0 : radius.card + 6,
            borderWidth: 2,
            borderColor: color.line,
            borderBottomWidth: isPhone ? 0 : 2 + LIP,
            paddingBottom: isPhone ? insets.bottom : 0,
            overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.md, paddingLeft: space.lg, borderBottomWidth: 2, borderBottomColor: color.line }}>
            <Mascot mood="think" size={40} bounce={false} />
            <Text variant="title" weight="display" style={{ flex: 1 }}>
              해설
            </Text>
            <IconButton icon="close" label="해설 닫기" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ padding: space.md }}>
            {source ? (
              <View style={{ backgroundColor: "#FFFFFF", borderRadius: radius.control, overflow: "hidden" }}>
                <Image
                  source={source}
                  contentFit="contain"
                  style={{ width: "100%", aspectRatio: aspect }}
                  onLoad={(e) => {
                    const { width, height } = e.source
                    if (width && height) setAspect(width / height)
                  }}
                  accessibilityLabel="해설"
                />
              </View>
            ) : (
              <Text tone="soft">해설을 불러오는 중이에요.</Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
