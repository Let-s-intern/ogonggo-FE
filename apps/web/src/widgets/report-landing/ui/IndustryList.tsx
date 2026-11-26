import Link from 'next/link';
import { Badge, Button, Card, cn } from '@ogonggo/ui';
import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { landingPrice } from '../lib/price';
import { INDUSTRY_LANDING_COPY } from '../model/landingMock';

/**
 * 아랫줄 카드의 시작 칸. 태블릿(4칸 격자)에서는 다섯째가 가운데(2번째 칸)에, 데스크톱(6칸 격자)에서는 넷째가 2번째,
 * 다섯째가 4번째 칸에 선다. 클래스를 조립하지 않고 통째로 적는다(Tailwind 가 소스의 글자를 스캔한다).
 */
const CARD_START: readonly string[] = [
  '',
  '',
  '',
  'lg:col-start-2',
  'md:col-start-2 lg:col-start-4',
];

/**
 * 산업 한눈에 보기. 산업 다섯 카드가 처음부터 모두 보이고, 카드 맨 아래 `리포트 보기` 버튼이 판매 상세
 * (`/reports/{slug}`)로 보낸다. 누르는 것은 카드 안 버튼 하나뿐이고 카드 자체는 링크가 아니다.
 *
 * 카드는 위에서 아래로 썸네일, 번호와 산업 이름, 이번 주 헤드라인, 공고 속 직무 칩 셋, 가격, 버튼이다. 목록 격자의
 * 줄을 카드들이 나눠 쓰므로(카드마다 `row-span-6` = 칸 여섯, subgrid) 같은 줄의 카드는 글이 몇 줄이든 요소의 세로 위치가 같고 버튼이 같은 높이에 선다.
 * 썸네일은 렛츠커리어가 주는 실제 이미지(573x430, 4:3)라 칸을 4:3 으로 고정했다. 읽지 못한 카드도 칸은 남겨 둔다 —
 * 줄이 어긋나지 않는다. 가격은 렛츠커리어에서 읽은 `priceInfo` 이고 읽지 못하면 가격 줄만 빈다.
 *
 * 열은 모바일 1, 태블릿(md) 2, 데스크톱(lg) 3 이다. 격자는 카드 하나가 2칸이라 태블릿 4칸, 데스크톱 6칸이고, 아랫줄은
 * 가운데에 놓인다(다섯 카드의 폭이 모두 같다). 모바일에서는 카드가 썸네일 원본 폭(573px)을 넘어 늘지 않게
 * `max-w-lg` 로 막는다.
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

      <div role="list" className="mt-5 grid gap-x-4 md:grid-cols-4 lg:grid-cols-6">
        {INDUSTRY_REPORTS.map((report, index) => {
          const copy = INDUSTRY_LANDING_COPY[report.slug];
          const guidebook = guidebooks[index] ?? null;
          const thumbnail = guidebook ? (guidebook.thumbnail ?? guidebook.desktopThumbnail) : null;
          const price = landingPrice(guidebook?.priceInfo ?? null);
          return (
            <Card
              key={report.slug}
              role="listitem"
              className={cn(
                'row-span-6 mx-auto mb-4 grid w-full max-w-lg grid-rows-subgrid overflow-hidden rounded-xl p-0',
                'md:col-span-2 md:max-w-none',
                CARD_START[index],
              )}
            >
              <div className="aspect-4/3 bg-gray-100">
                {guidebook && thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={`${report.label} ${guidebook.title}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className="block h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="px-4 pt-4">
                <p aria-hidden="true" className="text-sm font-bold text-blue-600 tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-3xl font-bold break-keep text-gray-950">{report.label}</h3>
              </div>
              <p className="px-4 pt-3 text-lg font-bold break-keep text-gray-900">
                {copy.headline}
              </p>
              <div className="px-4 pt-3">
                <p className="text-xs font-semibold text-gray-500">공고 속 직무</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {copy.roles.map((role) => (
                    <li key={role}>
                      <Badge tone="neutral" className="rounded-full px-2.5 py-1 text-xs">
                        {role}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="flex items-baseline gap-1.5 px-4 pt-4">
                {price ? (
                  <>
                    <span className="text-lg font-bold text-gray-950">{price.final}</span>
                    {price.original ? (
                      <span className="text-sm text-gray-400 line-through">{price.original}</span>
                    ) : null}
                  </>
                ) : null}
              </p>
              <div className="p-4 pt-2">
                <Button
                  asChild
                  className="w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
            </Card>
          );
        })}
      </div>
    </section>
  );
}
