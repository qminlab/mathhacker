// 폭을 재서 칸 수를 정하는 격자 (사이드바 유무와 상관없이 맞게)
import { useState, type ReactNode } from "react"
import { View } from "react-native"

export function Grid<T>({
  items,
  minWidth,
  gap,
  render,
  keyOf,
}: {
  items: T[]
  minWidth: number
  gap: number
  render: (item: T, width: number, index: number) => ReactNode
  keyOf: (item: T, index: number) => string | number
}) {
  const [width, setWidth] = useState(0)
  const cols = Math.max(1, Math.floor((width + gap) / (minWidth + gap)))
  const cell = width ? Math.floor((width - gap * (cols - 1)) / cols) : 0
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
      {width > 0
        ? items.map((item, i) => (
            <View key={keyOf(item, i)} style={{ width: cell }}>
              {render(item, cell, i)}
            </View>
          ))
        : null}
    </View>
  )
}
