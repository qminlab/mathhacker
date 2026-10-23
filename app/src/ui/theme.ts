// 디자인 토큰
//
// 모티프는 수학 공부하는 책상: 모눈종이, 파란 볼펜, 빨간 채점펜, 노란 형광펜.
// - 파란색은 "내가 하는 일"(버튼, 내 필기, 선택)
// - 빨간색은 채점 표시(동그라미·빗금)와 경고에만 쓴다. 다른 곳에 빨강을 쓰지 않는다.
// - 노란 형광펜은 "오늘"을 강조할 때만 아껴서 쓴다.

export const color = {
  paper: "#F6F8FB", // 모눈종이 바탕
  sheet: "#FFFFFF", // 문제·입력 면
  grid: "#DDE4EE", // 모눈 선
  gridStrong: "#C7D2E1",
  ink: "#2F343C", // 연필심(본문)
  inkSoft: "#5E6672", // 보조 글자
  inkFaint: "#8B93A0",
  blue: "#2443A8", // 볼펜
  blueSoft: "#E8EDFA",
  blueDeep: "#182E78",
  red: "#E23B2E", // 채점펜
  redSoft: "#FDECEA",
  highlighter: "#FFE15A", // 형광펜
  highlighterSoft: "#FFF6C7",
  mint: "#2E8B6E", // 완료·업로드 성공 (채점 표시와 겹치지 않는 차분한 초록)
} as const

export const font = {
  regular: "IBMPlexSansKR_400Regular",
  medium: "IBMPlexSansKR_500Medium",
  bold: "IBMPlexSansKR_700Bold",
  pen: "NanumPenScript_400Regular", // 채점펜 글씨에만
} as const

// 타입 스케일 (1.25 비율, 기준 16)
export const type = {
  caption: { fontSize: 12, lineHeight: 16 },
  small: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 22 },
  bodyLarge: { fontSize: 17, lineHeight: 26 },
  title: { fontSize: 20, lineHeight: 28 },
  headline: { fontSize: 25, lineHeight: 32 },
  display: { fontSize: 32, lineHeight: 40 },
  number: { fontSize: 40, lineHeight: 44 },
} as const

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const

// 모서리: 종이(면)는 살짝, 손으로 누르는 것은 더 둥글게
export const radius = { sheet: 6, control: 10, pill: 999 } as const

/** 모눈 한 칸 크기. 화면 곳곳의 간격도 이 배수로 맞춘다 */
export const GRID = 24
