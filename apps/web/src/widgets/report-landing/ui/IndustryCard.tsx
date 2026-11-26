import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import type { IndustryReport } from '@/shared/config/industryReports';
import { landingPrice } from '../lib/price';

/**
 * 산업 한 칸. 카드 전체가 링크 하나이고 어디를 눌러도 판매 상세(`/reports/{slug}`)로 간다. 링크 안에 링크·버튼이 없고
 * 스크린리더는 `{산업 이름} 리포트 보기` 한 번만 읽는다.
 *
 * 홈의 채용공고 카드(`entities/job/ui/JobCard.tsx`)와 같은 껍데기(`rounded-2xl border-gray-100 bg-white shadow-sm`)에
 * 위에서 아래로 4:3 썸네일, 산업 이름, 산업 소개 줄(`tagline`, 마케팅팀 상세 이미지의 글), 가격과 `리포트 보기` 를 둔다.
 * 가격은 알약이 아니라 글자로 보인다(알약은 값싼 이벤트 딱지처럼 보인다). 정가가 있으면 취소선으로 함께 보인다.
 *
 * 들어올 때 카드가 차례로 떠오른다(`.ogonggo-rise-in`, 차례는 `delayMs`). 마우스를 올리거나 키보드 포커스가 오면 카드 줄 아래에 설명이 크게 뜨고(산업마다 다른 `지난주 핵심` 한 줄과 근거 세 줄 — `report.lastWeek`, 설정 파일에서 매주 갱신하며 지난주 내용이라고 밝혀 보인다. 마케팅팀 상세 이미지의 글이다), 카드가 15% 커지고(`motion-safe`, 이웃 위로 겹치도록 `z-10`) 테두리 없이 그림자만 깊어지며, 썸네일이
 * 카드 안에서 천천히 커지고(칸이 잘라 주므로 카드 크기는 그대로) 화살표가 오른쪽으로 간다. 나머지 카드는 `ul`(group/list)
 * 안에 올려진 카드가 있을 때만 흐려지고 20% 작아진다. 움직임을 줄인 환경은 색·그림자만 바뀐다.
 *
 * 호버한 카드는 이전 호버로 줄어 있던 상태(`scale-80`)를 즉시 푼다(`hover:duration-0`, 줄어든 크기에서 시작해 커지면
 * 작았다가 커지는 것처럼 보인다). 이어서 `Link` 가 평소 크기에서 15% 커진다. 나머지 카드가 줄어드는 것은 천천히 한다.
 *
 * 모바일(sm 미만)은 썸네일이 왼쪽, 글이 오른쪽인 가로 카드다. 썸네일은 렛츠커리어의 실제 이미지(573x430)를 자르지 않고
 * (`object-contain`) 두며 어느 폭에서도 원본 폭보다 작다. 읽지 못한 카드도 칸은 남기고 썸네일·가격만 빠진다.
 */
