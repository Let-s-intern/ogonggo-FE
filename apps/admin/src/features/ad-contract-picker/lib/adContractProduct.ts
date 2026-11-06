import type { AdContractProduct, AdContractSummary } from '@ogonggo/api/src/ad-contracts';
import type { AdPostingPlacement } from '@ogonggo/api/src/ad-postings';
import type { BannerPlacement } from '@ogonggo/api/src/banners';
import { AD_PLACEMENT_LABELS } from '@/entities/ad-posting/lib/adPosting';
import { PLACEMENT_LABELS, formatKst } from '@/entities/banner/lib/banner';

/** 상품 이름. 배너와 광고 공고에 같은 자리 이름(`공고 상세`)이 있어 종류를 붙인다. */
export function adContractProductLabel(product: AdContractProduct): string {
  if (product.startsWith('BANNER_')) {
    return `배너 ${PLACEMENT_LABELS[product.slice('BANNER_'.length) as BannerPlacement]}`;
  }
  return `광고 공고 ${AD_PLACEMENT_LABELS[product.slice('AD_POSTING_'.length) as AdPostingPlacement]}`;
}

export const bannerProduct = (placement: BannerPlacement): AdContractProduct =>
  `BANNER_${placement}`;
export const adPostingProduct = (placement: AdPostingPlacement): AdContractProduct =>
  `AD_POSTING_${placement}`;

/** `2026.11.01 00:00 ~ 2026.12.01 00:00`. */
export function formatContractPeriod(contract: AdContractSummary): string {
  return `${formatKst(contract.startAt)} ~ ${formatKst(contract.endAt)}`;
}
