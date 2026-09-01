import { httpClient } from '@ogonggo/api';
import type {
  SideStudyListResponse,
  SideStudyPageInfo,
  SideStudySummary,
} from '@/entities/side-study/model/types';
import { SideStudyCard } from '@/entities/side-study/ui/SideStudyCard';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { buildSideStudyListHref, type SideStudyListQuery } from '../lib/query';

export type SideStudyListProps = SideStudyListQuery;

/**
 * API 없음: `GET /api/v1/side-studies`는 백엔드에 없는 경로다(PRD 5절). 생성된 클라이언트
 * 함수가 있을 리 없어 `httpClient`로 URL을 직접 만들어 부른다 — MSW 핸들러
 * (`packages/api/src/mocks/handlers.ts`)만 이 요청에 답한다.
 *
 * `size`는 보내지 않는다 — 한 페이지 건수는 MSW 핸들러의 기본값(`DEFAULT_SIDE_STUDY_SIZE`,
 * 목업의 카드 8장) 한 곳에만 둔다.
 */
function buildSideStudiesRequestUrl({ page }: SideStudyListQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  return `/api/v1/side-studies?${params.toString()}`;
}

async function fetchSideStudyPage(
  query: SideStudyListQuery,
): Promise<{ items: SideStudySummary[]; pageInfo: SideStudyPageInfo }> {
  const response = await httpClient<SideStudyListResponse>(buildSideStudiesRequestUrl(query));

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: query.page, pageSize: 8, totalElements: 0, totalPages: 0 },
    }
  );
}

/** `사이드스터디.png`의 목록 본문 — 4열 카드 그리드 + 번호 페이지네이션. */
export async function SideStudyList(query: SideStudyListProps) {
  const { items, pageInfo } = await fetchSideStudyPage(query);

  return (
    <div className="flex w-full flex-col gap-6">
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">모집 중인 글이 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {items.map((sideStudy) => (
            <li key={sideStudy.id}>
              <SideStudyCard sideStudy={sideStudy} />
            </li>
          ))}
        </ul>
      )}
      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildSideStudyListHref(query, { page })}
      />
    </div>
  );
}
