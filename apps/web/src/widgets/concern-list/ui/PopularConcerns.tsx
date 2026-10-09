import { listPublicPopularConcerns, ListPublicPopularConcernsSort } from '@ogonggo/api';
import type { SuccessResponseListConcernSummaryResponse } from '@ogonggo/api';
import type { ConcernSummary } from '@/entities/concern/model/types';
import { PopularConcernCard } from '@/entities/concern/ui/PopularConcernCard';

/**
 * `listPublicPopularConcerns`(`GET /api/v1/concerns/popular`). 최근 7일 안에 쓴 글 중 조회수가 큰 것을
 * 최대 3건 준다. 페이지 정보가 없고 카테고리 파라미터도 없어서 칩과 정렬을 바꿔도 이 목록은 그대로다.
 *
 * 언랩은 다른 목록과 같다. 생성 타입은 `{ data, status, headers }` 를 선언하지만 `httpClient` 는 응답
 * 봉투를 그대로 준다.
 */
async function fetchPopularConcerns(): Promise<ConcernSummary[]> {
  const response = (await listPublicPopularConcerns({
    sort: ListPublicPopularConcernsSort.VIEW_COUNT,
  })) as unknown as SuccessResponseListConcernSummaryResponse;

  return response.data ?? [];
}

/**
 * `지금 많이 보는 취준 고민`. API 가 3건까지만 줘서 PC 는 3열이다(PRD 결정 3) — 시안은 4열이다.
 * 최근 글이 없어 결과가 비면 제목까지 통째로 숨긴다.
 */
export async function PopularConcerns() {
  const concerns = await fetchPopularConcerns();

  if (concerns.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-4" aria-labelledby="popular-concerns-title">
      <h2
        id="popular-concerns-title"
        className="flex items-center gap-2 text-lg font-bold text-gray-900"
      >
        <span aria-hidden="true" className="icon-[lucide--flame] block h-5 w-5 text-emerald-500" />
        지금 많이 보는 취준 고민
      </h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {concerns.map((concern) => (
          <li key={concern.id}>
            <PopularConcernCard concern={concern} />
          </li>
        ))}
      </ul>
    </section>
  );
}
