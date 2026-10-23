import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Squoo API",
  description: "Squoo 앱의 서버 (OCR·문제 분리·채점)",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#0f172a", color: "#e2e8f0" }}>
        {children}
      </body>
    </html>
  )
}
