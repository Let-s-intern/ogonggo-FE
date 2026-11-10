import { enumLabel, type MyAdvertisementContractSummaryResponseStatus } from '@ogonggo/api';
import type { BadgeProps } from '@ogonggo/ui';

/** 내 광고 신청 목록 주소. 헤더 `신청 내역` 과 마이페이지 메뉴가 여기로 간다. */
export const MY_AD_CONTRACTS_HREF = '/mypage/company/ads';

export const myAdContractHref = (id: number) => `${MY_AD_CONTRACTS_HREF}/${id}`;

/** 한 페이지 건수. 마이페이지 공고 목록과 같다. */
export const PAGE_SIZE = 10;

/** 상태 배지 색. 라벨은 enum 카탈로그(`AdvertisementContractStatus`)에서 읽는다. */
const STATUS_TONE: Record<MyAdvertisementContractSummaryResponseStatus, BadgeProps['tone']> = {
  REQUESTED: 'main',
  NEGOTIATING: 'urgent',
  APPROVED: 'success',
  REJECTED: 'danger',
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
