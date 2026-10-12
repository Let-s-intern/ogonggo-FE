import {
  getRecruitmentPosts,
  listPublicBootcamps,
  listPublicJobs,
  listPublicAnnouncements,
} from '@ogonggo/api';
import type {
  PageInfo,
  RecruitmentPostSummaryResponse,
  SuccessResponsePageResponseRecruitmentPostSummaryResponse,
  SuccessResponsePageResponseUserBootcampSummaryResponse,
  SuccessResponsePageResponseUserJobSummaryResponse,
  SuccessResponsePageResponseUserAnnouncementSummaryResponse,
  UserBootcampSummaryResponse,
  UserJobSummaryResponse,
  UserAnnouncementSummaryResponse,
} from '@ogonggo/api';

/**
 * `app/sitemap.ts`와 `app/rss/*.xml/route.ts`가 공유하는 목록 수집기.
 *
 * 둘 다 "상세 주소를 빠짐없이 낸다"는 같은 문제를 풀므로 쪽넘김 로직을 여기 한 곳에 둔다.
 * 상태·마감 여부로 좁히는 필터는 아무것도 보내지 않는다 — 마감된 공고도 상세 페이지가 여전히
 * 200으로 응답하므로(`widgets/*-detail/ui/*DetailView.tsx`의 404 판별은 존재하지 않는 id일
 * 때만 걸린다) 사이트맵·RSS에서도 계속 다룬다. 근거:
 * `.claude/tasks/memos/결정-sitemap-rss-2026-09-23.md`.
 */

/** 한 번에 받아 올 건수. 생성된 파라미터의 `@maximum 100`과 같다 — 상한보다 작게 받으면 같은 결과를 더 많은 호출로 나눌 뿐이다. */
const PAGE_SIZE = 100;

/**
 * 자원 하나에 허용하는 최대 쪽수. `PAGE_SIZE`와 곱하면 50,000건 — 사이트맵 한 파일에 실을 수
 * 있는 주소 수의 상한이다. 처음엔 20쪽(2,000건)이었는데 2026-10-12 채용공고가 3,923건이 되어
 * 절반 가까이가 사이트맵·RSS 에서 빠졌다. 이 선에 닿으면 남은 건은 조용히 비운다 — 그때는
 * 사이트맵을 여러 파일로 나눠야 한다(`generateSitemaps`).
 */
const MAX_PAGES = 500;

interface Page<T> {
  items: T[];
  pageInfo: PageInfo;
}

/** `pageInfo.totalPages`가 안내하는 대로, 또는 `MAX_PAGES`에 닿을 때까지 쪽을 이어 받는다. */
async function fetchAllPages<T>(fetchPage: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const response = await fetchPage(page);
    items.push(...response.items);

    if (response.items.length === 0 || page >= response.pageInfo.totalPages) {
      break;
    }
    page += 1;
  }

  return items;
}

const emptyPageInfo = (page: number): PageInfo => ({
  pageNum: page,
  pageSize: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
});

/** 부트캠프 상세 전체. `listPublicBootcamps`(`GET /api/v1/bootcamps`)를 상태 필터 없이 돈다. */
export async function fetchAllBootcamps(): Promise<UserBootcampSummaryResponse[]> {
  return fetchAllPages(async (page) => {
    const response = (await listPublicBootcamps({
      page,
      size: PAGE_SIZE,
    })) as unknown as SuccessResponsePageResponseUserBootcampSummaryResponse;
    return response.data ?? { items: [], pageInfo: emptyPageInfo(page) };
  });
}

/** 채용공고 상세 전체. `listPublicJobs`(`GET /api/v1/jobs`)를 필터 없이 돈다. */
export async function fetchAllJobs(): Promise<UserJobSummaryResponse[]> {
  return fetchAllPages(async (page) => {
    const response = (await listPublicJobs({
      page,
      size: PAGE_SIZE,
    })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;
    return response.data ?? { items: [], pageInfo: emptyPageInfo(page) };
  });
}

/**
 * 사이드·스터디 상세 전체. `getRecruitmentPosts`(`GET /api/v1/recruitment-posts`)를 돈다.
 * 이 엔드포인트만 `page`/`size`를 문자열로 받는다(`widgets/side-study-list/ui/SideStudyList.tsx`
 * 와 같은 이유).
 */
export async function fetchAllSideStudies(): Promise<RecruitmentPostSummaryResponse[]> {
  return fetchAllPages(async (page) => {
    const response = (await getRecruitmentPosts({
      page: String(page),
      size: String(PAGE_SIZE),
    })) as unknown as SuccessResponsePageResponseRecruitmentPostSummaryResponse;
    return response.data ?? { items: [], pageInfo: emptyPageInfo(page) };
  });
}

/** 공지 상세 전체. `listPublicAnnouncements`(`GET /api/v1/announcements`)를 돈다. 2026-09-23 실측 0건. */
export async function fetchAllNotices(): Promise<UserAnnouncementSummaryResponse[]> {
  return fetchAllPages(async (page) => {
    const response = (await listPublicAnnouncements({
      page,
      size: PAGE_SIZE,
    })) as unknown as SuccessResponsePageResponseUserAnnouncementSummaryResponse;
    return response.data ?? { items: [], pageInfo: emptyPageInfo(page) };
  });
}
