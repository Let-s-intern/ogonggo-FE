/**
 * 비즈니스 앱(`apps/business`, `biz.ogonggo.co.kr`) 주소. 기업회원의 마이페이지·공고 작성·로그인이 그쪽에 있다
 * (광고 시스템 PRD `비즈니스 서브도메인`).
 *
 * 비우면 운영 주소다 — `NEXT_PUBLIC_LETSCAREER_WEB_ORIGIN` 과 같은 방식이다. 로컬은 `dev` · `mock` 스크립트가
 * 비즈니스 dev 서버(http://localhost:4002)를 넘긴다. 값을 넣는 곳은 `apps/web/.env.example` 에 적었다.
 */
export const BUSINESS_ORIGIN =
  process.env.NEXT_PUBLIC_BUSINESS_ORIGIN || 'https://biz.ogonggo.co.kr';

/** 비즈니스 앱의 경로를 절대 주소로. 다른 출처라 `Link` 로 넘겨도 페이지 이동이 된다. */
export function businessUrl(path: string): string {
  return new URL(path, BUSINESS_ORIGIN).toString();
}
