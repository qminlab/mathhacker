import { Text as RNText, type TextProps } from "react-native"
import { font, type } from "./theme"
import { useColors } from "./ThemeProvider"

type Variant = keyof typeof type
type Weight = "regular" | "medium" | "bold" | "display"

export type AppTextProps = TextProps & {
  variant?: Variant
  /** display = 둥근 제목 글씨(Jua) */
  weight?: Weight
  tone?: "ink" | "soft" | "faint" | "blue" | "red" | "white" | "mint" | "primary" | "coral" | "sun" | "flame"
  align?: "left" | "center" | "right"
  tabular?: boolean
}


export function Text({ variant = "body", weight = "regular", tone = "ink", align, tabular, style, ...rest }: AppTextProps) {
  const color = useColors()
  const tones = {
    ink: color.ink,
    soft: color.inkSoft,
    faint: color.inkFaint,
    blue: color.primary,
    primary: color.primary,
    red: color.coral,
    coral: color.coral,
    white: "#FFFFFF",
    mint: color.mintText,
    sun: color.sunText,
    flame: color.flame,
  }
  const base = type[variant]
  return (
    <RNText
      {...rest}
      style={[
        weight === "display" ? { fontSize: base.fontSize * 1.06, lineHeight: base.lineHeight * 1.04 } : base,
        {
          fontFamily: font[weight],
          color: tones[tone],
          textAlign: align,
          fontVariant: tabular ? ["tabular-nums"] : undefined,
        },
        style,
      ]}
    />
  )
}

/** 손글씨 (채점 코멘트) */
export function PenText({ style, size = 28, ...rest }: TextProps & { size?: number }) {
  const color = useColors()
  return <RNText {...rest} style={[{ fontFamily: font.pen, fontSize: size, lineHeight: size * 1.1, color: color.coral }, style]} />
}
