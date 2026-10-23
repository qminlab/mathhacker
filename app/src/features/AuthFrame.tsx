// 로그인·가입 화면 틀. 패드·컴퓨터는 왼쪽에 마스코트 면, 폰은 위아래로.
import { LinearGradient } from "expo-linear-gradient"
import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { FlameIcon, StarIcon } from "@/ui/game"
import { useFormFactor } from "@/ui/layout"
import { Mascot } from "@/ui/Mascot"
import { Text } from "@/ui/Text"
import { LIP, radius, space } from "@/ui/theme"
import { useColors } from "@/ui/ThemeProvider"

function Perk({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start" }}>
      {icon}
      <Text weight="display" tone="white">
        {children}
      </Text>
    </View>
  )
}

function Brand({ compact }: { compact: boolean }) {
  return (
    <View style={{ gap: compact ? space.md : space.xl, alignItems: compact ? "center" : "flex-start" }}>
      <View style={{ width: compact ? 120 : 180, height: compact ? 120 : 180, borderRadius: 100, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
        <Mascot mood="cheer" size={compact ? 96 : 144} />
      </View>
      <View style={{ gap: space.xs, alignItems: compact ? "center" : "flex-start" }}>
        <Text style={{ fontSize: compact ? 40 : 60, lineHeight: compact ? 46 : 68 }} weight="display" tone="white">
          Math Hacker
        </Text>
        <Text variant={compact ? "body" : "bodyLarge"} weight="display" align={compact ? "center" : "left"} style={{ color: "#E3DCFF", maxWidth: 380 }}>
          내 문제지로 매일 퀘스트 깨기
        </Text>
      </View>
      {!compact ? (
        <View style={{ gap: space.sm }}>
          <Perk icon={<FlameIcon size={20} />}>매일 풀면 불꽃이 이어져요</Perk>
          <Perk icon={<StarIcon size={20} />}>맞힐수록 XP, 레벨 업</Perk>
        </View>
      ) : null}
    </View>
  )
}

export function AuthFrame({ children }: { children: ReactNode }) {
  const color = useColors()
  const { isPhone, width } = useFormFactor()
  const split = !isPhone && width >= 900

  return (
    <LinearGradient colors={["#8A6BFF", color.primary, color.primaryDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
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
              gap: split ? space.xxxl * 1.5 : space.xl,
              maxWidth: 1100,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <View style={{ flex: split ? 1 : undefined, paddingTop: isPhone ? space.lg : 0 }}>
              <Brand compact={!split} />
            </View>
            <View
              style={{
                flex: split ? 1 : undefined,
                maxWidth: 440,
                width: "100%",
                alignSelf: split ? "center" : isPhone ? "stretch" : "center",
                backgroundColor: color.surface,
                borderRadius: radius.card + 4,
                borderBottomWidth: LIP + 2,
                borderBottomColor: "rgba(0,0,0,0.18)",
                padding: isPhone ? space.lg : space.xl,
                gap: space.lg,
              }}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}
