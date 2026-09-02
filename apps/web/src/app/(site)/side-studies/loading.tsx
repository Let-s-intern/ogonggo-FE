import { ListPageSkeleton } from '@/shared/ui/ListPageSkeleton';

/** 한 페이지 카드 수. MSW 핸들러의 `DEFAULT_SIDE_STUDY_SIZE`와 같은 값이다. */
const CARD_COUNT = 8;

/**
 * `app/side-studies/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * 두는 이유와 `<main>` 클래스는 `app/bootcamps/loading.tsx`와 같다. 다른 곳은 카드 수(8장)와
 * 카드 아래 해시태그·댓글·조회수 줄뿐이다 — 사이드·스터디 카드에만 그 줄이 있다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center bg-white">
      <ListPageSkeleton cardCount={CARD_COUNT} hasCardFooter />
    </main>
  );
}
