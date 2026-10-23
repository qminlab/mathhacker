import { Stack } from "expo-router"
import { useColors } from "@/ui/ThemeProvider"

export const unstable_settings = { initialRouteName: "sign-in" }

export default function AuthLayout() {
  const color = useColors()
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
