/**
 * `LetsCareerGuidebookPrice` 와 같은 모양. 단위 테스트가 `@/` 별칭을 풀지 못해 여기서 모양만 적는다.
 * 판매 상세의 `priceView`(`widgets/industry-report-sale/lib/price.ts`)와 같은 규칙이다 — 위젯끼리 import 하지 않으려고
 * 이 위젯 안에 따로 두었다. 두 곳이 어긋나면 상세가 보이는 가격과 랜딩이 보이는 가격이 달라진다.
 */
interface PriceInput {
  originalPrice: number;
  discountRate: number;
  finalPrice: number;
}

export interface LandingPrice {
  /** 결제 금액. 0원이면 `무료`. */
  final: string;
  /** 할인 중일 때만 정가. 없으면 `null`. */
  original: string | null;
}

const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

/** 카드 한 장에 보일 가격. 가격을 읽지 못했으면 `null` 이고 화면은 가격 줄만 뺀다. */
export function landingPrice(price: PriceInput | null): LandingPrice | null {
  if (!price) {
    return null;
  }
  const discounted = price.discountRate > 0 && price.originalPrice > price.finalPrice;
  return {
    final: price.finalPrice === 0 ? '무료' : won(price.finalPrice),
    original: discounted ? won(price.originalPrice) : null,
  };
}

/**
 * 산업 다섯의 가격이 모두 같을 때만 그 결제 금액을 준다. 하나라도 읽지 못했거나 다르면 `null` — 히어로의
 * `산업별 한 편 990원` 같은 문구를 지어낼 근거가 없다.
 */
export function commonFinalPrice(prices: readonly (PriceInput | null)[]): string | null {
  const first = prices[0];
  if (!first || prices.some((price) => price === null || price.finalPrice !== first.finalPrice)) {
    return null;
  }
  return landingPrice(first)?.final ?? null;
}
