// 화면 크기별 레이아웃. 패드를 기준으로 설계하고, 폰은 줄이고, 컴퓨터는 넓힌다.
import { useWindowDimensions } from "react-native"

export type FormFactor = "phone" | "tablet" | "desktop"

export function useFormFactor() {
  const { width, height } = useWindowDimensions()
  const shortSide = Math.min(width, height)
  // 패드는 짧은 변이 744pt(iPad mini) 이상. 폰을 가로로 눕혀도 폰이다.
  let form: FormFactor = shortSide >= 700 ? "tablet" : "phone"
  // 웹에서 넓은 창은 컴퓨터로 본다
  if (width >= 1280 && shortSide >= 700) form = "desktop"
  // 패드를 화면 분할로 좁게 쓰면 폰 레이아웃으로
  if (form !== "phone" && width < 600) form = "phone"

  return {
    form,
    width,
    height,
    landscape: width > height,
    isPhone: form === "phone",
    /** 본문 최대 폭 */
    contentMax: form === "desktop" ? 1120 : form === "tablet" ? 960 : width,
    /** 화면 좌우 여백 */
    gutter: form === "phone" ? 16 : 32,
  }
}

/** 카드 격자 열 수 */
export function columnsFor(width: number, min = 300) {
  return Math.max(1, Math.floor(width / min))
}
