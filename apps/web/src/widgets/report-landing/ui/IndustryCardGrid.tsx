import { cn } from '@ogonggo/ui';
import { INDUSTRY_REPORTS, type IndustrySlug } from '@/shared/config/industryReports';
import { INDUSTRY_LANDING_COPY } from '../model/landingMock';
import { SpotlightCard } from './SpotlightCard';

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
 * 큰 외곽선 번호로 가른다.
 *
 * 배치는 데스크톱이 6칸 격자라 위 줄이 큰 카드(4칸) 하나와 작은 카드(2칸) 하나, 아래 줄이 작은 카드 셋(2칸씩)이다.
 * 첫 카드만 제목과 헤드라인이 한 단계 크다. 태블릿은 2열이고 첫 카드와 다섯째가 두 칸을 쓴다. 모바일은 1열이다.
 */
export function IndustryCardGrid() {
  return (
    <section id="industries" aria-labelledby="industries-title" className="scroll-mt-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-blue-300">PICK AN INDUSTRY</p>
      <h2
        id="industries-title"
        className="mt-3 text-4xl font-extrabold tracking-[-0.03em] break-keep text-white md:text-6xl"
      >
        산업을 골라 리포트를 열어 보세요
      </h2>
      <ul className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-5 lg:grid-cols-6">
        {INDUSTRY_REPORTS.map((report, index) => {
          const copy = INDUSTRY_LANDING_COPY[report.slug];
          const featured = index === 0;
          return (
            <li
              key={report.slug}
              className={cn(
                'lg:col-span-2',
                featured && 'md:col-span-2 lg:col-span-4',
                index === INDUSTRY_REPORTS.length - 1 && 'md:col-span-2 lg:col-span-2',
              )}
            >
              <SpotlightCard
                href={`/reports/${report.slug}`}
                className={cn('min-h-[22rem]', featured && 'lg:min-h-[26rem]')}
              >
                {/* 거대한 외곽선 번호. 장식이라 보조기기에서 뺀다. 카드 오른쪽 위로 일부가 잘려 나간다. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute -top-4 -right-3 leading-none font-extrabold tracking-[-0.06em] text-white/[0.06] select-none tabular-nums',
                    'transition-colors duration-300 group-hover:text-blue-400/20 group-focus-visible:text-blue-400/20',
                    featured ? 'text-[11rem] md:text-[15rem]' : 'text-[9rem] md:text-[11rem]',
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-blue-300">
                  <span aria-hidden="true" className={cn(INDUSTRY_ICON[report.slug], 'h-7 w-7')} />
                </span>
                <h3
                  className={cn(
                    'mt-8 font-extrabold tracking-[-0.03em] text-white',
                    featured ? 'text-4xl md:text-6xl' : 'text-4xl',
                  )}
                >
                  {report.label}
                </h3>
                <p className="mt-2 text-sm break-keep text-gray-400 md:text-base">{copy.tagline}</p>
                <p
                  className={cn(
                    'mt-6 font-semibold break-keep text-gray-100',
                    featured ? 'text-lg md:text-2xl lg:max-w-xl' : 'text-base md:text-lg',
                  )}
                >
                  {copy.headline}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {copy.keywords.map((keyword) => (
                    <li
                      key={keyword}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-gray-300"
                    >
                      {keyword}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-8 text-sm font-semibold text-blue-300 group-hover:text-blue-200">
                  리포트 보기
                  <span
                    aria-hidden="true"
                    className="icon-[lucide--arrow-right] h-4 w-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1.5 motion-safe:group-focus-visible:translate-x-1.5"
                  />
                </span>
              </SpotlightCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
