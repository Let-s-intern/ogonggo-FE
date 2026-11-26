import { Badge } from '@ogonggo/ui';
import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { IndustryPanel } from './IndustryPanel';

/**
 * `/reports` 의 전부. 헤더 아래에서 화면 높이를 채우는 히어로 하나이고, 히어로 자체가 산업 다섯으로 들어가는 입구다.
 * 위쪽에 제목과 한 줄 안내, (다섯 가격이 같을 때만) 가격 칩이 있고 나머지 높이를 산업 패널 다섯이 쓴다. 바탕은 박스 없이 화면
 * 폭 전체에 깐 옅은 파랑(`bg-blue-50`) 한 겹이고 그 위에 흰 패널이 바로 놓인다. 제목과 패널은 헤더·푸터와 같은 본문
 * 기준선(`mx-auto max-w-page-padded px-5`) 안에 선다.
 *
 * 높이: 바깥 `min-h-svh` 가 뷰포트 높이이고 헤더가 그 위에 얹히므로, 바탕은 헤더가 차지하는 높이만큼 아래 여백을 두어 패널이
 * 첫 화면 안에서 끝난다(바탕 색은 그 아래로 이어진다). 데스크톱·태블릿(md)은 헤더(`h-10` + `h-14` 에 테두리 2px)에 맞춰
 * `md:pb-26`, 모바일은 헤더(`h-14`)와 하단 탭(`h-16`)을 더한 `pb-30` 이다. 헤더나 하단 탭 높이가 바뀌면 이 값도 맞춘다.
 *
 * 화면의 글은 제목·가격 칩·산업 이름·`리포트 보기` 뿐이다. 회차·발행 주기·구성을 말하는 문구는 근거가 없어 두지 않는다(PRD 11.3 L7).
 */
export function ReportLandingHero({
  price,
  guidebooks,
}: {
  /** 다섯 상품의 공통 결제 금액(`990원`, `무료`). 모르면 `null` 이고 가격 칩을 뺀다. */
  price: string | null;
  /** `INDUSTRY_REPORTS` 와 같은 순서. 읽지 못한 칸은 `null`. */
  guidebooks: readonly (LetsCareerGuidebook | null)[];
}) {
  return (
    <div className="-mb-28 flex min-h-svh flex-col md:-mb-24">
      <section
        aria-labelledby="reports-hero-title"
        className="flex flex-1 flex-col pt-6 pb-30 lg:pt-8"
      >
        <div className="mx-auto flex w-full max-w-page-padded flex-1 flex-col gap-4 px-5 lg:gap-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-1 md:gap-2">
              <h1
                id="reports-hero-title"
                className="text-2xl font-bold tracking-tight break-keep text-balance text-gray-800 md:text-4xl lg:text-5xl"
              >
                이번 주 산업 트렌드 분석 리포트
              </h1>
              <p className="text-sm break-keep text-gray-600 md:text-base">
                관심 있는 산업을 골라 리포트를 열어 보세요
              </p>
            </div>
            {price ? (
              <Badge
                tone="main"
                className="w-fit shrink-0 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap"
              >
                산업별 한 편&nbsp;<span className="font-bold">{price}</span>
              </Badge>
            ) : null}
          </div>

          <ul className="group/list flex flex-1 flex-col gap-2 md:gap-3 lg:flex-row lg:items-stretch lg:gap-4">
            {INDUSTRY_REPORTS.map((report, index) => (
              <IndustryPanel
                key={report.slug}
                report={report}
                guidebook={guidebooks[index] ?? null}
                priority={index < 2}
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
