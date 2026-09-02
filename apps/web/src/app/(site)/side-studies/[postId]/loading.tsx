import { DetailPageSkeleton } from '@/shared/ui/DetailPageSkeleton';
import { ForBusinessBanner } from '@/widgets/for-business-banner';

/**
 * `app/side-studies/[postId]/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * 뼈대와 `<main>` 클래스는 채용공고·부트캠프 상세의 것과 같다. 다른 것은 숫자뿐이다
 * (`widgets/side-study-detail/ui/SideStudyDetailView.tsx`) — 헤더 카드의 작성자 썸네일이
 * `h-12 w-12`(다른 둘은 회사 로고라 `h-16 w-16`), 정보 그리드 4행(`기술 스택`이 두 칸을
 * 차지해 7칸이 4행이 된다), 본문 섹션 3개(한 줄 소개, 모집 상세 내용, 지원 자격 및 전형),
 * 사이드바 목록 1개(비슷한 사이드·스터디 — 이 화면에는 `함께 보면 좋아요`가 없다).
 *
 * 문단을 다섯 줄로 그리는 것도 이 화면만이다. 사이드바에 목록이 하나뿐이라 높이가 268px로
 * 짧아 본문이 항상 더 길고, 그래서 화면 높이가 본문 길이에 좌우된다 — 세 줄로 그리면 실측
 * 두 건(750px)보다 140px 짧았고 다섯 줄이면 20px 짧다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center gap-10 bg-white px-6 py-10">
      <DetailPageSkeleton
        avatarClass="h-12 w-12"
        infoRows={4}
        sectionCount={3}
        sectionLines={5}
        sidebarListCount={1}
        bodyGapClass="gap-8"
      />
      <div className="w-full max-w-6xl">
        <ForBusinessBanner />
      </div>
    </main>
  );
}
