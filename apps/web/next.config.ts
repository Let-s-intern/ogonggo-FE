import type { NextConfig } from 'next';

// 로컬 user API 는 임시로 18080 이다(8080 을 로컬 렛츠커리어 서버가 쓴다). 기본값은 두고 dev 스크립트가 넘긴다.
const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  transpilePackages: ['@ogonggo/ui', '@ogonggo/api'],
  // Same-origin from the browser avoids CORS and keeps packages/api free of
  // any base-URL config — see packages/api/src/lib/http-client.ts.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${USER_API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
