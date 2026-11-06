import type { AdvertiserSource } from '@ogonggo/api/src/advertisers';

/** 광고주가 들어온 길. 광고주별 광고 목록·상세가 쓴다. */
export const ADVERTISER_SOURCE_LABELS: Record<AdvertiserSource, string> = {
  COMPANY_MEMBER: '비즈니스 회원',
  AD_INQUIRY: '광고 문의',
  MANUAL: '직접 추가',
};

export const ADVERTISER_TYPE_OPTIONS = [
  { value: '', label: '회원·비회원 전체' },
  { value: 'MEMBER', label: '회원' },
  { value: 'NON_MEMBER', label: '비회원' },
];
