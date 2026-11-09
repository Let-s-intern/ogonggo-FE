import type { AdminAdvertisementContractSummaryResponseStatus } from '@ogonggo/api/src/admin';

/** 계약 상태 배지 색. 신청은 새로 온 것이라 눈에 띄게, 반려는 끝난 것이라 회색이다. */
export const CONTRACT_STATUS_TONE: Record<
  AdminAdvertisementContractSummaryResponseStatus,
  'main' | 'urgent' | 'success' | 'neutral'
> = {
  REQUESTED: 'urgent',
  NEGOTIATING: 'main',
  APPROVED: 'success',
  REJECTED: 'neutral',
};

/** 협의 금액. 없으면(`undefined`·`null`) 아직 정하지 않은 것이고 0 은 0원이다. */
export function formatPaymentAmount(amount: number | null | undefined): string {
  return amount == null ? '미정' : `${amount.toLocaleString('ko-KR')}원`;
}
