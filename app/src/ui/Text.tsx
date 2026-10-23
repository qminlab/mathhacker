import { Text as RNText, type TextProps } from "react-native"
import { color, font, type } from "./theme"

type Variant = keyof typeof type
type Weight = "regular" | "medium" | "bold"

export type AppTextProps = TextProps & {
  variant?: Variant
  weight?: Weight
  tone?: "ink" | "soft" | "faint" | "blue" | "red" | "white" | "mint"
  align?: "left" | "center" | "right"
  tabular?: boolean
}

const tones = {
  ink: color.ink,
  soft: color.inkSoft,
  faint: color.inkFaint,
  blue: color.blue,
  red: color.red,
  white: "#FFFFFF",
  mint: color.mint,
}

export function Text({
  variant = "body",
  weight = "regular",
  tone = "ink",
  align,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  return (
    <RNText
      {...rest}
      style={[
        type[variant],
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

/** 채점펜 글씨 (빨간 손글씨) */
export function PenText({ style, size = 28, ...rest }: TextProps & { size?: number }) {
  return (
    <RNText
      {...rest}
      style={[{ fontFamily: font.pen, fontSize: size, lineHeight: size * 1.1, color: color.red }, style]}
    />
  )
}
