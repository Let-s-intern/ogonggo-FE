import { DetailPageSkeleton } from '@/shared/ui/DetailPageSkeleton';
import { ForBusinessBanner } from '@/widgets/for-business-banner';

/**
 * `app/jobs/[jobId]/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * `<main>` 클래스와 그 아래 두 덩어리(상세 본문, `FOR BUSINESS` 배너)는
 * `views/job-detail/ui/JobDetailPage.tsx`와 같은 값이다 — 로딩이 끝날 때 두 덩어리의 자리가
 * 바뀌지 않아야 한다. 배너는 회색 자리 대신 진짜 위젯을 그린다. 데이터가 필요 없는 정적
 * 위젯이라 로딩 중에 이미 최종 모습으로 둘 수 있고, 그러면 이 부분은 높이가 어긋날 여지가
 * 아예 없다.
 *
 * 정보 그리드 2행(경력/채용 유형/학력/지역)과 사이드바 목록 2개(비슷한 공고,
 * 함께 보면 좋아요)는 이 화면의 실제 구성이다(`widgets/job-detail/ui/JobDetailView.tsx`).
 *
 * 본문 섹션은 최대 6개지만 3개만 그린다. 값이 없는 섹션은 통째로 사라져서 실제 개수가
 * 공고마다 다르고(픽스처 5건 실측: 1·1·1·4·6개), 6개를 그리면 본문이 사이드바보다 길어져
 * 그 아래 배너가 아래로 밀린다. 3개면 본문이 사이드바 높이(492px) 안에 들어가 화면 높이가
 * 사이드바로 고정된다 — 실측 5건 중 3건이 정확히 그 높이였다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center gap-10 bg-white px-6 py-10">
      <DetailPageSkeleton
        avatarClass="h-16 w-16"
        infoRows={2}
        sectionCount={3}
        sectionLines={3}
        sidebarListCount={2}
        bodyGapClass="gap-4"
      />
      <div className="w-full max-w-6xl">
        <ForBusinessBanner />
      </div>
    </main>
  );
}
