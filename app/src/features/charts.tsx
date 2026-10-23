// 기록 화면 차트 (계열 하나라 범례 없이 제목이 이름을 맡는다)
// - 일별: 푼 문제 수 막대, 누르면 그날 정답률
// - 단원별: 정답률 가로 막대, 약한 단원부터
import { useState } from "react"
import { Pressable, View } from "react-native"
import Svg, { Line, Path } from "react-native-svg"
import { Text } from "@/ui/Text"
import { color, space } from "@/ui/theme"

/** 위쪽 모서리만 4px 둥근 막대 (바닥선에 붙는다) */
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, w / 2, h)
  return `M ${x} ${y + h} L ${x} ${y + rr} Q ${x} ${y} ${x + rr} ${y} L ${x + w - rr} ${y} Q ${x + w} ${y} ${x + w} ${y + rr} L ${x + w} ${y + h} Z`
}

function dayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function DailyBars({ data }: { data: { day: string; total: number; correct: number }[] }) {
  const [width, setWidth] = useState(0)
  const lastWithData = [...data].reverse().find((d) => d.total > 0)
  const [selected, setSelected] = useState<string | null>(lastWithData?.day ?? null)
  const height = 180
  const axis = 22
  const max = Math.max(4, ...data.map((d) => d.total))
  const step = width / Math.max(1, data.length)
  const barW = Math.max(6, Math.min(28, step - 6))
  const sel = data.find((d) => d.day === selected)

  return (
    <View style={{ gap: space.md }}>
      <Text variant="small" tone="soft" accessibilityLiveRegion="polite">
        {sel
          ? sel.total
            ? `${dayLabel(sel.day)}  ${sel.total}문제 풀고 ${sel.correct}문제 맞음 (정답률 ${Math.round((sel.correct / sel.total) * 100)}%)`
            : `${dayLabel(sel.day)}  풀지 않음`
          : "막대를 누르면 그날 기록이 보여요"}
      </Text>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={height}>
              {[0.5, 1].map((t) => (
                <Line key={t} x1={0} x2={width} y1={(height - axis) * (1 - t)} y2={(height - axis) * (1 - t)} stroke={color.grid} strokeWidth={1} />
              ))}
              <Line x1={0} x2={width} y1={height - axis} y2={height - axis} stroke={color.gridStrong} strokeWidth={1} />
              {data.map((d, i) => {
                if (!d.total) return null
                const h = ((height - axis) * d.total) / max
                const x = i * step + (step - barW) / 2
                return (
                  <Path
                    key={d.day}
                    d={barPath(x, height - axis - h, barW, h)}
                    fill={color.blue}
                    opacity={selected && selected !== d.day ? 0.45 : 1}
                  />
                )
              })}
            </Svg>
            {/* 막대보다 넓은 눌림 영역 */}
            <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
              {data.map((d) => (
                <Pressable
                  key={d.day}
                  onPress={() => setSelected(d.day)}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayLabel(d.day)} ${d.total}문제 중 ${d.correct}문제 맞음`}
                  style={{ width: step, height: "100%" }}
                />
              ))}
            </View>
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row" }} pointerEvents="none">
              {data.map((d, i) => (
                <Text
                  key={d.day}
                  variant="caption"
                  tone={d.day === selected ? "ink" : "faint"}
                  align="center"
                  style={{ width: step, opacity: i % (data.length > 10 ? 2 : 1) === 0 || d.day === selected ? 1 : 0 }}
                >
                  {dayLabel(d.day)}
                </Text>
              ))}
            </View>
            <Text variant="caption" tone="faint" style={{ position: "absolute", left: 0, top: -2 }} tabular>
              {max}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  )
}

export function UnitBars({ data }: { data: { unit: string; total: number; correct: number }[] }) {
  return (
    <View style={{ gap: space.md }} accessibilityRole="list">
      {data.map((u) => {
        const rate = u.total ? u.correct / u.total : 0
        return (
          <View key={u.unit} style={{ gap: 6 }} accessible accessibilityLabel={`${u.unit} 정답률 ${Math.round(rate * 100)}%, ${u.total}문제`}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
              <Text weight="medium" numberOfLines={1} style={{ flex: 1 }}>
                {u.unit}
              </Text>
              <Text tabular weight="bold">
                {Math.round(rate * 100)}%
              </Text>
              <Text tabular tone="faint" variant="small" style={{ width: 56, textAlign: "right" }}>
                {u.correct}/{u.total}
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: color.grid, overflow: "hidden" }}>
              <View style={{ width: `${rate * 100}%`, height: "100%", borderRadius: 4, backgroundColor: color.blue }} />
            </View>
          </View>
        )
      })}
    </View>
  )
}
