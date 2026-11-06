import type { AdPostingPlacement } from './ad-postings';
import type { BannerPlacement } from './banners';

/**
 * 광고 계약(이슈 #573, 2026-11-06 사용자). 광고주가 언제부터 언제까지 얼마를 내고 어느 자리를 샀는지 적는다. 배너·광고 공고는
 * 계약 하나에 이어 둘 수 있고(`contractId`), 어드민은 계약을 고르면 노출 기간을 계약 기간으로 채운다.
 *
 * 백엔드 API 가 아직 없어 손으로 적었다. 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "광고 계약"
 * 이고, 목(`./mocks/admin/ad-contracts.ts`)이 이 모양 그대로 응답한다. 백엔드 배포 뒤 코드젠으로 바꾼다.
 */

/**
 * 계약한 상품(자리). 배너 자리와 광고 공고 자리에 같은 이름(`JOB_DETAIL_SIDE`)이 있어 종류를 앞에 붙인다.
 */
export type AdContractProduct = `BANNER_${BannerPlacement}` | `AD_POSTING_${AdPostingPlacement}`;

export const AD_CONTRACT_PRODUCTS: readonly AdContractProduct[] = [
  'BANNER_HOME_TOP',
  'BANNER_HOME_BOTTOM',
  'BANNER_JOB_DETAIL_SIDE',
  'BANNER_BOOTCAMP_TOP',
  'BANNER_BOOTCAMP_BOTTOM',
  'BANNER_BOOTCAMP_DETAIL_SIDE',
  'AD_POSTING_JOB_LIST',
  'AD_POSTING_JOB_PICK',
  'AD_POSTING_BOOTCAMP_LIST',
  'AD_POSTING_JOB_DETAIL_SIDE',
  'AD_POSTING_CALENDAR',
  'AD_POSTING_MYPAGE_SCRAP',
];

/** 배너·광고 공고 응답에 붙는 계약 요약. 기간 밖 경고와 표의 `계약` 표시가 쓴다. */
export interface AdContractSummary {
  id: number;
  /** 운영자가 붙인 이름(예: `11월 홈 배너`). 없으면 `null` 이다. */
  name: string | null;
  /** 광고 시작·끝(KST, `YYYY-MM-DDTHH:mm:ss`). 둘 다 있다. 시작은 포함, 끝은 미포함이다(배너와 같은 규칙). */
  startAt: string;
  endAt: string;
}

/** `GET /api/v1/admin/advertisers/{advertiserId}/contracts` 한 건. */
export interface AdminAdContractResponse extends AdContractSummary {
  advertiserId: number;
  /** 금액(원). 0 이상의 정수. */
  amount: number;
  /** `amount` 가 부가가치세를 포함한 금액인가. 새 계약은 포함(`true`)으로 시작한다(2026-11-06 사용자). */
  vatIncluded: boolean;
  /** 결제 완료 여부. */
  paid: boolean;
  /** 결제일(KST, `YYYY-MM-DD`). 결제 완료일 때만 있고, 몰라도 비워 둘 수 있다. */
  paidDate: string | null;
  /** 산 자리. 비어 있으면 자리를 정하지 않은 계약이다. */
  products: AdContractProduct[];
  /**
   * 산 인스타그램 게재 유형(`./instagram.ts` 의 유형 id). 유형은 운영자가 정해 늘고 줄어 `products` 처럼 고정 값으로 둘 수 없어
   * 칸을 따로 둔다. 계정은 계약에서 정하지 않고 인스타 광고를 잡을 때 고른다.
   */
  instagramFormatIds: number[];
  memo: string | null;
  /** 이 계약에 이어 둔 배너·광고 공고·인스타 광고 수. 서버가 센다. */
  bannerCount: number;
  adPostingCount: number;
  instagramAdCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 등록(`POST`) 본문. 수정(`PATCH`)은 이 칸의 부분집합이다. */
export interface AdminAdContractRequest {
  name: string | null;
  startAt: string;
  endAt: string;
  amount: number;
  vatIncluded: boolean;
  paid: boolean;
  paidDate: string | null;
  products: AdContractProduct[];
  instagramFormatIds: number[];
  memo: string | null;
}

export type UpdateAdminAdContractRequest = Partial<AdminAdContractRequest>;

/** 광고주 한 곳의 계약 목록·등록. */
export const adminAdvertiserContractsPath = (advertiserId: number) =>
  `/api/v1/admin/advertisers/${advertiserId}/contracts`;

/** 계약 한 건의 수정·삭제(`/{contractId}`). */
export const ADMIN_AD_CONTRACTS_PATH = '/api/v1/admin/advertiser-contracts';
