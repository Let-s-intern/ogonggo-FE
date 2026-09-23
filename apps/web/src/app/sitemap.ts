import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/shared/config/site';
import {
  fetchAllBootcamps,
  fetchAllJobs,
  fetchAllNotices,
  fetchAllSideStudies,
} from '@/shared/lib/publicListings';

/**
 * `app/sitemap.ts`는 Next가 `/sitemap.xml`로 내보내는 파일 규칙이다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md).
 * 빌드 시점에 한 번 실행돼 정적 파일로 구워진다 — `robots.ts`와 같다.
 *
 * `robots`가 막는 경로(`/mypage`, `/login`, `/signup`, `/auth`, `/calendar`)는 여기서도 내지
 * 않는다. 사이트맵이 알려 주고 robots가 막는 주소가 있으면 크롤러가 둘 중 뭘 믿을지 갈린다.
 *
 * `/jobs` 목록 화면은 없다(2026-09-23 실측, 직접 열면 404) — 공고 검색은 홈(`/`)의 검색·필터가
 * 대신한다. 그래서 채용공고는 상세(`/jobs/[jobId]`)만 싣는다.
 *
 * 상세 주소는 `fetchAll*`(`shared/lib/publicListings.ts`)가 쪽넘김으로 모아 온다 — 건수 상한과
 * 호출 횟수 근거는 그 파일과 `.claude/tasks/memos/결정-sitemap-rss-2026-09-23.md`에 있다.
 *
 * **마감된 공고도 싣는다.** 상세 페이지는 마감 후에도 200으로 계속 서빙되고(존재하지 않는 id일
 * 때만 404), 목록 API도 상태 필터를 걸지 않아 마감분을 함께 돌려준다 — 위 메모에 근거를 적었다.
 *
 * `lastModified`는 실제로 있는 값만 쓴다. `closedAt`(채용공고·부트캠프)은 응답에 있으면 최근
 * 변경을 뜻하는 진짜 신호라 그대로 쓰고, 없으면 필드를 아예 비운다 — 거짓 날짜는 크롤러가 다시
 * 오는 주기를 틀어지게 한다(task 1.3). 사이드·스터디 목록 응답에는 그런 필드가 없어 항상 비운다.
 * 공지는 `createdAt`이 항상 있는 진짜 필드라 그대로 쓴다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bootcamps, jobs, sideStudies, notices] = await Promise.all([
    fetchAllBootcamps(),
    fetchAllJobs(),
    fetchAllSideStudies(),
    fetchAllNotices(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_ORIGIN}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_ORIGIN}/about`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_ORIGIN}/bootcamps`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_ORIGIN}/side-studies`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_ORIGIN}/notices`, changeFrequency: 'weekly', priority: 0.3 },
  ];

  const bootcampEntries: MetadataRoute.Sitemap = bootcamps.map((bootcamp) => ({
    url: `${SITE_ORIGIN}/bootcamps/${bootcamp.id}`,
    lastModified: bootcamp.closedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE_ORIGIN}/jobs/${job.id}`,
    lastModified: job.closedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const sideStudyEntries: MetadataRoute.Sitemap = sideStudies.map((sideStudy) => ({
    url: `${SITE_ORIGIN}/side-studies/${sideStudy.id}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const noticeEntries: MetadataRoute.Sitemap = notices.map((notice) => ({
    url: `${SITE_ORIGIN}/notices/${notice.id}`,
    lastModified: notice.createdAt,
    changeFrequency: 'monthly',
    priority: 0.3,
  }));

  return [
    ...staticEntries,
    ...bootcampEntries,
    ...jobEntries,
    ...sideStudyEntries,
    ...noticeEntries,
  ];
}
