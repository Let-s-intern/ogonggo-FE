import type { LetsCareerGuidebookPrice } from '@/shared/api/letsCareerGuidebook';
import { priceView } from '../lib/price';

/** 가격 한 줄. 할인 중이면 정가를 줄 긋고 할인율을 붙인다. 0원이면 `무료`다. */
export function PriceLine({ price }: { price: LetsCareerGuidebookPrice }) {
  const { final, discount } = priceView(price);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      {discount ? <span className="text-lg font-bold text-blue-500">{discount.rate}%</span> : null}
      <span className="text-2xl font-bold text-gray-950">{final}</span>
      {discount ? (
        <span className="text-sm text-gray-400 line-through">{discount.original}</span>
      ) : null}
    </div>
  );
}
