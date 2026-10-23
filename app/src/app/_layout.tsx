import {
  IBMPlexSansKR_400Regular,
  IBMPlexSansKR_500Medium,
  IBMPlexSansKR_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-kr"
import { NanumPenScript_400Regular } from "@expo-google-fonts/nanum-pen-script"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useFonts } from "expo-font"
import { DefaultTheme, Stack, ThemeProvider } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider, useAuth } from "@/lib/auth"
import { isConfigured } from "@/lib/env"
import { color } from "@/ui/theme"
import { SetupNeeded } from "@/features/SetupNeeded"

SplashScreen.preventAutoHideAsync().catch(() => {})

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: color.paper, card: color.sheet, primary: color.blue, text: color.ink, border: color.grid },
}

function RootNavigator() {
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
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansKR_400Regular,
    IBMPlexSansKR_500Medium,
    IBMPlexSansKR_700Bold,
    NanumPenScript_400Regular,
  })
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      })
  )

  if (!fontsLoaded && !fontError) return null

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.paper }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navTheme}>
            <StatusBar style="dark" />
            {isConfigured ? (
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
            ) : (
              <SetupNeeded />
            )}
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
