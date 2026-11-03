import { getPublicBootcamp, httpClient } from '@ogonggo/api';
import type {
  PageInfo,
  SuccessResponsePageResponseUserBootcampSummaryResponse,
  SuccessResponseUserBootcampDetailResponse,
} from '@ogonggo/api';
import { fetchAdExposures } from '@/entities/advertisement/api/adExposureApi';
import { AdLabel } from '@/entities/advertisement/ui/AdLabel';
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
/**
 * 적극 모집중 교육(`active_edu`, E1 교육 상단 고정과 같은 자리)의 광고와 그 부트캠프. 카드 칸이 노출 응답에 없어 상세를
 * 한 건씩 읽는다(채용공고의 `fetchAdJobs` 와 같다). 읽지 못한 것은 빼고, 광고 API 가 실패하면 빈 목록이다.
 */
async function fetchActiveEduAds(): Promise<BootcampSummary[]> {
  const ads = (await fetchAdExposures('ACTIVE_EDU')).filter((ad) => ad.target === 'BOOTCAMP');
  const bootcamps = await Promise.all(
    ads.map(async (ad) => {
      try {
        const response = (await getPublicBootcamp(
          ad.postId,
        )) as unknown as SuccessResponseUserBootcampDetailResponse;
        return response.data as BootcampSummary | undefined;
      } catch {
        return undefined;
      }
    }),
  );
  return bootcamps.filter((bootcamp): bootcamp is BootcampSummary => bootcamp !== undefined);
}

export async function BootcampList(query: BootcampListProps) {
  // 적극 모집중 광고는 첫 쪽 목록 맨 앞에 고정한다. 한 쪽 카드 수가 바뀌지 않게 목록 뒤에서 그만큼 덜어 낸다.
  const [{ items: pageItems, pageInfo }, pinned] = await Promise.all([
    fetchBootcampPage(query),
    query.page === 1 ? fetchActiveEduAds() : Promise.resolve([]),
  ]);
  const pinnedIds = pinned.map((bootcamp) => bootcamp.id);
  const items = pageItems
    .filter((bootcamp) => !pinnedIds.includes(bootcamp.id))
    .slice(0, Math.max(0, pageItems.length - pinned.length));

  return (
    <div className="flex w-full flex-col gap-6">
      <BootcampListControls query={query} />
      {items.length + pinned.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">교육·부트캠프가 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {pinned.map((bootcamp) => (
            <li key={`ad-${bootcamp.id}`} className="relative" data-ad-placement="ACTIVE_EDU">
              <BootcampCard bootcamp={bootcamp} />
              <AdLabel className="absolute top-2 left-2" />
            </li>
          ))}
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
