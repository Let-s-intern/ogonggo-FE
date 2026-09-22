'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { UpdateRecruitmentApplicationStatusRequestApplicationStatus } from '@ogonggo/api';
import { useToast, type SelectOption } from '@ogonggo/ui';
import {
  canMoveStage,
  isMovableStageId,
  moveApplicationStage,
  movableTargets,
  stagesOf,
  type ApplicationStageId,
} from '@/features/application-board';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import {
  MyPageFilterRow,
  MyPageListTable,
  MyPageListTabs,
  type MyPageListColumn,
  type MyPageListTab,
} from '@/widgets/mypage-list';
import {
  fetchMyApplications,
  fetchMyBookmarkApplications,
  type MyApplicationRow as Row,
  type MyApplicationsPage,
} from '../lib/fetch';
import { deleteApplication, unbookmarkApplication, updateApplicationStatus } from '../lib/mutate';
import { MyApplicationRow } from './MyApplicationRow';
import { MyApplicationsCta } from './MyApplicationsCta';
import { MyApplicationsFilters, MyApplicationsSort } from './MyApplicationsFilters';
import { MyApplicationsNotice } from './MyApplicationsNotice';
import {
  buildMyApplicationsHref,
  buildMyApplicationsResetHref,
  hasMyApplicationsFilter,
  stageOf,
  type MyApplicationsQuery,
  type MyApplicationTab,
} from '../lib/query';

/**
 * 탭 이름과 그 탭이 쓰는 말. `지원` 과 `신청` 이 갈린다 — 목업 세 장이 채용공고·모집글에는
 * `지원`, 부트캠프에는 `신청` 을 쓴다.
 */
const TAB_LABELS: Record<MyApplicationTab, { label: string; verb: string }> = {
  jobs: { label: '채용 공고', verb: '지원' },
  bootcamps: { label: '교육 · 부트캠프', verb: '신청' },
  'side-studies': { label: '사이드 · 스터디', verb: '지원' },
};

/**
 * 사이드·스터디의 네 단계는 **모두 고를 수 있다** — `updateRecruitmentApplicationStatus` 가
 * 넷을 다 받는다. 북마크 두 탭은 열린 전이가 `스크랩 ↔ 지원 준비 중` 뿐이라 나머지가 비활성이다
 * (`features/application-board/model/stages.ts` 의 `movableTo`).
 */
function statusOptionsFor(tab: MyApplicationTab, stage: ApplicationStageId): SelectOption[] {
  const targets: readonly ApplicationStageId[] =
    tab === 'side-studies' ? stagesOf(tab).map((option) => option.id) : movableTargets(tab, stage);
  return stagesOf(tab)
    .filter((option) => tab !== 'side-studies' || option.id !== 'SCRAPPED')
    .map((option) => ({
      value: option.id,
      label: option.label,
      disabled: option.id !== stage && !targets.includes(option.id),
    }));
}

function columnsFor(tab: MyApplicationTab): readonly MyPageListColumn[] {
  const { verb } = TAB_LABELS[tab];
  return [
    { key: 'info', label: tab === 'side-studies' ? '모집글 정보' : '공고 정보' },
    { key: 'deadline', label: '마감일', className: 'w-56' },
    { key: 'status', label: `나의 ${verb} 상태`, className: 'w-40' },
    { key: 'action', label: verb, className: 'w-40' },
  ];
}

type State = { kind: 'loading' } | { kind: 'ready'; page: MyApplicationsPage } | { kind: 'error' };

export interface MyApplicationsProps {
  query: MyApplicationsQuery;
}

/**
 * `신청 현황`(`/mypage/applications`). 탭 셋 + 필터 한 줄 + 표 + 페이지네이션 + 하단 CTA 다.
 *
 * **셋 다 실연동이다.** v4 때 채용공고·부트캠프 탭을 채우던 하드코딩은 v7 에서 지웠다 —
 * 북마크가 단계를 갖게 되면서(`LC-3359`) 되읽을 곳이 생겼다.
 *
 * 데이터 출처는 아직 탭마다 갈린다. 사이드·스터디는 지원 이력
 * (`listMyRecruitmentApplications`) 이고 나머지 둘은 북마크 목록이다. 북마크 쪽은 응답에 단계
 * 칸이 없어 **한 번에 한 단계만** 그린다 — 근거는 `lib/query.ts` 의 `DEFAULT_STAGE`.
 */
