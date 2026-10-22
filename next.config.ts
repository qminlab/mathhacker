import type { NextConfig } from "next";

// 문제 이미지는 Supabase Storage의 public 버킷에서 불러온다.
// 호스트는 환경변수의 프로젝트 URL에서 읽어서, 코드에 프로젝트 주소를 박아두지 않는다.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 개발 서버를 http://127.0.0.1:3000 으로 열어도 JS가 막히지 않게 허용
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
