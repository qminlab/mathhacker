// 풀이 세션을 만들고 풀이 화면으로 이동
import { useMutation } from "@tanstack/react-query"
import { router } from "expo-router"
import { Alert, Platform } from "react-native"
import { backend } from "@/lib/data"
import type { PracticeMode } from "@/lib/types"

export function notify(title: string, message?: string) {
  if (Platform.OS === "web") {
    // 웹에는 네이티브 알림창이 없다
    globalThis.alert?.([title, message].filter(Boolean).join("\n\n"))
  } else {
    Alert.alert(title, message)
  }
}

export function useStartPractice() {
  return useMutation({
    mutationFn: async ({
      mode,
      workbookId,
      problemIds,
    }: {
      mode: PracticeMode
      workbookId?: number
      problemIds?: string[]
    }) => {
      const session =
        mode === "daily"
          ? await backend.startDaily()
          : problemIds?.length
            ? await backend.startWith(mode, problemIds, workbookId)
            : await backend.startSession(mode, workbookId)
      return { session, mode }
    },
    onSuccess: ({ session, mode }) => {
      if (!session || session.problem_ids.length === 0) {
        notify(
          mode === "wrong" ? "다시 풀 오답이 없어요" : "풀 문제가 없어요",
          mode === "wrong" ? "틀리거나 포기한 문제가 생기면 여기서 다시 풀 수 있어요." : "문제지를 올리거나 다른 문제집을 골라 보세요."
        )
        return
      }
      router.push(`/practice/${session.id}`)
    },
    onError: (e) => notify("시작하지 못했어요", e instanceof Error ? e.message : undefined),
  })
}

/** 확인 창 (웹은 브라우저 confirm) */
export function confirmAsync(title: string, message: string, confirmLabel = "확인", destructive = false): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false)
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: "취소", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
    ])
  )
}
