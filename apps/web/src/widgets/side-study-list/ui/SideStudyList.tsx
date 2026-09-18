import { getRecruitmentPosts } from '@ogonggo/api';
import type {
  PageInfo,
  SuccessResponsePageResponseRecruitmentPostSummaryResponse,
} from '@ogonggo/api';
import type { SideStudySummary } from '@/entities/side-study/model/types';
import { SideStudyCard } from '@/entities/side-study/ui/SideStudyCard';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { buildSideStudyListHref, TAB_KINDS, type SideStudyListQuery } from '../lib/query';
import { SideStudyListControls } from './SideStudyListControls';

export type SideStudyListProps = SideStudyListQuery;

/** 한 페이지 카드 수. 목업 `사이드스터디.png` 의 카드 8장이다. 백엔드 기본값(10) 과 달라 보낸다. */
const PAGE_SIZE = 8;

/**
 * `getRecruitmentPosts`(`GET /api/v1/recruitment-posts`). 탭이 고른 구분은 `recruitmentTypes`
 * 배열 하나로 보내고, `전체` 탭은 생략한다. 정렬은 보내지 않는다 — 기본 `LATEST` 가 id 역순이다.
 *
 * 언랩은 채용공고·부트캠프 목록과 같다. 생성 타입은 `{ data, status, headers }` 를 선언하지만
 * `httpClient` 는 응답 봉투를 그대로 준다.
 */
async function fetchSideStudyPage({
  page,
  tab,
}: SideStudyListQuery): Promise<{ items: SideStudySummary[]; pageInfo: PageInfo }> {
  const kind = TAB_KINDS[tab];
  const response = (await getRecruitmentPosts({
    page: String(page),
    size: String(PAGE_SIZE),
    ...(kind ? { recruitmentTypes: [kind] } : {}),
  })) as unknown as SuccessResponsePageResponseRecruitmentPostSummaryResponse;

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: page, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0 },
    }
  );
}

/** `사이드스터디.png`의 목록 본문 — 컨트롤 한 줄 + 4열 카드 그리드 + 번호 페이지네이션. */
export async function SideStudyList(query: SideStudyListProps) {
  const { items, pageInfo } = await fetchSideStudyPage(query);

  return (
    <div className="flex w-full flex-col gap-6">
      <SideStudyListControls query={query} />
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
