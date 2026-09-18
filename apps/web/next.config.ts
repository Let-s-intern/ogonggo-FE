import type { NextConfig } from 'next';

// 로컬 user API 는 임시로 18080 이다(8080 을 로컬 렛츠커리어 서버가 쓴다). 기본값은 두고 dev 스크립트가 넘긴다.
const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';

// 일반 회원 가입·로그인이 부르는 렛츠커리어 API. 값이 없으면(목 실행 등) rewrite 를 만들지 않는다.
// `undefined/api/...` 를 목적지로 넣으면 Next 가 설정 오류를 내며 뜨지 못한다.
const LETSCAREER_API_ORIGIN = process.env.NEXT_PUBLIC_LETSCAREER_API_ORIGIN;

const nextConfig: NextConfig = {
  transpilePackages: ['@ogonggo/ui', '@ogonggo/api'],
  // Same-origin from the browser avoids CORS and keeps packages/api free of
  // any base-URL config — see packages/api/src/lib/http-client.ts.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${USER_API_ORIGIN}/api/:path*` },
      // 오공고의 `/api/**` 와 겹치지 않게 접두사를 따로 둔다. 같은 오리진으로 부르니 렛츠커리어 CORS 설정이
      // 필요 없다. 소셜 로그인은 페이지 이동이라 이 경로를 쓰지 않고 렛츠커리어 주소로 바로 간다.
      ...(LETSCAREER_API_ORIGIN
        ? [
            {
              source: '/letscareer-api/:path*',
              destination: `${LETSCAREER_API_ORIGIN}/api/:path*`,
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
