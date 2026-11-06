import type { AdContractSummary } from './ad-contracts';
import type { AdvertiserSummary } from './advertisers';

/**
 * 인스타그램 광고(이슈 #573, 2026-11-06 사용자). 광고주의 홍보를 우리 인스타그램 계정에 올려 주는 상품이다. 계정이 여럿이고
 * 올리는 방식(피드 게시물, 릴스, 스토리 등)도 여럿이라 운영자가 `인스타 등록` 에서 계정과 게재 유형을 등록하고, `인스타 광고`
 * 에서 광고주별 게시 일정을 잡는다.
 *
 * 백엔드 API 가 아직 없어 손으로 적었다. 계약은 `.claude/tasks/memos/백엔드-요청-인스타-광고-2026-11-06.md` 이고, 목
 * (`./mocks/admin/instagram.ts`)이 이 모양 그대로 응답한다. 백엔드 배포 뒤 코드젠으로 바꾼다.
 */

/** 우리 인스타그램 계정. `GET /api/v1/admin/instagram-accounts` 한 건. */
export interface AdminInstagramAccountResponse {
  id: number;
  /** `@` 를 뺀 계정 이름(예: `letscareer.job`). 영문·숫자·`.`·`_` 30자까지, 겹치지 않는다. 화면은 `@` 를 붙여 보인다. */
  handle: string;
  /** 표시 이름(예: `렛츠커리어 오공고`). */
  displayName: string;
  /** 계정 주소. */
  profileUrl: string;
  /** 프로필 이미지. `https://` 주소이거나 웹 사이트 안 경로(`/community/...`). 없으면 `null`. */
  profileImageUrl: string | null;
  /** 끄면 새 인스타 광고에서 고를 수 없다. 이미 잡힌 광고는 그대로다. */
  enabled: boolean;
  memo: string | null;
  /** 이 계정에 잡힌 인스타 광고 수. 서버가 센다. 1 이상이면 지울 수 없다. */
  adCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInstagramAccountRequest {
  handle: string;
  displayName: string;
  profileUrl: string;
  profileImageUrl: string | null;
  enabled: boolean;
  memo: string | null;
}

export type UpdateAdminInstagramAccountRequest = Partial<AdminInstagramAccountRequest>;

/** 목록·등록, `/{accountId}` 수정·삭제. */
export const ADMIN_INSTAGRAM_ACCOUNTS_PATH = '/api/v1/admin/instagram-accounts';

/** 게재 유형(피드 게시물, 릴스 등). 운영자가 정하고 순서를 바꾼다. `GET /api/v1/admin/instagram-formats` 한 건. */
export interface AdminInstagramFormatResponse {
  id: number;
  /** 이름(예: `릴스(숏츠)`). 겹치지 않는다. */
  name: string;
  description: string | null;
  enabled: boolean;
  /** 기본 단가(원). 안내용이고 계약 금액에 더하지 않는다. 없으면 `null`. */
  defaultPrice: number | null;
  /** 이 유형으로 올릴 수 있는 계정. 비어 있으면 모든 계정이다. */
  accountIds: number[];
  /** 1부터. 목록과 고르기 칸이 이 순서다. */
  displayOrder: number;
  /** 이 유형으로 잡힌 인스타 광고 수. 1 이상이면 지울 수 없다. */
  adCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInstagramFormatRequest {
  name: string;
  description: string | null;
  enabled: boolean;
  defaultPrice: number | null;
  accountIds: number[];
}

export type UpdateAdminInstagramFormatRequest = Partial<AdminInstagramFormatRequest>;

/** 목록·등록, `/{formatId}` 수정·삭제, `PUT /order`(`{ formatIds }`) 순서 바꾸기. */
export const ADMIN_INSTAGRAM_FORMATS_PATH = '/api/v1/admin/instagram-formats';

/** 인스타 광고 진행 상태. 예정, 게시 완료, 취소. 운영자가 바꾼다(날짜로 저절로 바뀌지 않는다). */
export type InstagramAdStatus = 'SCHEDULED' | 'PUBLISHED' | 'CANCELED';

export const INSTAGRAM_AD_STATUSES: readonly InstagramAdStatus[] = [
  'SCHEDULED',
  'PUBLISHED',
  'CANCELED',
];

/** 인스타 광고 한 건. `GET /api/v1/admin/instagram-ads` 한 건. */
export interface AdminInstagramAdResponse {
  id: number;
  advertiserId: number;
  /** 서버가 `advertiserId` 로 읽어 싣는다. 광고주가 지워졌으면 `null`. */
  advertiser: AdvertiserSummary | null;
  contractId: number | null;
  contract: AdContractSummary | null;
  accountId: number;
  account: Pick<AdminInstagramAccountResponse, 'id' | 'handle' | 'displayName'> | null;
  formatId: number;
  format: Pick<AdminInstagramFormatResponse, 'id' | 'name'> | null;
  /** 게시 예정일(KST `YYYY-MM-DD`). 게시하면 실제 게시일로 고친다. */
  postDate: string;
  /** 스토리·하이라이트 고정처럼 기간이 있는 것의 노출 끝 날(KST `YYYY-MM-DD`, 그날 포함). 없으면 `null`(하루짜리 게시). */
  endDate: string | null;
  status: InstagramAdStatus;
  /** 올린 게시물 주소. 게시 뒤 적는다. */
  postUrl: string | null;
  /** 소재·문구 메모(광고주가 준 문구, 이미지 위치 등). */
  creativeMemo: string | null;
  /** 담당자 메모. */
  adminMemo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInstagramAdRequest {
  advertiserId: number;
  contractId: number | null;
  accountId: number;
  formatId: number;
  postDate: string;
  endDate: string | null;
  status: InstagramAdStatus;
  postUrl: string | null;
  creativeMemo: string | null;
  adminMemo: string | null;
}

export type UpdateAdminInstagramAdRequest = Partial<AdminInstagramAdRequest>;

/**
 * 목록·등록, `/{adId}` 수정·삭제. 목록은 `?month=YYYY-MM`(그달과 겹치는 것), `advertiserId`, `contractId`, `accountId`,
 * `formatId`, `status` 로 거른다. 모두 비우면 전부다. 게시 예정일이 이른 것이 먼저다.
 */
export const ADMIN_INSTAGRAM_ADS_PATH = '/api/v1/admin/instagram-ads';
