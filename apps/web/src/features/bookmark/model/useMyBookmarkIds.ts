'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subscribeTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { fetchMyBookmarkIdPage, type BookmarkKind } from '../api/bookmarkApi';

/** 내 목록의 한 페이지 크기. 백엔드가 `@Max(100)` 이라 이보다 크게 부를 수 없다. */
const PAGE_SIZE = 100;

/**
 * 페이지를 넘기는 횟수의 상한. `totalPages` 는 서버가 주는 값이라, 그것만 믿고 도는 반복은
 * 서버가 이상한 수를 주는 날 브라우저를 멈춘다. 100 건씩 스무 번이면 2,000 건이다.
 */
const MAX_PAGES = 20;

/** 한 종류의 id 모음 쿼리 키. 무효화하는 쪽(`useToggleBookmark`, 스크랩 화면) 도 이것을 쓴다. */
export function myBookmarkIdsKey(kind: BookmarkKind) {
  return ['my-bookmarks', kind] as const;
}

/**
 * 북마크를 쓸 수 있는 상태인지. 버튼을 그릴지와 내 목록을 부를지가 모두 여기서 갈린다.
 *
 * `unknown` 은 로그인했는데 역할을 아직 모르는 동안(과 계정을 못 읽은 경우) 이다. 이때는
 * 버튼을 그리지 않는다 — 보였다가 사라지는 것보다 늦게 나타나는 편이 낫다(PRD "기업 회원에게는
 * 버튼이 없다").
 */
export type BookmarkAccess = 'guest' | 'member' | 'company' | 'unknown';

export function useBookmarkAccess(): BookmarkAccess {
  const account = useMyAccount();
  switch (account.kind) {
    case 'signedOut':
      return 'guest';
    case 'ready':
      return account.account.role === 'COMPANY' ? 'company' : 'member';
    default:
      return 'unknown';
  }
}

/**
 * 한 종류의 "내가 북마크한 id" 모음(PRD "북마크 여부는 브라우저가 내 목록으로 덮어쓴다").
 *
 * 목록·상세를 그리는 것은 서버 컴포넌트이고, 로그인 토큰은 브라우저에만 있다. 그래서 서버가 준
 * `bookmarked` 는 누구에게나 늘 `false` 다. 아이콘은 이 모음을 보고 그린다.
 *
 * 아직 모르는 동안(로딩)과 부를 수 없는 경우(비로그인·기업 회원) 는 `undefined` 다. 부르는 쪽은
 * 그때 서버가 준 값을 그대로 그린다 — 모음이 도착하면 채워진 아이콘으로 바뀐다. 이 깜빡임은
 * 받아들인다. 빈 아이콘이 잠깐 보이는 것이 틀린 채움을 보이는 것보다 낫다.
 *
 * **종류별로 따로 둔다.** 채용공고 목록을 볼 때 사이드·스터디 북마크까지 부를 이유가 없다.
 * 한 화면에 카드가 스무 장이어도 쿼리 키가 같아 요청은 종류당 한 번이다.
 *
 * **기업 회원에게는 부르지 않는다.** 스크랩 화면이 일반 회원 마이페이지에만 있어 기업 회원의
 * 북마크는 쓸 곳이 없고, 그리지 않을 아이콘을 위한 요청도 마찬가지다.
 */
export function useMyBookmarkIds(kind: BookmarkKind): ReadonlySet<number> | undefined {
  const access = useBookmarkAccess();
  const queryClient = useQueryClient();

  /*
   * 로그인·로그아웃이 바뀌면 모음을 버린다. 계정이 바뀌는 것이라 앞 사람의 모음을 잠깐이라도
   * 그리면 안 된다 — `enabled` 만으로는 캐시에 남은 값이 그대로 보인다. `useMyAccount` 도 같은
   * 신호를 구독하고 있어, 비우고 나면 새 역할이 정해지는 대로 다시 부른다.
   */
  useEffect(
    () => subscribeTokens(() => queryClient.removeQueries({ queryKey: ['my-bookmarks'] })),
    [queryClient],
  );

  const query = useQuery({
    queryKey: myBookmarkIdsKey(kind),
    queryFn: () => fetchAllBookmarkIds(kind),
    enabled: access === 'member',
    /*
     * 바뀌는 것은 이 앱이 스스로 무효화한다(등록·해제, 스크랩 화면의 해제). 그사이에는 화면을
     * 오갈 때마다 다시 부를 이유가 없다.
     */
    staleTime: 5 * 60 * 1000,
  });

  // 캐시에 남은 값이 아니라 지금 부를 수 있는지를 따른다. 로그아웃 직후가 그 차이다.
  return access === 'member' ? query.data : undefined;
}

/**
 * 1 페이지부터 `pageInfo` 의 마지막 페이지까지 부른다. 거의 모든 사용자는 한 번이면 끝난다.
 */
async function fetchAllBookmarkIds(kind: BookmarkKind): Promise<ReadonlySet<number>> {
  const ids = new Set<number>();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchMyBookmarkIdPage(kind, { page, size: PAGE_SIZE });
    for (const id of result.ids) {
      ids.add(id);
    }
    if (page >= result.pageInfo.totalPages) {
      break;
    }
  }
  return ids;
}
