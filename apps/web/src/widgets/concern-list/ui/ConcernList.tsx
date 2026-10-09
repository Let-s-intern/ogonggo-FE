import type { ConcernListQuery } from '../lib/query';
import { ConcernListBanner } from './ConcernListBanner';
import { ConcernListControls } from './ConcernListControls';
import { ConcernListItems } from './ConcernListItems';
import { PopularConcerns } from './PopularConcerns';

export type ConcernListProps = ConcernListQuery;

/**
 * `v13 취준고민/목록.webp` 의 본문 — 상단 줄, 지금 많이 보는 고민, 고민 목록과 페이지네이션, 하단 배너.
 *
 * 인기 고민과 목록은 따로 데이터를 받는 형제 서버 컴포넌트라 두 요청이 겹쳐 나간다. 서로 입력이
 * 달라(인기는 쿼리를 보지 않는다) 한 컴포넌트에서 차례로 기다릴 이유가 없다.
 */
export function ConcernList(query: ConcernListProps) {
  return (
    <div className="flex w-full flex-col gap-10">
      <ConcernListControls query={query} />
      <PopularConcerns />
      <ConcernListItems query={query} />
      <ConcernListBanner />
    </div>
  );
}
