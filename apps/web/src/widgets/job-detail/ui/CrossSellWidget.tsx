const CROSS_SELL_ITEMS = [
  { eyebrow: '취업 일단 시작!', title: '취준 기필코 시작 챌린지 8기' },
  { eyebrow: '만능 답변으로 진짜 나를 드러내는', title: '자기소개서 2주 완성 챌린지 8기' },
  { eyebrow: '경험을 200% 활용하여 제작하는', title: '포트폴리오 2주 완성 챌린지 22기' },
] as const;

/**
 * "함께 보면 좋아요" — 채용공고 데이터가 아니라 렛츠커리어의 다른 상품(챌린지) 광고라 공고별로
 * 달라질 이유가 없다. API를 호출하지 않고 목업 텍스트 그대로 완전히 하드코딩한다(PRD 10절).
 */
export function CrossSellWidget() {
  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">함께 보면 좋아요</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {CROSS_SELL_ITEMS.map((item) => (
          <li key={item.title} className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-md bg-gray-100" />
            <div className="min-w-0">
              <p className="truncate text-xs text-gray-500">{item.eyebrow}</p>
              <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
