import { httpClient } from '@ogonggo/api';
import type {
  PageInfo,
  SuccessResponsePageResponseUserBootcampSummaryResponse,
} from '@ogonggo/api';
import type { BootcampSummary } from '@/entities/bootcamp/model/types';
import { BootcampCard } from '@/entities/bootcamp/ui/BootcampCard';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { buildBootcampListHref, type BootcampListQuery } from '../lib/query';
import { BootcampListControls } from './BootcampListControls';

export type BootcampListProps = BootcampListQuery;

/**
 * API 없음: `sort`와 `status`는 생성 타입 `GetBootcampsParams`에 없는 파라미터라
 * `getBootcamps(params)`로는 보낼 수 없다 — `widgets/job-list/ui/JobList.tsx`가 같은 이유로
 * 하던 대로 URL을 직접 만들어 `httpClient`를 부른다. MSW 핸들러가 이 둘을 처리한다
 * (`packages/api/src/mocks/handlers.ts`, PRD 2절).
 *
 * `size`는 보내지 않는다 — 한 페이지 건수는 아직 결정 전이라 MSW 핸들러의 기본값
 * (`DEFAULT_BOOTCAMP_SIZE`) 한 곳에만 둔다.
 */
function buildBootcampsRequestUrl({ page, sort, openOnly }: BootcampListQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('sort', sort);
  if (openOnly) {
    params.set('status', 'RECRUITING');
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
      pageInfo: { pageNum: query.page, pageSize: 12, totalElements: 0, totalPages: 0 },
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
          {items.map((bootcamp) => (
            <li key={bootcamp.id}>
              <BootcampCard bootcamp={bootcamp} />
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
