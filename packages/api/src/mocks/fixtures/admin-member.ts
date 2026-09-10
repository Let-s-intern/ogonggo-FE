/**
 * 어드민 회원 픽스처.
 *
 * 일반 회원과 비즈니스 회원은 백엔드에서 같은 `users` 테이블에 `UserRole`(`USER`/`COMPANY`)로
 * 나뉘어 있지만, 어드민 화면은 목록 칸이 서로 달라 두 화면으로 나뉜다(PRD "회원"). 그래서
 * 타입도 둘로 나눠 둔다.
 *
 * `status`는 백엔드 `UserStatus`(`ACTIVE`/`WITHDRAWN`/`SUSPENDED`)를 그대로 쓴다. 콘솔은 이
 * 값을 바꾸지 않는다 — 제재는 운영자가 쿼리로 걸고, 화면은 그 결과를 보여주기만 한다.
 *
 * 아래 값은 **전부 지어낸 것이다.** 회사명과 사업자등록번호는 실존하지 않는다.
 */

export type MemberStatus = 'ACTIVE' | 'WITHDRAWN' | 'SUSPENDED';

export interface UserMemberSummary {
  id: number;
  nickname: string;
  email: string;
  /** ISO 8601. */
  joinedAt: string;
  status: MemberStatus;
  /** ISO 8601. 한 번도 접속하지 않았으면 없다. */
  lastAccessedAt?: string;
}

export interface CompanyMemberSummary {
  id: number;
  companyName: string;
  /** `000-00-00000` 형식. */
  businessRegistrationNumber: string;
  managerName: string;
  managerEmail: string;
  /** 그 회사가 등록한 채용공고 수. 게시 상태를 가리지 않는다. */
  jobPostingCount: number;
  joinedAt: string;
  status: MemberStatus;
}

export interface MemberPageInfo {
  pageNum: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface UserMemberPageResponse {
  items: UserMemberSummary[];
  pageInfo: MemberPageInfo;
}

export interface CompanyMemberPageResponse {
  items: CompanyMemberSummary[];
  pageInfo: MemberPageInfo;
}

/** `GET /api/v1/admin/members/users`의 응답 봉투. */
export interface UserMemberListResponse {
  status: number;
  message: string;
  data?: UserMemberPageResponse;
}

/** `GET /api/v1/admin/members/companies`의 응답 봉투. */
export interface CompanyMemberListResponse {
  status: number;
  message: string;
  data?: CompanyMemberPageResponse;
}

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const USER_MEMBER_FIXTURES: UserMemberSummary[] = [
  {
    id: 1,
    nickname: '취준생김씨',
    email: 'minsu.kim@example.com',
    joinedAt: daysAgo(2),
    status: 'ACTIVE',
    lastAccessedAt: daysAgo(0),
  },
  {
    id: 2,
    nickname: '프론트뉴비',
    email: 'seoyeon.lee@example.com',
    joinedAt: daysAgo(4),
    status: 'ACTIVE',
    lastAccessedAt: daysAgo(1),
  },
  {
    id: 3,
    nickname: '백엔드지망',
    email: 'jihoon.park@example.com',
    joinedAt: daysAgo(6),
    status: 'ACTIVE',
    lastAccessedAt: daysAgo(3),
  },
  {
    id: 4,
    nickname: '데이터분석가',
    email: 'yujin.choi@example.com',
    joinedAt: daysAgo(12),
    status: 'SUSPENDED',
    lastAccessedAt: daysAgo(9),
  },
  {
    id: 5,
    nickname: '하늘색개발자',
    email: 'haneul.jung@example.com',
    joinedAt: daysAgo(23),
    status: 'ACTIVE',
    lastAccessedAt: daysAgo(2),
  },
  {
    id: 6,
    nickname: '도현이',
    email: 'dohyun.kang@example.com',
    joinedAt: daysAgo(41),
    status: 'WITHDRAWN',
  },
  {
    id: 7,
    nickname: '소라게',
    email: 'sora.yoon@example.com',
    joinedAt: daysAgo(58),
    status: 'ACTIVE',
    lastAccessedAt: daysAgo(5),
  },
  {
    id: 8,
    nickname: '태우태우',
    email: 'taewoo.lim@example.com',
    joinedAt: daysAgo(77),
    status: 'ACTIVE',
    lastAccessedAt: daysAgo(14),
  },
  {
    id: 9,
    nickname: '예린',
    email: 'yerin.han@example.com',
    joinedAt: daysAgo(95),
    status: 'ACTIVE',
    lastAccessedAt: daysAgo(31),
  },
  {
    id: 10,
    nickname: '준석',
    email: 'junseok.oh@example.com',
    joinedAt: daysAgo(130),
    status: 'SUSPENDED',
    lastAccessedAt: daysAgo(120),
  },
];

export const COMPANY_MEMBER_FIXTURES: CompanyMemberSummary[] = [
  {
    id: 101,
    companyName: '넥스트웨이브',
    businessRegistrationNumber: '123-45-67890',
    managerName: '신재현',
    managerEmail: 'jaehyun.shin@example.com',
    jobPostingCount: 7,
    joinedAt: daysAgo(3),
    status: 'ACTIVE',
  },
  {
    id: 102,
    companyName: '코드그로브',
    businessRegistrationNumber: '234-56-78901',
    managerName: '배수민',
    managerEmail: 'sumin.bae@example.com',
    jobPostingCount: 3,
    joinedAt: daysAgo(5),
    status: 'ACTIVE',
  },
  {
    id: 103,
    companyName: '라이트박스',
    businessRegistrationNumber: '345-67-89012',
    managerName: '오준석',
    managerEmail: 'junseok.oh@example.com',
    jobPostingCount: 12,
    joinedAt: daysAgo(19),
    status: 'ACTIVE',
  },
  {
    id: 104,
    companyName: '한빛솔루션',
    businessRegistrationNumber: '456-78-90123',
    managerName: '한예린',
    managerEmail: 'yerin.han@example.com',
    jobPostingCount: 1,
    joinedAt: daysAgo(46),
    status: 'SUSPENDED',
  },
  {
    id: 105,
    companyName: '스튜디오무브',
    businessRegistrationNumber: '567-89-01234',
    managerName: '임태우',
    managerEmail: 'taewoo.lim@example.com',
    jobPostingCount: 5,
    joinedAt: daysAgo(88),
    status: 'ACTIVE',
  },
  {
    id: 106,
    companyName: '테라데이터랩',
    businessRegistrationNumber: '678-90-12345',
    managerName: '강도현',
    managerEmail: 'dohyun.kang@example.com',
    jobPostingCount: 0,
    joinedAt: daysAgo(141),
    status: 'WITHDRAWN',
  },
];

/** 대시보드가 세는 "이번 주 신규 회원" — 최근 7일 안에 가입한 일반 + 비즈니스 회원이다. */
export const countMembersJoinedWithinDays = (days: number): number => {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  const isRecent = (joinedAt: string) => new Date(joinedAt).getTime() >= threshold;
  return (
    USER_MEMBER_FIXTURES.filter((member) => isRecent(member.joinedAt)).length +
    COMPANY_MEMBER_FIXTURES.filter((member) => isRecent(member.joinedAt)).length
  );
};
