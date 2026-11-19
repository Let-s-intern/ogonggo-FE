import { httpClient } from '@ogonggo/api';
import type {
  UserBootcampSummaryResponse,
  UserJobSummaryResponse,
  UserJobSummaryResponseJobField,
} from '@ogonggo/api';
import { isAdsEnabled } from '@/shared/config/ads';
import type { AdSlot } from './adPosting';

/**
 * 광고 공고 자리(PRD 6.8, D12). 백엔드 `AdvertisementProductPosition` 에 더해지는 값이다. `JOB_PICK` 은 홈 히어로
 * `오공고 PICK` 탭, `CALENDAR_DAY` 는 공고 달력 날짜별 목록, `MYPAGE_SCRAP` 은 마이페이지 지원 관리 보드의 채용공고
 * 스크랩 칸, `JOB_DETAIL_SIDE` 는 공고 상세 옆 추천, `BOOTCAMP_LIST` 는 부트캠프 목록 상단 고정(대상은 부트캠프)이다
 * (계약 7·8절, 2026-11-19 사용자 결정).
 */
export type AdPostingPosition =
  | 'JOB_LIST'
  | 'JOB_PICK'
  | 'JOB_DETAIL_SIDE'
  | 'CALENDAR_DAY'
  | 'MYPAGE_SCRAP'
  | 'BOOTCAMP_LIST';

/**
 * 광고 공고 한 칸. `targetType` 이 `JOB` 이면 `job`, `BOOTCAMP` 면 `bootcamp` 가 찬다. 응답 모양은
 * `.claude/tasks/memos/광고-리포트-API-계약-2026-11-19.md` 2절이고, 백엔드 배포 뒤 코드젠 타입으로 바꾼다(Push 6 의 11.1).
 */
export interface AdPostingResponse {
  exposureId: number;
  position: AdPostingPosition;
  displayOrder: number;
  targetType: 'JOB' | 'BOOTCAMP';
  /** 카드에 `AD` 표시를 붙일지(계약 7절). */
  adLabel: boolean;
  /** `JOB_LIST` 노출의 직무(계약 8절). `전체` 탭 노출과 다른 자리는 null 이다(계약 10절). */
  jobField?: UserJobSummaryResponseJobField | null;
  /**
   * 노출 기간(KST, 오프셋 없음). 계약 2·8절에는 없는 칸이라 백엔드에 더해 달라고 했다. 공고 달력이 고른 날짜가 기간
   * 안인지 가르는 데 쓴다. 오지 않으면 그쪽 끝이 열린 것으로 본다 — 지금 노출 중인 광고가 모든 날짜에 보인다.
   */
  startAt?: string | null;
  endAt?: string | null;
  /** 오공고 PICK(`JOB_PICK`) 노출의 추천 문구(계약 9절). 운영자 PICK 카드와 같은 상자에 보인다. 다른 자리는 null 이다. */
  recommendationTitle?: string | null;
  recommendationDescription?: string | null;
  job: UserJobSummaryResponse | null;
  bootcamp: UserBootcampSummaryResponse | null;
}

/** 자리 하나에 보이는 최대 칸 수(D13). */
export const MAX_AD_POSTINGS = 3;

/** 이 시간 안에 응답이 없으면 광고 없이 그린다. 목록이 광고를 기다리지 않게 한다(`fetchBanners` 와 같다). */
const TIMEOUT_MS = 3000;

/**
 * 자리 하나의 지금 노출 중인 광고 공고(`GET /api/v1/advertisement-exposures/postings?position=`). 서버가 정한 순서
 * 그대로다. 광고를 끈 배포(`shared/config/ads.ts`)에서는 부르지 않고, 실패하면 빈 목록이다 — 광고 때문에 목록이
 * 오류 화면이 되면 안 된다.
 *
 * `JOB_LIST` 는 직무(`jobField`)를 주면 그 직무 탭의 광고, 빼면 `전체` 탭의 광고(직무가 없는 노출)만 온다(계약 10절).
 */
export async function fetchAdPostings(
  position: AdPostingPosition,
  jobField?: UserJobSummaryResponseJobField,
): Promise<AdPostingResponse[]> {
  if (!isAdsEnabled) {
    return [];
  }
  const params = new URLSearchParams({ position });
  if (jobField) {
    params.set('jobField', jobField);
  }
  try {
    const response = await httpClient<{ data?: AdPostingResponse[] }>(
      `/api/v1/advertisement-exposures/postings?${params.toString()}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    return response.data ?? [];
  } catch (error) {
    console.error(
      `[ad-postings] ${params.toString()} 광고 공고를 받지 못해 자리를 비웁니다.`,
      error,
    );
    return [];
  }
}

/** 카드에 넘기는 광고 값. 칸 번호는 자리 안 순서(1부터)다. */
export function toAdSlot(posting: AdPostingResponse, position: number): AdSlot {
  return {
    adId: posting.exposureId,
    placement: posting.position,
    position,
    adLabel: posting.adLabel === true,
  };
}
