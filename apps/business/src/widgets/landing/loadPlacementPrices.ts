import {
  listPublicAdvertisementProducts,
  type SuccessResponsePageResponseAdvertisementProductResponse,
} from '@ogonggo/api';
import type { PlacementPrices } from './price';

/** 어드민에서 바꾼 가격이 소개 화면에 보이기까지 걸리는 시간(초). */
export const PLACEMENT_PRICE_REVALIDATE = 300;

/**
 * 광고 상품의 자리별 소개 가격을 서버에서 읽는다. 한 자리에 상품이 여럿이면 id 가 가장 큰 상품의 가격을 쓴다.
 * API 가 실패하면 빈 값을 돌려주고, 그러면 모든 칸이 견적 문의로 보인다. 코드에 박은 가격으로 되돌아가지 않는다.
 */
export async function loadPlacementPrices(): Promise<PlacementPrices> {
  try {
    // 생성 타입은 `{ data, status }` 로 한 겹 더 싸여 있지만 `httpClient` 는 응답 본문을 그대로 준다.
    const body = (await listPublicAdvertisementProducts(
      { size: 50 },
      { next: { revalidate: PLACEMENT_PRICE_REVALIDATE } },
    )) as unknown as SuccessResponsePageResponseAdvertisementProductResponse;
    const latestId = new Map<string, number>();
    const prices: PlacementPrices = {};
    for (const product of body.data?.items ?? []) {
      const { position } = product;
      if (!position || product.id <= (latestId.get(position) ?? -1)) continue;
      latestId.set(position, product.id);
      prices[position] = product.price ?? null;
    }
    return prices;
  } catch (error) {
    console.error('[ogonggo] 광고 상품 가격을 읽지 못했습니다. 견적 문의로 보입니다.', error);
    return {};
  }
}
