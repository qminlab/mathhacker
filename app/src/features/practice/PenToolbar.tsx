// 풀이판 도구: 펜 색, 지우개, 되돌리기, 전부 지우기
import { Pressable, View } from "react-native"
import { IconButton } from "@/ui/controls"
import { color, radius, space } from "@/ui/theme"
import type { Tool } from "./DrawingCanvas"

// 빨강은 채점 표시 전용이라 펜 색에서 뺐다
export const PEN_COLORS = [color.blue, "#24272C", "#2E8B6E"] as const

export function PenToolbar({
  tool,
  setTool,
  penColor,
  setPenColor,
  onUndo,
  onClear,
  canUndo,
  vertical,
  compact,
}: {
  tool: Tool
  setTool: (t: Tool) => void
  penColor: string
  setPenColor: (c: string) => void
  onUndo: () => void
  onClear: () => void
  canUndo: boolean
  vertical?: boolean
  compact?: boolean
}) {
  return (
    <View
      style={{
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        gap: space.xs,
        padding: space.xs,
        backgroundColor: color.sheet,
        borderRadius: radius.control + 4,
        borderWidth: 1,
        borderColor: color.grid,
        borderBottomWidth: 2,
        borderBottomColor: color.gridStrong,
      }}
    >
      <IconButton icon="pen" label="펜" active={tool === "pen"} onPress={() => setTool("pen")} size={compact ? 38 : 44} />
      {PEN_COLORS.map((c) => {
        const selected = tool === "pen" && penColor === c
        return (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={c === color.blue ? "파란 펜" : c === "#24272C" ? "검은 펜" : "초록 펜"}
            accessibilityState={{ selected }}
            onPress={() => {
              setPenColor(c)
              setTool("pen")
            }}
            hitSlop={4}
            style={{ width: compact ? 30 : 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <View
              style={{
                width: selected ? 24 : 18,
                height: selected ? 24 : 18,
                borderRadius: 12,
                backgroundColor: c,
                borderWidth: selected ? 3 : 0,
                borderColor: color.blueSoft,
              }}
            />
          </Pressable>
        )
      })}
      <View style={vertical ? { height: 1, width: 24, backgroundColor: color.grid } : { width: 1, height: 24, backgroundColor: color.grid }} />
      <IconButton icon="eraser" label="지우개" active={tool === "eraser"} onPress={() => setTool("eraser")} size={compact ? 38 : 44} />
      <IconButton icon="undo" label="되돌리기" onPress={onUndo} disabled={!canUndo} size={compact ? 38 : 44} style={{ opacity: canUndo ? 1 : 0.35 }} />
      <IconButton icon="trash" label="전부 지우기" onPress={onClear} disabled={!canUndo} size={compact ? 38 : 44} style={{ opacity: canUndo ? 1 : 0.35 }} />
    </View>
  )
}
