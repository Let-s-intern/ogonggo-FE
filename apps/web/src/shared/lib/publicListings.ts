import {
  getRecruitmentPosts,
  listPublicBootcamps,
  listPublicJobs,
  listPublicNotices,
} from '@ogonggo/api';
import type {
  PageInfo,
  RecruitmentPostSummaryResponse,
  SuccessResponsePageResponseRecruitmentPostSummaryResponse,
  SuccessResponsePageResponseUserBootcampSummaryResponse,
  SuccessResponsePageResponseUserJobSummaryResponse,
  SuccessResponsePageResponseUserNoticeSummaryResponse,
  UserBootcampSummaryResponse,
  UserJobSummaryResponse,
  UserNoticeSummaryResponse,
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
 * 자원 하나에 허용하는 최대 쪽수. `PAGE_SIZE`와 곱하면 2,000건 — 2026-09-23 실측(부트캠프
 * 110건)의 18배쯤 되는 여유다. 이 선에 닿으면 그 자원이 예상 밖으로 폭증했다는 뜻이라, 빌드를
 * 막는 대신 남은 건은 이번 빌드에서 조용히 비운다(다음 빌드가 다시 채운다). 근거는 위 메모와
 * 같다.
 */
const MAX_PAGES = 20;

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

/** 공지 상세 전체. `listPublicNotices`(`GET /api/v1/notices`)를 돈다. 2026-09-23 실측 0건. */
export async function fetchAllNotices(): Promise<UserNoticeSummaryResponse[]> {
  return fetchAllPages(async (page) => {
    const response = (await listPublicNotices({
      page,
      size: PAGE_SIZE,
    })) as unknown as SuccessResponsePageResponseUserNoticeSummaryResponse;
    return response.data ?? { items: [], pageInfo: emptyPageInfo(page) };
  });
}
