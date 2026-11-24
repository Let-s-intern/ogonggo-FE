import type { AdvertisementProductResponsePosition } from '@ogonggo/api';

/** 상품이 놓이는 오공고 화면 자리(공개 상품 API 의 `position`). */
export type PlacementPosition = NonNullable<AdvertisementProductResponsePosition>;

/** 자리별 소개 가격. 값이 `null` 이거나 자리가 없으면 견적 문의다. */
export type PlacementPrices = Partial<Record<PlacementPosition, number | null>>;

/** 소개 가격 문구. `null` 은 견적 문의, 0 은 무료, 그 밖은 금액이다(어드민 `formatProductPrice` 와 같은 규칙). */
export function formatPlacementPrice(price: number | null | undefined): string {
  if (price == null) return '견적 문의';
  if (price === 0) return '무료';
  return `${price.toLocaleString('ko-KR')}원 / 1주`;
}
