import { cn } from '@ogonggo/ui';

/** 자리만 채우는 회색 막대. 실제 요소의 line-height 를 높이로 쓴다. */
function Bar({ className }: { className: string }) {
  return <div className={cn('rounded bg-gray-200', className)} />;
}

/**
 * `loading.tsx` 는 같은 세그먼트의 `page.tsx` 를 Suspense 경계로 감싸 데이터가 오기 전까지 이 폴백을
 * 보여 준다. 바깥 `<main>`·폭·여백은 `ConcernDetailPage`·`ConcernDetailView` 와 같은 값이다.
 *
 * 뼈대는 브레드크럼(`md` 부터) → 본문 카드 → `답변` 제목 → 답변 카드 둘이다. 본문 길이와 답변 수는
 * 받기 전에는 알 수 없어 높이를 맞추지 못한다. 카드는 배지·제목·작성자·시각·본문 두 줄의 높이로 그린다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center gap-10 bg-white px-4 pt-4 pb-40 md:px-6 md:py-10">
      <div className="w-full" role="status">
        <span className="sr-only">불러오는 중</span>
        <div
          aria-hidden="true"
          className="ogonggo-skeleton mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-4 md:gap-12"
        >
          <Bar className="hidden h-5 w-20 md:block" />
          <div className="flex flex-col gap-10 md:px-10">
            <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-7">
              <Bar className="h-[22px] w-24" />
              <Bar className="mt-3 h-7 w-3/4" />
              <div className="mt-3 flex items-center gap-2">
                <div className="h-6 w-6 shrink-0 rounded-sm bg-gray-200" />
                <Bar className="h-5 w-24" />
              </div>
              <Bar className="mt-2 h-4 w-32" />
              <hr className="my-4 border-gray-200" />
              <Bar className="h-[23px] w-full" />
              <Bar className="mt-1 h-[23px] w-2/3" />
            </div>
            <div className="flex flex-col gap-4">
              <Bar className="h-7 w-16" />
              {[0, 1].map((index) => (
                <div key={index} className="rounded-xl border border-gray-200 bg-white p-5 md:p-7">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 shrink-0 rounded-sm bg-gray-200" />
                    <Bar className="h-5 w-28" />
                  </div>
                  <Bar className="mt-3 h-[23px] w-full" />
                  <Bar className="mt-1 h-[23px] w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