export function IndustryCard({
  report,
  guidebook,
  priority,
  delayMs,
  className,
}: {
  report: IndustryReport;
  /** 읽지 못했으면 `null`. */
  guidebook: LetsCareerGuidebook | null;
  /** 첫 화면에서 바로 보이는 썸네일은 서둘러 읽는다. */
  priority: boolean;
  /** 들어올 때 떠오르기 시작할 때까지의 지연(ms). 카드마다 달라 차례로 보인다. */
  delayMs: number;
  /** 칸(`li`)에 더할 클래스. 격자에서의 자리(`col-span`, `col-start`)를 정할 때 쓴다. */
  className?: string;
}) {
  const thumbnail = guidebook ? (guidebook.thumbnail ?? guidebook.desktopThumbnail) : null;
  const price = landingPrice(guidebook?.priceInfo ?? null);

  return (
    <li className={cn('group/item min-w-0', className)}>
      {/* 들어오기·흐려짐·줄어듦은 `li` 가 아니라 이 안쪽 칸이 맡는다. `li` 에 크기 변형이 걸려 있으면 아래 설명(`absolute`)의
          폭 기준이 변형이 끝날 때까지 카드 폭으로 바뀌어, 설명이 작았다가 줄 폭으로 커진다. */}
      <div
        style={{ animationDelay: `${delayMs}ms` }}
        className={cn(
          'ogonggo-rise-in h-full transition duration-300 hover:duration-0 has-focus-visible:duration-0',
          'group-has-hover/list:not-hover:opacity-50 motion-safe:group-has-hover/list:not-hover:scale-80',
          'group-has-focus-visible/list:not-has-focus-visible:opacity-50 motion-safe:group-has-focus-visible/list:not-has-focus-visible:scale-80',
        )}
      >
        <Link
          href={`/reports/${report.slug}`}
          aria-label={`${report.label} 리포트 보기`}
          className={cn(
            'group/card relative flex h-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-col sm:items-stretch',
            'transition duration-300 hover:border-transparent hover:shadow-2xl focus-visible:border-transparent focus-visible:shadow-2xl',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
            'hover:z-10 focus-visible:z-10 motion-safe:hover:scale-115 motion-safe:focus-visible:scale-115',
          )}
        >
          <span className="block aspect-4/3 w-2/5 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-full">
            {guidebook && thumbnail ? (
              <img
                src={thumbnail}
                alt={`${report.label} ${guidebook.title}`}
                loading={priority ? 'eager' : 'lazy'}
                width={573}
                height={430}
                className="block h-full w-full object-contain motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover/card:scale-110 motion-safe:group-focus-visible/card:scale-110"
              />
            ) : null}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4 sm:px-1 sm:pt-1">
            <span className="flex flex-col gap-1">
              <span className="text-xl font-bold break-keep text-gray-900">{report.label}</span>
              <span className="text-sm break-keep text-gray-600 sm:min-h-10 xl:min-h-0">
                {report.tagline}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2 sm:mt-auto sm:border-t sm:border-gray-100 sm:pt-3">
              <span className="text-base font-bold text-gray-900">
                {price?.original ? (
                  <span className="mr-1 text-sm font-normal text-gray-400 line-through">
                    {price.original}
                  </span>
                ) : null}
                {price?.final}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                리포트 보기
                <span
                  aria-hidden="true"
                  className="icon-[lucide--arrow-right] h-4 w-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/card:translate-x-1 motion-safe:group-focus-visible/card:translate-x-1"
                />
              </span>
            </span>
          </span>
        </Link>
      </div>
      {/* 카드 줄 아래 빈 자리에 크게 뜨는 설명. 위치 기준은 카드 줄(`ul`, `relative`)이라 줄 전체 폭을 쓰고, 자리를 차지하지
          않아 푸터가 밀리지 않는다. 설명이 카드(확대되는 `Link`) 안에 있으면 변형 때문에 기준이 카드로 바뀌므로 `Link` 밖에 둔다.
          호버·포커스 때만 보이고 눌림을 받지 않는다. 스크린리더에는 카드 이름이 이미 읽히므로 숨긴다. 줄이 5열인
          lg 이상에서만 둔다 — 그보다 좁은 화면은 호버가 드물고 설명이 놓일 빈 자리도 없다. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-full mt-10 hidden rounded-3xl border border-gray-100 bg-white px-10 py-5 shadow-2xl lg:flex',
          'opacity-0 transition duration-300 motion-safe:translate-y-3',
          'group-hover/item:translate-y-0 group-hover/item:opacity-100',
          'group-has-focus-visible/item:translate-y-0 group-has-focus-visible/item:opacity-100',
        )}
      >
        <div className="flex w-full items-center gap-10">
          <div className="flex w-72 shrink-0 flex-col items-start gap-3 xl:w-96">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                지난주 핵심
              </span>
              <span className="text-xs font-bold text-gray-600">{report.label}</span>
            </div>
            <p className="text-xl font-bold break-keep text-gray-900">{report.lastWeek.headline}</p>
            <p className="text-xs break-keep text-gray-500">
              지난주 리포트 기준이에요. 이번 주 내용은 리포트에서 확인해 주세요.
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 border-l border-gray-200 pl-10">
            {report.lastWeek.points.map((point, index) => (
              <p key={point} className="flex items-start gap-2.5 text-sm break-keep text-gray-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                  {index + 1}
                </span>
                {point}
              </p>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
