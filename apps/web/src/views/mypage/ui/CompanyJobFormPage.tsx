import { CompanyJobForm } from '@/widgets/company-job-form';

export interface CompanyJobFormPageProps {
  /**
   * 있으면 수정 화면(`/mypage/company/posts/jobs/{jobId}/edit`), 없으면 새 공고
   * (`/mypage/company/posts/jobs/new`). 두 주소는
   * `widgets/company-posts/lib/routes.ts` 가 정했다.
   */
  jobId?: number;
}

/**
 * 채용공고 작성·수정 본문(v5 PRD 3 절). 바깥 껍데기(사이드바·로그인 가드·역할 가드) 는
 * `app/(site)/mypage/layout.tsx` 의 `MyPageLayout` 이라 여기는 제목 줄과 폼만 그린다.
 *
 * 사이드바의 `작성한 공고` 가 켜진 채로 남는다 — `MyPageSidebar` 가 하위 경로까지 현재
 * 항목으로 보기 때문이다. 목업의 사이드바도 그 항목이 켜져 있다.
 *
 * 제목만 작성과 수정이 다르다. 폼은 같은 것이고 `jobId` 하나로 갈린다.
 */
export function CompanyJobFormPage({ jobId }: CompanyJobFormPageProps) {
  const editing = jobId !== undefined;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-950">채용 공고 {editing ? '수정' : '등록'}</h1>
        <p className="pt-2 text-sm text-gray-500">지원자에게 필요한 정보를 입력해 주세요.</p>
      </header>
      <CompanyJobForm jobId={jobId} />
    </section>
  );
}
