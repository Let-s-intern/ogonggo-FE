import { Button } from '@ogonggo/ui';

/**
 * `home.png` 하단 "FOR BUSINESS" CTA 배너. 홈 화면 하단에 쓰고, Push 5에서 상세 페이지에도
 * 재사용한다(PRD 10절). 두 버튼 모두 대상 화면이 없어 `Button`을 `Link`로 감싸지 않아 클릭해도
 * 아무 일도 일어나지 않는다.
 */
export function ForBusinessBanner() {
  return (
    <section className="rounded-lg bg-blue-50 px-8 py-8">
      <p className="text-xs font-semibold text-blue-600">FOR BUSINESS</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">기업·교육기관 담당자라면?</h2>
          <p className="mt-1 text-sm text-gray-500">
            월 8만 취준생에게 공고를 직접 등록하고, 배너 광고로 더 크게 알려보세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button>무료로 공고 등록하기</Button>
          <Button variant="secondary">광고 상품 문의하기</Button>
        </div>
      </div>
    </section>
  );
}
