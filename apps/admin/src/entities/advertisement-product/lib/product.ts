import { enumLabel } from '@ogonggo/api/src/admin';
import {
  AD_POSTING_POSITION_LABELS,
  isAdPostingPosition,
} from '@/entities/advertisement-exposure/lib/adPosting';
import type { AdvertisementProduct } from '../api/useAdvertisementProducts';

/** 소개 가격. `null` 은 견적 문의이고 0원과 다르다. */
export function formatProductPrice(price: number | null | undefined): string {
  return price == null ? '견적 문의' : `${price.toLocaleString('ko-KR')}원`;
}

/** 자리 라벨. 광고 공고 자리는 코드젠 전이라 카탈로그에 없어 로컬 라벨을 쓴다. */
export function positionLabel(position: string): string {
  return isAdPostingPosition(position)
    ? AD_POSTING_POSITION_LABELS[position]
    : enumLabel('AdvertisementProductPosition', position);
}

/** 표와 고르기 목록에 쓰는 상품 이름. 자리가 있으면 자리도 붙인다. */
export function productLabel(product: AdvertisementProduct): string {
  const category = enumLabel('AdvertisementProductCategory', product.category);
  const position = product.position ? ` · ${positionLabel(product.position)}` : '';
  return `${product.name} (${category}${position})`;
}
