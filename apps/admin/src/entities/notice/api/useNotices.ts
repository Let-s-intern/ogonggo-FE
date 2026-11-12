import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  type AdminAnnouncementDetailResponse,
  type AdminAnnouncementSummaryResponse,
  type CreateAdminAnnouncementRequestCategory,
  type CreateAdminAnnouncementRequestVisibility,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

export type NoticeSummary = AdminAnnouncementSummaryResponse;
export type NoticeDetail = AdminAnnouncementDetailResponse;
export type NoticeVisibility = CreateAdminAnnouncementRequestVisibility;
export type NoticeCategory = CreateAdminAnnouncementRequestCategory;

export interface NoticeWriteInput {
  title: string;
  /** Lexical EditorState JSON 문자열. 공용 편집기(`RichTextEditor`)가 만든 그대로다. */
  content: string;
  pinned: boolean;
  visibility: NoticeVisibility;
  /** 공지사항 화면의 카테고리 칸(BE LC-3614). */
  category: NoticeCategory;
  /** 추천 카드 썸네일 주소. 비어 있으면 없음이다. */
  thumbnailUrl: string;
  /** 목록·추천 카드의 한두 줄 요약. 비어 있으면 없음이다. */
  summary: string;
}

/**
 * 공지 목록. 노출 여부와 무관하게 삭제되지 않은 공지가 오고, 고정이 먼저 그다음 최신순이다.
 *
 * 쪽이 나뉜다. 화면은 페이지만 넘기고 `keyword`·`visibility`·`pinned` 필터는 보내지 않는다 —
 * 공지는 수십 건을 넘지 않아 검색 상자를 둘 일이 없다.
 */
export function useNoticeList(page: number) {
  return useQuery({
    // 다음 페이지를 받는 동안 지금 페이지를 그대로 둔다. 비우면 표와 페이지 번호가 사라져 1페이지로 돌아간 것처럼 보인다.
    placeholderData: keepPreviousData,
    queryKey: ['admin', 'notices', page],
    queryFn: () => unwrapData(listAnnouncements({ page })),
  });
}

/**
 * 공지 한 건. **목록에는 본문이 없어서** 수정 폼을 열 때 이것으로 받는다.
 *
 * 목록 행의 값으로 폼을 채우던 때와 달라진 점이다. `id` 가 없으면(새 공지) 부르지 않는다.
 */
export function useNoticeDetail(noticeId: number | null) {
  return useQuery({
    queryKey: ['admin', 'notices', 'detail', noticeId],
    queryFn: () => unwrapData(getAnnouncement(noticeId as number)),
    enabled: noticeId !== null,
  });
}

/**
 * 새 공지 등록과 기존 공지 수정.
 *
 * 수정은 `PATCH` 라 보낸 값만 바뀌지만 폼이 모든 칸을 들고 있으므로 모두 보낸다. 일부만
 * 보내면 폼에서 지운 값이 서버에 남아 있는 것과 구분되지 않는다.
 */
export function useSaveNotice(noticeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoticeWriteInput) => {
      const body = {
        title: input.title,
        content: input.content,
        pinned: input.pinned,
        visibility: input.visibility,
        category: input.category,
      };
      // 등록은 빈 칸을 보내지 않고, 수정은 빈 글자를 보내 지운다(BE: 썸네일·요약은 빈 글자면 지운다).
      return noticeId === null
        ? unwrapData(
            createAnnouncement({
              ...body,
              thumbnailUrl: input.thumbnailUrl || undefined,
              summary: input.summary || undefined,
            }),
          )
        : unwrapData(
            updateAnnouncement(noticeId, {
              ...body,
              thumbnailUrl: input.thumbnailUrl,
              summary: input.summary,
            }),
          );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}

/** 삭제. 서버가 소프트 삭제하고 목록에서 사라진다. */
export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noticeId: number) => {
      await deleteAnnouncement(noticeId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}

/**
 * 목록에서 노출만 바꾼다. 본문을 보내지 않으므로 평문 ↔ Lexical 왕복을 거치지 않는다.
 *
 * `useSaveNotice` 는 폼이 네 칸을 다 들고 있어 전부 보내지만, 여기는 고칠 것이 한 칸이다.
 * 본문까지 보내면 요약 응답에 본문이 없어 목록에서는 보낼 값 자체가 없고, 다시 받아 오면
 * 토글 한 번에 요청이 둘이 된다. `PATCH` 라 보낸 칸만 바뀐다.
 *
 * 채용공고·부트캠프 목록이 같은 자리에서 같은 일을 한다(`pages/job-list` 의 `VisibilityToggle`).
 */
export function usePatchNoticeVisibility(noticeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visibility: NoticeVisibility) =>
      unwrapData(updateAnnouncement(noticeId, { visibility })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}
