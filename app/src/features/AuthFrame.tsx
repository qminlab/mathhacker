// 로그인·가입 화면 틀. 패드·컴퓨터는 왼쪽에 브랜드 면, 폰은 위아래로.
import { useState, type ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { GradeMark } from "@/ui/GradeMark"
import { GraphPaper } from "@/ui/GraphPaper"
import { useFormFactor } from "@/ui/layout"
import { Text } from "@/ui/Text"
import { color, font, space } from "@/ui/theme"

function Brand({ compact }: { compact: boolean }) {
  const numberSize = compact ? 56 : 88
  const [box, setBox] = useState({ w: 0, h: 0 })
  const mark = box.h * 1.55
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ alignSelf: "flex-start", paddingHorizontal: numberSize * 0.2, paddingVertical: numberSize * 0.12 }}>
        <Text
          onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          style={{ fontFamily: font.bold, fontSize: numberSize, lineHeight: numberSize * 1.05, color: color.blue, letterSpacing: -2 }}
        >
          011
        </Text>
        {box.w > 0 ? (
          // 숫자를 감싸도록 동그라미를 옆으로 늘린다
          <View
            style={{
              position: "absolute",
              left: numberSize * 0.2 + box.w / 2 - mark / 2,
              top: numberSize * 0.12 + box.h / 2 - mark / 2,
              transform: [{ scaleX: (box.w * 1.25) / mark }, { rotate: "-4deg" }],
            }}
          >
            <GradeMark kind="correct" size={mark} delay={350} strokeWidth={compact ? 4 : 5} />
          </View>
        ) : null}
      </View>
      <View style={{ gap: space.xs }}>
        <Text variant={compact ? "headline" : "display"} weight="bold">
          Math Hacker
        </Text>
        <Text variant={compact ? "body" : "bodyLarge"} tone="soft" style={{ maxWidth: 380 }}>
          가진 문제지를 한 번 올려 두면, 매일 몇 문제씩 꺼내 풀고 채점까지 해 줍니다.
        </Text>
      </View>
    </View>
  )
}

export function AuthFrame({ children }: { children: ReactNode }) {
  const { isPhone, width } = useFormFactor()
  const split = !isPhone && width >= 900

  return (
    <GraphPaper style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              flexDirection: split ? "row" : "column",
              alignItems: split ? "center" : "stretch",
              justifyContent: "center",
              padding: isPhone ? space.lg : space.xxxl,
              gap: split ? space.xxxl * 1.5 : space.xxl,
              maxWidth: 1100,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <View style={{ flex: split ? 1 : undefined, paddingTop: isPhone ? space.xl : 0 }}>
              <Brand compact={!split} />
            </View>
            <View
              style={{
                flex: split ? 1 : undefined,
                maxWidth: 440,
                width: "100%",
                alignSelf: split ? "center" : isPhone ? "stretch" : "center",
                backgroundColor: color.sheet,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: color.grid,
                borderBottomWidth: 3,
                borderBottomColor: color.gridStrong,
                padding: isPhone ? space.lg : space.xl,
                gap: space.lg,
              }}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GraphPaper>
  )
}
