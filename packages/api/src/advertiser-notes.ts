/**
 * 광고주 어드민 메모(이슈 #573, 2026-11-06 사용자). 광고 계약 상세에 운영자가 여러 건 남기는 메모다. 비회원 광고주에 있던
 * 한 칸짜리 `memo` 는 없앴고, 그 값은 이 메모 한 건(`광고주 등록 메모`)으로 옮긴다(2026-11-06 사용자).
 *
 * 백엔드 API 가 아직 없어 손으로 적었다. 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "어드민 메모"
 * 이고, 목(`./mocks/admin/advertiser-notes.ts`)이 이 모양 그대로 응답한다. 백엔드 배포 뒤 코드젠으로 바꾼다.
 */

/** `GET /api/v1/admin/advertisers/{advertiserId}/notes` 한 건. 최신순으로 온다. */
export interface AdminAdvertiserNoteResponse {
  id: number;
  advertiserId: number;
  title: string;
  content: string;
  /** 쓴 관리자 이름. 서버가 관리자 토큰에서 읽어 싣는다. 모르면 `null` 이고 화면은 `관리자` 로 보인다. */
  authorName: string | null;
  /** KST `YYYY-MM-DDTHH:mm:ss`. */
  createdAt: string;
  updatedAt: string;
}

/** 등록(`POST`)·수정(`PATCH`) 본문. 제목 1~100자, 내용 1~2000자. 수정은 보낸 칸만 바뀐다. */
export interface AdminAdvertiserNoteRequest {
  title: string;
  content: string;
}

export const adminAdvertiserNotesPath = (advertiserId: number) =>
  `/api/v1/admin/advertisers/${advertiserId}/notes`;

/** 메모 한 건의 수정·삭제(`/{noteId}`). */
export const ADMIN_ADVERTISER_NOTES_PATH = '/api/v1/admin/advertiser-notes';
