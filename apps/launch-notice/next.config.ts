import type { NextConfig } from 'next';

/**
 * 이 앱은 워크스페이스 패키지를 쓰지 않는다 — `transpilePackages` 가 없는 이유다.
 * 런칭(2026-09-23) 이후 이 폴더와 Vercel 프로젝트만 지우면 끝나야 하므로, 지우는 순간
 * 다른 앱이 깨지는 연결을 처음부터 만들지 않는다.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
