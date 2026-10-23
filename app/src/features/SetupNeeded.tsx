// 환경변수 없이 빌드했을 때 보이는 안내 (개발자용)
import { useEffect } from "react"
import { ScrollView, View } from "react-native"
import * as SplashScreen from "expo-splash-screen"
import { GraphPaper } from "@/ui/GraphPaper"
import { Sheet } from "@/ui/controls"
import { Text } from "@/ui/Text"
import { space } from "@/ui/theme"

export function SetupNeeded() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])
  return (
    <GraphPaper style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: space.xl }}>
        <Sheet style={{ maxWidth: 560, width: "100%", alignSelf: "center", gap: space.md }}>
          <Text variant="title" weight="bold">
            서버 연결 정보가 없습니다
          </Text>
          <Text tone="soft">
            app/.env.local 에 EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_URL을 넣고 앱을 다시
            실행하세요. 화면만 둘러보려면 EXPO_PUBLIC_DEMO=1 로 실행하면 됩니다.
          </Text>
          <View />
        </Sheet>
      </ScrollView>
    </GraphPaper>
  )
}
