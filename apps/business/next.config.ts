import type { NextConfig } from 'next';

// 로컬 user API 는 18080 이다(dev 스크립트가 넘긴다). 기본값은 `apps/web/next.config.ts` 와 같다.
const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  transpilePackages: ['@ogonggo/ui', '@ogonggo/api'],
  // 목데이터 여부를 브라우저에 알린다(`src/shared/config/mocks.ts`). `pnpm mock` 이 `OGONGGO_USE_MOCKS=true` 를 준다.
  // 리포트 화면 여부(`src/shared/config/reports.ts`)도 같은 방식으로 빌드 때 박는다. 리포트 API 배포 전에는 비워 둔다.
  env: {
    NEXT_PUBLIC_OGONGGO_USE_MOCKS: process.env.OGONGGO_USE_MOCKS ?? '',
    NEXT_PUBLIC_OGONGGO_REPORTS_ENABLED: process.env.NEXT_PUBLIC_OGONGGO_REPORTS_ENABLED ?? '',
  },
  // 브라우저는 같은 오리진의 `/api/**` 를 부르고 Next 가 user API 로 넘긴다(web 과 같은 방식,
  // `packages/api/src/lib/http-client.ts`). 브라우저의 `Origin` 이 그대로 가므로 쓰기 요청은 user API 의
  // CORS 허용 목록에 이 앱의 오리진이 있어야 한다.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${USER_API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
