// 디자인 토큰 (게임형)
//
// 중·고등학생이 매일 들어오고 싶은 앱: 쨍한 색, 통통한 입체 버튼, 연속 학습 불꽃, XP, 뱃지, 마스코트 모눈이.
// - 보라(primary)는 "누를 수 있는 것"과 내 진행
// - 민트는 맞음, 코랄은 틀림 (채점 결과에만)
// - 해(노랑)는 XP·별, 주황은 연속 학습 불꽃
// 입체감은 그림자 대신 아래쪽 "턱"(lip) 한 줄로 낸다: 버튼·카드가 같은 방식이라 한 세트로 보인다.

const light = {
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
  sunText: "#9A6600", // 노랑 바탕 위에서도 읽히는 글자색
  mintText: "#0E9A6E",
  flame: "#FF8A3D",
  flameDeep: "#E06A1C",
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
  onTint: "#E3DCFF", // 보라 그라데이션 위의 흐린 글자
}

export type Palette = { [K in keyof typeof light]: string }

/** 다크: 밤하늘 보라 바탕, 색은 조금 더 밝게, soft는 어두운 색조 */
const dark: Palette = {
  primary: "#8467FF",
  primaryDeep: "#5638E0",
  primarySoft: "#2D2660",
  mint: "#1FCB95",
  mintDeep: "#10966C",
  mintSoft: "#163D35",
  coral: "#FF6877",
  coralDeep: "#CF3A4C",
  coralSoft: "#47222C",
  sun: "#FFC94D",
  sunDeep: "#C9920F",
  sunSoft: "#3B3119",
  sunText: "#FFD36B",
  mintText: "#3FE0AE",
  flame: "#FF934D",
  flameDeep: "#D2651E",
  flameSoft: "#41291B",
  sky: "#47BBFF",
  skyDeep: "#1C86C9",
  skySoft: "#16304A",
  bg: "#120F26",
  surface: "#1D1938",
  line: "#2E294F",
  lineStrong: "#433C6E",
  ink: "#F2F0FF",
  inkSoft: "#B3AED6",
  inkFaint: "#7B76A3",
  onTint: "#E3DCFF",
}

function withAliases(p: Palette) {
  return {
    ...p,
    paper: p.bg,
    sheet: p.surface,
    grid: p.line,
    gridStrong: p.lineStrong,
    blue: p.primary,
    blueSoft: p.primarySoft,
    blueDeep: p.primaryDeep,
    red: p.coral,
    redSoft: p.coralSoft,
    highlighter: p.sun,
    highlighterSoft: p.sunSoft,
  }
}

export type Colors = ReturnType<typeof withAliases>
export type Scheme = "light" | "dark"

export const schemes: Record<Scheme, Colors> = { light: withAliases(light), dark: withAliases(dark) }

/** 풀이판 종이는 다크 모드에서도 밝게 둔다 (문제 이미지가 흰 바탕이고, 펜 색이 그대로 보이게) */
export const paper = schemes.light

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
export type ToneSet = Record<Tone, { face: string; lip: string; soft: string; on: string }>

export function makeTones(p: Colors): ToneSet {
  return {
    primary: { face: p.primary, lip: p.primaryDeep, soft: p.primarySoft, on: "#FFFFFF" },
    mint: { face: p.mint, lip: p.mintDeep, soft: p.mintSoft, on: "#FFFFFF" },
    coral: { face: p.coral, lip: p.coralDeep, soft: p.coralSoft, on: "#FFFFFF" },
    sun: { face: p.sun, lip: p.sunDeep, soft: p.sunSoft, on: "#1F1A3D" },
    sky: { face: p.sky, lip: p.skyDeep, soft: p.skySoft, on: "#FFFFFF" },
    flame: { face: p.flame, lip: p.flameDeep, soft: p.flameSoft, on: "#FFFFFF" },
    white: { face: p.surface, lip: p.lineStrong, soft: p.bg, on: p.primary },
  }
}
