import { NextResponse } from 'next/server';
import { SITE_ORIGIN } from '@/shared/config/site';
import { fetchAllSideStudies } from '@/shared/lib/publicListings';
import { buildRssFeed } from '@/shared/lib/rss';

/**
 * `/rss/side-studies.xml`. `pubDate`는 `recruitmentStartDate`에서 뺀다 — 사이드·스터디 목록
 * 응답에는 채용공고·부트캠프의 `recruitmentStartAt` 같은 선택 필드가 아니라 항상 있는 필수
 * 필드라 모든 항목이 날짜를 낸다. 근거: `.claude/tasks/memos/결정-sitemap-rss-2026-09-23.md`.
 *
 * 마감된 모집도 싣는다 — `shared/lib/publicListings.ts`의 `fetchAllSideStudies`가 상태 필터
 * 없이 돈다.
 */
export async function GET() {
  const sideStudies = await fetchAllSideStudies();

  const xml = buildRssFeed({
    title: '오늘의 공고 · 사이드·스터디',
    description: '오늘의 공고에 새로 올라온 사이드 프로젝트·스터디.',
    link: `${SITE_ORIGIN}/side-studies`,
    feedUrl: `${SITE_ORIGIN}/rss/side-studies.xml`,
    items: sideStudies.map((sideStudy) => ({
      title: sideStudy.title,
      link: `${SITE_ORIGIN}/side-studies/${sideStudy.id}`,
      pubDate: sideStudy.recruitmentStartDate,
    })),
  });

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
