import { AD_APPLICATION_FIXTURES, mondayAfter } from './advertisement';
import type { AdApplication, AdPlacementKey } from './advertisement-types';

/**
 * 어드민 광고 신청 픽스처. 마이페이지 목의 신청 셋(`AD_APPLICATION_FIXTURES`, 한 기업)에 다른 기업의 확정·집행 중 신청을
 * 더한다. 어드민은 모든 기업의 신청을 보고, 구좌 설정 화면에서 노출 순서를 바꿀 항목이 있어야 한다.
 *
 * 기업과 공고 이름은 광고 시스템 시안의 공고 달력 칩(PFCT, 쿠팡이츠, 카카오페이, 토스)에서 가져왔다. 금액과 날짜는 지어낸 값이다.
 */

const pad = (value: number) => String(value).padStart(2, '0');
const ymd = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const DAY = 24 * 60 * 60 * 1000;

const thisWeek = mondayAfter(0);
const nextWeek = mondayAfter(1);
const received = mondayAfter(-3);

interface Seed {
  id: number;
  companyName: string;
  postId: number;
  postTitle: string;
  status: 'CONFIRMED' | 'RUNNING';
  placementKey: AdPlacementKey;
  placementName: string;
  price: number;
  displayOrder: number;
}

const SEEDS: Seed[] = [
  {
    id: 31,
    companyName: 'PFCT',
    postId: 201,
    postTitle: 'PO 인턴 (채용연계형)',
    status: 'RUNNING',
    placementKey: 'MAIN_TOP_BANNER_RECRUIT',
    placementName: '메인 상단 배너',
    price: 500000,
    displayOrder: 1,
  },
  {
    id: 32,
    companyName: '쿠팡이츠',
    postId: 202,
    postTitle: '마케팅 인턴',
    status: 'RUNNING',
    placementKey: 'MAIN_TOP_BANNER_RECRUIT',
    placementName: '메인 상단 배너',
    price: 500000,
    displayOrder: 2,
  },
  {
    id: 33,
    companyName: '카카오페이',
    postId: 203,
    postTitle: '서비스 기획 인턴 (6개월)',
    status: 'RUNNING',
    placementKey: 'ACTIVE_RECRUIT',
    placementName: '적극 채용중 공고 구좌',
    price: 400000,
    displayOrder: 1,
  },
  {
    id: 34,
    companyName: '토스',
    postId: 204,
    postTitle: '콘텐츠 마케터',
    status: 'RUNNING',
    placementKey: 'ACTIVE_RECRUIT',
    placementName: '적극 채용중 공고 구좌',
    price: 400000,
    displayOrder: 2,
  },
  {
    id: 35,
    companyName: '현대오토에버',
    postId: 205,
    postTitle: '2026 하반기 사업기획 신입 채용',
    status: 'CONFIRMED',
    placementKey: 'MAIN_TOP_BANNER_RECRUIT',
    placementName: '메인 상단 배너',
    price: 500000,
    displayOrder: 3,
  },
];

function toApplication(seed: Seed): AdApplication {
  const start = seed.status === 'RUNNING' ? thisWeek : nextWeek;
  const end = new Date(start.getTime() + 6 * DAY);
  const applicationNo = `AD-${ymd(received).slice(2).replaceAll('-', '')}-${String(seed.id).padStart(4, '0')}`;
  return {
    id: seed.id,
    applicationNo,
    status: seed.status,
    postTarget: 'JOB',
    postId: seed.postId,
    postTitle: seed.postTitle,
    companyName: seed.companyName,
    purpose: 'BRAND_AWARENESS',
    items: [
      {
        id: seed.id * 100 + 1,
        placementKey: seed.placementKey,
        placementName: seed.placementName,
        startDate: ymd(start),
        endDate: ymd(end),
        weeks: 1,
        amount: seed.price,
        couponApplied: false,
        displayOrder: seed.displayOrder,
        creative: {
          id: (seed.id * 100 + 1) * 10 + 1,
          source: 'OGONGGO_MADE',
          skillTags: [],
          taskTags: [],
          confirmStatus: 'APPROVED',
        },
      },
    ],
    amount: { subtotal: seed.price, discount: 0, coupon: 0, total: seed.price },
    paid: true,
    receivedAt: `${ymd(received)}T10:00:00`,
    contact: {
      name: '담당자',
      phone: '010-0000-0000',
      email: `ads${seed.id}@example.com`,
      companyName: seed.companyName,
    },
    billing: {
      contractEmail: `ads${seed.id}@example.com`,
      taxInvoiceEmail: `ads${seed.id}@example.com`,
      taxInvoiceType: 'CLAIM',
    },
    waitlist: 'NONE',
    history: [{ at: `${ymd(received)}T10:00:00`, message: `신청 접수 (${applicationNo})` }],
  };
}

export const ADMIN_AD_APPLICATION_FIXTURES: AdApplication[] = [
  ...AD_APPLICATION_FIXTURES,
  ...SEEDS.map(toApplication),
];
