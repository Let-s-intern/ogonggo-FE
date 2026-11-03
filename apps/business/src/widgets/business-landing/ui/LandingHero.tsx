import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { CONSULT_HREF, SALES_EMAIL } from '@/shared/config/site';
import { HERO_STATS, STATS_BASIS } from '../model/content';

/** 랜딩 안에서 섹션으로 건너뛰는 띠. 시안 상단 메뉴(`오공고 구좌` ~ `진행 방법`)다. */
export const LANDING_SECTIONS = [
  { id: 'placements', label: '오공고 구좌' },
  { id: 'channels', label: '렛츠커리어 채널' },
  { id: 'packages', label: '함께 집행' },
  { id: 'cases', label: '사례' },
  { id: 'process', label: '진행 방법' },
] as const;

/**
 * 랜딩 첫 화면(시안 히어로). 파란 띠 위에 문구와 CTA 셋, 그 아래 수치 다섯. 가입 화면의 파란 띠
 * (`widgets/signup-banner`)와 같은 그라데이션을 쓴다.
 */
export function LandingHero() {
  return (
    <section className="bg-linear-to-r from-blue-600 to-blue-400 text-white">
      <div className="mx-auto flex max-w-page-padded flex-col gap-8 px-5 pt-14 pb-12 md:pt-20 md:pb-16">
        <p className="text-sm font-semibold tracking-wide text-white/80">
          오늘의 공고 FOR BUSINESS
        </p>
        <h1 className="text-3xl leading-tight font-bold md:text-5xl md:leading-tight">
          취준생에게 좋은 공고를,
          <br />
          기업에게 좋은 인재를
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
          인턴·신입 채용을 위한 가장 효과적인 채널. 지원 의사가 높은 취준생이 매일 공고를 찾는
          10만명의 취준생이 함께하는 오늘의공고 지면과, 렛츠커리어 채널에 공고를 알려보세요.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-white text-blue-600 hover:bg-blue-50">
            <a href={CONSULT_HREF}>광고 상담 신청</a>
          </Button>
          <Button asChild className="border border-white/70 bg-transparent hover:bg-white/10">
            <Link href="#placements">광고 구좌 둘러보기</Link>
          </Button>
          <Button asChild className="border border-white/70 bg-transparent hover:bg-white/10">
            <a
              href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent('오늘의공고 광고 소개서 · 견적 문의')}`}
            >
              소개서 · 견적 문의
            </a>
          </Button>
        </div>
        <dl className="grid grid-cols-2 gap-3 pt-4 md:grid-cols-5">
          {HERO_STATS.map((stat) => (
            <div key={stat.value} className="rounded-md bg-white/10 px-4 py-4">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-xl font-bold md:text-2xl">{stat.value}</dd>
              <dd className="pt-1 text-xs text-white/80 md:text-sm">{stat.label}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-white/70">{STATS_BASIS}</p>
      </div>
      <nav aria-label="랜딩 섹션" className="border-t border-white/20 bg-white/5">
        <div className="mx-auto flex h-12 max-w-page-padded items-center gap-6 overflow-x-auto px-5 text-sm whitespace-nowrap">
          {LANDING_SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="text-white/85 hover:text-white">
              {section.label}
            </a>
          ))}
        </div>
      </nav>
    </section>
  );
}