export function MyApplications({ query }: MyApplicationsProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  /** 상태 변경·삭제 뒤 목록을 다시 읽으려고 올리는 값. 주소는 그대로인데 내용만 바뀌는 경우다. */
  const [reloadToken, setReloadToken] = useState(0);
  /** 요청이 도는 행. 그 행의 컨트롤을 잠근다. */
  const [pendingId, setPendingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  /**
   * 무엇을 읽을지는 주소가 정한다. `query` 객체는 렌더마다 새로 만들어져 효과의 의존값이 될
   * 수 없는데, 주소 문자열은 탭·필터·페이지를 그대로 담고 있어 같은 값이면 같은 요청이다.
   */
  const href = buildMyApplicationsHref(query);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    const current = queryRef.current;
    const stage = stageOf(current);
    const request =
      current.tab === 'side-studies' || stage === undefined
        ? fetchMyApplications(current)
        : fetchMyBookmarkApplications(current.tab, stage, current);
    request
      .then((page) => {
        if (active) {
          setState({ kind: 'ready', page });
        }
      })
      .catch(() => {
        if (active) {
          setState({ kind: 'error' });
        }
      });
    return () => {
      active = false;
    };
  }, [href, reloadToken]);

  const page = state.kind === 'ready' ? state.page : undefined;
  const tabs: readonly MyPageListTab<MyApplicationTab>[] = [
    { value: 'jobs', label: TAB_LABELS.jobs.label },
    { value: 'bootcamps', label: TAB_LABELS.bootcamps.label },
    {
      value: 'side-studies',
      label: TAB_LABELS['side-studies'].label,
      count: query.tab === 'side-studies' ? page?.count : undefined,
    },
  ];

  const columns = columnsFor(query.tab);
  const rows = page?.rows ?? [];
  const pageInfo = page?.pageInfo ?? {
    pageNum: query.page,
    pageSize: 0,
    totalElements: 0,
    totalPages: 0,
  };

  /** 한 행의 요청. 도는 동안 그 행을 잠그고, 끝나면 목록을 다시 읽는다. */
  const mutate = (id: number, run: () => Promise<void>) => {
    setPendingId(id);
    run()
      .then(() => setReloadToken((token) => token + 1))
      .catch(() => setState({ kind: 'error' }))
      .finally(() => setPendingId(null));
  };

  /**
   * 상태 셀렉트가 고른 값. 탭마다 저장하는 곳이 다르다 — 사이드·스터디는 지원 이력의 상태를
   * 고치고, 북마크 두 탭은 단계 이동(`prepare`/`cancel-preparation`) 이다.
   *
   * **열리지 않은 전이는 요청을 보내지 않고 왜 막혔는지 알린다**(PRD 완료 조건). 셀렉트가
   * 애초에 비활성으로 그리지만, 목록을 받아 둔 사이에 다른 화면에서 단계가 바뀌면 여기까지 온다.
   */
  const changeStatus = (row: Row, value: string) => {
    if (query.tab === 'side-studies') {
      mutate(row.id, () =>
        updateApplicationStatus(
          row.id,
          value as UpdateRecruitmentApplicationStatusRequestApplicationStatus,
        ),
      );
      return;
    }
    const tab = query.tab;
    if (!isMovableStageId(value) || !canMoveStage(tab, row.applicationStatus, value)) {
      toast.show({ message: '아직 옮길 수 없는 단계예요', tone: 'error' });
      return;
    }
    mutate(row.id, () => moveApplicationStage(tab, row.id, value));
  };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-950">신청 현황</h1>
        <p className="pt-2 text-sm text-gray-500">
          지원하거나 신청한 공고의 진행 상태를 한곳에서 확인해요.
        </p>
      </header>

      <MyPageListTabs
        items={tabs}
        current={query.tab}
        buildHref={(tab) => buildMyApplicationsHref(query, { tab })}
        aria-label="지원·신청 종류"
      />

      <MyPageFilterRow
        resetHref={buildMyApplicationsResetHref(query)}
        filtered={hasMyApplicationsFilter(query)}
        search={{
          placeholder: query.tab === 'side-studies' ? '모집글 검색' : '공고 검색',
          defaultValue: query.keyword,
          buildHref: (keyword) => buildMyApplicationsHref(query, { keyword }),
        }}
        sort={query.tab === 'side-studies' ? <MyApplicationsSort query={query} /> : undefined}
      >
        <MyApplicationsFilters query={query} />
      </MyPageFilterRow>

      <MyApplicationsNotice tab={query.tab} />

      <MyPageListTable columns={columns}>
        {rows.length > 0 ? (
          rows.map((row) => (
            <MyApplicationRow
              key={row.key}
              row={row}
              statusOptions={statusOptionsFor(query.tab, row.applicationStatus)}
              verb={TAB_LABELS[query.tab].verb}
              pending={pendingId === row.id}
              onStatusChange={(value) => changeStatus(row, value)}
              onDelete={() =>
                mutate(row.id, () =>
                  query.tab === 'side-studies'
                    ? deleteApplication(row.id)
                    : unbookmarkApplication(queryClient, query.tab, row.id),
                )
              }
            />
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-500">
              {state.kind === 'loading'
                ? '불러오는 중입니다.'
                : state.kind === 'error'
                  ? '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                  : `${TAB_LABELS[query.tab].verb}한 내역이 없습니다.`}
            </td>
          </tr>
        )}
      </MyPageListTable>

      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildMyApplicationsHref(query, { page })}
      />

      <MyApplicationsCta tab={query.tab} />
    </section>
  );
}
