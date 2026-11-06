import type { AdPostingPlacement } from '../../ad-postings';

/**
 * 광고 공고 목의 저장소(이슈 #573). 공개 조회(`../handlers.ts` 의 `getAdPostingsHandler`)와 어드민 세팅
 * (`../admin/ad-postings.ts`)이 이 배열 하나를 같이 본다. 대상의 제목·카드 내용은 저장하지 않고 조회할 때 공고·부트캠프
 * 픽스처에서 읽는다 — 백엔드도 광고에는 대상 id 만 두고 대상을 이어 읽기를 바란다.
 *
 * 배너 목(`./banners.ts`)과 같은 한계가 있다. 사용자 웹(Next 서버의 `msw/node`)과 어드민(브라우저 워커)은 메모리를 나누지
 * 않아 어드민에서 바꾼 광고는 웹 목에 나오지 않는다. 어드민 브라우저에서는 `localStorage` 에 적어 새로고침해도 남긴다.
 */

export interface AdPostingRecord {
  id: number;
  placement: AdPostingPlacement;
  targetId: number;
  advertiserId: number;
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'ogonggo.mock.admin.adPostings';

const SEED_TIME = '2026-11-06T09:00:00';

/**
 * 자리마다 두세 건. 대상 id 는 공고 픽스처(`./job.ts`)·부트캠프 픽스처(`./bootcamp.ts`)의 것이고, 어드민 목에서도
 * 공개·모집 중인 것으로 골랐다.
 *
 * - `JOB_LIST` 의 700 번과 `BOOTCAMP_LIST` 의 22 번은 최신순 1쪽에도 있는 대상이다. 웹이 1쪽 일반 목록에서 빼는지 본다.
 * - 꺼 둔 것과 노출 예정인 것을 하나씩 둔다. 어드민 표에는 보이고 웹에는 나오지 않는다.
 */
// 광고주 id: 100xxx 는 비즈니스 회원(`./advertisers.ts` 의 `MEMBER_ID_OFFSET + 사용자 id`), 1·2 는 광고 문의로 들어온
// 비회원 기업, 3 은 운영자가 더한 비회원 기업이다.
const SEED: [AdPostingPlacement, number, number, Partial<AdPostingRecord>?][] = [
  ['JOB_LIST', 13, 100103],
  ['JOB_LIST', 700, 1],
  ['JOB_LIST', 29, 100105, { enabled: false }],
  ['JOB_LIST', 16, 2, { startAt: '2026-12-01T00:00:00', endAt: '2026-12-31T23:59:00' }],
  ['JOB_PICK', 18, 100104],
  ['JOB_PICK', 22, 1],
  ['BOOTCAMP_LIST', 7, 3],
  ['BOOTCAMP_LIST', 22, 2],
  ['JOB_DETAIL_SIDE', 58, 100104],
  ['JOB_DETAIL_SIDE', 4, 1],
  ['CALENDAR', 24, 100104],
  ['CALENDAR', 12, 2],
  ['MYPAGE_SCRAP', 33, 1],
  ['MYPAGE_SCRAP', 20, 100102, { enabled: false }],
];

function seed(): AdPostingRecord[] {
  const orderInPlacement = new Map<AdPostingPlacement, number>();
  return SEED.map(([placement, targetId, advertiserId, overrides], index) => {
    const displayOrder = (orderInPlacement.get(placement) ?? 0) + 1;
    orderInPlacement.set(placement, displayOrder);
    return {
      id: index + 1,
      placement,
      targetId,
      advertiserId,
      startAt: null,
      endAt: null,
      enabled: true,
      displayOrder,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
      ...overrides,
    };
  });
}

/** 브라우저에서만 읽고 쓴다. 배너 목과 같은 이유다. */
function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): AdPostingRecord[] {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AdPostingRecord[];
    }
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return seed();
}

export const adPostingStore: { adPostings: AdPostingRecord[] } = { adPostings: load() };

export function saveAdPostings(): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(adPostingStore.adPostings));
  } catch {
    // 메모리에는 남는다.
  }
}

/** KST 벽시계 시각(`YYYY-MM-DDTHH:mm:ss`)을 시각으로. 오프셋이 없어 `+09:00` 을 붙인다. */
function kstTime(value: string): number {
  return Date.parse(`${value}+09:00`);
}

/** 광고 자체가 지금 켜져 있고 기간 안인가. 대상이 공개·모집 중인지는 부르는 쪽이 따로 본다. */
export function isAdPostingLive(ad: AdPostingRecord, now = Date.now()): boolean {
  return (
    ad.enabled &&
    (ad.startAt === null || kstTime(ad.startAt) <= now) &&
    (ad.endAt === null || now < kstTime(ad.endAt))
  );
}

/** 자리 안 광고를 순서대로. */
export function adPostingsIn(placement: string): AdPostingRecord[] {
  return adPostingStore.adPostings
    .filter((ad) => ad.placement === placement)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
