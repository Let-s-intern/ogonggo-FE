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

/** 판매 상품 차례(계약 8절). 광고 공고 세팅 탭과 상품 자리 고르기가 이 차례다. */
export const AD_POSTING_POSITIONS: readonly AdPostingPosition[] = [
  'JOB_PICK',
  'JOB_LIST',
  'CALENDAR_DAY',
  'MYPAGE_SCRAP',
];

export const AD_POSTING_POSITION_LABELS: Record<AdPostingPosition, string> = {
  JOB_PICK: '오공고 PICK',
  JOB_LIST: '리스트 상단 고정',
  CALENDAR_DAY: '공고 달력',
  MYPAGE_SCRAP: '마이페이지 스크랩',
};

export const AD_POSTING_POSITION_DESCRIPTIONS: Record<AdPostingPosition, string> = {
  JOB_PICK:
    '홈 히어로 "오늘의 추천 공고" 의 오공고 PICK 탭 맨 앞 칸. 탭의 카드 수는 그대로이고, 같은 공고는 PICK 목록에서 빠집니다.',
  JOB_LIST:
    '채용공고 목록의 직무 탭 1페이지 맨 위 칸. 직무당 한 칸이고 직렬 필터와 상관없이 붙습니다. 전체 탭과 2페이지부터는 없습니다.',
  CALENDAR_DAY:
    '공고 달력에서 고른 날짜의 공고 목록 맨 앞 칸. 노출 기간 안의 날짜면 날마다 붙습니다.',
  MYPAGE_SCRAP:
    '마이페이지 지원 관리 보드(PC 보드 보기)의 채용공고 스크랩 칸 맨 앞 칸. 모바일 리스트 보기에는 없습니다.',
};

/** 광고 공고 자리는 모두 채용공고만 걸 수 있다(계약 8절). */
export const AD_POSTING_FIXED_TARGET: Record<AdPostingPosition, 'JOB' | 'BOOTCAMP' | undefined> = {
  JOB_PICK: 'JOB',
  JOB_LIST: 'JOB',
  CALENDAR_DAY: 'JOB',
  MYPAGE_SCRAP: 'JOB',
};

export const isAdPostingPosition = (value: unknown): value is AdPostingPosition =>
  AD_POSTING_POSITIONS.includes(value as AdPostingPosition);

/** 코드젠 전 생성 타입에는 대상 칸이 없다. 없으면 null 이다. */
export type AdPostingExposure = AdvertisementExposure &
  Partial<
    Pick<AdminAdPostingExposureResponse, 'targetTitle' | 'targetCompanyName' | 'targetPublished'>
  >;
