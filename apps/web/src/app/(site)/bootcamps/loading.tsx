import { ListPageSkeleton } from '@/shared/ui/ListPageSkeleton';

/** 한 페이지 카드 수. MSW 핸들러의 `DEFAULT_BOOTCAMP_SIZE`와 같은 값이다. */
const CARD_COUNT = 12;

/**
 * `app/bootcamps/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * 이 파일이 없으면 루트 `app/loading.tsx`가 이 자리를 대신하는데, 그건 `/calendar`와 같이 쓰는
 * 폴백이라 목록 모양을 알려 줄 수 없다. 목록은 자기 모양을 아는 스켈레톤을 쓰려고 여기 둔다.
 *
 * `<main>` 클래스는 `views/bootcamp-list/ui/BootcampListPage.tsx`와 같은 값이다 —
 * 로딩이 끝날 때 배경·정렬·최소 높이가 바뀌지 않아야 한다. `ogonggo-fallback`은 300ms 지연
 * 노출이다(`app/globals.css`).
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center bg-white">
      <ListPageSkeleton cardCount={CARD_COUNT} />
    </main>
  );
}
