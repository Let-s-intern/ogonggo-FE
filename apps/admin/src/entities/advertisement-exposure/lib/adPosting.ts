import type { AdminJobSummaryResponseJobField } from '@ogonggo/api/src/admin';
import type {
  AdPostingPosition,
  AdminAdPostingExposureResponse,
} from '@ogonggo/api/src/mocks/admin/advertisementPostings';
import type { AdvertisementExposure } from '../api/useAdvertisementExposures';

/**
 * 광고 공고(카드) 자리(PRD `prd-business-report.md` 6.8, D12). BE(Push 5) 코드젠 전이라 자리 enum 과 라벨을 여기 둔다.
 * 코드젠 뒤에는 `enumLabel('AdvertisementProductPosition', ...)` 로 바꾼다.
 */
export type { AdPostingPosition };

export const AD_POSTING_POSITIONS: readonly AdPostingPosition[] = [
  'JOB_PICK',
  'JOB_LIST',
  'JOB_DETAIL_SIDE',
  'CALENDAR_DAY',
  'MYPAGE_SCRAP',
];

export const AD_POSTING_POSITION_LABELS: Record<AdPostingPosition, string> = {
  JOB_PICK: '오공고 PICK',
  JOB_LIST: '채용공고 목록',
  JOB_DETAIL_SIDE: '공고 상세 추천',
  CALENDAR_DAY: '공고 달력 날짜별',
  MYPAGE_SCRAP: '마이페이지 스크랩',
};

export const AD_POSTING_POSITION_DESCRIPTIONS: Record<AdPostingPosition, string> = {
  JOB_PICK:
    '홈 히어로 "오늘의 추천 공고" 의 오공고 PICK 탭 맨 앞 칸. 탭의 카드 수는 그대로이고, 같은 공고는 PICK 목록에서 빠집니다.',
  JOB_LIST:
    '채용공고 목록 첫 페이지 맨 앞 칸. 일반 카드와 같은 모양에 광고 표시가 붙고, 많아야 3칸입니다.',
  JOB_DETAIL_SIDE:
    '공고 상세 오른쪽 추천 카드. 지금 보는 공고는 빠지고, 좁은 화면에서는 본문 아래로 내려갑니다.',
  CALENDAR_DAY: '공고 달력의 날짜별 목록 맨 앞 칸입니다.',
  MYPAGE_SCRAP: '마이페이지 지원 관리의 채용공고 스크랩 칸 맨 앞입니다.',
};

/** 현재 판매 중인 광고 공고 자리는 모두 채용공고만 받는다(LC-3649). */
export const AD_POSTING_FIXED_TARGET: Record<AdPostingPosition, 'JOB'> = {
  JOB_PICK: 'JOB',
  JOB_LIST: 'JOB',
  JOB_DETAIL_SIDE: 'JOB',
  CALENDAR_DAY: 'JOB',
  MYPAGE_SCRAP: 'JOB',
};

export const isAdPostingPosition = (value: unknown): value is AdPostingPosition =>
  AD_POSTING_POSITIONS.includes(value as AdPostingPosition);

/** 코드젠 전 생성 타입에는 대상 칸이 없다. 없으면 null 이다. */
export type AdPostingExposure = AdvertisementExposure &
  { jobField?: AdminJobSummaryResponseJobField | null } &
  Partial<
    Pick<AdminAdPostingExposureResponse, 'targetTitle' | 'targetCompanyName' | 'targetPublished'>
  >;
