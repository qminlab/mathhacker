// 색 테마: 기본은 기기 설정(라이트/다크)을 따르고, 설정에서 직접 고를 수도 있다.
// 선택은 이 기기에만 저장한다 (localStorage: 웹은 브라우저, 네이티브는 expo-sqlite).
import "expo-sqlite/localStorage/install"
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react"
import { useColorScheme } from "react-native"
import { makeTones, schemes, type Colors, type Scheme, type ToneSet } from "./theme"

export type ThemePref = "system" | "light" | "dark"

const KEY = "mh.theme"
const listeners = new Set<() => void>()

function readPref(): ThemePref {
  try {
    const v = globalThis.localStorage?.getItem(KEY)
    return v === "light" || v === "dark" ? v : "system"
  } catch {
    return "system"
  }
}

let current: ThemePref = readPref()

export function setThemePref(p: ThemePref) {
  current = p
  try {
    if (p === "system") globalThis.localStorage?.removeItem(KEY)
    else globalThis.localStorage?.setItem(KEY, p)
  } catch {}
  listeners.forEach((l) => l())
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => current
  )
}

type Theme = { scheme: Scheme; color: Colors; tones: ToneSet }

const ThemeContext = createContext<Theme>({ scheme: "light", color: schemes.light, tones: makeTones(schemes.light) })

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const pref = useThemePref()
  const scheme: Scheme = pref === "system" ? (system === "dark" ? "dark" : "light") : pref
  const value = useMemo(() => ({ scheme, color: schemes[scheme], tones: makeTones(schemes[scheme]) }), [scheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
export const useColors = () => useContext(ThemeContext).color
export const useTones = () => useContext(ThemeContext).tones
