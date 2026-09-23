import { NextResponse } from 'next/server';
import { SITE_ORIGIN } from '@/shared/config/site';
import { fetchAllJobs } from '@/shared/lib/publicListings';
import { buildRssFeed } from '@/shared/lib/rss';

/**
 * `/rss/jobs.xml`. 채용공고는 목록 화면이 없어(`/jobs` 404, 2026-09-23 실측) 채널 `<link>`는
 * 검색을 대신하는 홈(`/`)을 가리킨다.
 *
 * `pubDate`는 `recruitmentStartAt`(모집 시작 시각)에서 뺀다 — 작성 시각 필드는 없고, 이 값이
 * 실제 데이터에 있는 것 중 가장 "이 공고가 후보에게 열린 시점"에 가깝다. 값이 없는 공고는 그
 * 항목만 `pubDate`를 비운다(`buildRssFeed`). 근거:
 * `.claude/tasks/memos/결정-sitemap-rss-2026-09-23.md`.
 *
 * 마감된 공고도 싣는다 — `shared/lib/publicListings.ts`의 `fetchAllJobs`가 상태 필터 없이 돌기
 * 때문이고, 이유는 그 파일 주석과 위 메모에 있다.
 */
export async function GET() {
  const jobs = await fetchAllJobs();

  const xml = buildRssFeed({
    title: '오늘의 공고 · 채용공고',
    description: '오늘의 공고에 새로 올라온 채용공고.',
    link: `${SITE_ORIGIN}/`,
    feedUrl: `${SITE_ORIGIN}/rss/jobs.xml`,
    items: jobs.map((job) => ({
      title: `${job.companyName} · ${job.title}`,
      link: `${SITE_ORIGIN}/jobs/${job.id}`,
      pubDate: job.recruitmentStartAt,
    })),
  });

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
