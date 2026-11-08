import type { NextConfig } from 'next';

// 로컬 user API 는 18080 이다(dev 스크립트가 넘긴다). 기본값은 `apps/web/next.config.ts` 와 같다.
const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  transpilePackages: ['@ogonggo/ui', '@ogonggo/api'],
  // 브라우저는 같은 오리진의 `/api/**` 를 부르고 Next 가 user API 로 넘긴다(web 과 같은 방식,
  // `packages/api/src/lib/http-client.ts`). 브라우저의 `Origin` 이 그대로 가므로 쓰기 요청은 user API 의
  // CORS 허용 목록에 이 앱의 오리진이 있어야 한다.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${USER_API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
