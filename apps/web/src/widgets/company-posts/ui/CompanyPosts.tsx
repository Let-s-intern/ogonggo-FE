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
import { closeCompanyPost, deleteCompanyPost } from '../lib/mutate';
import { buildCompanyPostsHref, type CompanyPostsQuery, type CompanyPostTab } from '../lib/query';
import { companyPostNewHref } from '../lib/routes';
import { CompanyPostRow } from './CompanyPostRow';
import { CompanyPostsCta } from './CompanyPostsCta';

/**
 * 표 머리글. `공고 정보` 는 폭을 주지 않아 남는 폭을 갖는다.
 *
 * **목업의 `조회수` 열이 빠지고 `심사 · 게시 상태` 열이 늘었다.** 기업용 목록 응답에는
 * 조회수도 북마크수도 없고 대신 `reviewStatus`·`publicationStatus` 가 있다 — 근거는
 * `CompanyPostRow` 와 `model/status.ts` 주석에 있다.
 *
 * 폭을 준 네 열이 좁다. v4 표(`widgets/my-posts`) 보다 열이 하나 많아 같은 폭을 쓰면
 * `공고 정보` 에 제목 한 줄이 들어가지 않는다 — 모집 기간은 날짜 두 줄로 접고 나머지는
 * 내용 폭까지 줄였다.
 */
const COLUMNS: readonly MyPageListColumn[] = [
  { key: 'info', label: '공고 정보' },
  { key: 'capacity', label: '모집 인원', className: 'w-24' },
  { key: 'period', label: '모집 기간', className: 'w-48' },
  // 머리글이 `심사 · 게시 상태` 면 w-28 안에서 두 줄로 접힌다. 열을 넓히면 `공고 정보` 가
  // 좁아지므로 머리글을 줄였다 — 어느 배지가 무엇인지는 배지의 `title` 이 말한다.
  { key: 'status', label: '심사 · 게시', className: 'w-28' },
  { key: 'action', label: '관리', className: 'w-36' },
];

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
  /** 삭제 뒤 목록을 다시 읽으려고 올리는 값. 주소는 그대로인데 내용만 바뀐다. */
  const [reloadToken, setReloadToken] = useState(0);
  /** 요청이 도는 행. 그 행의 메뉴를 잠근다. */
  const [pendingId, setPendingId] = useState<string | null>(null);
  /**
   * 한 동작이 실패했을 때의 말. 표를 오류 화면으로 바꾸지 않고 표 위에 한 줄 띄운다 —
   * 읽어 온 목록을 버리면 무엇이 왜 안 됐는지 볼 화면이 사라진다(v4 `MyPosts` 와 같다).
   */
  const [actionError, setActionError] = useState<string | null>(null);
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
  }, [href, reloadToken]);

  /** 한 행에 거는 동작 하나. 도는 동안 그 행을 잠그고, 끝나면 목록을 다시 읽는다. */
  const mutate = (key: string, failure: string, run: () => Promise<unknown>) => {
    setPendingId(key);
    setActionError(null);
    run()
      .then(() => setReloadToken((token) => token + 1))
      .catch(() => setActionError(failure))
      .finally(() => setPendingId(null));
  };

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

      {actionError ? (
        <p role="alert" className="text-sm text-error">
          {actionError}
        </p>
      ) : null}

      <MyPageListTable columns={COLUMNS}>
        {rows.length > 0 ? (
          rows.map((row) => (
            <CompanyPostRow
              key={row.key}
              row={row}
              tab={query.tab}
              pending={pendingId === row.key}
              onDelete={() =>
                mutate(row.key, `${TAB_NOUNS[query.tab]}를 삭제하지 못했습니다.`, () =>
                  deleteCompanyPost(query.tab, row.id),
                )
              }
              onClose={() =>
                mutate(row.key, `${TAB_NOUNS[query.tab]}를 마감하지 못했습니다.`, () =>
                  closeCompanyPost(query.tab, row.id),
                )
              }
            />
          ))
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
