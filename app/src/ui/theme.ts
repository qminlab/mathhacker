// 디자인 토큰 (게임형)
//
// 중·고등학생이 매일 들어오고 싶은 앱: 쨍한 색, 통통한 입체 버튼, 연속 학습 불꽃, XP, 뱃지, 마스코트 모눈이.
// - 보라(primary)는 "누를 수 있는 것"과 내 진행
// - 민트는 맞음, 코랄은 틀림 (채점 결과에만)
// - 해(노랑)는 XP·별, 주황은 연속 학습 불꽃
// 입체감은 그림자 대신 아래쪽 "턱"(lip) 한 줄로 낸다: 버튼·카드가 같은 방식이라 한 세트로 보인다.

export const palette = {
  primary: "#6D4AFF",
  primaryDeep: "#4E2FD9",
  primarySoft: "#ECE7FF",
  mint: "#19C28C",
  mintDeep: "#0E9A6E",
  mintSoft: "#DDF7EE",
  coral: "#FF5C6C",
  coralDeep: "#D93A4B",
  coralSoft: "#FFE5E8",
  sun: "#FFC233",
  sunDeep: "#E0A100",
  sunSoft: "#FFF3D1",
  flame: "#FF8A3D",
  flameSoft: "#FFE9DA",
  sky: "#3DB6FF",
  skyDeep: "#1A8FD6",
  skySoft: "#DFF3FF",
  bg: "#F4F2FF",
  surface: "#FFFFFF",
  line: "#E6E2F7",
  lineStrong: "#D3CDEE",
  ink: "#1F1A3D",
  inkSoft: "#6B6790",
  inkFaint: "#A19DBF",
} as const

/** 예전 이름 → 새 팔레트 (풀이판 등 공용 조각이 쓰는 이름) */
export const color = {
  ...palette,
  paper: palette.bg,
  sheet: palette.surface,
  grid: palette.line,
  gridStrong: palette.lineStrong,
  blue: palette.primary,
  blueSoft: palette.primarySoft,
  blueDeep: palette.primaryDeep,
  red: palette.coral,
  redSoft: palette.coralSoft,
  highlighter: palette.sun,
  highlighterSoft: palette.sunSoft,
} as const

export const font = {
  regular: "IBMPlexSansKR_400Regular",
  medium: "IBMPlexSansKR_500Medium",
  bold: "IBMPlexSansKR_700Bold",
  display: "Jua_400Regular", // 제목·숫자·버튼: 둥글고 통통한 글씨
  pen: "NanumPenScript_400Regular",
} as const

export const type = {
  caption: { fontSize: 12, lineHeight: 16 },
  small: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 22 },
  bodyLarge: { fontSize: 17, lineHeight: 26 },
  title: { fontSize: 21, lineHeight: 28 },
  headline: { fontSize: 26, lineHeight: 32 },
  display: { fontSize: 34, lineHeight: 40 },
  number: { fontSize: 44, lineHeight: 48 },
} as const

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const

export const radius = { sheet: 22, card: 22, control: 16, chip: 12, pill: 999 } as const

/** 입체 턱 두께 */
export const LIP = 4

export const GRID = 24

export type Tone = "primary" | "mint" | "coral" | "sun" | "sky" | "flame" | "white"

export const tones: Record<Tone, { face: string; lip: string; soft: string; on: string }> = {
  primary: { face: palette.primary, lip: palette.primaryDeep, soft: palette.primarySoft, on: "#FFFFFF" },
  mint: { face: palette.mint, lip: palette.mintDeep, soft: palette.mintSoft, on: "#FFFFFF" },
  coral: { face: palette.coral, lip: palette.coralDeep, soft: palette.coralSoft, on: "#FFFFFF" },
  sun: { face: palette.sun, lip: palette.sunDeep, soft: palette.sunSoft, on: palette.ink },
  sky: { face: palette.sky, lip: palette.skyDeep, soft: palette.skySoft, on: "#FFFFFF" },
  flame: { face: palette.flame, lip: "#E06A1C", soft: palette.flameSoft, on: "#FFFFFF" },
  white: { face: palette.surface, lip: palette.lineStrong, soft: palette.bg, on: palette.primary },
}
