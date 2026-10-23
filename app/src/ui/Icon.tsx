// 선 아이콘 (24 그리드, 볼펜 굵기). 외부 아이콘 패키지 없이 필요한 것만 그린다.
import Svg, { Circle, G, Path, Rect } from "react-native-svg"
import { color } from "./theme"

export type IconName =
  | "today" | "books" | "wrong" | "stats" | "settings"
  | "pen" | "eraser" | "undo" | "trash" | "plus" | "upload" | "clock"
  | "hint" | "flag" | "check" | "chevronRight" | "chevronLeft" | "close"
  | "refresh" | "key" | "play" | "lasso" | "logout" | "minus"

const paths: Record<IconName, (c: string) => React.ReactNode> = {
  today: (c) => (
    <>
      <Rect x={3.5} y={5} width={17} height={15.5} rx={2} stroke={c} />
      <Path d="M3.5 9.5h17M8 3v4M16 3v4" stroke={c} />
      <Path d="M9 14.5l2 2 4-4" stroke={c} />
    </>
  ),
  books: (c) => (
    <>
      <Path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10v16H5.5A1.5 1.5 0 0 1 4 18.5z" stroke={c} />
      <Path d="M10 4h4.5A1.5 1.5 0 0 1 16 5.5V20h-6" stroke={c} />
      <Path d="M16.5 6.2l2.6-.7a1 1 0 0 1 1.2.7l3 11.4" stroke={c} transform="translate(-2.6 0)" />
    </>
  ),
  wrong: (c) => (
    <>
      <Path d="M6 3.5h9l3.5 3.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" stroke={c} />
      <Path d="M9 15.5l6-6" stroke={c} />
    </>
  ),
  stats: (c) => <Path d="M4 20h16M7 16v-4M12 16V7M17 16v-6" stroke={c} />,
  settings: (c) => (
    <>
      <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke={c} />
      <Circle cx={16} cy={7} r={2} stroke={c} />
      <Circle cx={10} cy={17} r={2} stroke={c} />
    </>
  ),
  pen: (c) => (
    <>
      <Path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" stroke={c} />
      <Path d="M13.5 6.5l4 4" stroke={c} />
    </>
  ),
  eraser: (c) => (
    <>
      <Path d="M8.5 19.5L3.8 14.8a1.5 1.5 0 0 1 0-2.1l8.5-8.5a1.5 1.5 0 0 1 2.1 0l5.4 5.4a1.5 1.5 0 0 1 0 2.1l-8 8.1" stroke={c} />
      <Path d="M8.5 19.5H20M7.5 10l6.5 6.5" stroke={c} />
    </>
  ),
  undo: (c) => <Path d="M9 7L4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H12" stroke={c} />,
  trash: (c) => <Path d="M4.5 7h15M10 4h4M6.5 7l1 13h9l1-13M10 11v5M14 11v5" stroke={c} />,
  plus: (c) => <Path d="M12 5v14M5 12h14" stroke={c} />,
  minus: (c) => <Path d="M5 12h14" stroke={c} />,
  upload: (c) => <Path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 14v5.5h14V14" stroke={c} />,
  clock: (c) => (
    <>
      <Circle cx={12} cy={13} r={7.5} stroke={c} />
      <Path d="M12 9v4l2.5 2.5M10 2.5h4" stroke={c} />
    </>
  ),
  hint: (c) => <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" stroke={c} />,
  flag: (c) => <Path d="M5.5 21V4M5.5 4.5h11l-2.5 4 2.5 4h-11" stroke={c} />,
  check: (c) => <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={c} />,
  chevronRight: (c) => <Path d="M9.5 5.5L16 12l-6.5 6.5" stroke={c} />,
  chevronLeft: (c) => <Path d="M14.5 5.5L8 12l6.5 6.5" stroke={c} />,
  close: (c) => <Path d="M6 6l12 12M18 6L6 18" stroke={c} />,
  refresh: (c) => <Path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.5H15" stroke={c} />,
  key: (c) => (
    <>
      <Circle cx={8} cy={15} r={4} stroke={c} />
      <Path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2" stroke={c} />
    </>
  ),
  play: (c) => <Path d="M7.5 5v14l11-7z" stroke={c} />,
  lasso: (c) => <Path d="M12 4c4.7 0 8.5 2.5 8.5 5.5S16.7 15 12 15s-8.5-2.5-8.5-5.5S7.3 4 12 4zM9 15c-1 1.5-1 3 .5 4.5" stroke={c} />,
  logout: (c) => <Path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14M10 12h10M16.5 8.5L20 12l-3.5 3.5" stroke={c} />,
}

export function Icon({
  name,
  size = 22,
  tint = color.ink,
  strokeWidth = 1.8,
}: {
  name: IconName
  size?: number
  tint?: string
  strokeWidth?: number
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {paths[name](tint)}
      </G>
    </Svg>
  )
}
