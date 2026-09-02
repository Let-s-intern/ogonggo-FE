import { DetailPageSkeleton } from '@/shared/ui/DetailPageSkeleton';
import { ForBusinessBanner } from '@/widgets/for-business-banner';

/**
 * `app/bootcamps/[bootcampId]/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * 뼈대와 `<main>` 클래스는 채용공고 상세(`app/jobs/[jobId]/loading.tsx`)와 같다 — 두 화면의
 * 실제 레이아웃이 같은 값이기 때문이다. 다른 것은 숫자뿐이다
 * (`widgets/bootcamp-detail/ui/BootcampDetailView.tsx`) — 정보 그리드 3행(6칸), 본문 섹션 2개
 * (커리큘럼, 지원 자격 · 전형), 사이드바 목록 2개. 본문 열 간격도 `gap-8`로 다르다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center gap-10 bg-white px-6 py-10">
      <DetailPageSkeleton
        avatarClass="h-16 w-16"
        infoRows={3}
        sectionCount={2}
        sectionLines={3}
        sidebarListCount={2}
        bodyGapClass="gap-8"
      />
      <div className="w-full max-w-6xl">
        <ForBusinessBanner />
      </div>
    </main>
  );
}
