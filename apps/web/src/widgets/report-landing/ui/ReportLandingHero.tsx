import { Badge } from '@ogonggo/ui';

/**
 * 랜딩 맨 위. 옅은 파랑 바탕이 화면 폭 끝까지 닿고, 글은 본문 폭 안에 둔다. 발행 회차는 목데이터다
 * (`model/landingMock.ts`).
 */
export function ReportLandingHero({ issueLabel }: { issueLabel: string }) {
  return (
    <section className="bg-linear-to-b from-blue-50 to-blue-00">
      <div className="mx-auto w-full max-w-page-padded px-5 pt-12 pb-12 md:pt-16 md:pb-16">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="main" className="gap-1 bg-white px-3 text-sm">
            <span aria-hidden="true" className="icon-[lucide--calendar-check] h-4 w-4" />
            매주 월요일 발행
          </Badge>
          <span className="text-sm font-medium text-gray-500">{issueLabel}</span>
        </div>
        <h1 className="mt-5 max-w-3xl text-6xl font-bold break-keep text-gray-950 md:text-7xl">
          이번 주 산업 트렌드를 <span className="text-blue-500">채용공고와 함께</span> 읽어요
        </h1>
        <p className="mt-5 max-w-xl text-base break-keep text-gray-600 md:text-lg">
          매주 따라가기 번거로운 산업 흐름을 실제 채용공고가 요구하는 역량과 이어 드려요. 자소서와
          포트폴리오에 녹일 수 있는 준비 활동까지 한 번에 받아 보세요.
        </p>
        <a
          href="#industries"
          className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-sm bg-blue-500 px-5 text-base font-medium text-blue-00 transition-colors hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          산업 고르기
          <span aria-hidden="true" className="icon-[lucide--arrow-down] h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
