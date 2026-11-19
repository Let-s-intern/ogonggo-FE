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
  'BOOTCAMP_LIST',
  'JOB_DETAIL_SIDE',
];

export const AD_POSTING_POSITION_LABELS: Record<AdPostingPosition, string> = {
  JOB_PICK: '오공고 PICK',
  JOB_LIST: '채용공고 목록',
  BOOTCAMP_LIST: '부트캠프 목록',
  JOB_DETAIL_SIDE: '공고 상세 추천',
};

export const AD_POSTING_POSITION_DESCRIPTIONS: Record<AdPostingPosition, string> = {
  JOB_PICK:
    '홈 히어로 "오늘의 추천 공고" 의 오공고 PICK 탭 맨 앞 칸. 탭의 카드 수는 그대로이고, 같은 공고는 PICK 목록에서 빠집니다.',
  JOB_LIST:
    '채용공고 목록 첫 페이지 맨 앞 칸. 일반 카드와 같은 모양에 광고 표시가 붙고, 많아야 3칸입니다.',
  BOOTCAMP_LIST:
    '부트캠프 목록 첫 페이지 맨 앞 칸. 일반 카드와 같은 모양에 광고 표시가 붙고, 많아야 3칸입니다.',
  JOB_DETAIL_SIDE:
    '공고 상세 오른쪽 추천 카드. 지금 보는 공고는 빠지고, 좁은 화면에서는 본문 아래로 내려갑니다.',
};

/** 목록 자리와 오공고 PICK 은 그 목록의 콘텐츠만 걸 수 있다(PICK 은 채용공고만, 계약 7절). 상세 추천은 둘 다 된다. */
export const AD_POSTING_FIXED_TARGET: Record<AdPostingPosition, 'JOB' | 'BOOTCAMP' | undefined> = {
  JOB_PICK: 'JOB',
  JOB_LIST: 'JOB',
  BOOTCAMP_LIST: 'BOOTCAMP',
  JOB_DETAIL_SIDE: undefined,
};

export const isAdPostingPosition = (value: unknown): value is AdPostingPosition =>
  AD_POSTING_POSITIONS.includes(value as AdPostingPosition);

/** 코드젠 전 생성 타입에는 대상 칸이 없다. 없으면 null 이다. */
export type AdPostingExposure = AdvertisementExposure &
  Partial<
    Pick<AdminAdPostingExposureResponse, 'targetTitle' | 'targetCompanyName' | 'targetPublished'>
  >;
