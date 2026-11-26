import Link from 'next/link';
import { Badge, Button, Card, cn } from '@ogonggo/ui';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';

/**
 * 랜딩 맨 위. 화면 폭 끝까지 닿는 채도 높은 파랑 면(blue-600 → blue-700) 위에 흰 제목이 놓이고, 오른쪽에는
 * 이번 회차와 산업 바로가기를 담은 흰 카드가 걸친다. 발행 회차는 목데이터다(`model/landingMock.ts`).
 *
 * 디자인 스케일의 가장 큰 글자(`text-7xl`, 36px)가 상한이라 제목을 더 키우지 않았다. 대신 글자 무게(bold)와
 * 색면 대비(파랑 면 위 흰 글자, 강조 구절은 흰 면 위 파랑 글자)로 힘을 준다. 흰 글자 대비는 blue-600 이상에서
 * 4.5:1 을 넘기므로 파랑 면은 blue-600 보다 옅게 가지 않는다.
 */
export function ReportLandingHero({ issueLabel }: { issueLabel: string }) {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-blue-600 to-blue-700 text-white">
      {/* 장식 원. 평평한 색면이고 글자 뒤에 깔린다. 보조기기에서는 뺀다. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-blue-500 opacity-60" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-blue-800 opacity-60" />
      </div>
      <div className="relative mx-auto grid w-full max-w-page-padded gap-10 px-5 py-14 md:py-20 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-24">
        <div className="lg:col-span-7">
          <p className="text-sm font-semibold tracking-widest text-blue-100">
            WEEKLY INDUSTRY REPORT
          </p>
          <h1 className="mt-4 text-6xl font-bold break-keep md:text-7xl">
            <span className="block">이번 주 산업 트렌드를</span>
            <span className="mt-2 inline-block rounded-md bg-white px-3 py-1 text-blue-600">
              채용공고와 함께
            </span>
            <span className="mt-2 block">읽어요</span>
          </h1>
          <p className="mt-8 max-w-xl text-base break-keep text-white md:text-lg">
            매주 따라가기 번거로운 산업 흐름을 실제 채용공고가 요구하는 역량과 이어 드려요. 자소서와
            포트폴리오에 녹일 수 있는 준비 활동까지 한 번에 받아 보세요.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="border-transparent bg-white px-6 text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <a href="#industries">
                산업 고르기
                <span aria-hidden="true" className="ml-1.5 icon-[lucide--arrow-down] h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="border-blue-200 bg-transparent px-6 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <a href="#structure">리포트 구성 보기</a>
            </Button>
          </div>
        </div>

        <Card className="rounded-xl border-transparent p-6 md:p-8 lg:col-span-5">
          <Badge tone="main" className="gap-1 text-sm">
            <span aria-hidden="true" className="icon-[lucide--calendar-check] h-4 w-4" />
            매주 월요일 발행
          </Badge>
          <p className="mt-4 text-sm font-semibold text-gray-500">이번 회차</p>
          <p className="mt-1 text-5xl font-bold text-gray-950">{issueLabel}</p>
          <p className="mt-6 text-sm font-semibold text-gray-500">이번 주 다루는 산업</p>
          <ol className="mt-2 divide-y divide-gray-100">
            {INDUSTRY_REPORTS.map((report, index) => (
              <li key={report.slug}>
                <Link
                  href={`/reports/${report.slug}`}
                  className={cn(
                    'group flex items-center gap-4 py-3 text-lg font-bold text-gray-900',
                    'transition-colors hover:text-blue-500',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                  )}
                >
                  <span className="w-8 text-base font-bold text-blue-200 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {report.label}
                  <span
                    aria-hidden="true"
                    className="ml-auto icon-[lucide--arrow-right] h-4 w-4 text-gray-400 transition group-hover:text-blue-500 motion-safe:group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </section>
  );
}
