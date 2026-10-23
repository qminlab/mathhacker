import { Stack } from "expo-router"
import { useColors } from "@/ui/ThemeProvider"

export default function LibraryLayout() {
  const color = useColors()
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }} />
}
