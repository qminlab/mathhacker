// EXPO_PUBLIC_ 값은 빌드할 때 코드에 그대로 박힌다 (process.env.X 형태로만 읽어야 함)
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, ""),
  demo: process.env.EXPO_PUBLIC_DEMO === "1",
}

export const isConfigured = env.demo || Boolean(env.supabaseUrl && env.supabaseAnonKey && env.apiUrl)
