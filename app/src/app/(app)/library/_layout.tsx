import { Stack } from "expo-router"
import { color } from "@/ui/theme"

export default function LibraryLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }} />
}
