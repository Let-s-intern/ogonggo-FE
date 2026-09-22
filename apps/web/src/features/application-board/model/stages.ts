import type {
  ListMyBootcampBookmarksApplicationStatus,
  ListMyJobBookmarksApplicationStatus,
  ListMyRecruitmentApplicationsApplicationStatus,
} from '@ogonggo/api';

/**
 * `지원 · 신청 관리` 의 탭 셋(PRD "탭 셋이 각각 자기 단계로 그려진다").
 *
 * 이름은 북마크 기능의 `BOOKMARK_KINDS` 와 같은 값이다. 기능은 다른 기능을 임포트하지 않으므로
 * (`features/README.md`) 값은 여기 따로 적는다 — 둘이 어긋나면 탭 주소(`?tab=jobs`) 와 북마크
 * 토스트의 `보기` 가 서로 다른 탭을 가리킨다.
 */
export const APPLICATION_BOARD_TABS = ['jobs', 'bootcamps', 'side-studies'] as const;
export type ApplicationBoardTab = (typeof APPLICATION_BOARD_TABS)[number];

/**
 * 탭마다 단계가 다르다. 채용공고 여섯, 부트캠프 다섯, 사이드·스터디 다섯이다.
 *
 * 값은 **생성 모델의 enum 을 그대로 쓴다.** 그래야 백엔드에 값이 늘었을 때 아래 표가 컴파일에서
 * 깨진다 — 화면 안에서만 쓰는 이름을 새로 지으면 그 연결이 끊긴다.
 *
 * 사이드·스터디만 둘을 합친 모양이다. 북마크(`SCRAPPED`) 와 지원 이력(나머지 넷) 이 다른
 * 테이블이라 `SCRAPPED` 를 담은 enum 이 없다 — `RecruitmentPostBookmarkService.prepare()` 가
 * 북마크를 지우고 지원 이력을 만든다. 자세한 것은
 * `.claude/tasks/memos/결정-지원신청-관리-push1-2026-09-22.md` 2 절.
 */
export interface ApplicationStageIds {
  jobs: ListMyJobBookmarksApplicationStatus;
  bootcamps: ListMyBootcampBookmarksApplicationStatus;
  'side-studies': 'SCRAPPED' | ListMyRecruitmentApplicationsApplicationStatus;
}

export type ApplicationStageId<Tab extends ApplicationBoardTab = ApplicationBoardTab> =
  ApplicationStageIds[Tab];

/** 칸·섹션 하나. `id` 는 키에서 채워 넣는다(`toOrderedStages`). */
export interface ApplicationStage<Id extends string = string> {
  readonly id: Id;
  /** 칸 머리에 쓰는 문구. 목업 그대로다. */
  readonly label: string;
  /**
   * 이 단계에서 **옮겨 갈 수 있는** 단계. 비어 있으면 그 칸의 카드는 움직이지 않는다.
   *
   * 백엔드 `JobApplicationStatus.movableFrom()` 과 같은 규칙인데 방향이 반대다 — 백엔드 쪽은
   * "이 단계로 들어올 수 있는 출발 단계" 를 준다. 지금 열린 전이가 `SCRAPPED ↔ PREPARING`
   * 하나뿐이고 양방향이라 두 표의 값이 같다. **한쪽만 열린 전이가 생기면 그때부터 갈린다** —
   * 그때 `movableFrom()` 을 다시 읽어 뒤집어 적어야 한다.
   */
  readonly movableTo: readonly Id[];
}

type StageTable<Id extends string> = Readonly<Record<Id, Omit<ApplicationStage<Id>, 'id'>>>;

/**
 * 표를 화면에 늘어놓을 차례의 배열로 바꾼다.
 *
 * 차례는 **표에 적은 키 차례** 그대로다. 문자열 키만 있는 객체의 `Object.keys` 는 적은 차례를
 * 지키므로(ES 명세), 단계를 하나 더할 때 넣을 자리에 적으면 화면 차례도 따라온다. 차례를 담은
 * 배열을 따로 두면 표에만 더하고 배열에 안 더한 단계가 조용히 사라진다.
 */
function toOrderedStages<Id extends string>(
  table: StageTable<Id>,
): readonly ApplicationStage<Id>[] {
  return (Object.entries(table) as [Id, Omit<ApplicationStage<Id>, 'id'>][]).map(([id, stage]) => ({
    id,
    ...stage,
  }));
}

/**
 * 채용공고 여섯 단계.
 *
 * 목업 리스트 뷰는 일곱 칸이고 그중 `서류 합격` 은 `JobApplicationStatus` 에 없다.
 * **여섯으로 간다**(PRD 결정 기록) — 없는 값이라 그 칸은 영원히 빈다.
 *
 * 문구는 목업의 칸 이름이다. 백엔드 enum 의 `desc` 와 셋이 다르다(`면접`/`합격` 대신
 * `면접 진행`/`최종 합격`, `스크랩` 대신 `스크랩한 공고`). 화면 문구는 목업을 따른다.
 */
