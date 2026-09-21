import { RecruitmentPostForm } from '@/features/recruitment-post-form';

/**
 * `/mypage/posts/new` 본문(PRD 5 절). 바깥 껍데기(사이드바·로그인 가드) 는
 * `app/(site)/mypage/layout.tsx` 의 `MyPageLayout` 이라 여기는 제목 줄과 폼만 그린다.
 *
 * 사이드바의 `작성한 모집글` 이 켜진 채로 남는다 — `MyPageSidebar` 가 하위 경로까지 현재
 * 항목으로 보기 때문이다. 목업의 사이드바도 그 항목이 켜져 있다.
 */
export function MyPostFormPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-950">사이드 프로젝트 · 스터디 모집글 작성</h1>
        <p className="pt-2 text-sm text-gray-500">
          사이드 프로젝트 · 스터디를 함께할 메이트들을 모집할 수 있어요.
        </p>
      </header>
      <RecruitmentPostForm />
    </section>
  );
}
