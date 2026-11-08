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

/** 오공고 서비스(일반 회원용) 주소. */
export const OGONGGO_WEB_ORIGIN = 'https://www.ogonggo.co.kr';

export const CONTACT_EMAIL = 'official@letscareer.co.kr';

/** `apps/web/src/widgets/site-footer/ui/SiteFooter.tsx` 와 같은 문서다. */
export const TERMS_URL =
  'https://letsintern.notion.site/3e95e77cbee180f993a3c70e3bce5a21?source=copy_link';
export const PRIVACY_POLICY_URL =
  'https://letsintern.notion.site/3e95e77cbee18074a1c7dc485644d737?pvs=74';
