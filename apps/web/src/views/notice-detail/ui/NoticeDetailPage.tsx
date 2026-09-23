import { NoticeDetailView } from '@/widgets/notice-detail';

export interface NoticeDetailPageProps {
  noticeId: number;
}

/** `/notices/[noticeId]` — 바깥 여백은 목록(`views/notice-list`) 과 같은 값이다. */
export function NoticeDetailPage({ noticeId }: NoticeDetailPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <NoticeDetailView noticeId={noticeId} />
      </div>
    </main>
  );
}
