import Link from 'next/link';
import { Badge, Button, cn } from '@ogonggo/ui';
import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { landingPrice } from '../lib/price';
import { INDUSTRY_LANDING_COPY } from '../model/landingMock';

/**
 * 산업 한눈에 보기. 산업 다섯 카드가 처음부터 모두 보이고, 카드 어디를 눌러도 판매 상세(`/reports/{slug}`)로 간다.
 *
 * 카드 전체가 눌리는 방식은 stretched link 다. 카드 맨 아래 `리포트 보기` 가 카드마다 하나뿐인 링크이고, 그 링크의
 * `::after` 가 카드(`relative`) 전체를 덮는다. 링크 안에 링크·버튼이 없고 스크린리더는 `{산업 이름} 리포트 보기` 한 번만
 * 읽는다. 버튼은 그대로 보이고 누를 수 있는 범위만 카드로 넓어졌다. 마우스를 올리거나 키보드 포커스가 오면 카드
 * 테두리가 blue-500 이 되고 그림자가 커지며 살짝 떠오른다(떠오름은 `motion-safe`, 움직임을 줄인 환경은 색·그림자만),
 * 버튼은 한 단계 진해진다. 썸네일은 확대하지 않는다.
 *
 * 카드는 홈의 채용공고 카드(`entities/job/ui/JobCard.tsx`)와 같은 계열로 맞췄다. 껍데기는 인기 공고가 쓰는
 * `featured` 카드와 같고(`rounded-2xl border-gray-100 bg-white shadow-sm`, 안쪽 여백 `p-4`/`md:p-3`, 간격
 * `gap-3`/`md:gap-2`), 안은 위에서 아래로 4:3 썸네일(`rounded-lg shadow-sm`, 공고는 8:5), 산업 이름 + 가격 알약(공고의 회사명 +
 * D-day 자리), 헤드라인(최대 두 줄, 공고 제목과 같은 크기), 직무 칩 둘, 버튼이다.
 *
 * 열은 공고 목록 그리드와 같은 규칙으로 왼쪽부터 채운다(`gap-x-4 gap-y-8`). 데스크톱(lg) 4열, 태블릿(md) 3열이고
 * 마지막 줄은 왼쪽 정렬이다. 공고 목록은 태블릿에서 4열이지만 카드가 170px 라 헤드라인이 네 줄이 되어 3열로 뒀다.
 * 모바일은 인기 공고처럼 카드를 가로로 넘긴다(폭 240px).
 *
 * 같은 줄의 카드는 높이와 요소의 세로 위치가 같다. 헤드라인 칸이 두 줄 높이로 고정이고 칩은 한 줄, 버튼은 `mt-auto`
 * 라 맨 아래에 선다. 썸네일은 렛츠커리어의 실제 이미지(573x430, 4:3)를 자르지 않고(`object-contain`, `width`/`height` 로 로딩 전에도 비율 자리를 잡는다) — 이미지 안에 제목 글자가 있어 8:5 로 자르면
 * 글자 아랫줄이 잘린다. 카드 안쪽 폭은 가장 넓은 곳(lg 직전 3열)에서도 원본 폭보다 작다. 읽지 못한 카드도 칸은 남겨 둔다. 가격은 렛츠커리어에서 읽은 `priceInfo` 이고 읽지 못하면 가격 알약만
 * 빈다.
 */
export function IndustryList({
  guidebooks,
}: {
  /** `INDUSTRY_REPORTS` 와 같은 순서. 읽지 못한 칸은 `null`. */
  guidebooks: readonly (LetsCareerGuidebook | null)[];
}) {
  return (
    <section id="industries" aria-labelledby="industries-title" className="scroll-mt-6">
      <h2 id="industries-title" className="text-4xl font-bold break-keep text-gray-950">
        산업별 리포트
      </h2>
      <p className="mt-2 text-base break-keep text-gray-600">
        산업별 이번 주 헤드라인과 공고 속 직무를 한눈에 보고, 리포트를 열어 보세요
      </p>

      <ul className="-mx-5 mt-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-x-4 md:gap-y-8 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
        {INDUSTRY_REPORTS.map((report, index) => {
          const copy = INDUSTRY_LANDING_COPY[report.slug];
          const guidebook = guidebooks[index] ?? null;
          const thumbnail = guidebook ? (guidebook.thumbnail ?? guidebook.desktopThumbnail) : null;
          const price = landingPrice(guidebook?.priceInfo ?? null);
          return (
            <li key={report.slug} className="w-60 shrink-0 snap-start md:w-auto">
              <div
                className={cn(
                  'group relative flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:gap-2 md:p-3',
                  'transition duration-200 hover:border-blue-500 hover:shadow-lg',
                  'has-focus-visible:border-blue-500 has-focus-visible:shadow-lg has-focus-visible:ring-2 has-focus-visible:ring-blue-500',
                  'motion-safe:hover:-translate-y-1 motion-safe:has-focus-visible:-translate-y-1',
                )}
              >
                <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm">
                  {guidebook && thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`${report.label} ${guidebook.title}`}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      width={573}
                      height={430}
                      className="block h-full w-full object-contain"
                    />
                  ) : null}
                </div>
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <h3 className="min-w-0 truncate text-sm font-bold text-gray-600">
                    {report.label}
                  </h3>
                  {price ? (
                    <Badge tone="main" className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold">
                      {price.original ? (
                        <span className="mr-1 font-normal text-gray-400 line-through">
                          {price.original}
                        </span>
                      ) : null}
                      {price.final}
                    </Badge>
                  ) : null}
                </div>
                <p className="line-clamp-2 min-h-10 text-sm font-bold break-keep text-gray-900 md:min-h-12 md:text-base">
                  {copy.headline}
                </p>
                <ul aria-label="공고 속 직무" className="flex flex-wrap gap-1">
                  {copy.roles.slice(0, 2).map((role) => (
                    <li key={role}>
                      <Badge tone="neutral" className="rounded-full px-2 py-0.5 text-xs">
                        {role}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="sm"
                  className="mt-auto w-full transition-colors group-hover:bg-blue-600 group-has-focus-visible:bg-blue-600 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  <Link href={`/reports/${report.slug}`} aria-label={`${report.label} 리포트 보기`}>
                    리포트 보기
                    <span
                      aria-hidden="true"
                      className="ml-1.5 icon-[lucide--arrow-right] h-4 w-4"
                    />
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
