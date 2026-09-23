import type { Metadata } from 'next';
import { fetchNoticeDetail } from '@/widgets/notice-detail';
import { lexicalToPlainText } from '@/shared/lib/lexicalHtml';
import { NoticeDetailPage } from '@/views/notice-detail';

type PageParams = { params: Promise<{ noticeId: string }> };

/** 메타 설명 한 줄 분량. 초과하면 말줄임표를 붙인다. */
const DESCRIPTION_MAX_LENGTH = 150;

/**
 * 본문(`content`)은 Lexical EditorState JSON이거나(대부분) 형식이 깨진 평문이다
 * (`NoticeDetailView.tsx` 주석). `lexicalToPlainText`가 둘 다 받아 글자만 돌려주므로 여기서는
 * 길이만 자른다. 본문이 비어 있으면(글자 없는 공지) 제목만으로도 설명이 되게 `title`로 대신한다.
 */
function buildDescription(title: string, content: unknown): string {
  const plain = lexicalToPlainText(content) || title;
  return plain.length > DESCRIPTION_MAX_LENGTH
    ? `${plain.slice(0, DESCRIPTION_MAX_LENGTH)}…`
    : plain;
}

/**
 * `fetchNoticeDetail`(`widgets/notice-detail/ui/NoticeDetailView.tsx`)을 그대로 재사용한다 —
 * 404 판별(`HttpError.status === 404` → `notFound()`)이 본문과 갈리면 안 된다. `getPublicNotice`는
 * `fetch`로 나가므로 같은 렌더 안에서 본문과 이 호출이 자동으로 합쳐진다(요청 한 번).
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { noticeId } = await params;
  const notice = await fetchNoticeDetail(Number(noticeId));

  const description = buildDescription(notice.title, notice.content);
  const canonical = `/notices/${noticeId}`;

  return {
    title: notice.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: notice.title,
      description,
      url: canonical,
    },
  };
}

/**
 * 동적 라우트의 `params` 는 이 Next 버전에서 Promise 다 — `app/(site)/side-studies/[postId]`
 * 와 같다. `noticeId` 가 숫자가 아니면 `NaN` 이 되고, 그때도 없는 id 조회와 같은 404 로
 * 처리된다(`widgets/notice-detail/ui/NoticeDetailView.tsx`).
 */
export default async function Page({ params }: PageParams) {
  const { noticeId } = await params;

  return <NoticeDetailPage noticeId={Number(noticeId)} />;
}
