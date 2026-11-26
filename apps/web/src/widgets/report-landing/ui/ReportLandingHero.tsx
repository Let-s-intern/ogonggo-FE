import type { CSSProperties } from 'react';
import { cn } from '@ogonggo/ui';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';

/**
 * 랜딩 맨 위. 어두운 면 위에 파랑 오로라와 격자가 깔리고, 거대한 제목과 산업 이름 마퀴가 이어진다.
 * 발행 회차는 목데이터다(`model/landingMock.ts`).
 *
 * 제목 크기는 디자인 토큰 스케일(`text-7xl` = 36px 이 끝)을 넘는다. 이 화면은 첫 인상이 일인 연출형 랜딩이라
 * 스케일 안에 넣으면 제목이 절반이 된다. `clamp()` 로 375px 에서 44px, 1440px 에서 112px 까지 화면 폭을 따라
 * 자라게 하고, 이 예외는 이 파일의 제목 한 곳에만 둔다.
 */
export function ReportLandingHero({ issueLabel, issueCode }: { issueLabel: string; issueCode: string }) {
  return (
    <section className="relative isolate">
      {/* 배경. 전부 장식이라 보조기기에서 뺀다. 가장 위 가는 선이 밝은 헤더와 어두운 면의 경계를 잇는다. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-400/70 to-transparent" />
        <div className="report-landing-drift-a absolute -top-[28rem] left-1/2 h-[56rem] w-[72rem] max-w-none -translate-x-[70%]">
          <div className="report-landing-aurora-a h-full w-full" />
        </div>
        <div className="report-landing-drift-b absolute -top-[22rem] left-1/2 h-[46rem] w-[60rem] max-w-none translate-x-[5%]">
          <div className="report-landing-aurora-b h-full w-full" />
        </div>
        <div className="report-landing-grid absolute inset-0" />
        <div className="report-landing-noise absolute inset-0" />
      </div>

      <div className="mx-auto w-full max-w-page-padded px-5 pt-14 pb-16 md:pt-20 md:pb-20">
        <div className="report-landing-rise flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pr-3 pl-2.5 text-xs font-semibold tracking-[0.18em] text-blue-200">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-blue-400 motion-safe:animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-blue-400" />
            </span>
            WEEKLY INDUSTRY REPORT
          </span>
          <span className="text-xs font-semibold tracking-[0.18em] text-gray-400 tabular-nums">
            {issueCode}
          </span>
        </div>

        <h1
          className="report-landing-rise mt-7 text-[clamp(3rem,8.4vw,7rem)] leading-[1.04] font-extrabold tracking-[-0.045em] break-keep text-white md:mt-9"
          style={{ '--d': '80ms' } as CSSProperties}
        >
          <span className="block">
            이번 주 <span className="whitespace-nowrap">산업 트렌드를</span>
          </span>
          <span className="block bg-linear-to-r from-blue-200 via-blue-400 to-blue-500 bg-clip-text pb-[0.08em] text-transparent">
            채용공고와 함께
          </span>
          <span className="block">읽어요</span>
        </h1>

        <p
          className="report-landing-rise mt-7 max-w-xl text-base break-keep text-gray-300 md:mt-9 md:text-lg"
          style={{ '--d': '200ms' } as CSSProperties}
        >
          매주 따라가기 번거로운 산업 흐름을 실제 채용공고가 요구하는 역량과 이어 드려요. 자소서와
          포트폴리오에 녹일 수 있는 준비 활동까지 한 번에 받아 보세요.
        </p>

        <div
          className="report-landing-rise mt-9 flex flex-wrap items-center gap-3"
          style={{ '--d': '300ms' } as CSSProperties}
        >
          <a
            href="#industries"
            className={cn(
              'inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-gray-950',
              'shadow-[0_0_40px_-6px_rgb(74_118_255/0.7)] transition-colors hover:bg-blue-100',
              'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300',
            )}
          >
            산업 고르기
            <span aria-hidden="true" className="icon-[lucide--arrow-down] h-4 w-4" />
          </a>
          <a
            href="#structure"
            className={cn(
              'inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-base font-medium text-gray-100',
              'transition-colors hover:border-white/40 hover:bg-white/5',
              'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300',
            )}
          >
            리포트 구성 보기
          </a>
          <span className="ml-1 text-sm text-gray-400">
            매주 월요일 발행 · {issueLabel}
          </span>
        </div>

        <div
          aria-hidden="true"
          className="mt-12 hidden items-center gap-3 text-xs font-semibold tracking-[0.2em] text-gray-400 md:flex"
        >
          <span className="relative block h-12 w-px overflow-hidden bg-white/15">
            <span className="report-landing-scroll-line absolute inset-0 bg-blue-300" />
          </span>
          SCROLL
        </div>
      </div>

      <IndustryMarquee />
    </section>
  );
}

/**
 * 산업 이름이 흐르는 띠. 카드와 같은 내용이라 읽을 거리는 아니고 장식이다 — 보조기기에서는 뺀다.
 * 같은 묶음을 둘 이어 붙이고 절반만큼 밀어 끊김이 없다. 움직임은 `reportLanding.css` 가 정하고,
 * reduced-motion 에서는 멈춘다.
 */
function IndustryMarquee() {
  const group = (suffix: string) => (
    <ul className="flex shrink-0 items-center" key={suffix}>
      {INDUSTRY_REPORTS.map((report, index) => (
        <li key={report.slug} className="flex items-center">
          <span
            className={cn(
              'px-6 text-5xl font-extrabold tracking-[-0.03em] whitespace-nowrap md:px-10 md:text-7xl',
              index % 2 === 0
                ? 'text-white/90'
                : 'text-white/25',
            )}
          >
            {report.label}
          </span>
          <span className="icon-[lucide--sparkle] h-5 w-5 shrink-0 text-blue-400" />
        </li>
      ))}
    </ul>
  );
  return (
    <div
      aria-hidden="true"
      className="report-landing-marquee-wrap relative overflow-hidden border-y border-white/10 py-5 md:py-6"
    >
      <div className="report-landing-marquee flex w-max">
        {group('a')}
        {group('b')}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-gray-950 to-transparent md:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-gray-950 to-transparent md:w-40" />
    </div>
  );
}
