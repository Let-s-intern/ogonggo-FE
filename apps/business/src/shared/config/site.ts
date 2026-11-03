/**
 * 오늘의 공고 사용자 웹(`apps/web`) 주소. 푸터의 공지사항, 헤더의 `오늘의 공고` 링크가 간다.
 *
 * 비즈니스와 다른 도메인이라 경로가 아니라 오리진을 통째로 받는다. 비우면 운영 주소다. 로컬 `dev` 스크립트는
 * `http://localhost:4000` 을 넘긴다. `NEXT_PUBLIC_` 이라 빌드 시점에 박힌다.
 */
export const WEB_ORIGIN = process.env.NEXT_PUBLIC_WEB_ORIGIN || 'https://www.ogonggo.co.kr';
