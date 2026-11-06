/**
 * 광고주(이슈 #573). 배너·광고 공고가 어느 기업이 맡긴 광고인지 적는다. 비즈니스 회원은 회원 정보를 그대로 쓰고, 회원이
 * 아닌 기업(무료 홍보 신청·광고 문의로 들어온 곳, 운영자가 직접 더한 곳)은 광고주로 따로 둔다.
 *
 * 백엔드 API 가 아직 없어 손으로 적었다. 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "광고주"
 * 이고, 목(`./mocks/admin/advertisers.ts`)이 이 모양 그대로 응답한다. 백엔드 배포 뒤 코드젠으로 바꾼다.
 */

/** `MEMBER` 는 비즈니스 회원, `NON_MEMBER` 는 회원이 아닌 기업이다. */
export type AdvertiserType = 'MEMBER' | 'NON_MEMBER';

/** 광고주가 목록에 들어온 길. 회원 가입, 광고 문의(무료 홍보 신청 포함), 운영자 직접 추가. */
export type AdvertiserSource = 'COMPANY_MEMBER' | 'AD_INQUIRY' | 'MANUAL';

/** 배너·광고 공고 응답에 붙는 광고주 요약. 표의 `광고주` 칸이 그린다. */
export interface AdvertiserSummary {
  id: number;
  name: string;
  type: AdvertiserType;
}

/** `GET /api/v1/admin/advertisers` 한 건. */
export interface AdminAdvertiserResponse extends AdvertiserSummary {
  source: AdvertiserSource;
  /** 비즈니스 회원이면 그 회원의 사용자 id. */
  companyMemberUserId?: number;
  /** 광고 문의로 들어왔으면 그 문의 id(가장 최근 것). */
  adInquiryId?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  memo?: string;
}

/** 비회원 광고주 추가(`POST /api/v1/admin/advertisers`). 이름만 필수다. */
export interface CreateAdminAdvertiserRequest {
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  memo?: string;
}

export const ADMIN_ADVERTISERS_PATH = '/api/v1/admin/advertisers';
