import type {
  AdminAdvertisementContractDetailResponse,
  AdminAdvertisementExposureResponse,
  AdminAdvertisementProductResponse,
} from '../../generated/admin/models';
import type { AdvertisementExposureResponse } from '../../generated/user/models';
import { contractSeed } from './advertisement-contracts';

/**
 * 광고 상품과 노출 목의 저장소(BE LC-3583). 공개 배너 조회(`../advertisementExposures.ts`)가 이 배열을 본다.
 *
 * 상품은 배너 6자리마다 하나와, BE 이관 SQL 이 넣는 `비즈니스 공고 등록`(광고 공고, 자리 없음) 하나다. 운영 DB 에는 배너
 * 상품이 시드로 들어가지 않는다 — 운영자가 어드민에서 등록해야 배너가 나온다.
 *
 * 이미지는 사용자 웹의 `public/banners/` 소재다. BE 노출에는 이미지가 하나(`imageUrl`)뿐이라 PC 소재를 넣는다.
 *
 * 어드민 목(`../admin/advertisements.ts`)도 이 저장소를 쓴다. 상품·노출·계약을 함께 들고, 어드민 브라우저에서는
 * `localStorage` 에 적어 새로고침해도 남긴다. 웹 목 서버(Node)는 다른 프로세스라 어드민에서 바꾼 것이 보이지 않는다.
 */

const STORAGE_KEY = 'ogonggo.mock.admin.advertisements';

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

/** 상품은 BE 처럼 지워도 행이 남는다(`deletedAt`). 계약 상품이 지운 상품을 계속 가리킨다. */
export type ProductRecord = AdminAdvertisementProductResponse & { deletedAt: string | null };

interface AdvertisementStore {
  products: ProductRecord[];
  exposures: AdminAdvertisementExposureResponse[];
  contracts: AdminAdvertisementContractDetailResponse[];
}

function seedStore(): AdvertisementStore {
  return {
    products: PRODUCT_SEED.map((product) => ({ ...product, deletedAt: null })),
    exposures: EXPOSURE_SEED.map((exposure) => ({
      contractId: null,
      advertiserCompanyName: null,
      startAt: null,
      endAt: null,
      registeredAt: SEED_TIME,
      updatedAt: SEED_TIME,
      ...exposure,
    })),
    contracts: contractSeed(),
  };
}

/** 브라우저에서만 읽고 쓴다. Node(웹 목 서버)의 `localStorage` 는 실험 기능이라 건드리지 않는다. */
function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): AdvertisementStore {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) {
      return { ...seedStore(), ...(JSON.parse(raw) as Partial<AdvertisementStore>) };
    }
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return seedStore();
}

export const advertisementStore: AdvertisementStore = load();

export function saveAdvertisementStore(): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(advertisementStore));
  } catch {
    // 메모리에는 남는다.
  }
}

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