const JOB_STAGES = {
  SCRAPPED: { label: '스크랩한 공고', movableTo: ['PREPARING'] },
  PREPARING: { label: '지원 준비 중', movableTo: ['SCRAPPED'] },
  APPLIED: { label: '지원 완료', movableTo: [] },
  INTERVIEWING: { label: '면접 진행', movableTo: [] },
  PASSED: { label: '최종 합격', movableTo: [] },
  FAILED: { label: '불합격', movableTo: [] },
} as const satisfies StageTable<ApplicationStageIds['jobs']>;

/** 교육·부트캠프 다섯 단계. `PREPARING` 만 `신청 전` 이고 나머지는 enum 의 `desc` 와 같다. */
const BOOTCAMP_STAGES = {
  SCRAPPED: { label: '스크랩한 교육 · 부트캠프', movableTo: ['PREPARING'] },
  PREPARING: { label: '신청 전', movableTo: ['SCRAPPED'] },
  APPLIED: { label: '신청 완료', movableTo: [] },
  IN_PROGRESS: { label: '활동 중', movableTo: [] },
  COMPLETED: { label: '활동 완료', movableTo: [] },
} as const satisfies StageTable<ApplicationStageIds['bootcamps']>;

/**
 * 사이드·스터디 다섯 단계.
 *
 * `COMPLETED` 가 부트캠프에서는 `활동 완료` 인데 여기서는 `지원 완료` 다. 다른 enum 이고 목업도
 * 그렇게 적는다 — 문구를 탭마다 따로 두는 이유가 이것이다.
 */
const SIDE_STUDY_STAGES = {
  SCRAPPED: { label: '스크랩한 사이드 · 스터디', movableTo: ['PREPARING'] },
  PREPARING: { label: '지원 준비 중', movableTo: ['SCRAPPED'] },
  COMPLETED: { label: '지원 완료', movableTo: [] },
  IN_PROGRESS: { label: '활동 중', movableTo: [] },
  ENDED: { label: '활동 완료', movableTo: [] },
} as const satisfies StageTable<ApplicationStageIds['side-studies']>;

type ApplicationStageTables = {
  [Tab in ApplicationBoardTab]: readonly ApplicationStage<ApplicationStageId<Tab>>[];
};

/** 탭이 그리는 단계를 화면 차례대로. 칸반의 칸과 리스트의 섹션이 같은 것을 쓴다. */
export const APPLICATION_BOARD_STAGES: ApplicationStageTables = {
  jobs: toOrderedStages(JOB_STAGES),
  bootcamps: toOrderedStages(BOOTCAMP_STAGES),
  'side-studies': toOrderedStages(SIDE_STUDY_STAGES),
};

export function stagesOf<Tab extends ApplicationBoardTab>(tab: Tab): ApplicationStageTables[Tab] {
  return APPLICATION_BOARD_STAGES[tab];
}

function findStage(
  tab: ApplicationBoardTab,
  stageId: ApplicationStageId,
): ApplicationStage<ApplicationStageId> | undefined {
  const stages: readonly ApplicationStage<ApplicationStageId>[] = APPLICATION_BOARD_STAGES[tab];
  return stages.find((stage) => stage.id === stageId);
}

/** 한 단계의 화면 문구. 모르는 값이면 값 자체를 돌려준다 — 빈 칸 머리보다는 낫다. */
export function stageLabel(tab: ApplicationBoardTab, stageId: ApplicationStageId): string {
  return findStage(tab, stageId)?.label ?? stageId;
}

/**
 * 이 단계에서 옮겨 갈 수 있는 단계들. 리스트 뷰의 상태 셀렉트가 고를 수 있는 것이 이것뿐이고,
 * 나머지는 비활성이다(PRD 결정 기록 "옮기는 조작만 막는다").
 */
export function movableTargets(
  tab: ApplicationBoardTab,
  from: ApplicationStageId,
): readonly ApplicationStageId[] {
  return findStage(tab, from)?.movableTo ?? [];
}

/**
 * 이 전이를 보내도 되는가. **요청을 보내기 전에 이것을 먼저 본다** — 막힌 전이를 보내면
 * 백엔드가 409 로 거절하고, 그 왕복은 사용자에게 아무것도 알려 주지 않는다.
 */
export function canMoveStage(
  tab: ApplicationBoardTab,
  from: ApplicationStageId,
  to: ApplicationStageId,
): boolean {
  return movableTargets(tab, from).includes(to);
}

/** 이 단계에서 나갈 길이 하나라도 있는가. 카드에 `X` 를 그릴지가 이걸로 갈린다. */
export function isMovableStage(tab: ApplicationBoardTab, from: ApplicationStageId): boolean {
  return movableTargets(tab, from).length > 0;
}
