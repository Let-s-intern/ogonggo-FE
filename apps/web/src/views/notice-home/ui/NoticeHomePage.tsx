import { NoticeHome, type NoticeHomeProps } from '@/widgets/notice-home';

export type NoticeHomePageProps = NoticeHomeProps;

/** `/notices` — 공지사항 홈. 바깥 폭·여백은 다른 목록 화면과 같다. */
export function NoticeHomePage(props: NoticeHomePageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-page-padded flex-col px-5 py-10 md:pb-24">
        <NoticeHome {...props} />
      </div>
    </main>
  );
}
