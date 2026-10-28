import { type AdminAdvertisementInquiryResponse, enumLabel } from '@ogonggo/api/src/admin';

/** `biz.ogonggo.co.kr` 이 `/biz` 로 리다이렉트하며 남기는 진입 호스트(웹 `views/biz/model/inflow.ts`). */
const BIZ_ENTRY_HOST = 'biz.ogonggo.co.kr';

function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * 유입 경로 줄(PRD `어드민 화면`). 판정 이름을 앞에, 원본 값을 뒤에 흐리게 둔다 — 판정이 틀렸을 때 원본으로
 * 확인하려는 것이다.
 *
 * 판정은 서버가 저장한 `inflowChannel` 이다. 이름은 카탈로그 라벨이고, 둘만 원본으로 바꾼다(PRD `유입 경로 판정`).
 * - `UTM_OTHER`: 모르는 `utm_source` 는 원문.
 * - `EXTERNAL_SITE`: `외부 사이트 · <호스트>`.
 */
export function inflowName(inquiry: AdminAdvertisementInquiryResponse): string {
  if (inquiry.inflowChannel === 'UTM_OTHER' && inquiry.utmSource) {
    return inquiry.utmSource;
  }
  const label = enumLabel('AdvertisementInquiryInflowChannel', inquiry.inflowChannel);
  if (inquiry.inflowChannel === 'EXTERNAL_SITE') {
    const host = hostOf(inquiry.referrer);
    return host ? `${label} · ${host}` : label;
  }
  return label;
}

/**
 * 판정 이름 뒤에 흐리게 붙일 원본 값. `utm_source` 는 이름이 이미 그것이라 뺀다. referrer 호스트는 이름에
 * 들어가지 않은 경우만 붙인다. 리다이렉트로 들어왔으면 `biz.ogonggo.co.kr` 진입을 적는다.
 */
export function inflowRawParts(inquiry: AdminAdvertisementInquiryResponse): string[] {
  const parts: string[] = [];
  if (inquiry.utmMedium) parts.push(`utm_medium=${inquiry.utmMedium}`);
  if (inquiry.utmCampaign) parts.push(`utm_campaign=${inquiry.utmCampaign}`);
  if (inquiry.utmContent) parts.push(`utm_content=${inquiry.utmContent}`);
  const referrerHost = hostOf(inquiry.referrer);
  if (referrerHost && inquiry.inflowChannel !== 'EXTERNAL_SITE') {
    parts.push(`referrer ${referrerHost}`);
  }
  if (inquiry.entryHost === BIZ_ENTRY_HOST) parts.push(`진입 ${BIZ_ENTRY_HOST}`);
  return parts;
}
