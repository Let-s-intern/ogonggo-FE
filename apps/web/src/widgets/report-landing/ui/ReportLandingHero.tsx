import { Badge, Button, Card } from '@ogonggo/ui';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { INDUSTRY_LANDING_COPY, SAMPLE_REPORT } from '../model/landingMock';

/**
 * 랜딩 맨 위. 파랑 면(blue-600) 한 줄 높이에 제목과 한 줄 소개, 산업 목록으로 내려가는 버튼 하나를 두고, 오른쪽에는
 * 이번 회차 샘플 표지를 겹쳐 쌓은 종이처럼 놓는다. 표지와 문구는 목데이터다(`model/landingMock.ts`) — 표지에
 * `샘플` 이름표가 붙는다.
 *
 * 디자인 스케일의 가장 큰 글자(`text-7xl`, 36px)가 상한이라 제목을 더 키우지 않았다. 흰 글자 대비는 blue-600 이상에서
 * 4.5:1 을 넘기므로 파랑 면은 blue-600 보다 옅게 가지 않는다. 표지는 `md` 부터 보인다 — 모바일에서는 히어로가
 * 길어져 아래 샘플 리포트 절이 그 몫을 한다.
 */
export function ReportLandingHero({ issueLabel }: { issueLabel: string }) {
  const sample = INDUSTRY_REPORTS.find((report) => report.slug === SAMPLE_REPORT.slug);
  const sampleCopy = INDUSTRY_LANDING_COPY[SAMPLE_REPORT.slug];
  return (
    <section className="overflow-hidden bg-blue-600 text-white">
      <div className="mx-auto grid w-full max-w-page-padded gap-8 px-5 py-8 md:py-12 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="main" className="gap-1 bg-white text-blue-600">
              <span aria-hidden="true" className="icon-[lucide--calendar-check] h-4 w-4" />
              매주 월요일 발행
            </Badge>
            <span className="text-sm font-medium text-white">{issueLabel}</span>
          </div>
          <h1 className="mt-4 text-5xl font-bold break-keep md:text-7xl">
            이번 주 산업 트렌드를 채용공고와 함께 읽어요
          </h1>
          <p className="mt-4 text-base break-keep text-white md:text-lg">
            뉴스 4꼭지, 공고 속 직무, 혼자 해볼 준비 3가지를 산업별 한 편에 담았어요.
          </p>
          <Button
            asChild
            className="mt-6 border-transparent bg-white px-5 text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <a href="#industries">
              산업별 리포트 보기
              <span aria-hidden="true" className="ml-1.5 icon-[lucide--arrow-down] h-4 w-4" />
            </a>
          </Button>
        </div>

        {sample ? (
          <div className="relative mr-6 mb-6 hidden max-w-sm md:block lg:col-span-5 lg:ml-auto">
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-6 translate-y-6 rounded-xl bg-blue-800"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl bg-blue-500"
            />
            <Card className="relative rounded-xl border-transparent p-0 text-gray-900">
              <div className="flex items-center justify-between rounded-t-xl border-b border-gray-100 bg-blue-00 px-5 py-3">
                <span className="text-xs font-semibold tracking-widest text-blue-600">
                  WEEKLY INDUSTRY REPORT
                </span>
                <Badge tone="neutral">샘플</Badge>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm font-semibold text-gray-500">{issueLabel}</p>
                <p className="mt-1 text-5xl font-bold text-gray-950">{sample.label}</p>
                <p className="mt-4 text-lg font-bold break-keep text-gray-900">
                  {sampleCopy.headline}
                </p>
              </div>
              <ul className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 text-center text-sm font-medium text-gray-700">
                <li className="py-3">뉴스 4꼭지</li>
                <li className="py-3">직무 표</li>
                <li className="py-3">준비 3가지</li>
              </ul>
            </Card>
          </div>
        ) : null}
      </div>
    </section>
  );
}
