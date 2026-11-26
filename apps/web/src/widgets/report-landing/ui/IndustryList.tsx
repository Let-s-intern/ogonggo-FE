import Link from 'next/link';
import { Badge, Button, Card, cn } from '@ogonggo/ui';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { INDUSTRY_LANDING_COPY } from '../model/landingMock';

/**
 * 산업 한눈에 보기. 산업 다섯이 처음부터 모두 보이는 세로 목록이고, 각 행의 `리포트 보기` 버튼이 판매 상세
 * (`/reports/{slug}`)로 보낸다. 누르는 것은 행 안의 버튼 하나뿐이고 행 자체는 링크가 아니다.
 *
 * 번호, 산업 이름, 한 줄 소개, 이번 주 헤드라인, 공고 속 직무 칩 셋, 버튼이 한 행에 든다. 선택 상태가 없어
 * 서버 컴포넌트다.
 */
export function IndustryList() {
  return (
    <section id="industries" aria-labelledby="industries-title" className="scroll-mt-6">
      <h2 id="industries-title" className="text-4xl font-bold break-keep text-gray-950 md:text-5xl">
        산업별 리포트
      </h2>
      <p className="mt-2 text-base break-keep text-gray-600">
        산업별 이번 주 헤드라인과 공고 속 직무를 한눈에 보고, 리포트를 열어 보세요
      </p>

      <Card className="mt-6 overflow-hidden rounded-xl p-0">
        <ol className="divide-y divide-gray-100">
          {INDUSTRY_REPORTS.map((report, index) => {
            const copy = INDUSTRY_LANDING_COPY[report.slug];
            return (
              <li
                key={report.slug}
                className={cn('flex flex-col gap-4 p-5 md:p-6 lg:px-8', index % 2 === 1 && 'bg-blue-00')}
              >
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="w-12 shrink-0 text-5xl font-bold text-blue-600 tabular-nums lg:w-16 lg:text-7xl"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-950">{report.label}</h3>
                    <p className="text-sm break-keep text-gray-500">{copy.tagline}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">이번 주 헤드라인</p>
                  <p className="mt-1 text-lg font-bold break-keep text-gray-950 lg:text-xl">
                    {copy.headline}
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <ul aria-label="공고 속 직무" className="flex flex-wrap gap-1.5">
                    {copy.roles.map((role) => (
                      <li key={role}>
                        <Badge tone="neutral" className="rounded-full px-3 py-1 text-xs">
                          {role}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  >
                    <Link href={`/reports/${report.slug}`} aria-label={`${report.label} 리포트 보기`}>
                      리포트 보기
                      <span aria-hidden="true" className="ml-1.5 icon-[lucide--arrow-right] h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </section>
  );
}
