'use client';

import { useEffect, useRef, useState } from 'react';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import {
  MyPageFilterRow,
  MyPageListRowCells,
  MyPageListTable,
  MyPageListTabs,
  type MyPageListColumn,
  type MyPageListTab,
} from '@/widgets/mypage-list';
import { fetchMyScraps, TAB_NOUNS, type MyScrapsPage } from '../lib/fetch';
import {
  buildMyScrapsHref,
  buildMyScrapsResetHref,
  hasMyScrapsFilter,
  type MyScrapsQuery,
  type MyScrapTab,
} from '../lib/query';

const TABS: readonly MyPageListTab<MyScrapTab>[] = [
  { value: 'jobs', label: '채용 공고' },
  { value: 'bootcamps', label: '교육 · 부트캠프' },
  { value: 'side-studies', label: '사이드 · 스터디' },
];

/**
 * 표의 열 셋. `지원·신청 내역` 은 넷인데(모집글 정보 / 마감일 / 나의 지원 상태 / 지원) 스크랩에는
 * `나의 지원 상태` 에 해당하는 값이 없어 그 열을 두지 않았다 — 머리글만 있고 값이 없는 열은
 * "값을 못 읽었다" 로 읽힌다. 근거는
 * `.claude/tasks/memos/결정-마이페이지-push2-2026-09-21.md` 4 절.
 */
function columnsFor(tab: MyScrapTab): readonly MyPageListColumn[] {
  return [
    { key: 'info', label: tab === 'side-studies' ? '모집글 정보' : '공고 정보' },
    { key: 'deadline', label: '마감일', className: 'w-64' },
    { key: 'action', label: '스크랩', className: 'w-32' },
  ];
}

/** 검색 상자의 안내 문구. 사이드·스터디 탭은 검색 자체가 없다. */
const SEARCH_PLACEHOLDER: Record<MyScrapTab, string | undefined> = {
  jobs: '공고 검색',
  bootcamps: '공고 검색',
  'side-studies': undefined,
};

type State = { kind: 'loading' } | { kind: 'ready'; page: MyScrapsPage } | { kind: 'error' };

export interface MyScrapsProps {
  query: MyScrapsQuery;
}

/**
 * `스크랩한 공고`(PRD 2 절). 탭 셋 + 필터 한 줄 + 표 + 페이지네이션이다.
 *
 * **이 화면은 목업 그림이 없다**(사이드바 메뉴에만 있다). 같은 PRD 의 `지원·신청 내역` 과 같은
 * 모양으로 맞춘 것이고, 그것이 PRD 의 결정이다.
 *
 * 탭마다 부르는 API 가 다르고 필터도 다르다. 사이드·스터디 탭은
 * `listMyRecruitmentPostBookmarks` 가 `page`·`size` 만 받아 **필터 줄 자체를 그리지 않는다** —
 * 고를 것이 없는 줄을 그려 두면 비활성 드롭다운만 늘어선 줄이 된다.
 *
 * 읽기가 브라우저에서 일어난다. 로그인 토큰이 브라우저 저장소에만 있어 서버 컴포넌트가 이
 * 목록을 부를 수 없다 — `views/mypage/ui/MyPageLayout.tsx` 가 계정을 읽는 것과 같은 이유다.
 * 주소가 바뀌면(탭·필터·페이지) 다시 읽는다. 효과의 의존값이 주소 문자열인 이유는 `query` 가
 * 렌더마다 새 객체이기 때문이다 — 문자열이면 같은 주소에서 두 번 부르지 않는다.
 */
export function MyScraps({ query }: MyScrapsProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  /**
   * 무엇을 읽을지는 주소가 정한다. `query` 객체는 렌더마다 새로 만들어져 효과의 의존값이 될
   * 수 없는데, 주소 문자열은 탭·필터·페이지를 그대로 담고 있어 같은 값이면 같은 요청이다.
   * 그래서 의존값은 문자열이고, 부를 때 쓸 객체는 ref 로 넘긴다.
   */
  const href = buildMyScrapsHref(query);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    fetchMyScraps(queryRef.current)
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

  const placeholder = SEARCH_PLACEHOLDER[query.tab];
  const columns = columnsFor(query.tab);
  const pageInfo =
    state.kind === 'ready'
      ? state.page.pageInfo
      : { pageNum: query.page, pageSize: 0, totalElements: 0, totalPages: 0 };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-950">스크랩한 공고</h1>
        <p className="pt-2 text-sm text-gray-500">저장해 둔 공고를 한곳에서 확인해요.</p>
      </header>

      <MyPageListTabs
        items={TABS}
        current={query.tab}
        buildHref={(tab) => buildMyScrapsHref(query, { tab })}
        aria-label="스크랩 종류"
      />

      {placeholder ? (
        <MyPageFilterRow
          resetHref={buildMyScrapsResetHref(query)}
          filtered={hasMyScrapsFilter(query)}
          search={{
            placeholder,
            defaultValue: query.keyword,
            buildHref: (keyword) => buildMyScrapsHref(query, { keyword }),
          }}
        />
      ) : null}

      <MyPageListTable columns={columns}>
        {state.kind === 'ready' && state.page.rows.length > 0 ? (
          state.page.rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100">
              <MyPageListRowCells row={row} />
              <td className="px-4 py-5 text-center" />
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-500">
              {state.kind === 'loading'
                ? '불러오는 중입니다.'
                : state.kind === 'error'
                  ? '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                  : `스크랩한 ${TAB_NOUNS[query.tab]}가 없습니다.`}
            </td>
          </tr>
        )}
      </MyPageListTable>

      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildMyScrapsHref(query, { page })}
      />
    </section>
  );
}
