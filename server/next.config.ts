import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 네이티브 모듈·대용량 패키지는 번들하지 않고 node_modules에서 그대로 쓴다
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas", "sharp"],
  // pdfjs가 실행 중에 읽는 CMap·표준 글꼴 파일을 배포본에 함께 넣는다
  outputFileTracingIncludes: {
    "/api/ingest/**": [
      "./node_modules/pdfjs-dist/cmaps/**",
      "./node_modules/pdfjs-dist/standard_fonts/**",
    ],
  },
}

export default nextConfig
