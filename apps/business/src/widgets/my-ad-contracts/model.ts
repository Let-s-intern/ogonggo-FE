import { enumLabel, type MyAdvertisementContractSummaryResponseStatus } from '@ogonggo/api';
import type { BadgeProps } from '@ogonggo/ui';
import type { StageStep } from '@/shared/ui/StageTrack';

/** 내 광고 신청 목록 주소. 헤더 `신청 내역` 과 마이페이지 메뉴가 여기로 간다. */
export const MY_AD_CONTRACTS_HREF = '/mypage/company/ads';

export const myAdContractHref = (id: number) => `${MY_AD_CONTRACTS_HREF}/${id}`;

/** 한 페이지 건수. 마이페이지 공고 목록과 같다. */
export const PAGE_SIZE = 10;

type Status = MyAdvertisementContractSummaryResponseStatus;

/** 상태 배지 색. 라벨은 enum 카탈로그(`AdvertisementContractStatus`)에서 읽는다. */
const STATUS_TONE: Record<Status, BadgeProps['tone']> = {
  REQUESTED: 'main',
  NEGOTIATING: 'urgent',
  APPROVED: 'success',
  REJECTED: 'danger',
};

/**
 * 카드의 `신청 → 협의 → 승인` 칸. 공고 카드(`widgets/company-posts/ui/CompanyPostStageTrack.tsx`)처럼 반려되면
 * 가운데 칸이 `반려` 로 바뀐다 — 반려는 모든 신청이 거치는 칸이 아니어서 따로 두지 않았다.
 */
export const STATUS_STEPS: Record<Status, readonly StageStep[]> = {
  REQUESTED: [
    { label: '신청', state: 'current' },
    { label: '협의', state: 'todo' },
    { label: '승인', state: 'todo' },
  ],
  NEGOTIATING: [
    { label: '신청', state: 'done' },
    { label: '협의 중', state: 'current' },
    { label: '승인', state: 'todo' },
  ],
  APPROVED: [
    { label: '신청', state: 'done' },
    { label: '협의', state: 'done' },
    { label: '승인', state: 'ended' },
  ],
  REJECTED: [
    { label: '신청', state: 'done' },
    { label: '반려', state: 'rejected' },
    { label: '승인', state: 'todo' },
  ],
};

/** 상태별 안내 한 줄과 카드 색. */
export const STATUS_HINTS: Record<Status, { text: string; className: string }> = {
  REQUESTED: { text: '담당자가 신청 내용을 확인하고 있어요.', className: 'text-gray-500' },
  NEGOTIATING: { text: '담당자와 상품·일정·금액을 협의하고 있어요.', className: 'text-gray-500' },
  APPROVED: { text: '광고 집행이 확정됐어요.', className: 'text-blue-600' },
  REJECTED: {
    text: '신청이 반려됐어요. 자세한 내용은 담당자에게 문의해 주세요.',
    className: 'text-error',
  },
};

export const STATUS_CARD_CLASSES: Record<Status, string> = {
  REQUESTED: 'border-gray-200 bg-white',
  NEGOTIATING: 'border-gray-200 bg-white',
  APPROVED: 'border-gray-200 bg-white',
  REJECTED: 'border-red-200 bg-red-50/40',
};

export function statusBadge(status: MyAdvertisementContractSummaryResponseStatus) {
  return { label: enumLabel('AdvertisementContractStatus', status), tone: STATUS_TONE[status] };
}

/** 협의 금액. 아직 정하지 않았으면 `협의 전` 이다. */
export function formatPaymentAmount(amount: number | null | undefined): string {
  return amount == null ? '협의 전' : `${amount.toLocaleString('ko-KR')}원`;
}

/** 주소의 `?page=`. 1보다 작거나 숫자가 아니면 1이다. */
export function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
