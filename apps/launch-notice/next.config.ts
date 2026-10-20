import type { NextConfig } from 'next';

/**
 * 워크스페이스 패키지는 `@ogonggo/api` 의 enum 카탈로그(`src/enums.ts`) 하나만 읽는다 — 신청 유형과
 * 홍보 채널 문구가 백엔드 라벨이어야 해서다. Turbopack 이 TS 원본을 그대로 컴파일하므로
 * `transpilePackages` 는 두지 않는다. 연결은 이 앱 쪽 한 방향이라, 런칭(2026-09-23) 이후 이 폴더와
 * Vercel 프로젝트만 지우면 끝나는 것은 그대로다.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
