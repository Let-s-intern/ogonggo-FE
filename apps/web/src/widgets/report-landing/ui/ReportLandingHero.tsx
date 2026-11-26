import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { IndustryCard } from './IndustryCard';

/**
 * `/reports` 의 전부. 헤더 아래에서 화면 높이를 채우는 히어로 하나이고, 히어로 자체가 산업 다섯으로 들어가는 입구다.
 * 바탕은 사이트 기본 흰색이고 내용(소개 글과 카드 다섯)은 헤더·푸터와 같은 본문 기준선(`mx-auto max-w-page-padded px-5`)
 * 안에서 헤더 바로 아래(`pt-4`)부터 위에서 아래로 선다. 가운데에 두면 위가 비어 보여서 위로 붙였다.
 *
 * 소개 문장과 구성 태그는 넓은 화면(lg)에서 한 줄에 놓아 세로를 아낀다(호버 설명이 화면 안에 들어오도록). 들어올 때 소개 글 네 줄과 카드 다섯이 차례로 떠오른다. 이미 있는 `.ogonggo-rise-in`(`globals.css`)을 쓰고 차례는
 * `animationDelay` 로 준다. 움직임을 줄인 환경은 그 클래스가 알아서 멈춘다.
 *
 * 높이: 바깥 `min-h-svh` 가 뷰포트 높이이고 헤더가 그 위에 얹히므로 헤더가 차지하는 높이만큼 아래 여백을 음수로 뺀다
 * (`-mb-24` 데스크톱, 모바일 `-mb-28`). 헤더나 하단 탭 높이가 바뀌면 이 값도 맞춘다.
 *
 * 글은 모두 마케팅팀이 만든 상세 이미지에 이미 적힌 것이다 — 머리말 `오늘의 공고 · 주간 산업 트렌드 리포트`, 소개
 * `한 주의 산업 흐름을 '취업 언어'로 번역해 드려요`, 구성 `분야별 산업 뉴스 · 실제 JD 연결 · 자소서 활용 활동 · 용어 각주`.
 * 회차·발행 주기·무료 이벤트처럼 근거가 확인되지 않은 말은 두지 않는다(PRD 11.3 L7).
 */
/** 리포트 구성. 마케팅팀 상세 이미지의 `분야별 산업 뉴스 · 실제 JD 연결 · 자소서 활용 활동 · 용어 각주` 를 항목별 태그로 보인다. */
const FEATURES = ['분야별 산업 뉴스', '실제 JD 연결', '자소서 활용 활동', '용어 각주'] as const;

export function ReportLandingHero({
  guidebooks,
}: {
  /** `INDUSTRY_REPORTS` 와 같은 순서. 읽지 못한 칸은 `null`. */
  guidebooks: readonly (LetsCareerGuidebook | null)[];
}) {
  return (
    <div className="-mb-28 flex min-h-svh flex-col md:-mb-24">
      <section
        aria-labelledby="reports-hero-title"
        className="flex flex-1 flex-col pt-4 pb-30 md:pb-26"
      >
        <div className="mx-auto flex w-full max-w-page-padded flex-col gap-8 px-5">
          <div className="flex flex-col gap-2">
            <p className="ogonggo-rise-in text-sm font-bold text-blue-600">
              오늘의 공고 · 주간 산업 트렌드 리포트
            </p>
            <h1
              id="reports-hero-title"
              style={{ animationDelay: '80ms' }}
              className="ogonggo-rise-in text-3xl font-bold tracking-tight break-keep text-gray-900 md:text-4xl"
            >
              이번 주 산업 트렌드 분석 리포트
            </h1>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
              <p
                style={{ animationDelay: '160ms' }}
                className="ogonggo-rise-in text-base break-keep text-gray-700 md:text-xl"
              >
                한 주의 산업 흐름을 &lsquo;취업 언어&rsquo;로 번역해 드려요
              </p>
              <ul
                style={{ animationDelay: '240ms' }}
                className="ogonggo-rise-in flex flex-wrap gap-2"
              >
                {FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ul className="group/list relative grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {INDUSTRY_REPORTS.map((report, index) => (
              <IndustryCard
                key={report.slug}
                report={report}
                guidebook={guidebooks[index] ?? null}
                priority={index < 3}
                delayMs={320 + index * 80}
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
