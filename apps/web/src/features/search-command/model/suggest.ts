import { httpClient } from '@ogonggo/api';
import type {
  SuccessResponseListString,
  SuccessResponsePageResponseUserBootcampSummaryResponse,
  SuccessResponsePageResponseUserJobSummaryResponse,
} from '@ogonggo/api';

/** 무엇을 검색하는 모달인가. 미리 보이는 결과와 이동할 상세 주소가 갈린다. */
export type SearchScope = 'jobs' | 'bootcamps';

export interface SearchSuggestions {
  /** 검색어가 들어간 회사명. 고르면 그 이름으로 목록을 검색한다. */
  companies: string[];
  /** 검색어가 제목이나 회사명에 들어간 공고(또는 부트캠프). 고르면 상세로 간다. */
  items: { id: number; title: string; companyName: string; href: string }[];
}

const MAX_COMPANIES = 5;
const MAX_ITEMS = 5;

/**
 * 목록 API 가 받는 검색어 길이. 벗어나면 400 이다(`widgets/job-list/lib/query.ts` 의 `KEYWORD_MIN_LENGTH`,
 * `widgets/bootcamp-list/lib/query.ts` 의 `pickBootcampKeyword`). 회사명 검색은 1글자부터 된다.
 */
const LIST_KEYWORD_MIN = 2;
const LIST_KEYWORD_MAX = 100;

/**
 * 백엔드를 고치지 않고 이미 있는 공개 API 셋으로 연관 검색을 만든다.
 *
 * - 회사명: `GET /api/v1/company-names` — 채용공고·부트캠프·기업 회원의 회사명에서 검색어로 시작하는 이름이 먼저다.
 * - 공고·부트캠프: `GET /api/v1/jobs`·`/api/v1/bootcamps` 의 `keyword` — 제목이나 회사명에 검색어가 들어간 것.
 *   목록과 같은 최신순 첫 쪽에서 몇 건만 받는다. 목록에 걸어 둔 필터는 싣지 않는다.
 *
 * 하나가 실패해도 나머지는 보인다. 연관 검색은 거들 뿐이라 실패를 알리지 않는다.
 */
export async function fetchSuggestions(
  scope: SearchScope,
  keyword: string,
): Promise<SearchSuggestions> {
  const params = new URLSearchParams({ keyword });
  const listParams = new URLSearchParams({
    page: '1',
    size: String(MAX_ITEMS),
    sort: 'LATEST',
    keyword,
  });
  const listable = keyword.length >= LIST_KEYWORD_MIN && keyword.length <= LIST_KEYWORD_MAX;

  const [companies, items] = await Promise.allSettled([
    httpClient<SuccessResponseListString>(`/api/v1/company-names?${params}`),
    listable ? fetchItems(scope, listParams) : Promise.resolve([]),
  ]);

  return {
    companies:
      companies.status === 'fulfilled' ? (companies.value.data ?? []).slice(0, MAX_COMPANIES) : [],
    items: items.status === 'fulfilled' ? items.value : [],
  };
}

async function fetchItems(
  scope: SearchScope,
  params: URLSearchParams,
): Promise<SearchSuggestions['items']> {
  if (scope === 'jobs') {
    const body = await httpClient<SuccessResponsePageResponseUserJobSummaryResponse>(
      `/api/v1/jobs?${params}`,
    );
    return (body.data?.items ?? []).map(({ id, title, companyName }) => ({
      id,
      title,
      companyName,
      href: `/jobs/${id}`,
    }));
  }
  const body = await httpClient<SuccessResponsePageResponseUserBootcampSummaryResponse>(
    `/api/v1/bootcamps?${params}`,
  );
  return (body.data?.items ?? []).map(({ id, title, companyName }) => ({
    id,
    title,
    companyName,
    href: `/bootcamps/${id}`,
  }));
}
