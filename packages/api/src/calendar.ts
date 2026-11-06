import type { AdContractProduct, AdContractSummary } from './ad-contracts';
import type { AdminAdPostingResponse } from './ad-postings';
import type { AdvertiserSummary } from './advertisers';
import type { AdminBannerResponse } from './banners';

/**
 * 어드민 캘린더(이슈 #573, 2026-11-06 사용자). 헤더 `캘린더` 탭의 달력에 광고 일정(계약·배너·광고 공고)과 운영자 할 일을 함께
 * 그린다.
 *
 * 백엔드 API 가 아직 없어 손으로 적었다. 계약은 `.claude/tasks/memos/백엔드-요청-어드민-캘린더-2026-11-06.md` 이고, 목
 * (`./mocks/admin/calendar.ts`)이 이 모양 그대로 응답한다. 백엔드 배포 뒤 코드젠으로 바꾼다.
 *
 * 기간 조회의 `from`·`to` 는 KST 날짜(`YYYY-MM-DD`)이고 `from` 포함, `to` 미포함이다. 달력이 보이는 칸의 첫날과 마지막 날
 * 다음 날을 보낸다.
 */

/** 할 일 한 건. 날짜만 있고(시각 없음) 시작·끝 모두 포함이다. 하루짜리는 둘이 같다. */
export interface AdminCalendarTodoResponse {
  id: number;
  title: string;
  /** 내용. 없으면 `null`. */
  content: string | null;
  /** KST `YYYY-MM-DD`. */
  startDate: string;
  /** KST `YYYY-MM-DD`. `startDate` 와 같거나 뒤다. */
  endDate: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 등록(`POST`) 본문. 수정(`PATCH`)은 이 칸의 부분집합이다. 제목 1~100자, 내용 2000자까지. */
export interface AdminCalendarTodoRequest {
  title: string;
  content: string | null;
  startDate: string;
  endDate: string;
  done: boolean;
}

export type UpdateAdminCalendarTodoRequest = Partial<AdminCalendarTodoRequest>;

/** `GET ?from=&to=` 목록·`POST` 등록, `/{todoId}` 수정·삭제. */
export const ADMIN_CALENDAR_TODOS_PATH = '/api/v1/admin/calendar-todos';

/** 달력에 그릴 광고 계약. 계약 응답에서 달력이 쓰는 칸만 두고 광고주 이름을 붙였다. */
export interface AdminAdCalendarContract extends AdContractSummary {
  advertiserId: number;
  /** 서버가 `advertiserId` 로 읽어 싣는다. 광고주가 지워졌으면 `null` 이다. */
  advertiser: AdvertiserSummary | null;
  amount: number;
  paid: boolean;
  products: AdContractProduct[];
}

/**
 * `GET /api/v1/admin/ad-calendar?from=&to=`. 기간이 `[from, to)` 와 겹치는 광고 계약·배너·광고 공고 전부(꺼진 것 포함).
 * 배너·광고 공고의 시작·끝이 `null` 이면 그쪽 끝이 열린 것으로 보고 겹침을 판단한다. 배너·광고 공고 한 건은 어드민 목록
 * 응답과 같은 모양이다.
 */
export interface AdminAdCalendarResponse {
  contracts: AdminAdCalendarContract[];
  banners: AdminBannerResponse[];
  adPostings: AdminAdPostingResponse[];
}

export const ADMIN_AD_CALENDAR_PATH = '/api/v1/admin/ad-calendar';
