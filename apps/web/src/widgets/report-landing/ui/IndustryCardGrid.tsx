import Link from 'next/link';
import { Badge, cn } from '@ogonggo/ui';
import { INDUSTRY_REPORTS, type IndustrySlug } from '@/shared/config/industryReports';
import { INDUSTRY_LANDING_COPY } from '../model/landingMock';

/**
 * 산업마다 쓰는 아이콘. Iconify 플러그인은 소스에 적힌 글자를 스캔하므로 이름을 조립하지 않고 통째로 적는다.
 * `Record` 라 산업이 늘면 여기서 빠뜨린 칸을 타입 검사가 잡는다.
 */
const INDUSTRY_ICON: Record<IndustrySlug, string> = {
  fnb: 'icon-[lucide--utensils]',
  'it-platform': 'icon-[lucide--smartphone]',
  beauty: 'icon-[lucide--sparkles]',
  entertainment: 'icon-[lucide--clapperboard]',
  'retail-ecommerce': 'icon-[lucide--shopping-bag]',
};

/**
 * 산업 카드 다섯. 카드 전체가 판매 상세(`/reports/{slug}`)로 가는 링크다. 산업 사이는 색을 늘리지 않고 아이콘과
 * 번호로 가른다.
 *
 * 배치는 데스크톱이 6칸 격자에 2칸씩이라 위 줄 셋, 아래 줄 둘이고, 아래 둘은 3칸씩 차지해 마지막 줄이 비어 보이지
 * 않는다. 태블릿은 2열이고 다섯째가 두 칸을 쓴다. 모바일은 1열이다.
 */
export function IndustryCardGrid() {
  return (
    <section id="industries" aria-labelledby="industries-title" className="scroll-mt-6">
      <h2 id="industries-title" className="text-2xl font-bold break-keep text-gray-950">
        산업을 골라 리포트를 열어 보세요
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {INDUSTRY_REPORTS.map((report, index) => {
          const copy = INDUSTRY_LANDING_COPY[report.slug];
          const wide = index >= 3;
          return (
            <li
              key={report.slug}
              className={cn(
                'lg:col-span-2',
                wide && 'lg:col-span-3',
                index === INDUSTRY_REPORTS.length - 1 && 'md:col-span-2',
              )}
            >
              <Link
                href={`/reports/${report.slug}`}
                className={cn(
                  'group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6',
                  'transition-[transform,border-color,box-shadow] duration-200',
                  'hover:border-blue-200 hover:shadow-lg motion-safe:hover:-translate-y-1',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                  'motion-reduce:transition-none',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-500">
                    <span aria-hidden="true" className={cn(INDUSTRY_ICON[report.slug], 'h-6 w-6')} />
                  </span>
                  <span className="text-2xl font-bold text-blue-200 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-950">{report.label}</h3>
                <p className="mt-1 text-sm break-keep text-gray-500">{copy.tagline}</p>
                <p className="mt-5 text-base font-semibold break-keep text-gray-900">
                  {copy.headline}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {copy.keywords.map((keyword) => (
                    <li key={keyword}>
                      <Badge tone="neutral" className="rounded-full px-3 py-1 text-xs">
                        {keyword}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-blue-500">
                  리포트 보기
                  <span
                    aria-hidden="true"
                    className="icon-[lucide--arrow-right] h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
