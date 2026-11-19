import {
  enumLabel,
  type CreateAdminAdvertisementExposureRequestJobField,
} from '@ogonggo/api/src/admin';
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

/**
 * 판매 상품 차례(계약 8절, 공고 상세 옆은 2026-11-19 사용자 결정으로 남김). 부트캠프 상세 옆·마이페이지 스크랩 부트캠프 칸은
 * 계약 11절(BE LC-3652)이다. 광고 공고 세팅 탭이 이 차례다.
 */
export const AD_POSTING_POSITIONS: readonly AdPostingPosition[] = [
  'JOB_PICK',
  'JOB_LIST',
  'JOB_DETAIL_SIDE',
  'CALENDAR_DAY',
  'MYPAGE_SCRAP',
  'BOOTCAMP_LIST',
  'BOOTCAMP_DETAIL_SIDE',
  'BOOTCAMP_MYPAGE_SCRAP',
];

export const AD_POSTING_POSITION_LABELS: Record<AdPostingPosition, string> = {
  JOB_PICK: '오공고 PICK',
  JOB_LIST: '리스트 상단 고정',
  JOB_DETAIL_SIDE: '공고 상세 옆',
  CALENDAR_DAY: '공고 달력',
  MYPAGE_SCRAP: '마이페이지 스크랩',
  BOOTCAMP_LIST: '부트캠프 목록 상단 고정',
  BOOTCAMP_DETAIL_SIDE: '부트캠프 상세 옆',
  BOOTCAMP_MYPAGE_SCRAP: '마이페이지 스크랩 부트캠프',
};

export const AD_POSTING_POSITION_DESCRIPTIONS: Record<AdPostingPosition, string> = {
  JOB_PICK:
    '홈 히어로 "오늘의 추천 공고" 의 오공고 PICK 탭 맨 앞 칸. 탭의 카드 수는 그대로이고, 같은 공고는 PICK 목록에서 빠집니다.',
  JOB_LIST:
    '채용공고 목록의 전체 탭·직무 탭 1페이지 맨 위 칸. 탭당 한 칸이고 직렬 필터와 상관없이 붙습니다. 2페이지부터는 없습니다.',
  JOB_DETAIL_SIDE:
    '공고 상세 오른쪽 추천 카드. 개수 제한 없이 이 순서대로 쌓이고, 지금 보는 공고는 빠집니다. 좁은 화면에서는 본문 아래로 내려갑니다.',
  CALENDAR_DAY:
    '공고 달력에서 고른 날짜의 공고 목록 맨 앞 칸. 노출 기간 안의 날짜면 날마다 붙습니다.',
  MYPAGE_SCRAP:
    '마이페이지 지원 관리 보드(PC 보드 보기)의 채용공고 스크랩 칸 맨 앞 칸. 모바일 리스트 보기에는 없습니다.',
  BOOTCAMP_LIST:
    '부트캠프 목록 전체 탭 1페이지 맨 앞 칸. 일반 카드와 같은 모양에 광고 표시가 붙고, 많아야 3칸입니다. 대상은 부트캠프입니다.',
  BOOTCAMP_DETAIL_SIDE:
    '부트캠프 상세 오른쪽 사이드바 맨 위 카드. 개수 제한 없이 이 순서대로 쌓이고, 지금 보는 부트캠프는 빠집니다. 좁은 화면에서는 본문 아래로 내려갑니다. 대상은 부트캠프입니다.',
  BOOTCAMP_MYPAGE_SCRAP:
    '마이페이지 지원 관리 보드(PC 보드 보기)의 부트캠프 스크랩 칸 맨 앞 칸. 모바일 리스트 보기에는 없습니다. 대상은 부트캠프입니다.',
};

