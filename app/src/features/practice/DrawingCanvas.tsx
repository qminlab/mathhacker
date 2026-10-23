// 풀이판: 펜(애플펜슬·S펜·손가락·마우스)으로 쓰고, 지우개로 획 단위로 지운다.
// 좌표는 캔버스 크기에 대한 비율(0~1)로 저장해서 화면을 돌려도 제자리에 남는다.
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { StyleSheet, View, type LayoutChangeEvent } from "react-native"
import { GestureDetector, PointerType, usePanGesture } from "react-native-gesture-handler"
import Svg, { Path } from "react-native-svg"
import type { Stroke } from "@/lib/types"

export type Tool = "pen" | "eraser"

type Props = {
  strokes: Stroke[]
  onChange: (next: Stroke[]) => void
  tool: Tool
  penColor: string
  penWidth: number
  stylusOnly: boolean
}

const ERASE_RADIUS = 14

/** 점 목록 → 부드러운 곡선 (중점을 잇는 2차 베지어) */
function toPath(points: number[], w: number, h: number) {
  if (points.length < 2) return ""
  const x = (i: number) => points[i] * w
  const y = (i: number) => points[i + 1] * h
  if (points.length === 2) return `M ${x(0)} ${y(0)} l 0.1 0.1`
  let d = `M ${x(0)} ${y(0)}`
  for (let i = 2; i < points.length - 2; i += 2) {
    const mx = (x(i) + x(i + 2)) / 2
    const my = (y(i) + y(i + 2)) / 2
    d += ` Q ${x(i)} ${y(i)} ${mx} ${my}`
  }
  const last = points.length - 2
  d += ` L ${x(last)} ${y(last)}`
  return d
}

const DoneStrokes = memo(function DoneStrokes({ strokes, w, h }: { strokes: Stroke[]; w: number; h: number }) {
  return (
    <>
      {strokes.map((s, i) => (
        <Path key={i} d={toPath(s.points, w, h)} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </>
  )
})

export function DrawingCanvas({ strokes, onChange, tool, penColor, penWidth, stylusOnly }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  // 그리는 중인 획: 점은 ref에 모으고, 화면은 프레임마다 한 번만 갱신한다
  const [liveView, setLiveView] = useState<Stroke | null>(null)
  const live = useRef<Stroke | null>(null)
  const frame = useRef<number | null>(null)
  const strokesRef = useRef(strokes)
  useEffect(() => {
    strokesRef.current = strokes
  }, [strokes])

  const redraw = useCallback(() => {
    if (frame.current != null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      const s = live.current
      setLiveView(s ? { ...s, points: s.points.slice() } : null)
    })
  }, [])

  const eraseAt = useCallback(
    (px: number, py: number) => {
      const { w, h } = size
      if (!w || !h) return
      const r2 = ERASE_RADIUS * ERASE_RADIUS
      const next = strokesRef.current.filter((s) => {
        for (let i = 0; i < s.points.length; i += 2) {
          const dx = s.points[i] * w - px
          const dy = s.points[i + 1] * h - py
          if (dx * dx + dy * dy <= r2) return false
        }
        return true
      })
      if (next.length !== strokesRef.current.length) onChange(next)
    },
    [size, onChange]
  )

  const accept = (pointerType: PointerType) => !stylusOnly || pointerType === PointerType.STYLUS || pointerType === PointerType.MOUSE

  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    maxPointers: 1,
    onBegin: (e) => {
      if (!accept(e.pointerType)) return
      if (tool === "eraser") {
        eraseAt(e.x, e.y)
        return
      }
      const { w, h } = size
      if (!w || !h) return
      const pressure = e.stylusData?.pressure
      const width = pressure ? penWidth * (0.7 + Math.min(1, pressure) * 0.6) : penWidth
      live.current = { color: penColor, width, points: [e.x / w, e.y / h] }
      redraw()
    },
    onUpdate: (e) => {
      if (!accept(e.pointerType)) return
      if (tool === "eraser") {
        eraseAt(e.x, e.y)
        return
      }
      const s = live.current
      const { w, h } = size
      if (!s || !w || !h) return
      const nx = e.x / w
      const ny = e.y / h
      const lx = s.points[s.points.length - 2]
      const ly = s.points[s.points.length - 1]
      // 너무 촘촘한 점은 건너뛴다 (0.75pt 이하)
      if (Math.abs((nx - lx) * w) + Math.abs((ny - ly) * h) < 0.75) return
      s.points.push(nx, ny)
      redraw()
    },
    onFinalize: () => {
      const s = live.current
      live.current = null
      if (s && s.points.length >= 2) onChange([...strokesRef.current, s])
      setLiveView(null)
    },
  })

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setSize({ w: width, h: height })
  }

  return (
    <GestureDetector gesture={pan}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout} collapsable={false}>
        {size.w > 0 ? (
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            <DoneStrokes strokes={strokes} w={size.w} h={size.h} />
            {liveView ? (
              <Path
                d={toPath(liveView.points, size.w, size.h)}
                stroke={liveView.color}
                strokeWidth={liveView.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        ) : null}
      </View>
    </GestureDetector>
  )
}
