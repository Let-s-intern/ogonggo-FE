import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  type AdminAnnouncementDetailResponse,
  type AdminAnnouncementSummaryResponse,
  type CreateAdminAnnouncementRequest,
  type CreateAdminAnnouncementRequestVisibility,
  type PageResponseAdminAnnouncementSummaryResponse,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

/** 공지 카테고리. `NOTICE_CATEGORY_LABELS` 의 키와 같다. */
export type NoticeCategory = 'OGONGGO_UPDATE' | 'JOB_NOTE';

/** 오공고 업데이트 글 안의 태그. */
export type NoticeTag = 'NEW_FEATURE' | 'CHANGE';

/**
 * 카테고리·태그·썸네일·요약. **admin 스펙에 아직 없고 MSW 목에만 있다**
 * (`packages/api/src/mocks/admin/notices.ts`, 요청서 `백엔드-요청-광고-시스템-admin.md`).
 *
 * 생성 타입에 이 넷을 덧붙여 쓴다. 백엔드가 필드를 더하고 코드젠을 돌리면 이 타입과 아래
 * 덧붙임을 지운다.
 */
export interface NoticeExtraFields {
  category: NoticeCategory;
  tags: NoticeTag[];
  thumbnailUrl: string | null;
  summary: string | null;
}

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  OGONGGO_UPDATE: '오공고 업데이트',
  JOB_NOTE: '새로운 공고 노트',
};

export const NOTICE_TAG_LABELS: Record<NoticeTag, string> = {
  NEW_FEATURE: '새 기능',
  CHANGE: '변경사항',
};

export type NoticeSummary = AdminAnnouncementSummaryResponse & NoticeExtraFields;
export type NoticeDetail = AdminAnnouncementDetailResponse & NoticeExtraFields;
export type NoticeVisibility = CreateAdminAnnouncementRequestVisibility;

export interface NoticeWriteInput extends NoticeExtraFields {
  title: string;
  /** Lexical EditorState JSON 문자열. 공용 편집기(`RichTextEditor`)가 만든 그대로다. */
  content: string;
  pinned: boolean;
  visibility: NoticeVisibility;
}

/**
 * 공지 목록. 노출 여부와 무관하게 삭제되지 않은 공지가 오고, 고정이 먼저 그다음 최신순이다.
 *
 * 쪽이 나뉜다. 화면은 페이지만 넘기고 `keyword`·`visibility`·`pinned` 필터는 보내지 않는다 —
 * 공지는 수십 건을 넘지 않아 검색 상자를 둘 일이 없다.
 */
export function useNoticeList(page: number) {
  return useQuery({
    queryKey: ['admin', 'notices', page],
    // 생성 타입에 목 전용 필드가 없어 덧붙인 타입으로 읽는다(`NoticeExtraFields`).
    queryFn: () =>
      unwrapData(listAnnouncements({ page })) as Promise<
        (PageResponseAdminAnnouncementSummaryResponse & { items: NoticeSummary[] }) | undefined
      >,
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
    queryFn: () =>
      unwrapData(getAnnouncement(noticeId as number)) as Promise<NoticeDetail | undefined>,
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
      const body: CreateAdminAnnouncementRequest & NoticeExtraFields = {
        title: input.title,
        content: input.content,
        pinned: input.pinned,
        visibility: input.visibility,
        category: input.category,
        tags: input.tags,
        thumbnailUrl: input.thumbnailUrl,
        summary: input.summary,
      };
      return noticeId === null
        ? unwrapData(createAnnouncement(body))
        : unwrapData(updateAnnouncement(noticeId, body));
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