/** 광고 공고 자리는 채용공고만 걸 수 있다(계약 8절). 부트캠프 세 자리만 부트캠프다(계약 11절). */
export const AD_POSTING_FIXED_TARGET: Record<AdPostingPosition, 'JOB' | 'BOOTCAMP' | undefined> = {
  JOB_PICK: 'JOB',
  JOB_LIST: 'JOB',
  JOB_DETAIL_SIDE: 'JOB',
  CALENDAR_DAY: 'JOB',
  MYPAGE_SCRAP: 'JOB',
  BOOTCAMP_LIST: 'BOOTCAMP',
  BOOTCAMP_DETAIL_SIDE: 'BOOTCAMP',
  BOOTCAMP_MYPAGE_SCRAP: 'BOOTCAMP',
};

/**
 * 리스트 상단 고정(`JOB_LIST`) 노출의 직무(계약 8·10절). 비우면 `전체` 탭이다. 웹 채용공고 목록의 직무 칩 다섯 직군과 같은 값·차례다
 * (`apps/web/src/widgets/job-list/lib/roleChips.ts`). BE 는 직군 enum 전부를 받지만, 웹에 탭이 없는 직군에 걸면 어디에도
 * 보이지 않아 고르지 못하게 한다. 웹 칩이 바뀌면 여기도 바꾼다.
 */
export const AD_POSTING_JOB_FIELDS = [
  'MARKETING_ADVERTISING',
  'HR_GENERAL_AFFAIRS',
  'PLANNING_STRATEGY',
  'SALES',
  'IT_DEVELOPMENT',
] as const;

export const AD_POSTING_JOB_FIELD_OPTIONS = AD_POSTING_JOB_FIELDS.map((value) => ({
  value,
  label: enumLabel('JobField', value),
}));

/**
 * 리스트 상단 고정의 `전체` 탭을 고르는 값(계약 10절). 서버에는 `jobField` 를 비워 보낸다 — 이 값 자체는 보내지 않는다.
 * 고르기·거르기 칸에서 직무 값과 나란히 쓰려고 둔다.
 */
export const AD_POSTING_ALL_TAB = 'ALL';

/** 리스트 상단 고정의 탭 고르기. `전체` 가 맨 앞이고 직무가 뒤따른다. */
export const AD_POSTING_TAB_OPTIONS = [
  { value: AD_POSTING_ALL_TAB, label: '전체' },
  ...AD_POSTING_JOB_FIELD_OPTIONS,
];

/** 노출의 `jobField` 를 탭 값으로. null 이면 `전체` 탭이다. */
export const tabOf = (jobField: string | null | undefined) => jobField ?? AD_POSTING_ALL_TAB;

/** 탭 값을 요청의 `jobField` 로. `전체` 면 비운다. 값은 탭 고르기 목록에서만 나온다. */
export const jobFieldOfTab = (tab: string) =>
  tab === AD_POSTING_ALL_TAB ? undefined : (tab as CreateAdminAdvertisementExposureRequestJobField);

/** 추천 문구(제목·설명)가 필요한 자리. 운영자 PICK 과 같은 상자로 웹 카드에 나간다(계약 9절). */
export const needsRecommendation = (position: AdPostingPosition | null) => position === 'JOB_PICK';

/** 직무가 필요한 자리. */
export const needsJobField = (position: AdPostingPosition | null) => position === 'JOB_LIST';

/** 리스트 상단 고정 표·안내에 쓰는 탭 이름. 직무가 없으면 `전체` 탭이다(계약 10절). */
export const jobFieldLabel = (value: string | null | undefined) =>
  value ? enumLabel('JobField', value) : '전체';

export const isAdPostingPosition = (value: unknown): value is AdPostingPosition =>
  AD_POSTING_POSITIONS.includes(value as AdPostingPosition);

/** 코드젠 전 생성 타입에는 대상 칸이 없다. 없으면 null 이다. */
export type AdPostingExposure = AdvertisementExposure &
  Partial<
    Pick<
      AdminAdPostingExposureResponse,
      | 'targetTitle'
      | 'targetCompanyName'
      | 'targetPublished'
      | 'jobField'
      | 'recommendationTitle'
      | 'recommendationDescription'
    >
  >;
