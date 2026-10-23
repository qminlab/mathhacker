// 서버 주소로 들어왔을 때 보이는 안내 페이지 (앱은 /api/* 만 쓴다)
export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>
        <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Math Hacker API</h1>
        <p style={{ color: "#94a3b8", margin: 0 }}>
          서버가 동작 중입니다. 앱의 설정에서 이 주소를 서버 주소로 쓰면 됩니다.
        </p>
        <p style={{ marginTop: 16 }}>
          <a href="/api/health" style={{ color: "#38bdf8" }}>/api/health</a>
        </p>
      </div>
    </main>
  )
}
