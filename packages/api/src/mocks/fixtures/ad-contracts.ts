import type { AdContractSummary, AdminAdContractResponse } from '../../ad-contracts';

/**
 * 광고 계약 목의 저장소(이슈 #573). 어드민 계약 핸들러(`../admin/ad-contracts.ts`)와 배너·광고 공고 핸들러가 같이 본다.
 * 브라우저에서는 `localStorage` 에 적어 새로고침해도 남긴다(배너 목과 같다).
 */

/** 저장하는 계약. 이어 둔 배너·광고 공고 수는 저장하지 않고 응답할 때 센다. */
export type AdContractRecord = Omit<AdminAdContractResponse, 'bannerCount' | 'adPostingCount'>;

const STORAGE_KEY = 'ogonggo.mock.admin.adContracts';
const SEED_TIME = '2026-11-06T09:00:00';

/**
 * 진행 중·예정·종료가 하나씩은 보이게 둔다. 광고주 id 는 `./advertisers.ts` 의 것(1 그로우랩, 2 코드스테이션, 100104 회원).
 * 배너·광고 공고 시드 몇 건이 이 계약을 가리킨다(`./banners.ts`, `./ad-postings.ts`).
 */
const SEED: AdContractRecord[] = [
  {
    id: 1,
    advertiserId: 1,
    name: '11월 공고 상세 패키지',
    startAt: '2026-11-01T00:00:00',
    endAt: '2026-12-01T00:00:00',
    amount: 1_500_000,
    vatIncluded: true,
    paid: true,
    paidDate: '2026-10-28',
    products: ['BANNER_JOB_DETAIL_SIDE', 'AD_POSTING_JOB_LIST', 'AD_POSTING_JOB_DETAIL_SIDE'],
    memo: '공고 상세 배너 1, 광고 공고 2. 세금계산서 발행 완료',
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 2,
    advertiserId: 1,
    name: '12월 홈 상단 배너',
    startAt: '2026-12-01T00:00:00',
    endAt: '2027-01-01T00:00:00',
    amount: 2_000_000,
    vatIncluded: false,
    paid: false,
    paidDate: null,
    products: ['BANNER_HOME_TOP'],
    memo: null,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 3,
    advertiserId: 2,
    name: '10월 기획전',
    startAt: '2026-10-01T00:00:00',
    endAt: '2026-11-01T00:00:00',
    amount: 800_000,
    vatIncluded: true,
    paid: true,
    paidDate: '2026-09-25',
    products: ['BANNER_HOME_TOP', 'AD_POSTING_BOOTCAMP_LIST'],
    memo: null,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 4,
    advertiserId: 100104,
    name: '4분기 추천·달력',
    startAt: '2026-10-01T00:00:00',
    endAt: '2027-01-01T00:00:00',
    amount: 3_000_000,
    vatIncluded: true,
    paid: true,
    paidDate: null,
    products: ['AD_POSTING_JOB_PICK', 'AD_POSTING_CALENDAR', 'AD_POSTING_JOB_DETAIL_SIDE'],
    memo: null,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
];

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): AdContractRecord[] {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) {
      // 부가세 칸(`vatIncluded`)이 생기기 전에 저장한 계약은 포함으로 읽는다(새 계약의 기본값과 같다).
      return (JSON.parse(raw) as AdContractRecord[]).map((contract) => ({
        ...contract,
        vatIncluded: contract.vatIncluded ?? true,
      }));
    }
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return SEED.map((contract) => ({ ...contract, products: [...contract.products] }));
}

export const adContractStore: { contracts: AdContractRecord[] } = { contracts: load() };

export function saveAdContracts(): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(adContractStore.contracts));
  } catch {
    // 메모리에는 남는다.
  }
}

export function findAdContract(id: number | null | undefined): AdContractRecord | undefined {
  return id === null || id === undefined
    ? undefined
    : adContractStore.contracts.find((contract) => contract.id === id);
}

/** 배너·광고 공고 응답에 붙이는 요약. 지워졌거나 없으면 `null` 이다. */
export function adContractSummary(id: number | null | undefined): AdContractSummary | null {
  const contract = findAdContract(id);
  return contract
    ? { id: contract.id, name: contract.name, startAt: contract.startAt, endAt: contract.endAt }
    : null;
}

/**
 * 배너·광고 공고에 계약을 이을 수 있는가. 계약이 있어야 하고 같은 광고주의 것이어야 한다. 잇지 않으면(`null`) 늘 된다.
 * 걸리면 화면에 보일 문구를 준다.
 */
export function adContractLinkError(
  contractId: number | null | undefined,
  advertiserId: number | null,
): string | null {
  if (contractId === null || contractId === undefined) {
    return null;
  }
  const contract = findAdContract(contractId);
  if (!contract) {
    return 'contractId: 있는 계약을 골라 주세요.';
  }
  return contract.advertiserId === advertiserId
    ? null
    : 'contractId: 고른 광고주의 계약만 이을 수 있습니다.';
}

/** KST 벽시계 시각을 시각으로. */
function kstTime(value: string): number {
  return Date.parse(`${value}+09:00`);
}

/** 지금이 계약 기간 안인가(시작 포함, 끝 미포함). */
export function isAdContractActive(contract: AdContractRecord, now = Date.now()): boolean {
  return kstTime(contract.startAt) <= now && now < kstTime(contract.endAt);
}
