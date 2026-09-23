import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicNotice, HttpError } from '@ogonggo/api';
import type {
  SuccessResponseUserNoticeDetailResponse,
  UserNoticeDetailResponse,
} from '@ogonggo/api';
import { formatDateDots } from '@/shared/lib/localDate';
import { hasLexicalText } from '@/shared/lib/lexicalHtml';
import { ChevronIcon } from '@/shared/ui/icons';
import { LexicalContent } from '@/shared/ui/LexicalContent';

export interface NoticeDetailViewProps {
  noticeId: number;
}

/**
 * 공개 상세 `getPublicNotice`(`GET /api/v1/notices/{noticeId}`).
 *
 * 경로의 id 가 양의 정수가 아니면 부르지 않고 바로 `notFound()` 로 보낸다 — 사이드·스터디
 * 상세와 같은 판단이다. 비노출·삭제된 공지는 백엔드가 404 로 주고(`NoticeReader.readPublic`),
 * 그 404 는 `HttpError.status` 로 가려 `notFound()` 로 바꾼다. 그 밖의 오류는 다시 던져
 * 오류 화면(`app/(site)/error.tsx`) 이 받는다.
 */
export async function fetchNoticeDetail(noticeId: number): Promise<UserNoticeDetailResponse> {
  if (!Number.isInteger(noticeId) || noticeId < 1) {
    notFound();
  }

  let response: SuccessResponseUserNoticeDetailResponse;
  try {
    response = (await getPublicNotice(
      noticeId,
    )) as unknown as SuccessResponseUserNoticeDetailResponse;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!response.data) {
    notFound();
  }

  return response.data;
}

/**
 * 공지 상세 — 목록으로 돌아가는 링크, 제목·작성일, 본문.
 *
 * 본문(`content`) 은 Lexical EditorState JSON 문자열이다(스펙의 필드 설명, 백엔드
 * `UserNoticeResponses.kt`). 어드민이 넣은 값을 백엔드가 검사 없이 그대로 돌려주므로 형식이
 * 어긋난 값도 올 수 있는데, `LexicalContent` 가 그때는 글자만 모은 문단으로 그린다. 그래서
 * 평문이 와도 화면이 깨지지 않는다.
 */
export async function NoticeDetailView({ noticeId }: NoticeDetailViewProps) {
  const notice = await fetchNoticeDetail(noticeId);

  return (
    <article className="flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/notices"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronIcon direction="left" className="h-4 w-4" />
        공지사항 목록
      </Link>

      <header className="flex flex-col gap-2 border-b border-gray-200 pb-6">
        {notice.pinned ? <span className="text-xs font-bold text-blue-500">고정</span> : null}
        <h1 className="text-2xl font-bold text-gray-900">{notice.title}</h1>
        <time dateTime={notice.createdAt} className="text-sm text-gray-400">
          {formatDateDots(notice.createdAt)}
        </time>
      </header>

      {hasLexicalText(notice.content) ? (
        <LexicalContent content={notice.content} />
      ) : (
        <p className="py-16 text-center text-sm text-gray-500">내용이 없습니다.</p>
      )}
    </article>
  );
}
