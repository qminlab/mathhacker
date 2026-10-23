import {
  IBMPlexSansKR_400Regular,
  IBMPlexSansKR_500Medium,
  IBMPlexSansKR_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-kr"
import { Jua_400Regular } from "@expo-google-fonts/jua"
import { NanumPenScript_400Regular } from "@expo-google-fonts/nanum-pen-script"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useFonts } from "expo-font"
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider, useAuth } from "@/lib/auth"
import { isConfigured } from "@/lib/env"
import { SetupNeeded } from "@/features/SetupNeeded"
import { AppThemeProvider, useTheme } from "@/ui/ThemeProvider"

SplashScreen.preventAutoHideAsync().catch(() => {})

function RootNavigator() {
  const { color } = useTheme()
  const { session, loading } = useAuth()
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {})
  }, [loading])
  if (loading) return null

  const signedIn = !!session
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="practice/[sessionId]" options={{ gestureEnabled: false, animation: "fade" }} />
        <Stack.Screen name="upload" options={{ presentation: "formSheet", sheetAllowedDetents: [0.9], sheetGrabberVisible: true }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

/** 테마에 맞춘 내비게이션 색, 상태 막대 */
function Themed({ children }: { children: React.ReactNode }) {
  const { scheme, color } = useTheme()
  const base = scheme === "dark" ? DarkTheme : DefaultTheme
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: color.paper, card: color.sheet, primary: color.blue, text: color.ink, border: color.grid },
  }
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.paper }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        {children}
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansKR_400Regular,
    IBMPlexSansKR_500Medium,
    IBMPlexSansKR_700Bold,
    NanumPenScript_400Regular,
    Jua_400Regular,
  })
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      })
  )

  if (!fontsLoaded && !fontError) return null

  return (
    <AppThemeProvider>
      <Themed>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            {isConfigured ? (
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
            ) : (
              <SetupNeeded />
            )}
          </QueryClientProvider>
        </SafeAreaProvider>
      </Themed>
    </AppThemeProvider>
  )
}
