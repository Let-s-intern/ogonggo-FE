'use client';

import { useEffect, useRef, useState } from 'react';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import {
  MyPageListRowCells,
  MyPageListTable,
  MyPageListTabs,
  type MyPageListColumn,
  type MyPageListTab,
} from '@/widgets/mypage-list';
import { fetchMyApplications, type MyApplicationsPage } from '../lib/fetch';
import {
  buildMyApplicationsHref,
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

function columnsFor(tab: MyApplicationTab): readonly MyPageListColumn[] {
  const { verb } = TAB_LABELS[tab];
  return [
    { key: 'info', label: tab === 'side-studies' ? '모집글 정보' : '공고 정보' },
    { key: 'deadline', label: '마감일', className: 'w-64' },
    { key: 'status', label: `나의 ${verb} 상태`, className: 'w-44' },
    { key: 'action', label: verb, className: 'w-32' },
  ];
}

type State = { kind: 'loading' } | { kind: 'ready'; page: MyApplicationsPage } | { kind: 'error' };

export interface MyApplicationsProps {
  query: MyApplicationsQuery;
}

/**
 * `지원·신청 내역`(PRD 3 절). 탭 셋 + 필터 한 줄 + 표 + 페이지네이션 + 하단 CTA 배너다.
 *
 * **데이터 출처가 탭마다 갈린다.** 사이드·스터디만 `listMyRecruitmentApplications` 실연동이고,
 * 채용공고·부트캠프는 되읽는 API 가 없어 하드코딩이다 — 근거와 백엔드에 요청한 것은
 * `.claude/tasks/memos/백엔드-요청-마이페이지.md` 1·2 번에 있다.
 */
export function MyApplications({ query }: MyApplicationsProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  /**
   * 무엇을 읽을지는 주소가 정한다. `query` 객체는 렌더마다 새로 만들어져 효과의 의존값이 될
   * 수 없는데, 주소 문자열은 탭·필터·페이지를 그대로 담고 있어 같은 값이면 같은 요청이다.
   */
  const href = buildMyApplicationsHref(query);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    if (queryRef.current.tab !== 'side-studies') {
      return;
    }
    let active = true;
    setState({ kind: 'loading' });
    fetchMyApplications(queryRef.current)
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
  }, [href]);

  const sideStudyCount = state.kind === 'ready' ? state.page.count : undefined;
  const tabs: readonly MyPageListTab<MyApplicationTab>[] = [
    { value: 'jobs', label: TAB_LABELS.jobs.label },
    { value: 'bootcamps', label: TAB_LABELS.bootcamps.label },
    { value: 'side-studies', label: TAB_LABELS['side-studies'].label, count: sideStudyCount },
  ];

  const columns = columnsFor(query.tab);
  const rows = query.tab === 'side-studies' && state.kind === 'ready' ? state.page.rows : [];
  const pageInfo =
    query.tab === 'side-studies' && state.kind === 'ready'
      ? state.page.pageInfo
      : { pageNum: query.page, pageSize: 0, totalElements: 0, totalPages: 0 };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-950">지원·신청 내역</h1>
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

      <MyPageListTable columns={columns}>
        {rows.length > 0 ? (
          rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100">
              <MyPageListRowCells row={row} />
              <td className="px-4 py-5 text-center" />
              <td className="px-4 py-5 text-center" />
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-500">
              {query.tab === 'side-studies' && state.kind === 'loading'
                ? '불러오는 중입니다.'
                : query.tab === 'side-studies' && state.kind === 'error'
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
    </section>
  );
}
