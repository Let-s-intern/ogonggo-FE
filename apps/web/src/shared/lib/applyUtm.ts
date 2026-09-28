import type { BookmarkKind } from '@/features/bookmark';

/**
 * 상세의 지원·신청 버튼이 여는 바깥 주소에 붙이는 UTM(이슈 #145).
 *
 * 버튼 링크는 `rel="noopener noreferrer"`라 이동한 사이트에 referrer 가 가지 않는다. UTM 이 없으면
 * 상대 사이트의 분석 도구에는 오공고에서 간 사람이 직접 방문으로 잡힌다.
 *
 * 저장된 주소(`sourceUrl`, `applicationUrl`)는 건드리지 않고 여는 순간에만 붙인다. 크롤러와 BE 는
 * `sourceUrl`을 공고의 식별자로 쓰므로 거기에 UTM 이 들어가면 같은 공고가 다른 공고가 된다.
 */
const CAMPAIGN_BY_KIND: Record<BookmarkKind, string> = {
  jobs: 'job_detail',
  bootcamps: 'bootcamp_detail',
  'side-studies': 'side_study_detail',
};

/**
 * `href`에 UTM 을 붙인 주소. http·https 가 아니면(`mailto:` 등) 그대로 돌려준다.
 *
 * 원래 쿼리는 글자 그대로 남기고 `utm_*`만 우리 값으로 덮어쓴다 — 다른 사이트가 붙여 둔 UTM 이 남으면
 * 유입이 그 사이트로 잡힌다. `searchParams.set`을 쓰지 않는 까닭은 그것이 나머지 쿼리까지 다시
 * 인코딩하기 때문이다(`%20`→`+`, `?abc`→`?abc=`). 그걸 다르게 읽는 사이트에서는 공고가 열리지 않는다.
 * `#` 뒤는 `URL`이 따로 들고 있으므로 해시 라우팅 주소(`/#/detail?id=1`)도 깨지지 않는다.
 */
export function withApplyUtm(href: string, kind: BookmarkKind): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return href;
  }
  const kept = url.search
    .slice(1)
    .split('&')
    .filter((pair) => pair !== '' && !pair.toLowerCase().startsWith('utm_'));
  const utm = `utm_source=ogonggo&utm_medium=referral&utm_campaign=${CAMPAIGN_BY_KIND[kind]}`;
  url.search = [...kept, utm].join('&');
  return url.toString();
}
