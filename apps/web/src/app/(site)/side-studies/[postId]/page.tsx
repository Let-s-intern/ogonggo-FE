import { SideStudyDetailPage } from '@/views/side-study-detail';

/**
 * 동적 라우트의 `params`는 이 Next 버전에서 Promise다 — `app/bootcamps/[bootcampId]/page.tsx`와
 * 같다. `postId`가 숫자가 아니면 `NaN`이 되고, 그때도 존재하지 않는 id 조회와 같은 404로
 * 처리된다(`widgets/side-study-detail/ui/SideStudyDetailView.tsx`).
 */
export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  return <SideStudyDetailPage postId={Number(postId)} />;
}
