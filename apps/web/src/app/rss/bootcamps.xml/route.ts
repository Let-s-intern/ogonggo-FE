import { NextResponse } from 'next/server';
import { SITE_ORIGIN } from '@/shared/config/site';
import { fetchAllBootcamps } from '@/shared/lib/publicListings';
import { buildRssFeed } from '@/shared/lib/rss';

/**
 * `/rss/bootcamps.xml`. `pubDate`는 `recruitmentStartAt`(모집 시작 시각)에서 뺀다 — 근거는
 * `app/rss/jobs.xml/route.ts`와 같다(`.claude/tasks/memos/결정-sitemap-rss-2026-09-23.md`).
 *
 * 마감된 과정도 싣는다 — `shared/lib/publicListings.ts`의 `fetchAllBootcamps`가 상태 필터 없이
 * 돈다.
 */
export async function GET() {
  const bootcamps = await fetchAllBootcamps();

  const xml = buildRssFeed({
    title: '오늘의 공고 · 부트캠프',
    description: '오늘의 공고에 새로 올라온 교육·부트캠프.',
    link: `${SITE_ORIGIN}/bootcamps`,
    feedUrl: `${SITE_ORIGIN}/rss/bootcamps.xml`,
    items: bootcamps.map((bootcamp) => ({
      title: `${bootcamp.companyName} · ${bootcamp.title}`,
      link: `${SITE_ORIGIN}/bootcamps/${bootcamp.id}`,
      pubDate: bootcamp.recruitmentStartAt,
    })),
  });

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
