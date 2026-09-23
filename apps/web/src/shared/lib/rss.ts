/**
 * RSS 2.0 피드 조립기. `app/rss/*.xml/route.ts` 셋(채용공고·부트캠프·사이드·스터디)이 공유한다.
 *
 * Next에는 `sitemap.ts`/`robots.ts` 같은 RSS 전용 파일 규칙이 없어 일반 Route Handler로
 * 만든다. 폴더 이름에 `.xml`을 그대로 넣으면(`app/rss/jobs.xml/route.ts`) 그 문자열이 URL
 * 세그먼트가 된다(node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
 * route.md) — `/rss/jobs.xml`이 그대로 나간다.
 *
 * 형식은 RSS 2.0으로 정했다. Atom도 후보였지만 RSS 2.0이 검색엔진·피드 리더 양쪽에서 더 널리
 * 쓰이고, 이 저장소에 이미 있는 서비스형 태그(sitemap.xml 등)와 같은 급의 단순한 포맷이다.
 * 근거: `.claude/tasks/memos/결정-sitemap-rss-2026-09-23.md`.
 */

export interface RssItem {
  title: string;
  link: string;
  /** ISO 문자열. 응답에 진짜로 있는 필드에서만 채운다 — 없으면 그 항목은 `pubDate`를 낸다. */
  pubDate?: string;
  description?: string;
}

export interface RssFeed {
  title: string;
  description: string;
  /** 이 피드가 다루는 목록 화면 주소(채널의 `<link>`). */
  link: string;
  /** 피드 자신의 주소(`<atom:link rel="self">`) — 리더가 구독 갱신 시 이 주소로 다시 부른다. */
  feedUrl: string;
  items: RssItem[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC 822 형식(`<pubDate>`가 요구하는 형식)으로 바꾼다. 파싱할 수 없는 값은 건너뛴다. */
function toRfc822(isoDate: string): string | undefined {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? undefined : date.toUTCString();
}

function buildItemXml(item: RssItem): string {
  const pubDate = item.pubDate ? toRfc822(item.pubDate) : undefined;

  return [
    '<item>',
    `<title>${escapeXml(item.title)}</title>`,
    `<link>${escapeXml(item.link)}</link>`,
    `<guid isPermaLink="true">${escapeXml(item.link)}</guid>`,
    pubDate ? `<pubDate>${pubDate}</pubDate>` : '',
    item.description ? `<description>${escapeXml(item.description)}</description>` : '',
    '</item>',
  ]
    .filter(Boolean)
    .join('');
}

export function buildRssFeed(feed: RssFeed): string {
  const itemsXml = feed.items.map(buildItemXml).join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${escapeXml(feed.title)}</title>`,
    `<link>${escapeXml(feed.link)}</link>`,
    `<description>${escapeXml(feed.description)}</description>`,
    '<language>ko</language>',
    `<atom:link href="${escapeXml(feed.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    itemsXml,
    '</channel>',
    '</rss>',
  ].join('');
}
