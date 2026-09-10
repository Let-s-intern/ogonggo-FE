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
 * 닉네임·이메일·담당자 이름·사업자등록번호는 **전부 지어낸 값이다.** 회사명만 예외로, 실제
 * 공고 픽스처에 있는 회사를 그대로 쓴다 — 이유는 아래 `COMPANY_PROFILES` 주석에 있다.
 */

import { ADMIN_JOB_FIXTURES } from './admin-content';

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

/**
 * 비즈니스 회원의 담당자 정보. 회사명은 여기 적지 않는다 — 아래에서 실제 공고 픽스처의 회사와
 * 짝지어 붙인다.
 *
 * 처음에는 회사명까지 지어냈는데, 그러면 목록의 "등록 공고 7건"과 상세의 공고 목록 0건이
 * 어긋난다. 공고 픽스처의 회사명과 겹치는 이름이 하나도 없기 때문이다. 목이 스스로 모순되면
 * 화면이 조인을 제대로 하는지 확인할 수 없다.
 *
 * 담당자 이름·이메일·사업자등록번호는 여전히 **지어낸 값이다.**
 */
const COMPANY_PROFILES = [
  {
    id: 101,
    managerName: '신재현',
    managerEmail: 'jaehyun.shin@example.com',
    joinedDaysAgo: 3,
    status: 'ACTIVE' as const,
  },
  {
    id: 102,
    managerName: '배수민',
    managerEmail: 'sumin.bae@example.com',
    joinedDaysAgo: 5,
    status: 'ACTIVE' as const,
  },
  {
    id: 103,
    managerName: '오준석',
    managerEmail: 'junseok.oh@example.com',
    joinedDaysAgo: 19,
    status: 'ACTIVE' as const,
  },
  {
    id: 104,
    managerName: '한예린',
    managerEmail: 'yerin.han@example.com',
    joinedDaysAgo: 46,
    status: 'SUSPENDED' as const,
  },
  {
    id: 105,
    managerName: '임태우',
    managerEmail: 'taewoo.lim@example.com',
    joinedDaysAgo: 88,
    status: 'ACTIVE' as const,
  },
  {
    id: 106,
    managerName: '강도현',
    managerEmail: 'dohyun.kang@example.com',
    joinedDaysAgo: 141,
    status: 'WITHDRAWN' as const,
  },
  {
    id: 107,
    managerName: '윤소라',
    managerEmail: 'sora.yoon@example.com',
    joinedDaysAgo: 12,
    status: 'ACTIVE' as const,
  },
  {
    id: 108,
    managerName: '정하늘',
    managerEmail: 'haneul.jung@example.com',
    joinedDaysAgo: 61,
    status: 'ACTIVE' as const,
  },
];

/** 비즈니스 회원이 올린 것으로 되어 있는 공고들의 회사명. 등장 순서를 유지한다. */
const COMPANY_NAMES_WITH_JOBS = [
  ...new Set(
    ADMIN_JOB_FIXTURES.filter((job) => job.source === 'COMPANY').map((job) => job.companyName),
  ),
];

/** `000-00-00000` 형식. id 에서 만들어 회사가 늘어도 손으로 적을 것이 없다. */
const businessRegistrationNumberFor = (id: number): string => {
  const digits = String(id * 1_234_567)
    .padStart(10, '0')
    .slice(-10);
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
};

export const COMPANY_MEMBER_FIXTURES: CompanyMemberSummary[] = COMPANY_PROFILES.flatMap(
  (profile, index) => {
    const companyName = COMPANY_NAMES_WITH_JOBS[index];
    // 공고 픽스처에 비즈니스 등록분이 프로필 수보다 적으면 그만큼만 만든다.
    if (companyName === undefined) {
      return [];
    }
    return [
      {
        id: profile.id,
        companyName,
        businessRegistrationNumber: businessRegistrationNumberFor(profile.id),
        managerName: profile.managerName,
        managerEmail: profile.managerEmail,
        jobPostingCount: ADMIN_JOB_FIXTURES.filter(
          (job) => job.source === 'COMPANY' && job.companyName === companyName,
        ).length,
        joinedAt: daysAgo(profile.joinedDaysAgo),
        status: profile.status,
      },
    ];
  },
);

/** 대시보드가 세는 "이번 주 신규 회원" — 최근 7일 안에 가입한 일반 + 비즈니스 회원이다. */
export const countMembersJoinedWithinDays = (days: number): number => {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  const isRecent = (joinedAt: string) => new Date(joinedAt).getTime() >= threshold;
  return (
    USER_MEMBER_FIXTURES.filter((member) => isRecent(member.joinedAt)).length +
    COMPANY_MEMBER_FIXTURES.filter((member) => isRecent(member.joinedAt)).length
  );
};
