import type { InflowFields } from './apply';

/**
 * `/biz` 에 처음 들어온 순간의 유입 원본(PRD `유입 경로`). 서버가 이 값으로 유입 경로를 판정해 저장한다.
 *
 * 이 탭에서 처음 한 번만 잡아 `sessionStorage` 에 둔다. 새로고침하거나 페이지 안에서 이동해도 바뀌지 않아,
 * 콜드메일 링크로 들어와 한참 뒤 제출해도 UTM 이 남는다.
 */
const STORAGE_KEY = 'ogonggo.biz.inflow';

/** `biz.ogonggo.co.kr` 이 `/biz` 로 리다이렉트하며 붙이는 쿼리(PRD `주소`). */
const ENTRY_QUERY = 'entry';
const ENTRY_BIZ_HOST = 'biz.ogonggo.co.kr';

/** 서버 요청 필드 길이 상한(`CreateAdvertisementInquiryRequest`). 넘으면 400 이라 잘라 보낸다. */
const clip = (value: string | null | undefined, max: number) =>
  value ? value.slice(0, max) : undefined;

/**
 * 지금 주소에서 유입 원본을 만든다.
 *
 * 오공고 안의 다른 화면에서 링크로 넘어오면(클라이언트 이동) `document.referrer` 는 그 탭에 처음 문서를
 * 연 곳(예: 검색엔진)으로 남아 있다. 그대로 보내면 `오공고 사이트` 가 아니라 `검색` 으로 판정된다. 그래서
 * 이 문서를 처음 연 주소가 `/biz` 가 아니면 오공고 안에서 넘어온 것으로 보고 그 주소를 `referrer` 로 보낸다.
 */
function captureNow(): InflowFields {
  const url = new URL(window.location.href);
  const query = url.searchParams;
  const navigation = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  const documentUrl = navigation?.name ? new URL(navigation.name) : url;
  const enteredInApp = documentUrl.pathname !== url.pathname;
  const referrer = enteredInApp ? documentUrl.href : document.referrer;

  return {
    utmSource: clip(query.get('utm_source'), 100),
    utmMedium: clip(query.get('utm_medium'), 100),
    utmCampaign: clip(query.get('utm_campaign'), 100),
    utmContent: clip(query.get('utm_content'), 100),
    referrer: clip(referrer, 2000),
    entryHost: clip(query.get(ENTRY_QUERY) === 'biz' ? ENTRY_BIZ_HOST : url.host, 255),
    landingPath: clip(`${url.pathname}${url.search}`, 2000),
  };
}

/** 처음 들어왔을 때 한 번만 잡는다. 이미 있으면 그대로 둔다. 페이지가 마운트될 때 부른다. */
export function captureInflow(): void {
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === null) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captureNow()));
    }
  } catch {
    // 저장소를 쓸 수 없는 브라우저(사생활 보호 모드 일부)는 제출 때 지금 주소로 다시 잡는다.
  }
}

/** 제출에 실을 유입 원본. 저장된 것이 없으면 지금 주소로 잡는다. */
export function readInflow(): InflowFields {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as InflowFields;
    }
  } catch {
    // 아래로 내려가 지금 주소로 잡는다.
  }
  return captureNow();
}
