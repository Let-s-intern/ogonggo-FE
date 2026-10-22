import { ListPageSkeleton } from '@/shared/ui/ListPageSkeleton';

/** 한 페이지 카드 수. 목록 요청의 `size`(`widgets/side-study-list/ui/SideStudyList.tsx`) 와 같은 값이다. */
const CARD_COUNT = 8;

/**
 * `app/side-studies/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * 두는 이유와 `<main>` 클래스는 `app/bootcamps/loading.tsx`와 같다. 다른 곳은 카드 수(8장)와
 * 카드 모양이다(`framed`) — 데스크톱은 테두리 카드, 모바일은 선으로 나뉜 한 줄 목록이다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center bg-white">
      {/* 페이지(`views/side-study-list`)에 `FOR BUSINESS` 배너가 없어 자리도 잡지 않는다. */}
      <ListPageSkeleton cardCount={CARD_COUNT} framed />
    </main>
  );
}
