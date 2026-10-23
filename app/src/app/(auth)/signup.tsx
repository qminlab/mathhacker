// 계정 만들기 (이메일 인증 없이 바로 시작하도록 Supabase에서 Confirm email을 꺼 두는 것을 권장)
import { Link } from "expo-router"
import { useRef, useState } from "react"
import { Pressable, View } from "react-native"
import { AuthFrame } from "@/features/AuthFrame"
import { signUp } from "@/lib/auth"
import { Button, Field, type TextInputRef } from "@/ui/controls"
import { Text } from "@/ui/Text"
import { space } from "@/ui/theme"

export default function SignupScreen() {
  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<TextInputRef>(null)
  const passwordRef = useRef<TextInputRef>(null)

  async function submit() {
    if (!nickname.trim() || !email.trim() || !password) {
      setError("닉네임, 이메일, 비밀번호를 모두 입력해 주세요.")
      return
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { needsConfirmation } = await signUp(email, password, nickname)
      if (needsConfirmation) {
        setNotice("가입했습니다. 메일함에서 인증을 마친 뒤 로그인해 주세요.")
        setLoading(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "가입하지 못했습니다.")
      setLoading(false)
    }
  }

  return (
    <AuthFrame>
      <Text variant="title" weight="bold">
        계정 만들기
      </Text>
      <View style={{ gap: space.md }}>
        <Field
          label="닉네임"
          value={nickname}
          onChangeText={setNickname}
          maxLength={20}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <Field
          ref={emailRef}
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
          hint="6자 이상"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>
      {error ? (
        <Text tone="red" variant="small">
          {error}
        </Text>
      ) : null}
      {notice ? <Text tone="mint">{notice}</Text> : null}
      <Button label="가입하고 시작하기" size="lg" loading={loading} onPress={submit} />
      <Link href="/sign-in" asChild>
        <Pressable accessibilityRole="link" style={{ alignSelf: "center", padding: space.sm }}>
          <Text tone="soft">
            이미 계정이 있으면 <Text weight="bold" tone="blue">로그인</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthFrame>
  )
}
