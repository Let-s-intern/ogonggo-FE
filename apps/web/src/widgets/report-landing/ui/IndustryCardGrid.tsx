import Link from 'next/link';
import { Badge, Card, cn } from '@ogonggo/ui';
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
 * 큰 번호 워터마크로 가른다.
 *
 * 배치는 데스크톱이 6칸 격자라 위 줄이 큰 카드(4칸) 하나와 작은 카드(2칸) 하나, 아래 줄이 작은 카드 셋(2칸씩)이다.
 * 큰 카드는 파랑 면에 흰 글자라 리듬의 기준이 된다 — 첫 산업이라는 순서 말고 다른 뜻은 없다. 태블릿은 2열이고
 * 큰 카드가 두 칸을 쓴다. 모바일은 1열이다.
 *
 * hover 와 focus 는 위로 살짝 뜨고 테두리 색이 바뀌고 화살표가 움직인다. 움직임은 `motion-safe` 일 때만이다.
 */
export function IndustryCardGrid() {
  return (
    <section id="industries" aria-labelledby="industries-title" className="scroll-mt-6">
      <p className="text-sm font-semibold tracking-widest text-blue-500">PICK AN INDUSTRY</p>
      <h2
        id="industries-title"
        className="mt-3 text-5xl font-bold break-keep text-gray-950 md:text-7xl"
      >
        산업을 골라 리포트를 열어 보세요
      </h2>
      <ul className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-6 lg:grid-cols-6">
        {INDUSTRY_REPORTS.map((report, index) => {
          const copy = INDUSTRY_LANDING_COPY[report.slug];
          const featured = index === 0;
          return (
            <li key={report.slug} className={cn('lg:col-span-2', featured && 'md:col-span-2 lg:col-span-4')}>
              <Link
                href={`/reports/${report.slug}`}
                className={cn(
                  'group block h-full rounded-xl',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                )}
              >
                <Card
                  className={cn(
                    'relative flex h-full min-h-80 flex-col overflow-hidden rounded-xl p-6 transition duration-200 md:p-8',
                    'motion-safe:group-hover:-translate-y-1 motion-reduce:transition-none',
                    featured
                      ? 'border-blue-600 bg-blue-600 text-white lg:min-h-96'
                      : 'group-hover:border-blue-500 group-focus-visible:border-blue-500',
                  )}
                >
                  {/* 큰 번호 워터마크. 장식이라 보조기기에서 뺀다. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-4 right-6 text-7xl font-bold tabular-nums',
                      featured ? 'text-blue-500' : 'text-blue-100',
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-md',
                      featured ? 'bg-white text-blue-600' : 'bg-blue-50 text-blue-500',
                    )}
                  >
                    <span aria-hidden="true" className={cn(INDUSTRY_ICON[report.slug], 'h-6 w-6')} />
                  </span>
                  <h3
                    className={cn(
                      'mt-8 font-bold',
                      featured ? 'text-5xl md:text-7xl' : 'text-4xl',
                      featured ? 'text-white' : 'text-gray-950',
                    )}
                  >
                    {report.label}
                  </h3>
                  <p
                    className={cn(
                      'mt-2 text-sm break-keep md:text-base',
                      featured ? 'text-white' : 'text-gray-500',
                    )}
                  >
                    {copy.tagline}
                  </p>
                  <p
                    className={cn(
                      'mt-6 font-semibold break-keep',
                      featured ? 'text-xl text-white lg:max-w-xl' : 'text-base text-gray-900',
                    )}
                  >
                    {copy.headline}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {copy.keywords.map((keyword) => (
                      <li key={keyword}>
                        <Badge
                          tone={featured ? 'main' : 'neutral'}
                          className={cn('rounded-full px-3 py-1 text-xs', featured && 'bg-white')}
                        >
                          {keyword}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <span
                    className={cn(
                      'mt-auto inline-flex items-center gap-1 pt-8 text-sm font-semibold',
                      featured ? 'text-white' : 'text-blue-500',
                    )}
                  >
                    리포트 보기
                    <span
                      aria-hidden="true"
                      className="icon-[lucide--arrow-right] h-4 w-4 transition motion-safe:group-hover:translate-x-1"
                    />
                  </span>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
