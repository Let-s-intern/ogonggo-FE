import { http, HttpResponse, type HttpHandler } from 'msw';
import type { MyAccountResponse } from '@ogonggo/api';

/**
 * 비즈니스 앱 목데이터 모드의 계정·로그인 목. 브라우저 워커에만 건다(`./startMockWorker.ts`).
 *
 * `packages/api` 의 생성 목은 내 계정의 역할이 무작위라 기업 마이페이지가 튕기고, 로그인은 토큰 모양만 맞춘
 * 무작위 문자열을 준다. 비즈니스는 로그인 → 새로고침 → 로그아웃을 목으로 확인해야 해서 손으로 쓴다. web 이
 * 아니라 이 앱에 두는 이유는 web 은 목 모드에서 늘 로그인으로 보기 때문이다(`shared/api/authTokens.ts`).
 *
 * 액세스 토큰에 역할을 실어 둔다(`mock-access.COMPANY`). 내 계정 목은 `Authorization` 의 토큰을 보고 역할을 정한다.
 * 기업 계정 정보는 이 브라우저의 `localStorage` 에 두어 새로고침해도 남는다(가입·기업 정보 수정이 그 값을 바꾼다).
 */

const ACCOUNT_KEY = 'ogonggo.business.mock.account';

export const MOCK_COMPANY_ACCOUNT: MyAccountResponse = {
  userId: 501,
  role: 'COMPANY',
  status: 'ACTIVE',
  email: 'company@example.com',
  joinedAt: '2026-09-01T00:00:00Z',
  passwordChangeable: true,
  companyProfile: {
    organizationName: '오공고 테스트 기업',
    managerName: '김담당',
    managerPhone: '010-1234-5678',
    notificationEmail: 'company@example.com',
    businessNumberType: 'BUSINESS_REGISTRATION',
    businessNumber: '1234567890',
    companyType: 'STARTUP',
    employeeCountRange: 'RANGE_10_49',
    industry: 'IT·플랫폼',
    address: '서울특별시 성동구 왕십리로 137',
    homepageUrl: 'https://www.ogonggo.co.kr',
    managerTitle: '인사팀 매니저',
    managerDuty: 'HR',
  },
};

/** 기업이 아닌 계정을 흉내 내는 이메일. 기업 로그인 화면이 이 계정을 막는지 본다. */
export const MOCK_USER_EMAIL = 'user@example.com';

const MOCK_USER_ACCOUNT: MyAccountResponse = {
  userId: 1,
  role: 'USER',
  status: 'ACTIVE',
  email: MOCK_USER_EMAIL,
  joinedAt: '2026-09-01T00:00:00Z',
  passwordChangeable: true,
  profile: { name: '김오공', nickname: '오공이' },
};

export function readMockCompanyAccount(): MyAccountResponse {
  const saved = localStorage.getItem(ACCOUNT_KEY);
  return saved ? (JSON.parse(saved) as MyAccountResponse) : MOCK_COMPANY_ACCOUNT;
}

export function saveMockCompanyAccount(account: MyAccountResponse): void {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

const roleOf = (request: Request): string | null => {
  const header = request.headers.get('Authorization');
  const match = header?.match(/^Bearer mock-access\.(\w+)/);
  return match ? match[1]! : null;
};

const unauthorized = () =>
  HttpResponse.json(
    { status: 401, code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
    { status: 401 },
  );

const ok = (data: unknown) =>
  HttpResponse.json({ status: 200, message: '요청이 성공했습니다.', data });

export const businessAuthHandlers: HttpHandler[] = [
  http.get('*/api/v1/users/me', ({ request }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    return ok(role === 'COMPANY' ? readMockCompanyAccount() : MOCK_USER_ACCOUNT);
  }),
];
