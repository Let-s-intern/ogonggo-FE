import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/shared/config/site';

/**
 * `app/robots.ts`는 Next가 `/robots.txt`로 내보내는 파일 규칙이다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md).
 *
 * 막는 것은 로그인해야 의미가 있거나, 수집돼도 남는 내용이 없는 화면이다.
 *
 * - `/mypage` — 내 스크랩·지원 현황·회사 공고 관리. 남의 계정으로는 볼 수 없다
 * - `/login`, `/signup` — 가입·로그인 절차
 * - `/auth` — 렛츠커리어 SSO 콜백. 토큰이 붙어 들어오는 주소다
 * - `/calendar` — 직무를 고르기 전에는 선택 화면이라 수집할 내용이 없고, 고른 뒤 주소는
 *   `?majors=` 조합만큼 늘어난다. 공고 자체는 `/jobs/[jobId]`가 사이트맵으로 들어가므로
 *   달력을 막아도 공고가 검색에서 빠지지 않는다
 *
 * 경로는 접두사로 맞춰지므로 `/mypage`가 `/mypage/scraps`까지 함께 막는다. 뒤에 `/`를 붙이면
 * `/mypage` 자신이 열린 채로 남는다.
 *
 * 네이버 서치어드바이저 인증 파일(`public/naver*.html`)은 루트에 있고 위 접두사 중 어느 것과도
 * 겹치지 않는다 — **막히면 사이트 소유 확인이 실패한다.**
 *
 * 사이트맵은 아직 없다. 주소만 먼저 정해 둔다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: ['/mypage', '/login', '/signup', '/auth', '/calendar'],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
