// 로그인
import { Link } from "expo-router"
import { useRef, useState } from "react"
import { Pressable, View } from "react-native"
import { AuthFrame } from "@/features/AuthFrame"
import { signIn } from "@/lib/auth"
import { Button, Field, type TextInputRef } from "@/ui/controls"
import { Text } from "@/ui/Text"
import { space } from "@/ui/theme"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<TextInputRef>(null)

  async function submit() {
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password) // 성공하면 화면이 저절로 바뀐다
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인하지 못했습니다.")
      setLoading(false)
    }
  }

  return (
    <AuthFrame>
      <Text variant="title" weight="bold">
        로그인
      </Text>
      <View style={{ gap: space.md }}>
        <Field
          label="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <Field
          ref={passwordRef}
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>
      {error ? (
        <Text tone="red" variant="small">
          {error}
        </Text>
      ) : null}
      <Button label="로그인" size="lg" loading={loading} onPress={submit} />
      <Link href="/signup" asChild>
        <Pressable accessibilityRole="link" style={{ alignSelf: "center", padding: space.sm }}>
          <Text tone="soft">
            처음이면 <Text weight="bold" tone="blue">계정 만들기</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthFrame>
  )
}
