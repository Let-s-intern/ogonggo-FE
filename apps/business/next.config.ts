import type { NextConfig } from 'next';

// 실제 오공고 user API. web 과 같은 이름·기본값이다(`apps/web/next.config.ts`).
const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  transpilePackages: ['@ogonggo/ui', '@ogonggo/api'],
  // 목데이터 여부를 브라우저에도 알린다(`src/shared/config/mocks.ts`). 규칙은 web 과 같다.
  env: { NEXT_PUBLIC_OGONGGO_USE_MOCKS: process.env.OGONGGO_USE_MOCKS ?? '' },
  // 브라우저는 같은 오리진의 `/api/**` 만 부른다. web 과 같은 방식이라 `packages/api` 에 주소 설정이 없다.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${USER_API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
