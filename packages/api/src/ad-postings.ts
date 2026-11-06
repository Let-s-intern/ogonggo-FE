import type { AdvertiserSummary } from './advertisers';
import type { UserBootcampSummaryResponse } from './generated/user/models/userBootcampSummaryResponse';
import type { UserJobSummaryResponse } from './generated/user/models/userJobSummaryResponse';

/**
 * 광고 공고(이슈 #573)의 요청·응답 타입과 주소. 운영자가 자리마다 고른 채용공고·부트캠프를 그 자리 목록 맨 앞에
 * 같은 카드 모양으로 싣는다.
 *
 * 백엔드 API 가 아직 없어 손으로 적었다. 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 이고,
 * 목(`./mocks/handlers.ts` 의 공개 조회, `./mocks/admin/ad-postings.ts`)이 이 모양 그대로 응답한다.
 * 백엔드 배포 뒤 코드젠으로 바꾼다 — 그때 이 파일을 지우고 생성 타입으로 옮긴다.
 */

/**
 * 광고 공고 자리.
 *
 * | 자리 | 화면 | 대상 |
 * |---|---|---|
 * | `JOB_LIST` | 채용공고 홈 `전체 공고` 카드 목록(1쪽) | 채용공고 |
 * | `JOB_PICK` | 홈 `오늘의 추천 공고` 첫 탭(오공고 PICK) | 채용공고 |
 * | `BOOTCAMP_LIST` | 교육·부트캠프 카드 목록(1쪽) | 부트캠프 |
 * | `JOB_DETAIL_SIDE` | 공고 상세 사이드바 `비슷한 공고` 목록 | 채용공고 |
 * | `CALENDAR` | 공고 달력 날짜별 목록 | 채용공고 |
 * | `MYPAGE_SCRAP` | 마이페이지 지원 보드 채용공고 `스크랩` 칸 | 채용공고 |
 */
export type AdPostingPlacement =
  | 'JOB_LIST'
  | 'JOB_PICK'
  | 'BOOTCAMP_LIST'
  | 'JOB_DETAIL_SIDE'
  | 'CALENDAR'
  | 'MYPAGE_SCRAP';

export const AD_POSTING_PLACEMENTS: readonly AdPostingPlacement[] = [
  'JOB_LIST',
  'JOB_PICK',
  'BOOTCAMP_LIST',
  'JOB_DETAIL_SIDE',
  'CALENDAR',
  'MYPAGE_SCRAP',
];

/** 광고 대상의 종류. 자리가 정한다 — `BOOTCAMP_LIST` 만 부트캠프이고 나머지는 채용공고다. */
export type AdPostingTargetType = 'JOB' | 'BOOTCAMP';

export function adPostingTargetType(placement: AdPostingPlacement): AdPostingTargetType {
  return placement === 'BOOTCAMP_LIST' ? 'BOOTCAMP' : 'JOB';
}

/**
 * 공개 조회(`GET /api/v1/ad-postings?placement=`) 한 건. 지금 노출 중인 것(켜짐, 기간 안, 대상이 공개·모집 중)만
 * 자리 안 순서대로 온다. 카드를 그릴 대상 요약을 함께 실어 웹이 따로 부르지 않는다.
 */
export interface PublicAdPostingResponse {
  /** 광고 id. 공고 id 가 아니다. 클릭 이벤트의 `ad_campaign_id` 로 쓴다. */
  id: number;
  placement: AdPostingPlacement;
  targetType: AdPostingTargetType;
  /** `targetType` 이 `JOB` 이면 있다. 목록 API(`GET /api/v1/jobs`)의 항목과 같은 모양이다. */
  job?: UserJobSummaryResponse;
  /** `targetType` 이 `BOOTCAMP` 이면 있다. 목록 API(`GET /api/v1/bootcamps`)의 항목과 같은 모양이다. */
  bootcamp?: UserBootcampSummaryResponse;
}

export interface PublicAdPostingListResponse {
  status: number;
  message: string;
  data?: PublicAdPostingResponse[];
}

export const getListAdPostingsUrl = (placement: AdPostingPlacement) =>
  `/api/v1/ad-postings?placement=${placement}`;

/** 어드민 목록·상세 한 건. */
export interface AdminAdPostingResponse {
  id: number;
  placement: AdPostingPlacement;
  targetType: AdPostingTargetType;
  /** 공고 id 또는 부트캠프 id. */
  targetId: number;
  /** 표에 보일 대상 제목·회사. 서버가 대상에서 읽어 싣는다. 대상이 지워졌으면 빈 문자열이다. */
  targetTitle: string;
  targetCompanyName: string;
  /** 대상이 지금 사용자 화면에 나갈 수 있는가(공개이고 모집 중). 아니면 켜 두어도 나가지 않는다. */
  targetAvailable: boolean;
  /**
   * 노출 시작·끝(KST, `YYYY-MM-DDTHH:mm:ss`). `null` 이면 그쪽 끝이 열려 있다. 시작은 포함, 끝은 미포함이다.
   * 배너(`./banners.ts`)와 같은 규칙이다.
   */
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
  /** 자리 안 순서이자 목록의 칸 번호. 1이면 그 목록의 첫 칸이다. */
  displayOrder: number;
  /** 어느 기업이 맡긴 광고인지(`./advertisers.ts`). 광고 공고는 늘 있다. */
  advertiserId: number;
  /** 표에 보일 광고주 요약. 서버가 `advertiserId` 로 읽어 싣는다. 광고주가 지워졌으면 `null` 이다. */
  advertiser: AdvertiserSummary | null;
  createdAt: string;
  updatedAt: string;
}

/** 등록 본문. 대상 종류는 자리가 정해 보내지 않는다. 그 자리 맨 뒤에 붙는다. */
export interface CreateAdminAdPostingRequest {
  placement: AdPostingPlacement;
  targetId: number;
  advertiserId: number;
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
}

/** 수정 본문(`PATCH`). 보낸 칸만 바뀐다. 자리와 대상은 바꾸지 않는다 — 바꾸려면 지우고 새로 등록한다. */
export interface UpdateAdminAdPostingRequest {
  advertiserId?: number;
  startAt?: string | null;
  endAt?: string | null;
  enabled?: boolean;
}

/** 자리 안 순서 바꾸기(`PUT /api/v1/admin/ad-postings/order`). 그 자리의 광고 id 를 빠짐없이 새 순서대로 보낸다. */
export interface ReplaceAdminAdPostingOrderRequest {
  placement: AdPostingPlacement;
  adPostingIds: number[];
}

export const ADMIN_AD_POSTINGS_PATH = '/api/v1/admin/ad-postings';
