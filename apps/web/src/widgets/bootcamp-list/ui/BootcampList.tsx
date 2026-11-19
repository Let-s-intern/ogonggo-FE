import { httpClient } from '@ogonggo/api';
import type {
  PageInfo,
  SuccessResponsePageResponseUserBootcampSummaryResponse,
} from '@ogonggo/api';
import type { BootcampSummary } from '@/entities/bootcamp/model/types';
import { BootcampCard } from '@/entities/bootcamp/ui/BootcampCard';
import type { AdSlot } from '@/shared/ads/adPosting';
import { fetchAdPostings, MAX_AD_POSTINGS, toAdSlot } from '@/shared/ads/fetchAdPostings';
import { RememberListHref } from '@/shared/ui/ListReturnLink';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import {
  buildBootcampListHref,
  pickBootcampKeyword,
  TAB_CATEGORIES,
  type BootcampListQuery,
} from '../lib/query';
import { BootcampListControls } from './BootcampListControls';

export type BootcampListProps = BootcampListQuery;

/**
 * `ListPublicBootcampsParams`의 `page`/`size`/`sort`/`category`/`keyword`를 보낸다. URL을 직접 만들어
 * `httpClient`를 부르는 것은 `widgets/job-list/ui/JobList.tsx`와 같은 방식이다. 목업 모드에서는
 * MSW 핸들러가 같은 파라미터로 거른다(`packages/api/src/mocks/handlers.ts`).
 */
const PAGE_SIZE = 12;

function buildBootcampsRequestUrl({ page, sort, tab, q }: BootcampListQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(PAGE_SIZE));
  params.set('sort', sort);
  const category = TAB_CATEGORIES[tab];
  if (category) {
    params.set('category', category);
  }
  const keyword = pickBootcampKeyword(q);
  if (keyword) {
    params.set('keyword', keyword);
  }
  return `/api/v1/bootcamps?${params.toString()}`;
}

async function fetchBootcampPage(
  query: BootcampListQuery,
): Promise<{ items: BootcampSummary[]; pageInfo: PageInfo }> {
  const response = await httpClient<SuccessResponsePageResponseUserBootcampSummaryResponse>(
    buildBootcampsRequestUrl(query),
  );

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: query.page, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0 },
    }
  );
}

/**
 * 첫 쪽 맨 앞에 넣을 광고 공고 칸(`BOOTCAMP_LIST`, PRD 6.8·D13). 채용공고 목록과 같은 규칙이다 — 2쪽부터는 없고,
 * 검색어가 있으면 운영 회사명·과정명에 든 것만, 최대 3칸.
 *
 * `전체` 가 아닌 탭에서는 넣지 않는다. 탭의 분류(`category`)는 등록 경로로 갈리는데 요약 응답에 그 값이 없어, 광고가
 * 그 탭에 맞는지 알 수 없다.
 */
async function fetchListAds(
  query: BootcampListQuery,
): Promise<{ bootcamp: BootcampSummary; ad: AdSlot }[]> {
  if (query.page !== 1 || TAB_CATEGORIES[query.tab]) {
    return [];
  }
  const keyword = pickBootcampKeyword(query.q)?.toLowerCase();
  const postings = await fetchAdPostings('BOOTCAMP_LIST');
  return postings
    .flatMap(({ bootcamp, ...posting }) =>
      bootcamp &&
      (!keyword || `${bootcamp.companyName} ${bootcamp.title}`.toLowerCase().includes(keyword))
        ? [{ ...posting, bootcamp }]
        : [],
    )
    .slice(0, MAX_AD_POSTINGS)
    .map((posting, index) => ({ bootcamp: posting.bootcamp, ad: toAdSlot(posting, index + 1) }));
}

/**
 * `교육부트캠프.png`의 목록 본문 — 컨트롤 한 줄 + 4열 카드 그리드 + 번호 페이지네이션. 첫 쪽은 광고 공고 칸이 맨
 * 앞이고, 같은 과정이 일반 목록에도 있으면 일반 쪽에서 뺀다.
 */
export async function BootcampList(query: BootcampListProps) {
  const [{ items: pageItems, pageInfo }, ads] = await Promise.all([
    fetchBootcampPage(query),
    fetchListAds(query),
  ]);
  const adBootcampIds = new Set(ads.map(({ bootcamp }) => bootcamp.id));
  const cards: { bootcamp: BootcampSummary; ad?: AdSlot }[] = [
    ...ads,
    ...pageItems.filter(({ id }) => !adBootcampIds.has(id)).map((bootcamp) => ({ bootcamp })),
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <RememberListHref kind="bootcamps" href={buildBootcampListHref(query)} />
      <BootcampListControls query={query} />
      {cards.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">교육·부트캠프가 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {cards.map(({ bootcamp, ad }, index) => (
            <li key={ad ? `ad-${ad.adId}` : bootcamp.id}>
              <BootcampCard
                bootcamp={bootcamp}
                ad={ad}
                tracking={{ listPosition: index + 1, pageNumber: pageInfo.pageNum }}
              />
            </li>
          ))}
        </ul>
      )}
      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildBootcampListHref(query, { page })}
      />
    </div>
  );
}
