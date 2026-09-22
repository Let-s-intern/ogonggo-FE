'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';
import { Chip, SearchInput } from '@ogonggo/ui';

/** 백엔드가 `keyword` 를 2자 이상으로 받는다(`ListMyJobBookmarksParams` 의 `@minLength 2`). */
const MIN_KEYWORD_LENGTH = 2;

export interface MyPageFilterRowSearch {
  placeholder: string;
  defaultValue?: string;
  /** 검색어 하나에 대한 주소. 지웠거나 한 글자면 `undefined` 로 불린다. */
  buildHref: (keyword?: string) => string;
}

export interface MyPageFilterRowProps {
  /** `전체` 칩이 가는 곳. 그 탭의 필터를 모두 지운 주소다. */
  resetHref: string;
  /** 지금 걸린 필터가 있는가. `전체` 칩의 색을 정한다. */
  filtered: boolean;
  /** 왼쪽 드롭다운들. 필터가 없는 탭은 이 줄 자체를 그리지 않는다. */
  children?: ReactNode;
  /** 오른쪽 검색 상자. 없는 탭은 넘기지 않는다. */
  search?: MyPageFilterRowSearch;
  /** 오른쪽 끝 정렬 드롭다운. */
  sort?: ReactNode;
  /**
   * 정렬 뒤에 붙는 것. `지원 · 신청 관리` 의 보기 전환 아이콘이 여기 온다
   * (`widgets/application-board/ui/ApplicationBoardViewToggle.tsx`).
   */
  trailing?: ReactNode;
}

/**
 * 표 위 필터 한 줄(목업 `docs/asset/v4 마이페이지/지원 신청내역/`). 왼쪽이 `전체` 칩 +
 * 드롭다운들, 오른쪽이 검색 상자 + 정렬이다.
 *
 * `전체` 칩은 그 탭의 필터를 전부 지운다 — 목업에 동작이 적혀 있지 않아 정한 것이고 근거는
 * `.claude/tasks/memos/결정-마이페이지-push2-2026-09-21.md` 5 절에 있다. `Chip` 이
 * `<button>` 이라 `<Link>` 로 감싸면 대화형 요소가 중첩되므로 라우터로 옮긴다.
 *
 * 검색은 `<form method="GET">` 이 아니라 `onSubmit` 이다. 이 화면은 로그인 토큰을 브라우저에서
 * 읽는 클라이언트 화면이라, 폼 GET 이 일으키는 전체 새로고침이 계정 조회와 로그인 가드를 매
 * 검색마다 다시 돌린다.
 */
export function MyPageFilterRow({
  resetHref,
  filtered,
  children,
  search,
  sort,
  trailing,
}: MyPageFilterRowProps) {
  const router = useRouter();

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!search) {
      return;
    }
    const keyword = String(new FormData(event.currentTarget).get('keyword') ?? '').trim();
    // 한 글자는 보내지 않는다. 보내면 백엔드가 400 을 주고, 화면에는 검색이 고장난 것으로 보인다.
    router.push(search.buildHref(keyword.length >= MIN_KEYWORD_LENGTH ? keyword : undefined));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip tone={filtered ? 'gray' : 'blue'} onClick={() => router.push(resetHref)}>
        전체
      </Chip>
      {children}
      <div className="ml-auto flex items-center gap-2">
        {search ? (
          <form onSubmit={submitSearch}>
            <SearchInput
              name="keyword"
              defaultValue={search.defaultValue}
              placeholder={search.placeholder}
              wrapperClassName="w-45"
            />
            <button type="submit" className="sr-only">
              검색
            </button>
          </form>
        ) : null}
        {sort}
        {trailing}
      </div>
    </div>
  );
}
