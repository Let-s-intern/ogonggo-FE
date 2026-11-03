import type { UserAnnouncementDetailResponse, UserAnnouncementSummaryResponse } from '@ogonggo/api';

/**
 * 공지 카테고리·태그·썸네일·요약은 백엔드에 아직 없다. 목(`packages/api/src/mocks/notices.ts`)이 먼저 주고,
 * 요청한 모양은 `.claude/tasks/memos/백엔드-요청-광고-시스템-web.md` 에 있다. 코드젠 뒤 생성 타입으로 바꾼다.
 */
export type NoticeCategory = 'OGONGGO_UPDATE' | 'JOB_NOTE';

export type NoticeTag = 'NEW_FEATURE' | 'CHANGE';

interface NoticeExtraFields {
  category?: NoticeCategory;
  tags?: NoticeTag[];
  thumbnailUrl?: string;
  summary?: string;
}

export type NoticeSummary = UserAnnouncementSummaryResponse & NoticeExtraFields;

export interface NoticeNeighbor {
  id: number;
  title: string;
}

export type NoticeDetail = UserAnnouncementDetailResponse &
  NoticeExtraFields & {
    /** 같은 카테고리의 바로 이전(더 오래된) 글. */
    previous?: NoticeNeighbor | null;
    /** 같은 카테고리의 바로 다음(더 새) 글. */
    next?: NoticeNeighbor | null;
  };

export const NOTICE_TAG_LABELS: Record<NoticeTag, string> = {
  NEW_FEATURE: '새 기능',
  CHANGE: '변경사항',
};

export interface NoticeCategoryInfo {
  category: NoticeCategory;
  label: string;
  description: string;
  /** 카테고리 목록 주소. */
  href: string;
}

/** 오공고 업데이트. 공지 홈의 카테고리 칸과 `/notices/updates` 목록이 쓴다. */
export const OGONGGO_UPDATE_CATEGORY: NoticeCategoryInfo = {
  category: 'OGONGGO_UPDATE',
  label: '오공고 업데이트',
  description: '오공고의 새로운 기능과 변경사항을 전달드려요.',
  href: '/notices/updates',
};

/**
 * 공지 홈 `전체 카테고리` 에 보이는 카테고리. `JOB_NOTE`(새로운 공고 노트)는 템플릿이 오기 전까지 글이 없어
 * 넣지 않는다(`.claude/tasks/memos/결정-광고시스템-web-공지사항-2026-11-03.md`).
 */
export const VISIBLE_NOTICE_CATEGORIES: NoticeCategoryInfo[] = [OGONGGO_UPDATE_CATEGORY];

/** 새 글 `N` 을 붙이는 기간. 게시 후 7 일이다. */
const NEW_NOTICE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * `createdAt` 은 시간대 없는 `LocalDateTime` 이고 백엔드가 KST 로 저장한다. KST 로 읽어 지금과 비교한다.
 * 공지 화면은 서버에서만 그리므로 하이드레이션 차이가 생기지 않는다.
 */
export function isNewNotice(createdAt: string, now = Date.now()): boolean {
  const posted = new Date(
    /[zZ]|[+-]\d{2}:\d{2}$/.test(createdAt) ? createdAt : `${createdAt}+09:00`,
  );
  const elapsed = now - posted.getTime();
  return elapsed >= 0 && elapsed < NEW_NOTICE_DAYS * DAY_MS;
}
