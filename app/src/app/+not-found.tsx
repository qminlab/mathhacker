// 없는 주소(또는 로그인 전에 앱 화면 주소)로 들어오면 알맞은 첫 화면으로 보낸다.
// 로그인 전에는 (app) 그룹이 막혀 있어서 "/" 가 이 화면으로 온다 → 로그인 화면으로.
import { Redirect } from "expo-router"
import { useAuth } from "@/lib/auth"

export default function NotFound() {
  const { session, loading } = useAuth()
  if (loading) return null
  return <Redirect href={session ? "/" : "/sign-in"} />
}
