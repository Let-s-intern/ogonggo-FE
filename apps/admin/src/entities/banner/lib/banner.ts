import type { BannerPlacement } from '@ogonggo/api/src/banners';
import { WEB_HOME } from '@/shared/api/webHandoff';
import type { Banner } from '../api/useBanners';

export const PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  HOME_TOP: '홈 상단',
  HOME_BOTTOM: '홈 하단',
  JOB_DETAIL_SIDE: '공고 상세',
};

export const PLACEMENT_DESCRIPTIONS: Record<BannerPlacement, string> = {
  HOME_TOP: '채용공고 홈 히어로 바로 아래. 첫 페이지에만 보입니다.',
  HOME_BOTTOM: '채용공고 홈 목록 아래, FOR BUSINESS 배너 바로 위.',
  JOB_DETAIL_SIDE:
    '공고 상세 오른쪽 사이드바의 비슷한 공고 아래. 좁은 화면에서는 본문 아래로 내려가 모바일 이미지가 보입니다.',
};

/**
 * 자리마다 PC 이미지 규격. 홈 자리는 가로 띠(1200×120), 공고 상세 사이드는 세로(400×500)다. 모바일 이미지는 모든 자리가
 * 750×200 이다. 미리보기도 이 비율로 그려야 웹에서 잘리는 곳을 미리 안다.
 */
export const PC_IMAGE_SPECS: Record<
  BannerPlacement,
  { aspectClassName: string; sizeHint: string; preset: 'pc' | 'side' }
> = {
  HOME_TOP: {
    aspectClassName: 'aspect-[1200/120]',
    sizeHint: '1200×120 비율(2400×240 권장). JPG·PNG.',
    preset: 'pc',
  },
  HOME_BOTTOM: {
    aspectClassName: 'aspect-[1200/120]',
    sizeHint: '1200×120 비율(2400×240 권장). JPG·PNG.',
    preset: 'pc',
  },
  JOB_DETAIL_SIDE: {
    aspectClassName: 'aspect-[400/500]',
    sizeHint: '400×500 비율(800×1000 권장). JPG·PNG.',
    preset: 'side',
  },
};

/**
 * 사용자 웹이 두는 기본 소재(`apps/web/public/banners/`). 웹 주소 기준 경로로 저장하고, 웹은 같은 오리진에서 읽는다.
 * 소재마다 가로(`-pc`)·세로(`-side`)·모바일(`-mo`) 세 장이 있고, 자리에 맞는 PC 이미지를 고른다.
 */
export function bannerPresets(placement: BannerPlacement) {
  const pc = PC_IMAGE_SPECS[placement].preset;
  return [
    { key: 'jobs', label: '오늘의 공고' },
    { key: 'schedule', label: '지원일정 관리' },
    { key: 'business', label: '오공고 for business' },
  ].map(({ key, label }) => ({
    key,
    label,
    pcImageUrl: `/banners/${key}-${pc}.svg`,
    mobileImageUrl: `/banners/${key}-mo.svg`,
  }));
}

/**
 * 미리보기 주소. `/banners/...` 처럼 사용자 웹의 경로면 웹 주소(`WEB_HOME`)를 붙인다 — 어드민 오리진에는 그 파일이 없다.
 * 로컬에서는 `VITE_OGONGGO_WEB_ORIGIN` 으로 띄운 웹을 가리켜야 보인다.
 */
export function bannerImageSrc(url: string): string {
  return url.startsWith('/') ? new URL(url, WEB_HOME).toString() : url;
}

/** KST 벽시계 시각(`YYYY-MM-DDTHH:mm:ss`)을 시각으로. */
function kstTime(value: string): number {
  return Date.parse(`${value}+09:00`);
}

export type BannerStatus = 'LIVE' | 'SCHEDULED' | 'ENDED' | 'OFF';

/** 지금 홈에 보이는지. 공개 조회가 거르는 규칙(켜짐, 시작 ≤ 지금 < 끝)과 같다. */
export function bannerStatus(banner: Banner, now = Date.now()): BannerStatus {
  if (!banner.enabled) return 'OFF';
  if (banner.startAt !== null && now < kstTime(banner.startAt)) return 'SCHEDULED';
  if (banner.endAt !== null && kstTime(banner.endAt) <= now) return 'ENDED';
  return 'LIVE';
}

/** `2026-11-06T09:00:00` → `2026.11.06 09:00`. */
export function formatKst(value: string | null): string {
  return value === null ? '' : `${value.slice(0, 10).replaceAll('-', '.')} ${value.slice(11, 16)}`;
}

export function formatPeriod(banner: Pick<Banner, 'startAt' | 'endAt'>): string {
  if (banner.startAt === null && banner.endAt === null) return '상시';
  return `${formatKst(banner.startAt) || '켜는 즉시'} ~ ${formatKst(banner.endAt) || '끌 때까지'}`;
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
