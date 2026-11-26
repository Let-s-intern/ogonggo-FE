import Link from 'next/link';
import { Badge, cn } from '@ogonggo/ui';
import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import type { IndustryReport } from '@/shared/config/industryReports';
import { landingPrice } from '../lib/price';

/**
 * 산업 한 칸. 패널 전체가 링크 하나이고 어디를 눌러도 판매 상세(`/reports/{slug}`)로 간다. 링크 안에는 링크·버튼이 없고
 * `리포트 보기` 는 눌림을 알리는 모양일 뿐인 span 이다. 스크린리더는 `{산업 이름} 리포트 보기` 한 번만 읽는다.
 *
 * 데스크톱(lg 이상)에서는 `<li>` 가 가로로 나란한 세로로 긴 패널이다. 안은 위에서 아래로 이름·가격, 썸네일, `리포트 보기` 이고
 * 높이는 히어로가 남긴 만큼 채운다. 이름은 줄바꿈 없이 한 줄(`whitespace-nowrap`)이라 좁아진 패널에서도 들어가는 글자 단계를 쓴다.
 * 마우스를 올리거나 키보드 포커스(`focus-visible`)가 오면 그 패널의 `flex-grow` 가 커져 넓어지고 썸네일도 함께 커지며(원본 폭을
 * 넘지 않는 `max-w-lg` 안에서), 나머지는 좁아진다(`motion-safe` 일 때만). 같은 순간 썸네일이 떠오르고, 패널이 흰 바탕과 파란
 * 테두리·깊은 그림자로 바뀌고, 화살표가 오른쪽으로 가고, `리포트 보기` 가 파랑으로 채워진다. 나머지 패널은 `ul`(group/list)
 * 안에 올려진 패널이 있을 때만 흐려지고 채도가 내려간다. 움직임을 줄인 환경(`prefers-reduced-motion`)은 색·그림자·투명도
 * 변화만 남는다. 호버가 없는 모바일·태블릿은 세로로 쌓이고(썸네일 왼쪽, 이름·가격·`리포트 보기` 오른쪽) 눌렀을 때(`active:`)
 * 살짝 가라앉는다.
 *
 * 썸네일은 렛츠커리어의 실제 이미지(573x430, 4:3)를 자르지 않고(`object-contain`, `width`/`height`) 패널 폭 안에 둔다.
 * 어느 폭에서도 원본 폭보다 작다. 읽지 못한 패널은 썸네일·가격만 빠진다.
 */
export function IndustryPanel({
  report,
  guidebook,
  priority,
}: {
  report: IndustryReport;
  /** 읽지 못했으면 `null`. */
  guidebook: LetsCareerGuidebook | null;
  /** 첫 화면에서 바로 보이는 썸네일은 서둘러 읽는다. */
  priority: boolean;
}) {
  const thumbnail = guidebook ? (guidebook.thumbnail ?? guidebook.desktopThumbnail) : null;
  const price = landingPrice(guidebook?.priceInfo ?? null);
  const hasThumbnail = Boolean(guidebook && thumbnail);

  return (
    <li
      className={cn(
        'group/panel min-h-20 min-w-0 flex-auto lg:flex lg:basis-0 lg:grow',
        'transition-colors duration-500 ease-out motion-safe:transition-all',
        'motion-safe:lg:hover:grow-2 motion-safe:lg:has-focus-visible:grow-2',
        'group-has-hover/list:not-hover:opacity-70 group-has-hover/list:not-hover:saturate-50',
        'group-has-focus-visible/list:not-has-focus-visible:opacity-70 group-has-focus-visible/list:not-has-focus-visible:saturate-50',
      )}
    >
      <Link
        href={`/reports/${report.slug}`}
        aria-label={`${report.label} 리포트 보기`}
        className={cn(
          'grid h-full w-full grid-cols-12 lg:h-auto content-center items-center gap-x-3 gap-y-2 overflow-hidden rounded-3xl bg-blue-50 p-2 shadow-sm md:gap-x-4 md:p-2',
          'lg:flex lg:flex-col lg:items-stretch lg:justify-between lg:gap-3 lg:p-3 xl:p-4',
          'transition-shadow duration-500 ease-out group-hover/panel:bg-white group-hover/panel:shadow-2xl group-hover/panel:ring-2 group-hover/panel:ring-blue-500 group-has-focus-visible/panel:bg-white group-has-focus-visible/panel:shadow-2xl group-has-focus-visible/panel:ring-2 group-has-focus-visible/panel:ring-blue-500',
          'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
          'motion-safe:transition-[box-shadow,transform] motion-safe:active:scale-98 lg:motion-safe:active:scale-100',
        )}
      >
        <span
          className={cn(
            'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 self-end lg:flex-col lg:items-start lg:gap-3 lg:self-auto',
            hasThumbnail
              ? 'col-span-8 col-start-5 row-start-1 md:col-span-9 md:col-start-4'
              : 'col-span-12',
          )}
        >
          <span className="text-xl font-bold tracking-tight break-keep whitespace-nowrap text-gray-950 md:text-3xl lg:text-xl xl:text-2xl">
            {report.label}
          </span>
          {price ? (
            <Badge tone="main" className="rounded-lg bg-white px-2 py-1 text-xs font-bold lg:text-sm">
              {price.original ? (
                <span className="mr-1 font-normal text-gray-400 line-through">{price.original}</span>
              ) : null}
              {price.final}
            </Badge>
          ) : null}
        </span>

        {guidebook && thumbnail ? (
          <span
            className={cn(
              'col-span-4 col-start-1 row-span-2 row-start-1 block md:col-span-3',
              'lg:col-auto lg:row-auto lg:mx-auto lg:w-full lg:max-w-lg',
            )}
          >
            <span
              className={cn(
                'block aspect-4/3 w-full overflow-hidden rounded-lg bg-white shadow-md',
                'transition-shadow duration-500 ease-out group-hover/panel:shadow-2xl group-has-focus-visible/panel:shadow-2xl',
                'motion-safe:transition-all motion-safe:group-hover/panel:-translate-y-2 motion-safe:group-has-focus-visible/panel:-translate-y-2',
              )}
            >
              <img
                src={thumbnail}
                alt={`${report.label} ${guidebook.title}`}
                loading={priority ? 'eager' : 'lazy'}
                width={573}
                height={430}
                className="block h-full w-full object-contain"
              />
            </span>
          </span>
        ) : null}

        <span
          className={cn(
            'inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap',
            'w-fit self-start lg:w-full',
            hasThumbnail
              ? 'col-span-8 col-start-5 row-start-2 md:col-span-9 md:col-start-4'
              : 'col-span-12',
            'border-blue-200 bg-white text-blue-600',
            'transition-colors duration-300 group-hover/panel:border-blue-500 group-hover/panel:bg-blue-500 group-hover/panel:text-white',
            'group-has-focus-visible/panel:border-blue-500 group-has-focus-visible/panel:bg-blue-500 group-has-focus-visible/panel:text-white',
            'group-active/panel:border-blue-500 group-active/panel:bg-blue-500 group-active/panel:text-white',
          )}
        >
          리포트 보기
          <span
            aria-hidden="true"
            className={cn(
              'icon-[lucide--arrow-right] h-4 w-4',
              'motion-safe:transition-transform motion-safe:duration-300',
              'motion-safe:group-hover/panel:translate-x-1.5 motion-safe:group-has-focus-visible/panel:translate-x-1.5',
            )}
          />
        </span>
      </Link>
    </li>
  );
}
