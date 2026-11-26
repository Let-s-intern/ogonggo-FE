import { Button } from '@ogonggo/ui';

/**
 * 마무리. 이 화면에서 가장 어두운 면(blue-950)은 여기 하나뿐이다. 큰 한 줄과 산업 카드로 돌아가는 버튼이다.
 */
export function ReportLandingClosing() {
  return (
    <section
      aria-labelledby="closing-title"
      className="rounded-xl bg-blue-950 px-6 py-12 text-white md:px-12 md:py-16"
    >
      <h2 id="closing-title" className="max-w-2xl text-5xl font-bold break-keep md:text-7xl">
        관심 있는 산업부터 <span className="text-blue-200">가볍게</span> 읽어 보세요
      </h2>
      <p className="mt-6 text-base break-keep text-white md:text-lg">
        산업마다 매주 새 리포트가 나와요.
      </p>
      <Button
        asChild
        className="mt-8 border-transparent bg-white px-6 text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <a href="#industries">
          산업 카드로 돌아가기
          <span aria-hidden="true" className="ml-1.5 icon-[lucide--arrow-up] h-4 w-4" />
        </a>
      </Button>
    </section>
  );
}
