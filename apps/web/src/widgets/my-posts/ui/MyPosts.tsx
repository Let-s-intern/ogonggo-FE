'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { MyPageListTable, type MyPageListColumn } from '@/widgets/mypage-list';
import { fetchMyPostsPage, type MyPostsPage } from '../lib/fetch';
import { buildMyPostsHref, type MyPostsQuery } from '../lib/query';
import { MyPostRow } from './MyPostRow';
import { MyPostsCta } from './MyPostsCta';

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
 * `작성한 모집글`(PRD 4 절). 제목 줄 + 표 + 페이지네이션 + 하단 CTA 배너다.
 *
 * 탭이 없다 — 목업에도 없고 `listMyRecruitmentPosts` 도 한 목록만 준다. 그래서
 * `MyPageListTabs` 를 쓰지 않고 표와 필터 줄만 `widgets/mypage-list` 에서 가져온다.
 *
 * 목록은 브라우저에서 읽는다. 로그인 토큰이 브라우저 저장소에만 있어 서버 컴포넌트가 읽으면
 * 토큰 없이 나간다 — `지원·신청 내역` 과 같다.
 */
export function MyPosts({ query }: MyPostsProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
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
  }, [href]);

  const rows = state.kind === 'ready' ? state.page.rows : [];
  const pageInfo =
    state.kind === 'ready'
      ? state.page.pageInfo
      : { pageNum: query.page, pageSize: 0, totalElements: 0, totalPages: 0 };

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">
            작성한 사이드 프로젝트 · 스터디 모집글
          </h1>
          <p className="pt-2 text-sm text-gray-500">
            내가 쓴 모집글의 모집 현황을 한곳에서 확인해요.
          </p>
        </div>
        {/* 작성 화면이 PRD 5 절이라 아직 없다. 없는 경로로 보내지 않는다. */}
        <Button disabled title={PLACEHOLDER_NOTICE} className="whitespace-nowrap">
          새 모집글 작성하기
        </Button>
      </header>

      <MyPageListTable columns={COLUMNS}>
        {rows.length > 0 ? (
          rows.map((row) => <MyPostRow key={row.postId} row={row} />)
        ) : (
          <tr>
            <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-sm text-gray-500">
              {state.kind === 'loading'
                ? '불러오는 중입니다.'
                : state.kind === 'error'
                  ? '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                  : '작성한 모집글이 없습니다.'}
            </td>
          </tr>
        )}
      </MyPageListTable>

      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildMyPostsHref(query, { page })}
      />

      <MyPostsCta />
    </section>
  );
}
