// Supabase 클라이언트. 로그인 상태는 기기에 저장한다.
// 네이티브: expo-sqlite가 제공하는 localStorage, 웹: 브라우저 localStorage
import "expo-sqlite/localStorage/install"
import { createClient } from "@supabase/supabase-js"
import { AppState, Platform } from "react-native"
import { env } from "./env"

export const supabase = createClient(env.supabaseUrl || "https://demo.invalid", env.supabaseAnonKey || "demo", {
  auth: {
    storage: typeof localStorage !== "undefined" ? localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// 앱이 화면에 있을 때만 토큰을 자동 갱신한다 (Supabase 권장)
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}
