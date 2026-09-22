import {
  APPLICATION_BOARD_TABS,
  stagesOf,
  type ApplicationBoardFilters,
  type ApplicationBoardTab,
  type ApplicationStageId,
} from '@/features/application-board';

/**
 * 칸반이 사는 주소. PRD 결정 기록의 표가 `스크랩한 공고` 메뉴를 이 경로에 붙였고, v4 스크랩
 * 화면이 쓰던 자리를 그대로 이어받는다.
 */
const BOARD_PATH = '/mypage/scraps';

/** 두 보기(PRD "칸반과 리스트 두 보기를 오른쪽 위 아이콘으로 전환한다"). */
export const APPLICATION_BOARD_VIEWS = ['kanban', 'list'] as const;
export type ApplicationBoardView = (typeof APPLICATION_BOARD_VIEWS)[number];

/**
 * `지원 · 신청 관리` 의 URL 상태. 탭과 필터가 전부 주소에 있다 — 마이페이지 목록 화면들이
 * 이미 그렇고(`widgets/my-scraps/lib/query.ts`), 그래야 뒤로가기와 새로고침이 보던 화면으로
 * 돌아온다.
 *
 * **쪽 번호는 없다.** 칸반은 칸마다 `더보기` 로 다음 쪽을 같은 칸에 잇는다(`useApplicationStage`).
 * 칸 여섯이 서로 다른 쪽에 가 있을 수 있어 주소에 담을 수 있는 값이 아니다.
 */
export interface ApplicationBoardQuery {
  tab: ApplicationBoardTab;
  /**
   * 칸반이냐 리스트냐. **주소에 둔다** — 탭과 필터가 이미 전부 여기 있고, 보기만 따로
   * `localStorage` 에 두면 첫 그림과 저장된 값이 어긋나 한 번 깜빡인다. 근거는
   * `.claude/tasks/memos/결정-지원신청-관리-push3-2026-09-22.md` 1 절.
   */
  view: ApplicationBoardView;
  /** `마감 상태` 드롭다운. 목록 요청에 그대로 실린다. */
  recruitmentStatus?: ApplicationBoardFilters['recruitmentStatus'];
  /**
   * `지원 상태` 드롭다운. **요청 파라미터가 아니라 어느 칸을 보일지다** — 단계는 칸 자체라
   * 이미 칸마다 요청이 갈라져 있다(`applicationBoardApi.ts`). 고르면 그 칸만 남는다.
   */
  stage?: ApplicationStageId;
  /** `공고 검색`. 목록 요청에 실린다. */
  keyword?: string;
}

export const DEFAULT_APPLICATION_BOARD_QUERY: ApplicationBoardQuery = {
  tab: 'jobs',
  view: 'kanban',
};

/** 목록 요청에 실리는 값만 뽑는다. `stage` 는 칸을 고르는 값이라 여기 들어가지 않는다. */
export function boardFilters(query: ApplicationBoardQuery): ApplicationBoardFilters {
  return { recruitmentStatus: query.recruitmentStatus, keyword: query.keyword };
}

/** 지금 탭에 걸린 필터가 하나라도 있는가. 필터 줄의 `전체` 칩 색이 이걸로 갈린다. */
export function hasApplicationBoardFilter(query: ApplicationBoardQuery): boolean {
  return (
    query.recruitmentStatus !== undefined ||
    query.stage !== undefined ||
    query.keyword !== undefined
  );
}

/**
 * 기본값(`tab=jobs`) 과 비어 있는 필터는 주소에서 뺀다 — `buildMyScrapsHref` 와 같은 방식이다.
 *
 * **탭을 옮기면 필터를 전부 지운다.** `stage` 는 탭마다 값이 아예 달라 그대로 들고 가면 없는
 * 칸을 고른 주소가 되고, 그러면 칸이 하나도 남지 않은 빈 화면이 나온다.
 */
export function buildApplicationBoardHref(
  base: ApplicationBoardQuery,
  overrides: Partial<ApplicationBoardQuery> = {},
): string {
  if (overrides.tab !== undefined && overrides.tab !== base.tab) {
    return BOARD_PATH;
  }

  const merged: ApplicationBoardQuery = { ...base, ...overrides };
  const params = new URLSearchParams();
  if (merged.tab !== DEFAULT_APPLICATION_BOARD_QUERY.tab) {
    params.set('tab', merged.tab);
  }
  if (merged.view !== DEFAULT_APPLICATION_BOARD_QUERY.view) {
    params.set('view', merged.view);
  }
  if (merged.recruitmentStatus !== undefined) {
    params.set('recruitmentStatus', merged.recruitmentStatus);
  }
  if (merged.stage !== undefined) {
    params.set('stage', merged.stage);
  }
  if (merged.keyword !== undefined) {
    params.set('keyword', merged.keyword);
  }

  const search = params.toString();
  return search ? `${BOARD_PATH}?${search}` : BOARD_PATH;
}

/** 그 탭의 필터를 전부 지운 주소. 필터 줄의 `전체` 칩이 간다. */
export function buildApplicationBoardResetHref(query: ApplicationBoardQuery): string {
  return buildApplicationBoardHref({ tab: query.tab, view: query.view });
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.find((candidate) => candidate === value);
}

const RECRUITMENT_STATUSES = ['RECRUITING', 'CLOSED'] as const;

/** 백엔드가 `keyword` 를 2~100자로 받는다. 범위를 벗어난 값은 없는 것으로 친다. */
function pickKeyword(value: string | undefined): string | undefined {
  const keyword = value?.trim();
  return keyword && keyword.length >= 2 && keyword.length <= 100 ? keyword : undefined;
}

/**
 * 주소의 문자열을 그대로 믿지 않고 아는 값만 통과시킨다.
 *
 * `stage` 는 **그 탭의 단계 목록에 있는 값만** 받는다. 탭마다 단계가 달라, 부트캠프의
 * `IN_PROGRESS` 를 채용공고 탭 주소에 적으면 지울 수도 없는 빈 화면이 된다.
 */
export function parseApplicationBoardQuery(
  searchParams: Record<string, string | undefined>,
): ApplicationBoardQuery {
  const tab = pick(searchParams.tab, APPLICATION_BOARD_TABS) ?? DEFAULT_APPLICATION_BOARD_QUERY.tab;
  const stageIds: readonly ApplicationStageId[] = stagesOf(tab).map((stage) => stage.id);

  return {
    tab,
    view: pick(searchParams.view, APPLICATION_BOARD_VIEWS) ?? DEFAULT_APPLICATION_BOARD_QUERY.view,
    recruitmentStatus: pick(searchParams.recruitmentStatus, RECRUITMENT_STATUSES),
    stage: pick(searchParams.stage, stageIds),
    keyword: pickKeyword(searchParams.keyword),
  };
}
