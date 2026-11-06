/**
 * 홈 배너(이슈 #573)의 요청·응답 타입과 주소.
 *
 * 백엔드 API 가 아직 없어 손으로 적었다. 계약은 `.claude/tasks/memos/백엔드-요청-배너-세팅-2026-11-06.md` 이고,
 * 목(`./mocks/banners.ts`, `./mocks/admin/banners.ts`)이 이 모양 그대로 응답한다.
 * 백엔드 배포 뒤 코드젠으로 바꾼다 — 그때 이 파일을 지우고 생성 타입으로 옮긴다.
 *
 * 사용자 API(공개 조회)와 어드민 API(세팅) 타입을 한 파일에 둔다. 두 쪽이 같은 배너를 다르게 자른 모양이라
 * 떨어뜨려 두면 한쪽만 고쳐지기 쉽다. 생성 타입의 이름과 겹치지 않게 `Banner` 를 붙였다.
 */

import type { AdContractSummary } from './ad-contracts';
import type { AdvertiserSummary } from './advertisers';

/**
 * 배너 자리. `HOME_TOP` 은 홈 히어로 아래, `HOME_BOTTOM` 은 홈 목록 아래 `FOR BUSINESS` 배너 위,
 * `JOB_DETAIL_SIDE` 는 공고 상세 오른쪽 사이드바(비슷한 공고 아래)다.
 */
export type BannerPlacement = 'HOME_TOP' | 'HOME_BOTTOM' | 'JOB_DETAIL_SIDE';

export const BANNER_PLACEMENTS: readonly BannerPlacement[] = [
  'HOME_TOP',
  'HOME_BOTTOM',
  'JOB_DETAIL_SIDE',
];

/**
 * 공개 조회(`GET /api/v1/banners?placement=`) 한 건. 지금 노출 중인 것(켜짐, 기간 안)만 순서대로 온다.
 * 운영자용 이름·기간·켜짐은 싣지 않는다.
 */
export interface PublicBannerResponse {
  id: number;
  placement: BannerPlacement;
  /**
   * PC 이미지. 홈 자리는 1200×120, 공고 상세 사이드는 400×500 이다. 절대 주소이거나 사용자 웹이 두는
   * `/banners/*.svg` 같은 경로다.
   */
  pcImageUrl: string;
  /**
   * 모바일 이미지(750×200, 모든 자리 같다). `pcImageUrl` 과 같은 규칙이다. 홈 자리는 비워 둘 수 있고(`null`), 그러면 웹이
   * 좁은 화면에도 PC 이미지를 쓴다. 공고 상세 사이드는 PC 가 세로 소재라 모바일 이미지가 꼭 있다.
   */
  mobileImageUrl: string | null;
  /** 누르면 가는 곳. `http(s)://` 로 시작하는 주소이거나 `/` 로 시작하는 사이트 안 경로다. */
  linkUrl: string;
  /** 새 탭으로 열지. 외부 주소는 이 값과 상관없이 새 탭이다(웹이 정한다). */
  openInNewTab: boolean;
  /** 이미지 대체 텍스트. 스크린 리더가 링크 이름으로 읽는다. */
  altText: string;
  /** `광고` 표시를 붙일지. 오공고 자체 홍보는 끄고, 돈을 받고 싣는 배너는 켠다. */
  showAdLabel: boolean;
}

export interface PublicBannerListResponse {
  status: number;
  message: string;
  data?: PublicBannerResponse[];
}

export const getListBannersUrl = (placement: BannerPlacement) =>
  `/api/v1/banners?placement=${placement}`;

/** 어드민 목록·상세 한 건. 공개 응답에 운영 칸이 더해진다. */
export interface AdminBannerResponse extends PublicBannerResponse {
  /** 운영자끼리 부르는 이름. 사용자에게 보이지 않는다. */
  name: string;
  /**
   * 노출 시작·끝(KST, `YYYY-MM-DDTHH:mm:ss`). `null` 이면 그쪽 끝이 열려 있다 — 시작이 없으면 켜는 즉시,
   * 끝이 없으면 끌 때까지 보인다. 시작은 그 시각부터, 끝은 그 시각 전까지다.
   */
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
  /** 자리 안 순서. 1부터, 작은 것이 먼저다. */
  displayOrder: number;
  /**
   * 어느 기업이 맡긴 배너인지(`./advertisers.ts`). `showAdLabel` 이 켜진 배너(돈을 받고 싣는 배너)는 반드시 있고,
   * 오공고 자체 홍보 배너는 `null` 이어도 된다.
   */
  advertiserId: number | null;
  /** 표에 보일 광고주 요약. 서버가 `advertiserId` 로 읽어 싣는다. 없으면 `null` 이다. */
  advertiser: AdvertiserSummary | null;
  /** 이어 둔 광고 계약(`./ad-contracts.ts`). 같은 광고주의 계약이어야 한다. 없으면 `null` 이다. */
  contractId: number | null;
  /** 표와 기간 밖 경고에 쓸 계약 요약. 서버가 `contractId` 로 읽어 싣는다. */
  contract: AdContractSummary | null;
  createdAt: string;
  updatedAt: string;
}

/** 등록(`POST`)과 수정(`PATCH`) 본문. 수정은 보낸 칸만 바뀐다. 자리 안 순서는 따로 바꾼다. */
export interface AdminBannerRequest {
  placement: BannerPlacement;
  name: string;
  pcImageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string;
  openInNewTab: boolean;
  altText: string;
  showAdLabel: boolean;
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
  /** 광고주. `showAdLabel` 이 참이면 필수, 아니면 `null` 을 보낼 수 있다. */
  advertiserId: number | null;
  /** 광고 계약. 고른 광고주의 계약만 받는다. `null` 이면 잇지 않는다. */
  contractId: number | null;
}

/** 자리 안 순서 바꾸기(`PUT /api/v1/admin/banners/order`). 그 자리의 배너 id 를 빠짐없이 새 순서대로 보낸다. */
export interface ReplaceAdminBannerOrderRequest {
  placement: BannerPlacement;
  bannerIds: number[];
}

export const ADMIN_BANNERS_PATH = '/api/v1/admin/banners';
