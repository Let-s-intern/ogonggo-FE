import type { AdminBannerResponse, PublicBannerResponse } from '../../banners';

/**
 * 홈 배너 목의 저장소. 공개 조회(`../banners.ts`)와 어드민 세팅(`../admin/banners.ts`)이 이 배열 하나를 같이 본다 —
 * 같은 런타임 안에서는 어드민에서 바꾼 것이 공개 조회에 그대로 나온다.
 *
 * 다만 사용자 웹(Next 서버의 `msw/node`)과 어드민(브라우저 워커)은 다른 프로세스라 메모리를 나누지 않는다. 어드민에서
 * 바꾼 배너는 웹 목 서버에 나오지 않는다. 어드민 브라우저에서는 `localStorage` 에 적어 새로고침해도 남긴다.
 *
 * 이미지는 사용자 웹의 `public/banners/` 소재다. 어드민은 그 경로 앞에 웹 주소를 붙여 미리 본다.
 */

const STORAGE_KEY = 'ogonggo.mock.admin.banners';

/** 저장하는 배너. 응답의 광고주 요약(`advertiser`)은 저장하지 않고 응답할 때 `advertiserId` 로 읽는다. */
export type BannerRecord = Omit<AdminBannerResponse, 'advertiser'>;

const SEED_TIME = '2026-11-06T09:00:00';

const SEED: BannerRecord[] = [
  {
    id: 1,
    placement: 'HOME_TOP',
    name: '오늘의 공고 홍보',
    pcImageUrl: '/banners/jobs-pc.svg',
    mobileImageUrl: '/banners/jobs-mo.svg',
    linkUrl: '/calendar',
    openInNewTab: false,
    altText: '지금 딱! 필요한 채용공고, 매일 아침 올라오는 새 공고를 한눈에',
    showAdLabel: false,
    startAt: null,
    endAt: null,
    enabled: true,
    advertiserId: null,
    displayOrder: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 2,
    placement: 'HOME_TOP',
    name: '지원일정 관리 홍보',
    pcImageUrl: '/banners/schedule-pc.svg',
    mobileImageUrl: '/banners/schedule-mo.svg',
    linkUrl: '/mypage/applications',
    openInNewTab: false,
    altText: '마감 일정, 이제 놓치지 마세요. 스크랩한 공고를 보드에서 한 번에 관리',
    showAdLabel: false,
    startAt: null,
    endAt: null,
    enabled: true,
    advertiserId: null,
    displayOrder: 2,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    // 꺼 둔 배너. 어드민 표에는 보이고 홈에는 나오지 않는다.
    id: 3,
    placement: 'HOME_TOP',
    name: '지난 기획전(꺼 둠)',
    pcImageUrl: '/banners/schedule-pc.svg',
    mobileImageUrl: '/banners/schedule-mo.svg',
    linkUrl: 'https://www.letscareer.co.kr',
    openInNewTab: true,
    altText: '지난 기획전',
    showAdLabel: true,
    startAt: '2026-10-01T00:00:00',
    endAt: '2026-10-31T23:59:59',
    enabled: false,
    advertiserId: 2,
    displayOrder: 3,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 4,
    placement: 'HOME_BOTTOM',
    name: '오공고 for business 광고 신청',
    pcImageUrl: '/banners/business-pc.svg',
    mobileImageUrl: '/banners/business-mo.svg',
    linkUrl: '/biz',
    openInNewTab: false,
    altText: '우리 공고, 딱 맞는 인재에게. 오공고 for business 광고 신청하기',
    showAdLabel: false,
    startAt: null,
    endAt: null,
    enabled: true,
    advertiserId: null,
    displayOrder: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    // 공고 상세 사이드. PC 는 400×500 세로 소재, 모바일(사이드바가 본문 아래로 내려간다)은 750×200 이다.
    id: 5,
    placement: 'JOB_DETAIL_SIDE',
    name: '지원일정 관리 홍보(상세)',
    pcImageUrl: '/banners/schedule-side.svg',
    mobileImageUrl: '/banners/schedule-mo.svg',
    linkUrl: '/mypage/applications',
    openInNewTab: false,
    altText: '마감 일정, 이제 놓치지 마세요. 스크랩한 공고를 보드에서 한 번에 관리',
    showAdLabel: false,
    startAt: null,
    endAt: null,
    enabled: true,
    advertiserId: null,
    displayOrder: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 6,
    placement: 'JOB_DETAIL_SIDE',
    name: '광고주 배너 예시(상세)',
    pcImageUrl: '/banners/business-side.svg',
    mobileImageUrl: '/banners/business-mo.svg',
    linkUrl: '/biz',
    openInNewTab: false,
    altText: '우리 공고, 딱 맞는 인재에게. 오공고 for business 광고 신청하기',
    showAdLabel: true,
    startAt: null,
    endAt: null,
    enabled: true,
    advertiserId: 1,
    displayOrder: 2,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
];

/** 브라우저에서만 읽고 쓴다. Node(웹 목 서버)의 `localStorage` 는 실험 기능이라 건드리지 않는다. */
function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): BannerRecord[] {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) {
      // 광고주 칸이 생기기 전에 저장한 배너는 광고주 없음으로 읽는다.
      const saved = (JSON.parse(raw) as BannerRecord[]).map((banner) => ({
        ...banner,
        advertiserId: banner.advertiserId ?? null,
      }));
      // 저장해 둔 뒤에 새로 생긴 자리(`JOB_DETAIL_SIDE`)는 시드로 채운다. 저장된 자리는 건드리지 않는다.
      const savedPlacements = new Set(saved.map((banner) => banner.placement));
      const savedIds = new Set(saved.map((banner) => banner.id));
      return [
        ...saved,
        ...SEED.filter(
          (banner) => !savedPlacements.has(banner.placement) && !savedIds.has(banner.id),
        ).map((banner) => ({ ...banner })),
      ];
    }
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return SEED.map((banner) => ({ ...banner }));
}

export const bannerStore: { banners: BannerRecord[] } = { banners: load() };

export function saveBanners(): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(bannerStore.banners));
  } catch {
    // 메모리에는 남는다.
  }
}

/** KST 벽시계 시각(`YYYY-MM-DDTHH:mm:ss`)을 시각으로. 오프셋이 없어 `+09:00` 을 붙인다. */
function kstTime(value: string): number {
  return Date.parse(`${value}+09:00`);
}

/** 지금 노출 중인가. 켜져 있고, 시작 시각이 지났고(없으면 지난 것), 끝 시각 전이다(없으면 전). */
export function isBannerLive(banner: BannerRecord, now = Date.now()): boolean {
  return (
    banner.enabled &&
    (banner.startAt === null || kstTime(banner.startAt) <= now) &&
    (banner.endAt === null || now < kstTime(banner.endAt))
  );
}

export function toPublicBanner({
  id,
  placement,
  pcImageUrl,
  mobileImageUrl,
  linkUrl,
  openInNewTab,
  altText,
  showAdLabel,
}: BannerRecord): PublicBannerResponse {
  return {
    id,
    placement,
    pcImageUrl,
    mobileImageUrl,
    linkUrl,
    openInNewTab,
    altText,
    showAdLabel,
  };
}
