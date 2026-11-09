import type {
  AdminAdvertisementExposureResponse,
  AdminAdvertisementProductResponse,
} from '../../generated/admin/models';
import type { AdvertisementExposureResponse } from '../../generated/user/models';

/**
 * 광고 상품과 노출 목의 저장소(BE LC-3583). 공개 배너 조회(`../advertisementExposures.ts`)가 이 배열을 본다.
 *
 * 상품은 배너 6자리마다 하나와, BE 이관 SQL 이 넣는 `비즈니스 공고 등록`(광고 공고, 자리 없음) 하나다. 운영 DB 에는 배너
 * 상품이 시드로 들어가지 않는다 — 운영자가 어드민에서 등록해야 배너가 나온다.
 *
 * 이미지는 사용자 웹의 `public/banners/` 소재다. BE 노출에는 이미지가 하나(`imageUrl`)뿐이라 PC 소재를 넣는다.
 */

const SEED_TIME = '2026-11-06T09:00:00';

const PRODUCT_ROWS: Omit<AdminAdvertisementProductResponse, 'registeredAt' | 'updatedAt'>[] = [
  {
    id: 1,
    category: 'BANNER',
    position: 'JOB_HOME_TOP_BANNER',
    name: '채용공고 홈 상단 배너',
    price: 300000,
  },
  {
    id: 2,
    category: 'BANNER',
    position: 'JOB_HOME_BOTTOM_BANNER',
    name: '채용공고 홈 하단 배너',
    price: 200000,
  },
  {
    id: 3,
    category: 'BANNER',
    position: 'JOB_DETAIL_BANNER',
    name: '공고 상세 배너',
    price: 200000,
  },
  {
    id: 4,
    category: 'BANNER',
    position: 'BOOTCAMP_LIST_TOP_BANNER',
    name: '부트캠프 목록 상단 배너',
    price: 200000,
  },
  {
    id: 5,
    category: 'BANNER',
    position: 'BOOTCAMP_LIST_BOTTOM_BANNER',
    name: '부트캠프 목록 하단 배너',
    price: 150000,
  },
  {
    id: 6,
    category: 'BANNER',
    position: 'BOOTCAMP_DETAIL_BANNER',
    name: '부트캠프 상세 배너',
    price: null,
  },
  { id: 7, category: 'JOB_POSTING', name: '비즈니스 공고 등록', price: null },
];

export const PRODUCT_SEED: AdminAdvertisementProductResponse[] = PRODUCT_ROWS.map((product) => ({
  ...product,
  registeredAt: SEED_TIME,
  updatedAt: SEED_TIME,
}));

type ExposureSeed = Pick<
  AdminAdvertisementExposureResponse,
  'id' | 'productId' | 'name' | 'imageUrl' | 'linkUrl' | 'adLabel' | 'exposed' | 'displayOrder'
> &
  Partial<AdminAdvertisementExposureResponse>;

const EXPOSURE_SEED: ExposureSeed[] = [
  {
    id: 1,
    productId: 1,
    name: '지금 딱! 필요한 채용공고, 매일 아침 올라오는 새 공고를 한눈에',
    imageUrl: '/banners/jobs-pc.svg',
    linkUrl: '/calendar',
    adLabel: false,
    exposed: true,
    displayOrder: 1,
  },
  {
    id: 2,
    productId: 1,
    name: '지원일정 관리 홍보',
    imageUrl: '/banners/schedule-pc.svg',
    linkUrl: '/mypage/applications',
    adLabel: false,
    exposed: true,
    displayOrder: 2,
  },
  {
    id: 3,
    productId: 1,
    name: '지난 기획전(꺼 둠)',
    imageUrl: '/banners/schedule-pc.svg',
    linkUrl: 'https://www.letscareer.co.kr',
    adLabel: true,
    startAt: '2026-10-01T00:00:00',
    endAt: '2026-10-31T23:59:59',
    exposed: false,
    displayOrder: 3,
  },
  {
    id: 4,
    productId: 2,
    name: '우리 공고, 딱 맞는 인재에게. 오공고 for business 광고 신청하기',
    imageUrl: '/banners/business-pc.svg',
    linkUrl: '/biz',
    adLabel: false,
    exposed: true,
    displayOrder: 1,
  },
  {
    id: 5,
    productId: 3,
    name: '지원일정 관리 홍보(상세)',
    imageUrl: '/banners/schedule-side.svg',
    linkUrl: '/mypage/applications',
    adLabel: false,
    exposed: true,
    displayOrder: 1,
  },
  {
    id: 6,
    productId: 3,
    name: '광고주 배너 예시(상세)',
    imageUrl: '/banners/business-side.svg',
    linkUrl: '/biz',
    adLabel: true,
    contractId: 1,
    advertiserCompanyName: '새싹컴퍼니',
    exposed: true,
    displayOrder: 2,
  },
  {
    id: 7,
    productId: 4,
    name: '지원일정 관리 홍보(부트캠프)',
    imageUrl: '/banners/schedule-pc.svg',
    linkUrl: '/mypage/applications',
    adLabel: false,
    exposed: true,
    displayOrder: 1,
  },
  {
    id: 8,
    productId: 5,
    name: '오공고 for business 광고 신청(부트캠프)',
    imageUrl: '/banners/business-pc.svg',
    linkUrl: '/biz',
    adLabel: false,
    exposed: true,
    displayOrder: 1,
  },
  {
    id: 9,
    productId: 6,
    name: '새싹 제휴 배너(부트캠프 상세)',
    imageUrl: '/banners/business-side.svg',
    linkUrl: '/biz',
    adLabel: true,
    exposed: true,
    displayOrder: 1,
  },
];

export const advertisementStore: {
  products: AdminAdvertisementProductResponse[];
  exposures: AdminAdvertisementExposureResponse[];
} = {
  products: PRODUCT_SEED.map((product) => ({ ...product })),
  exposures: EXPOSURE_SEED.map((exposure) => ({
    contractId: null,
    advertiserCompanyName: null,
    startAt: null,
    endAt: null,
    registeredAt: SEED_TIME,
    updatedAt: SEED_TIME,
    ...exposure,
  })),
};

/** KST 벽시계 시각(`YYYY-MM-DDTHH:mm:ss`)을 시각으로. 오프셋이 없어 `+09:00` 을 붙인다. */
function kstTime(value: string): number {
  return Date.parse(`${value}+09:00`);
}

/** BE `AdvertisementExposure.isShownAt` 과 같다. 켜져 있고, 시작 전이 아니고, 끝난 뒤가 아니다(양 끝 포함). */
export function isExposureShown(
  exposure: AdminAdvertisementExposureResponse,
  now = Date.now(),
): boolean {
  return (
    exposure.exposed &&
    (exposure.startAt == null || kstTime(exposure.startAt) <= now) &&
    (exposure.endAt == null || now <= kstTime(exposure.endAt))
  );
}

export function toPublicExposure({
  id,
  name,
  imageUrl,
  linkUrl,
  adLabel,
}: AdminAdvertisementExposureResponse): AdvertisementExposureResponse {
  return { id, name: name ?? '', imageUrl: imageUrl ?? '', linkUrl: linkUrl ?? '', adLabel };
}
