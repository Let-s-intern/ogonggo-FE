/**
 * 경로 → `page_type`. 웹은 마케팅팀 명세 3장의 열 개 값만 쓰고 나머지를 `etc` 로 보낸다
 * (`apps/web/src/shared/analytics/dataLayer.ts`). 이 앱의 화면은 그 열 개에 거의 없어 `biz_` 로 시작하는
 * 값을 새로 정했다(2026-11-24). 웹에도 있는 뜻만 같은 값을 재사용한다: 채용공고 등록 `job_post`, 그 밖의
 * 마이페이지 `mypage`.
 *
 * GTM 이 `page_type` 을 받아 GA4 로 넘기는 값이라, 새 값은 마케팅팀이 보고서 필터에 더해야 보인다.
 */
export function pageTypeOf(pathname: string): string {
  if (pathname === '/') return 'biz_landing';
  if (pathname === '/apply') return 'biz_apply';
  if (pathname === '/apply/ad') return 'biz_ad_apply';
  if (pathname === '/free-promotion') return 'biz_free_promotion';
  if (pathname === '/signup') return 'biz_signup';
  if (pathname === '/login' || pathname.startsWith('/login/')) return 'biz_login';
  if (pathname.startsWith('/auth/')) return 'biz_handoff';
  if (pathname.startsWith('/mypage/company/posts/jobs/')) return 'job_post';
  if (pathname.startsWith('/mypage/company/posts/bootcamps/')) return 'bootcamp_post';
  if (pathname === '/mypage' || pathname.startsWith('/mypage/')) return 'mypage';
  return 'etc';
}
