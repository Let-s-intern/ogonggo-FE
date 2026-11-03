import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicAnnouncement, HttpError } from '@ogonggo/api';
import type { SuccessResponseUserAnnouncementDetailResponse } from '@ogonggo/api';
import { NoticeTagChip } from '@/entities/notice/ui/NoticeBadges';
import {
  OGONGGO_UPDATE_CATEGORY,
  type NoticeDetail,
  type NoticeNeighbor,
} from '@/entities/notice/model/types';
import { formatDateDots } from '@/shared/lib/localDate';
import { hasLexicalText } from '@/shared/lib/lexicalHtml';
import { ChevronIcon } from '@/shared/ui/icons';
import { LexicalContent } from '@/shared/ui/LexicalContent';

export interface NoticeDetailViewProps {
  noticeId: number;
}

/**
 * 공개 상세 `getPublicAnnouncement`(`GET /api/v1/announcements/{noticeId}`).
 *
 * 경로의 id 가 양의 정수가 아니면 부르지 않고 바로 `notFound()` 로 보낸다 — 사이드·스터디
 * 상세와 같은 판단이다. 비노출·삭제된 공지는 백엔드가 404 로 주고(`NoticeReader.readPublic`),
 * 그 404 는 `HttpError.status` 로 가려 `notFound()` 로 바꾼다. 그 밖의 오류는 다시 던져
 * 오류 화면(`app/(site)/error.tsx`) 이 받는다.
 */
export async function fetchNoticeDetail(noticeId: number): Promise<NoticeDetail> {
  if (!Number.isInteger(noticeId) || noticeId < 1) {
    notFound();
  }

  let response: SuccessResponseUserAnnouncementDetailResponse;
  try {
    response = (await getPublicAnnouncement(
      noticeId,
    )) as unknown as SuccessResponseUserAnnouncementDetailResponse;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!response.data) {
    notFound();
  }

  // 카테고리·태그·대표 이미지·이전 다음 글은 생성 타입에 아직 없다(`entities/notice/model/types.ts`).
  return response.data as NoticeDetail;
}

/** `다음 글` · `이전 글` 한 줄. 없으면 그 줄을 그리지 않는다. */
function NeighborRow({ label, neighbor }: { label: string; neighbor?: NoticeNeighbor | null }) {
  if (!neighbor) {
    return null;
  }
  return (
    <li className="border-b border-gray-200">
      <Link
        href={`/notices/${neighbor.id}`}
        className="flex items-center gap-5 py-6 text-gray-900 hover:text-gray-600"
      >
        <span className="shrink-0 text-base text-gray-400">{label}</span>
        <span className="min-w-0 flex-1 truncate text-base md:text-lg">{neighbor.title}</span>
      </Link>
    </li>
  );
}

/**
 * 공지 상세(`notice-update-detail-pc.png`) — 카테고리 목록으로 돌아가는 링크, 태그·제목·게시일, 대표 이미지, 본문,
 * 다음 글 · 이전 글, 목록보기.
 *
 * 본문(`content`) 은 Lexical EditorState JSON 문자열이다(스펙의 필드 설명, 백엔드
 * `UserNoticeResponses.kt`). 어드민이 넣은 값을 백엔드가 검사 없이 그대로 돌려주므로 형식이
 * 어긋난 값도 올 수 있는데, `LexicalContent` 가 그때는 글자만 모은 문단으로 그린다. 그래서
 * 평문이 와도 화면이 깨지지 않는다.
 *
 * 돌아갈 목록은 카테고리가 정한다. 오공고 업데이트가 아니면(카테고리가 아직 없는 응답 포함) 공지 홈이다.
 */
export async function NoticeDetailView({ noticeId }: NoticeDetailViewProps) {
  const notice = await fetchNoticeDetail(noticeId);
  const list =
    notice.category === OGONGGO_UPDATE_CATEGORY.category
      ? { href: OGONGGO_UPDATE_CATEGORY.href, label: OGONGGO_UPDATE_CATEGORY.label }
      : { href: '/notices', label: '오공고 공지사항' };
  const hasNeighbor = Boolean(notice.next || notice.previous);

  return (
    <article className="flex w-full flex-col gap-6">
      <Link
        href={list.href}
        className="flex items-center gap-1 self-start text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronIcon direction="left" className="h-4 w-4" />
        {list.label}
      </Link>

      <div className="flex w-full flex-col gap-10 md:px-10 md:pt-10">
        <header className="flex flex-col items-start gap-2">
          {notice.tags && notice.tags.length > 0 ? (
            <div className="flex gap-1">
              {notice.tags.map((tag) => (
                <NoticeTagChip key={tag} tag={tag} />
              ))}
            </div>
          ) : null}
          <h1 className="text-2xl font-bold text-gray-900">{notice.title}</h1>
          <time dateTime={notice.createdAt} className="text-sm text-gray-500">
            {formatDateDots(notice.createdAt)}
          </time>
        </header>

        {notice.thumbnailUrl ? (
          // `Thumbnail` 과 같은 이유로 `next/image` 를 쓰지 않는다 — 어드민이 올린 외부 주소가 온다.
          <img
            src={notice.thumbnailUrl}
            alt=""
            className="aspect-[1032/460] w-full rounded-2xl bg-gray-50 object-cover"
          />
        ) : null}

        {hasLexicalText(notice.content) ? (
          <LexicalContent content={notice.content} />
        ) : (
          <p className="py-16 text-center text-sm text-gray-500">내용이 없습니다.</p>
        )}

        {hasNeighbor ? (
          <ul className="border-t border-gray-200">
            <NeighborRow label="다음 글" neighbor={notice.next} />
            <NeighborRow label="이전 글" neighbor={notice.previous} />
          </ul>
        ) : null}

        <Link
          href={list.href}
          className="self-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          목록보기
        </Link>
      </div>
    </article>
  );
}
