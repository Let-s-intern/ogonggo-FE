'use client';

import { useEffect, useRef, useState } from 'react';
import {
  closeMyPost,
  copyMyPost,
  deleteMyPost,
  reopenMyPost,
} from '@/entities/side-study/api/myRecruitmentPosts';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { MyPageFilterRow, MyPageListTable, type MyPageListColumn } from '@/widgets/mypage-list';
import { fetchMyPostsPage, type MyPostRow as MyPostRowData, type MyPostsPage } from '../lib/fetch';
import {
  buildMyPostsHref,
  buildMyPostsResetHref,
  hasMyPostsFilter,
  type MyPostsQuery,
} from '../lib/query';
import { MyPostRow } from './MyPostRow';
import { MyPostCard } from './MyPostCard';
import { MyPostsCta, MyPostsWriteCard } from './MyPostsCta';
import { MyPostsFilters, MyPostsSort } from './MyPostsFilters';

/** 목업의 표 머리글 다섯. 폭을 주지 않은 `모집글 정보` 가 남는 폭을 갖는다. */
const COLUMNS: readonly MyPageListColumn[] = [
  { key: 'info', label: '모집글 정보' },
  { key: 'capacity', label: '모집 인원', className: 'w-28' },
  { key: 'period', label: '모집 기간', className: 'w-64' },
  { key: 'viewCount', label: '조회수', className: 'w-24' },
  { key: 'action', label: '관리', className: 'w-44' },
];

type State = { kind: 'loading' } | { kind: 'ready'; page: MyPostsPage } | { kind: 'error' };

export interface MyPostsProps {
  query: MyPostsQuery;
}

/**
 * `작성한 모집글`(PRD 4 절). 필터 줄 + 표 + 페이지네이션 + 하단 CTA 배너다. 제목과 작성 버튼은
 * v11 부터 `MyPageLayout` 의 상단 탭 줄에 있다.
 *
 * 탭이 없다 — 목업에도 없고 `listMyRecruitmentPosts` 도 한 목록만 준다. 그래서
 * `MyPageListTabs` 를 쓰지 않고 표와 필터 줄만 `widgets/mypage-list` 에서 가져온다.
 *
 * 목록은 브라우저에서 읽는다. 로그인 토큰이 브라우저 저장소에만 있어 서버 컴포넌트가 읽으면
 * 토큰 없이 나간다 — `지원·신청 내역` 과 같다.
 */
export function MyPosts({ query }: MyPostsProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  /** 삭제·복사·마감·재모집 뒤 목록을 다시 읽으려고 올리는 값. 주소는 그대로인데 내용만 바뀐다. */
  const [reloadToken, setReloadToken] = useState(0);
  /** 요청이 도는 행. 그 행의 메뉴를 잠근다. */
  const [pendingPostId, setPendingPostId] = useState<number | null>(null);
  /**
   * 한 동작이 실패했을 때의 말. 표를 오류 화면으로 바꾸지 않고 표 위에 한 줄 띄운다 —
   * 재모집은 종료일이 지났으면 백엔드가 409 를 주는 정상적인 실패라, 그때마다 읽어 온 목록을
   * 버리면 무엇이 왜 안 됐는지 볼 화면이 사라진다.
   */
  const [actionError, setActionError] = useState<string | null>(null);
  /**
   * 무엇을 읽을지는 주소가 정한다. `query` 객체는 렌더마다 새로 만들어져 효과의 의존값이 될
   * 수 없는데, 주소 문자열은 페이지와 필터를 그대로 담고 있어 같은 값이면 같은 요청이다.
   */
  const href = buildMyPostsHref(query);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    fetchMyPostsPage(queryRef.current)
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
  const mutate = (postId: number, failure: string, run: () => Promise<unknown>) => {
    setPendingPostId(postId);
    setActionError(null);
    run()
      .then(() => setReloadToken((token) => token + 1))
      .catch(() => setActionError(failure))
      .finally(() => setPendingPostId(null));
  };

  /** 표의 행과 모바일 카드가 같은 동작을 건다. */
  const rowProps = (row: MyPostRowData) => ({
    row,
    pending: pendingPostId === row.postId,
    onDelete: () =>
      mutate(row.postId, '모집글을 삭제하지 못했습니다.', () => deleteMyPost(row.postId)),
    onCopy: () => mutate(row.postId, '모집글을 복사하지 못했습니다.', () => copyMyPost(row.postId)),
    onClose: () =>
      mutate(row.postId, '모집글을 마감하지 못했습니다.', () => closeMyPost(row.postId)),
    onReopen: () =>
      mutate(
        row.postId,
        // 백엔드가 409 를 주는 조건이 이것 하나다(생성 타입 설명).
        '모집 종료일이 지난 글은 다시 모집할 수 없습니다. 종료일을 미래로 고친 뒤 다시 시도해 주세요.',
        () => reopenMyPost(row.postId),
      ),
  });

  const emptyMessage =
    state.kind === 'loading'
      ? '불러오는 중입니다.'
      : state.kind === 'error'
        ? '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
        : '작성한 모집글이 없습니다.';

  const rows = state.kind === 'ready' ? state.page.rows : [];
  const pageInfo =
    state.kind === 'ready'
      ? state.page.pageInfo
      : { pageNum: query.page, pageSize: 0, totalElements: 0, totalPages: 0 };

  return (
    <section className="flex flex-col gap-6">
      {/* 제목은 없다(v11). 데스크톱은 `MyPageLayout` 의 상단 탭이 제목을 대신하고 작성 버튼도 그 줄
          오른쪽에 있다. 모바일은 `< 작성한 모집글` 머리가 제목이고 작성 버튼은 아래 카드다. */}
      <div className="md:hidden">
        <MyPostsWriteCard />
      </div>

      <MyPageFilterRow
        resetHref={buildMyPostsResetHref()}
        filtered={hasMyPostsFilter(query)}
        search={{
          placeholder: '모집글 검색',
          defaultValue: query.keyword,
          buildHref: (keyword) => buildMyPostsHref(query, { keyword }),
        }}
        sort={<MyPostsSort query={query} />}
      >
        <MyPostsFilters query={query} />
      </MyPageFilterRow>

      {actionError ? (
        <p role="alert" className="text-sm text-error">
          {actionError}
        </p>
      ) : null}

      <div className="hidden md:block">
        <MyPageListTable columns={COLUMNS}>
          {rows.length > 0 ? (
            rows.map((row) => <MyPostRow key={row.postId} {...rowProps(row)} />)
          ) : (
            <tr>
              <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </MyPageListTable>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.length > 0 ? (
          rows.map((row) => <MyPostCard key={row.postId} {...rowProps(row)} />)
        ) : (
          <li className="py-16 text-center text-sm text-gray-500">{emptyMessage}</li>
        )}
      </ul>

      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildMyPostsHref(query, { page })}
      />

      <div className="hidden md:block">
        <MyPostsCta />
      </div>
    </section>
  );
}
