/** `LetsCareerGuidebookPrice` 와 같은 모양. 단위 테스트가 `@/` 별칭을 풀지 못해 여기서 모양만 적는다. */
interface PriceInput {
  originalPrice: number;
  discountRate: number;
  finalPrice: number;
}

export interface PriceView {
  /** 보이는 결제 금액. 0원이면 `무료`. */
  final: string;
  /** 할인 중일 때만 정가와 할인율. 없으면 `null`. */
  discount: { original: string; rate: number } | null;
}

const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

/**
 * 가격 한 줄에 보일 값. 결제 금액은 `finalPrice` 이고, 정가가 그보다 크고 할인율이 있을 때만 정가와 할인율을 더한다.
 */
export function priceView({ originalPrice, discountRate, finalPrice }: PriceInput): PriceView {
  const discounted = discountRate > 0 && originalPrice > finalPrice;
  return {
    final: finalPrice === 0 ? '무료' : won(finalPrice),
    discount: discounted ? { original: won(originalPrice), rate: discountRate } : null,
  };
}
