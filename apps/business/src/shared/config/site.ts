/**
 * 배포본의 공개 주소. 운영 배포에만 `OGONGGO_SITE_ORIGIN=https://biz.ogonggo.co.kr` 을 넣는다.
 * 값이 없으면(로컬·프리뷰) 로컬 주소를 쓰고 검색 수집을 막는다(`app/robots.ts`, 루트 `metadata.robots`).
 * robots·sitemap 은 빌드 때 구워지므로 값을 바꾸면 다시 빌드해야 한다.
 */
const CONFIGURED_ORIGIN = process.env.OGONGGO_SITE_ORIGIN?.trim();

export const SITE_ORIGIN = CONFIGURED_ORIGIN || 'http://localhost:4002';

export const IS_INDEXABLE_DEPLOYMENT = CONFIGURED_ORIGIN !== undefined && CONFIGURED_ORIGIN !== '';

export const SITE_NAME = '오늘의 공고 비즈니스';

export const SITE_DESCRIPTION =
  '인턴·신입 채용과 교육 모집 광고. 월 10만 명의 취준생이 보는 오늘의 공고 지면과 렛츠커리어 채널에 채용공고·부트캠프를 알려보세요.';

/**
 * 오공고 서비스(일반 회원용) 주소. 비우면 운영 주소다. `오늘의 공고 웹으로`(`shared/api/webHandoff.ts`)를 로컬 웹
 * (`http://localhost:4000`)으로 보내 볼 때만 `NEXT_PUBLIC_OGONGGO_WEB_ORIGIN` 을 넣는다. 빌드 시점에 박힌다.
 */
export const OGONGGO_WEB_ORIGIN =
  process.env.NEXT_PUBLIC_OGONGGO_WEB_ORIGIN || 'https://www.ogonggo.co.kr';

export const CONTACT_EMAIL = 'official@letscareer.co.kr';

/** `apps/web/src/widgets/site-footer/ui/SiteFooter.tsx` 와 같은 문서다. */
export const TERMS_URL =
  'https://letsintern.notion.site/3e95e77cbee180f993a3c70e3bce5a21?source=copy_link';
export const PRIVACY_POLICY_URL =
  'https://letsintern.notion.site/3e95e77cbee18074a1c7dc485644d737?pvs=74';

/** 광고 상품 소개서(PDF). 광고 신청·문의의 `소개서 받기` 와 광고 안내의 고객 사례가 연다. 원본은 `AD_introduction.pdf`(2026-11-10). */
export const AD_INTRODUCTION_PDF = '/ad-introduction.pdf';
