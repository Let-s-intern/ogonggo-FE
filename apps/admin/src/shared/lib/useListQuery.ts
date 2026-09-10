import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * 목록 화면의 검색·필터·정렬·페이지를 URL 쿼리스트링에서 읽고 쓴다.
 *
 * 상태를 컴포넌트 안에 두지 않는 이유는 PRD "라우팅" 에 있다 — 운영자가 걸러낸 목록을 그대로
 * 북마크하고, 상세에서 뒤로 갔을 때 조건이 살아 있어야 한다.
 *
 * 필터를 바꾸면 페이지를 1 로 되돌린다. 3페이지를 보다가 상태를 바꾸면 결과가 두 페이지뿐일 수
 * 있고, 그러면 빈 화면이 나온다.
 */
export function useListQuery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = useCallback(
    (key: string, fallback = '') => searchParams.get(key) ?? fallback,
    [searchParams],
  );

  const page = Number(searchParams.get('page') ?? '1');

  const setFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(searchParams);
      if (nextPage <= 1) {
        next.delete('page');
      } else {
        next.set('page', String(nextPage));
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  return {
    get,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    setFilter,
    setPage,
    searchParams,
  };
}
