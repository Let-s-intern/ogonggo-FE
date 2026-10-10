import { listPublicConcerns } from '@ogonggo/api';
import type { PageInfo, SuccessResponsePageResponseConcernSummaryResponse } from '@ogonggo/api';
import type { ConcernSummary } from '@/entities/concern/model/types';
import { ConcernCard } from '@/entities/concern/ui/ConcernCard';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { buildConcernListHref, type ConcernListQuery } from '../lib/query';

/** 한 페이지 고민 수. 백엔드 기본값도 10 이지만 화면이 정하는 값이라 보낸다. */
const PAGE_SIZE = 10;

/**
 * `listPublicConcerns`(`GET /api/v1/concerns`). 생성 타입에서 `page`·`size`·`category` 는 문자열이라
 * 숫자를 바꿔 넘긴다. `category` 는 `parseConcernListQuery` 가 아는 값만 통과시킨 것이고, 없으면 보내지
 * 않아 전체가 된다.
 *
 * 언랩은 다른 목록과 같다. 생성 타입은 `{ data, status, headers }` 를 선언하지만 `httpClient` 는 응답
 * 봉투를 그대로 준다.
 */
async function fetchConcernPage({
  page,
  sort,
  category,
}: ConcernListQuery): Promise<{ items: ConcernSummary[]; pageInfo: PageInfo }> {
  const response = (await listPublicConcerns({
    page: String(page),
    size: String(PAGE_SIZE),
    sort,
    ...(category ? { category } : {}),
  })) as unknown as SuccessResponsePageResponseConcernSummaryResponse;

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: page, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0 },
    }
  );
}

export interface ConcernListItemsProps {
  query: ConcernListQuery;
}

/**
 * 고민글 행 열 개와 번호 페이지네이션. 행은 `entities/concern/ui/ConcernCard.tsx` 가 그린다. 시안의
 * 오른쪽 썸네일과 목록 가운데 광고 자리는 이미지·배너 API 가 없어 그리지 않는다(PRD).
 */
export async function ConcernListItems({ query }: ConcernListItemsProps) {
  const { items, pageInfo } = await fetchConcernPage(query);

  return (
    <section className="flex w-full flex-col gap-8" aria-labelledby="concern-list-title">
      <h2 id="concern-list-title" className="sr-only">
        전체 고민
      </h2>
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">고민글이 없습니다.</p>
      ) : (
        <ul>
          {items.map((concern) => (
            <li key={concern.id}>
              <ConcernCard concern={concern} />
            </li>
          ))}
        </ul>
      )}
      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildConcernListHref(query, { page })}
      />
    </section>
  );
}
