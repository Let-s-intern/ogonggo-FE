import { Button } from '@ogonggo/ui';

/**
 * 마무리. 이 화면에서 가장 어두운 면(blue-950)은 여기 하나뿐이다. 한 줄과 산업 고르기로 돌아가는 버튼이다.
 */
export function ReportLandingClosing() {
  return (
    <section
      aria-labelledby="closing-title"
      className="flex flex-col gap-4 rounded-xl bg-blue-950 px-6 py-6 text-white md:flex-row md:items-center md:justify-between md:px-8"
    >
      <h2 id="closing-title" className="text-2xl font-bold break-keep">
        관심 있는 산업부터 가볍게 읽어 보세요
      </h2>
      <Button
        asChild
        className="shrink-0 border-transparent bg-white px-5 text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <a href="#industries">
          산업 고르러 가기
          <span aria-hidden="true" className="ml-1.5 icon-[lucide--arrow-up] h-4 w-4" />
        </a>
      </Button>
    </section>
  );
}
