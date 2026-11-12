import type { UserAnnouncementSummaryResponseCategory } from '@ogonggo/api';
import { parseLocalDate } from '@/shared/lib/localDate';

export type NoticeCategory = UserAnnouncementSummaryResponseCategory;

export interface NoticeCategoryMeta {
  label: string;
  /** 카테고리 칸의 한 줄 설명(공지사항 시안). */
  description: string;
  /** 칸 아이콘과 썸네일 없는 추천 카드의 그림. Iconify lucide 클래스다. */
  icon: string;
  /** 아이콘 상자 배경·글자색. */
  tone: string;
}

/**
 * 공지 카테고리(BE `AnnouncementCategory`, LC-3614). 순서는 백엔드 정의 순서와 같고 카테고리 칸이 이 순서로 선다.
 *
 * 이름을 enum 카탈로그(`enumLabels`)에서 읽지 않고 여기 둔다. 카탈로그 스냅숏은 배포된 백엔드에서 받는데, 이 화면과
 * 함께 배포되는 새 enum 이라 그 전에는 비어 있다. 설명·아이콘은 어차피 화면의 것이다.
 */
export const NOTICE_CATEGORY_META: Record<NoticeCategory, NoticeCategoryMeta> = {
  OGONGGO_UPDATE: {
    label: '오공고 업데이트',
    description: '오공고의 새로운 기능과 변경사항을 전달드려요.',
    icon: 'icon-[lucide--sparkles]',
    tone: 'bg-blue-50 text-blue-500',
  },
  NEW_JOB_NOTE: {
    label: '새로운 공고 노트',
    description: '매주 새로 올라온 공고를 정리해드려요.',
    icon: 'icon-[lucide--bell-ring]',
    tone: 'bg-gray-100 text-gray-600',
  },
  SERVICE_NOTICE: {
    label: '서비스 안내',
    description: '점검, 약관 변경처럼 서비스 이용에 필요한 안내예요.',
    icon: 'icon-[lucide--megaphone]',
    tone: 'bg-orange-50 text-orange-500',
  },
};

export const NOTICE_CATEGORIES = Object.keys(NOTICE_CATEGORY_META) as NoticeCategory[];

export function isNoticeCategory(value: string | undefined): value is NoticeCategory {
  return value !== undefined && value in NOTICE_CATEGORY_META;
}

/** `N` 표시를 붙이는 기간. 공지는 하루에 여러 건 올라오지 않아 채용공고(24시간)보다 길게 둔다. */
const NEW_NOTICE_DAYS = 7;

/** 최근 공지인가(`N` 표시). 작성일은 시간대 없는 한국 시간이라 날짜만 비교한다. */
export function isNewNotice(createdAt: string, now: Date = new Date()): boolean {
  const created = parseLocalDate(createdAt.slice(0, 10));
  const elapsedDays = (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
  return elapsedDays < NEW_NOTICE_DAYS;
}
