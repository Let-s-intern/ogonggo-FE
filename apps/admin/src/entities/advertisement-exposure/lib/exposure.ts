import type { AdminAdvertisementProductResponsePosition } from '@ogonggo/api/src/admin';
import { WEB_HOME } from '@/shared/api/webHandoff';
import type { AdvertisementExposure } from '../api/useAdvertisementExposures';

/** 배너 노출 자리(BE `AdvertisementProductPosition`). 상품의 `position` 이 이 중 하나다. */
export type BannerPosition = NonNullable<AdminAdvertisementProductResponsePosition>;

export const BANNER_POSITIONS: readonly BannerPosition[] = [
  'JOB_HOME_TOP_BANNER',
  'JOB_HOME_BOTTOM_BANNER',
  'JOB_DETAIL_BANNER',
  'BOOTCAMP_LIST_TOP_BANNER',
  'BOOTCAMP_LIST_BOTTOM_BANNER',
  'BOOTCAMP_DETAIL_BANNER',
];

export const POSITION_DESCRIPTIONS: Record<BannerPosition, string> = {
  JOB_HOME_TOP_BANNER: '채용공고 홈 히어로 바로 아래. 첫 페이지에만 보입니다.',
  JOB_HOME_BOTTOM_BANNER: '채용공고 홈 목록 아래, FOR BUSINESS 배너 바로 위.',
  JOB_DETAIL_BANNER:
    '공고 상세 오른쪽 사이드바의 비슷한 공고 아래. 좁은 화면에서는 본문 아래로 내려갑니다.',
  BOOTCAMP_LIST_TOP_BANNER: '교육·부트캠프 목록 맨 위(카드 목록 바로 위). 첫 페이지에만 보입니다.',
  BOOTCAMP_LIST_BOTTOM_BANNER: '교육·부트캠프 목록 아래, FOR BUSINESS 배너 바로 위.',
  BOOTCAMP_DETAIL_BANNER:
    '부트캠프 상세 오른쪽 사이드바 아래. 좁은 화면에서는 본문 아래로 내려갑니다.',
};

/** 상세 사이드 자리. 세로 소재(400×500)를 쓴다. */
export const isSidePosition = (position: BannerPosition) =>
  position === 'JOB_DETAIL_BANNER' || position === 'BOOTCAMP_DETAIL_BANNER';

/**
 * 자리마다 이미지 규격. 목록 위·아래 자리는 가로 띠(1200×120), 상세 사이드는 세로(400×500)다. BE 노출에 이미지가 한 장뿐이라
 * 웹은 좁은 화면에도 같은 이미지를 쓴다(PRD D2). 미리보기도 이 비율로 그려야 웹에서 잘리는 곳을 미리 안다.
 */
export function imageSpec(position: BannerPosition) {
  return isSidePosition(position)
    ? { aspectClassName: 'aspect-[400/500]', sizeHint: '400×500 비율(800×1000 권장). JPG·PNG.' }
    : { aspectClassName: 'aspect-[1200/120]', sizeHint: '1200×120 비율(2400×240 권장). JPG·PNG.' };
}

/**
 * 미리보기 주소. `/banners/...` 처럼 사용자 웹의 경로면(목 시드) 웹 주소(`WEB_HOME`)를 붙인다 — 어드민 오리진에는 그
 * 파일이 없다.
 */
export function bannerImageSrc(url: string): string {
  return url.startsWith('/') ? new URL(url, WEB_HOME).toString() : url;
}

/** KST 벽시계 시각(`YYYY-MM-DDTHH:mm:ss`)을 시각으로. */
function kstTime(value: string): number {
  return Date.parse(`${value}+09:00`);
}

export type ExposureStatus = 'LIVE' | 'SCHEDULED' | 'ENDED' | 'OFF';

/** 표의 `상태` 칸. */
export const EXPOSURE_STATUS_BADGES: Record<
  ExposureStatus,
  { label: string; tone: 'success' | 'main' | 'neutral' }
> = {
  LIVE: { label: '노출 중', tone: 'success' },
  SCHEDULED: { label: '노출 예정', tone: 'main' },
  ENDED: { label: '기간 끝남', tone: 'neutral' },
  OFF: { label: '꺼짐', tone: 'neutral' },
};

/** 지금 웹에 보이는지. BE `AdvertisementExposure.isShownAt` 과 같다(켜짐, 시작 ≤ 지금 ≤ 끝). */
export function exposureStatus(exposure: AdvertisementExposure, now = Date.now()): ExposureStatus {
  if (!exposure.exposed) return 'OFF';
  if (exposure.startAt && now < kstTime(exposure.startAt)) return 'SCHEDULED';
  if (exposure.endAt && kstTime(exposure.endAt) < now) return 'ENDED';
  return 'LIVE';
}

/** `2026-11-06T09:00:00` → `2026.11.06 09:00`. */
export function formatKst(value: string | null | undefined): string {
  return value ? `${value.slice(0, 10).replaceAll('-', '.')} ${value.slice(11, 16)}` : '';
}

/** 기간은 둘 다 있거나 둘 다 없다(BE). 없으면 상시다. */
export function formatPeriod(exposure: Pick<AdvertisementExposure, 'startAt' | 'endAt'>): string {
  if (!exposure.startAt || !exposure.endAt) return '상시';
  return `${formatKst(exposure.startAt)} ~ ${formatKst(exposure.endAt)}`;
}

/** `http(s)://` 주소이거나 `/` 로 시작하는 사이트 안 경로(`//` 는 다른 호스트라 뺀다). */
export function isLinkUrl(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
