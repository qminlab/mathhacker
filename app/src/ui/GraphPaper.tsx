// 모눈종이 배경. 굵은 선은 5칸마다.
import { useState } from "react"
import { StyleSheet, View, type ViewProps } from "react-native"
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg"
import { color, GRID } from "./theme"

export function GraphPaper({
  children,
  style,
  cell = GRID,
  base = color.paper,
  faint = false,
  onLayout,
  ...rest
}: ViewProps & { cell?: number; base?: string; faint?: boolean }) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const major = cell * 5
  const minorColor = faint ? "#E6EBF2" : color.grid
  const majorColor = faint ? color.grid : color.gridStrong
  return (
    <View
      {...rest}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout
        setSize({ w: Math.ceil(width), h: Math.ceil(height) })
        onLayout?.(e)
      }}
      style={[{ backgroundColor: base }, style]}
    >
      {size.w > 0 ? (
        // 웹에서 Svg는 크기를 안 주면 300×150이 되므로 잰 크기를 그대로 준다
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Pattern id="mh-minor" width={cell} height={cell} patternUnits="userSpaceOnUse">
              <Path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke={minorColor} strokeWidth={0.6} />
            </Pattern>
            <Pattern id="mh-major" width={major} height={major} patternUnits="userSpaceOnUse">
              <Rect width={major} height={major} fill="url(#mh-minor)" />
              <Path d={`M ${major} 0 L 0 0 0 ${major}`} fill="none" stroke={majorColor} strokeWidth={0.9} />
            </Pattern>
          </Defs>
          <Rect width={size.w} height={size.h} fill="url(#mh-major)" />
        </Svg>
      ) : null}
      {children}
    </View>
  )
}
