import { Stack } from "expo-router"
import { color } from "@/ui/theme"

export const unstable_settings = { initialRouteName: "sign-in" }

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
