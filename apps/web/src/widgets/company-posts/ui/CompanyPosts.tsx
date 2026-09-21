'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@ogonggo/ui';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import {
  MyPageListTable,
  MyPageListTabs,
  type MyPageListColumn,
  type MyPageListTab,
} from '@/widgets/mypage-list';
import { fetchCompanyPosts, TAB_NOUNS, type CompanyPostsPage } from '../lib/fetch';
import { buildCompanyPostsHref, type CompanyPostsQuery, type CompanyPostTab } from '../lib/query';
import { companyPostNewHref } from '../lib/routes';
import { CompanyPostRow } from './CompanyPostRow';
import { CompanyPostsCta } from './CompanyPostsCta';

/** 표 머리글. `공고 정보` 는 폭을 주지 않아 남는 폭을 갖는다. */
const COLUMNS: readonly MyPageListColumn[] = [{ key: 'info', label: '공고 정보' }];

type State = { kind: 'loading' } | { kind: 'ready'; page: CompanyPostsPage } | { kind: 'error' };

export interface CompanyPostsProps {
  query: CompanyPostsQuery;
}

/**
 * `작성한 공고`(v5 PRD 2 절). 제목 줄 + 탭 둘 + 표 + 페이지네이션 + 하단 CTA 배너다.
 *
 * **목업(`docs/asset/v5 기업회원 마이페이지/작성한 공고.png`) 에 v4 잔재가 남아 있다.**
 * 디자이너가 v4 의 `작성한 모집글` 화면을 복사해 바뀌는 부분만 고쳐 넘겼고, 제목·부제·표
 * 머리글·행 메타에 모집글 용어가 그대로 있다. 여기 문구는 목업이 아니라 task 1.1 의 표를
 * 따른다 — 기업 회원 화면에 "사이드 프로젝트 · 스터디 모집글" 이 있으면 자기 공고 목록이
 * 아닌 것으로 읽힌다.
 *
 * | 목업 | 쓰는 것 |
 * |---|---|
 * | 작성한 사이드 프로젝트 · 스터디 모집글 | 작성한 공고 |
 * | 사이드 · 스터디확인해요. | 등록한 공고의 상태를 한곳에서 확인해요. |
 * | 새 모집글 작성하기 | 새 공고 작성하기 |
 *
 * **목업의 필터 줄(`마감 상태`·`지원 상태`·`모집글 검색`·`최근 저장순`) 을 그리지 않는다.**
 * `listMyJobs`·`listMyBootcamps` 가 받는 것이 `page`·`size` 뿐이라 거를 것도 정렬할 것도
 * 없다. 근거는 `.claude/tasks/memos/결정-기업-마이페이지-push2-2026-09-21.md` 1 절.
 *
 * 목록은 브라우저에서 읽는다. 로그인 토큰이 브라우저 저장소에만 있어 서버 컴포넌트가 읽으면
 * 토큰 없이 나간다 — 마이페이지 목록 화면 넷과 같다.
 */
export function CompanyPosts({ query }: CompanyPostsProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  /**
   * 무엇을 읽을지는 주소가 정한다. `query` 객체는 렌더마다 새로 만들어져 효과의 의존값이 될
   * 수 없는데, 주소 문자열은 탭과 페이지를 그대로 담고 있어 같은 값이면 같은 요청이다.
   */
  const href = buildCompanyPostsHref(query);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    fetchCompanyPosts(queryRef.current)
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

  const rows = state.kind === 'ready' ? state.page.rows : [];
  const pageInfo =
    state.kind === 'ready'
      ? state.page.pageInfo
      : { pageNum: query.page, pageSize: 0, totalElements: 0, totalPages: 0 };
  /**
   * 목업은 탭 둘 다 건수를 달고 있지만 지금 보고 있는 탭만 센다. 다른 탭의 건수는 그 탭을
   * 부르기 전에는 모르고, 0 과 "모름" 은 다른 말이다(`MyPageListTabs` 의 `count` 주석).
   */
  const tabs: readonly MyPageListTab<CompanyPostTab>[] = [
    {
      value: 'jobs',
      label: TAB_NOUNS.jobs,
      count: query.tab === 'jobs' && state.kind === 'ready' ? pageInfo.totalElements : undefined,
    },
    {
      value: 'bootcamps',
      label: TAB_NOUNS.bootcamps,
      count:
        query.tab === 'bootcamps' && state.kind === 'ready' ? pageInfo.totalElements : undefined,
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">작성한 공고</h1>
          <p className="pt-2 text-sm text-gray-500">등록한 공고의 상태를 한곳에서 확인해요.</p>
        </div>
        <Button asChild className="whitespace-nowrap">
          <Link href={companyPostNewHref(query.tab)}>새 공고 작성하기</Link>
        </Button>
      </header>

      <MyPageListTabs
        items={tabs}
        current={query.tab}
        buildHref={(tab) => buildCompanyPostsHref(query, { tab })}
        aria-label="공고 종류"
      />

      <MyPageListTable columns={COLUMNS}>
        {rows.length > 0 ? (
          rows.map((row) => <CompanyPostRow key={row.key} row={row} />)
        ) : (
          <tr>
            <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-sm text-gray-500">
              {state.kind === 'loading'
                ? '불러오는 중입니다.'
                : state.kind === 'error'
                  ? '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                  : `작성한 ${TAB_NOUNS[query.tab]}가 없습니다.`}
            </td>
          </tr>
        )}
      </MyPageListTable>

      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildCompanyPostsHref(query, { page })}
      />

      <CompanyPostsCta tab={query.tab} />
    </section>
  );
}
