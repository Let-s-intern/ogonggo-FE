import { NoticeDetailPage } from '@/views/notice-detail';

/**
 * 동적 라우트의 `params` 는 이 Next 버전에서 Promise 다 — `app/(site)/side-studies/[postId]`
 * 와 같다. `noticeId` 가 숫자가 아니면 `NaN` 이 되고, 그때도 없는 id 조회와 같은 404 로
 * 처리된다(`widgets/notice-detail/ui/NoticeDetailView.tsx`).
 */
export default async function Page({ params }: { params: Promise<{ noticeId: string }> }) {
  const { noticeId } = await params;

  return <NoticeDetailPage noticeId={Number(noticeId)} />;
}
