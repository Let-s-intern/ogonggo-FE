import { httpClient } from '@ogonggo/api';
import type {
  PageInfo,
  SuccessResponsePageResponseUserBootcampSummaryResponse,
} from '@ogonggo/api';
import type { BootcampSummary } from '@/entities/bootcamp/model/types';
import { BootcampCard } from '@/entities/bootcamp/ui/BootcampCard';
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

/** `교육부트캠프.png`의 목록 본문 — 컨트롤 한 줄 + 4열 카드 그리드 + 번호 페이지네이션. */
export async function BootcampList(query: BootcampListProps) {
  const { items, pageInfo } = await fetchBootcampPage(query);

  return (
    <div className="flex w-full flex-col gap-6">
      <BootcampListControls query={query} />
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">교육·부트캠프가 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {items.map((bootcamp, index) => (
            <li key={bootcamp.id}>
              <BootcampCard
                bootcamp={bootcamp}
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
