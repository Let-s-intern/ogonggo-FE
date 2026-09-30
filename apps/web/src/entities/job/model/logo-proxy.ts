/**
 * 로고 여백을 재려면 캔버스로 픽셀을 읽어야 하는데, 브라우저는 CORS 헤더를 주지 않는 호스트의
 * 이미지 픽셀을 막는다(`logo-bounds.ts`). 그런 호스트의 로고는 우리 서버(`app/logo-image/route.ts`)를
 * 거쳐 같은 출처로 받아 잰다. 그리는 이미지는 원래 주소 그대로다 — 재는 데만 쓴다.
 *
 * 받아 주는 호스트를 목록으로 묶는다. 아무 주소나 받아 주면 누구나 쓰는 열린 프록시가 된다.
 * 목록은 API 로고 주소의 호스트 중 CORS 헤더가 없는 것들이다(2026-09-30 배포 데이터: 로고 167건 중
 * 144건). 여기 없는 호스트는 전처럼 여백을 자르지 못한 채 이미지 전체 기준으로 크기를 맞춘다.
 */
export const LOGO_PROXY_HOSTS: readonly string[] = [
  'letsintern-bucket.s3.ap-northeast-2.amazonaws.com',
  'www.hanwhain.com',
  'innocean.recruiter.co.kr',
  'careers.nhn.com',
  'careers.lg.com',
];

export const LOGO_PROXY_PATH = '/logo-image';

/** 목록의 호스트인 https 주소면 그 URL 을, 아니면 `undefined`. 서버 라우트도 같은 판정을 쓴다. */
export function proxiableLogoUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && LOGO_PROXY_HOSTS.includes(url.hostname) ? url : undefined;
  } catch {
    return undefined;
  }
}

/** 프록시로 받을 수 있으면 그 경로, 아니면 `undefined`. */
export function logoProxyUrl(value: string): string | undefined {
  return proxiableLogoUrl(value)
    ? `${LOGO_PROXY_PATH}?url=${encodeURIComponent(value)}`
    : undefined;
}
