import Link from 'next/link';
import { Badge, Button, cn } from '@ogonggo/ui';
import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { landingPrice } from '../lib/price';

/**
 * 산업 한눈에 보기. 산업 다섯 카드가 처음부터 모두 보이고, 카드 어디를 눌러도 판매 상세(`/reports/{slug}`)로 간다.
 *
 * 카드 전체가 눌리는 방식은 stretched link 다. 카드 맨 아래 `리포트 보기` 가 카드마다 하나뿐인 링크이고, 그 링크의
 * `::after` 가 카드(`relative`) 전체를 덮는다. 링크 안에 링크·버튼이 없고 스크린리더는 `{산업 이름} 리포트 보기` 한 번만
 * 읽는다. 마우스를 올리거나 키보드 포커스가 오면 카드 테두리가 blue-500 이 되고 그림자가 커지며 살짝 떠오르고(떠오름은
 * `motion-safe`, 움직임을 줄인 환경은 색·그림자만), 평소 옅은 버튼은 파랑으로 채워진다. 썸네일은 확대하지 않는다.
 *
 * 카드에는 근거 있는 것만 담는다 — 썸네일·가격(렛츠커리어 공개 API), 산업 이름(상수). 헤드라인·직무 같은 글은 지어낸
 * 것이라 두지 않는다(PRD 11.3 L7).
 *
 * 카드는 홈의 채용공고 카드(`entities/job/ui/JobCard.tsx`)와 같은 계열로 맞췄다. 껍데기는 인기 공고가 쓰는
 * `featured` 카드와 같고(`rounded-2xl border-gray-100 bg-white shadow-sm`, 안쪽 여백 `p-4`/`md:p-3`, 간격
 * `gap-3`/`md:gap-2`), 안은 위에서 아래로 4:3 썸네일(`rounded-lg shadow-sm`, 공고는 8:5), 산업 이름 + 가격 알약(공고의
 * 회사명 + D-day 자리), 옅은 `리포트 보기` 버튼이다.
 *
 * 열은 모바일 한 열(가로로 넘기지 않고 세로로 쌓는다), 640px(sm) 두 열, 태블릿(md) 세 열, 데스크톱(lg) 다섯 열 한 줄이다
 * (`gap-x-4 gap-y-8`, 공고 목록 그리드와 같다). 다섯 열의 카드 폭은 1440px 에서 약 223px 로 홈 공고 카드(170~297px)
 * 범위 안이다. sm 에서 두 열로 한 것은 한 열이 640~767px 에서 카드를 원본(573px)보다 넓게 늘리기 때문이다.
 *
 * 같은 줄의 카드는 높이와 요소의 세로 위치가 같다(썸네일 4:3, 한 줄 이름, 같은 높이 버튼). 썸네일은 렛츠커리어의 실제
 * 이미지(573x430, 4:3)를 자르지 않고(`object-contain`, `width`/`height` 로 로딩 전에도 비율 자리를 잡는다) 두며
 * 어느 폭에서도 원본 폭보다 작다. 읽지 못한 카드도 칸은 남겨 둔다. 가격은 렛츠커리어에서 읽은 `priceInfo` 이고 읽지 못하면
 * 가격 알약만 빈다.
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
      <ul className="mt-5 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 md:grid-cols-3 md:gap-y-8 lg:grid-cols-5">
        {INDUSTRY_REPORTS.map((report, index) => {
          const guidebook = guidebooks[index] ?? null;
          const thumbnail = guidebook ? (guidebook.thumbnail ?? guidebook.desktopThumbnail) : null;
          const price = landingPrice(guidebook?.priceInfo ?? null);
          return (
            <li key={report.slug}>
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
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="mt-auto w-full hover:border-blue-500 hover:bg-blue-500 hover:text-white group-has-focus-visible:border-blue-500 group-has-focus-visible:bg-blue-500 group-has-focus-visible:text-white after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
