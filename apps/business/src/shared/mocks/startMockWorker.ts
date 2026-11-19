import {
  getGetMyAccountMockHandler,
  getSignInCompanyMockHandler,
  getSignOutMockHandler,
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
} from '@ogonggo/api';
import { setupUserWorker } from '@ogonggo/api/src/mocks/browser';

/**
 * 목데이터 모드에서 보여 줄 내 계정. 생성된 가짜 응답은 역할이 무작위라 기업 회원 가드(`CompanyMyPageLayout`)가
 * 로그인 화면으로 튕긴다. 기업 회원으로 고정한다. 값은 `apps/web/src/shared/mocks/startMockWorker.ts` 의 기업 회원과 같다.
 */
const MOCK_ACCOUNT: MyAccountResponse = {
  userId: 1,
  status: 'ACTIVE',
  joinedAt: '2026-09-01T00:00:00Z',
  passwordChangeable: true,
  role: 'COMPANY',
  email: 'company@example.com',
  companyProfile: { organizationName: '오공고 테스트 기업', managerName: '김담당' },
};

/**
 * 브라우저 워커를 띄운다. 끝날 때까지 기다려야 첫 요청이 워커를 지나치지 않는다. 손으로 쓴 핸들러
 * (`packages/api/src/mocks/handlers.ts`)가 생성 핸들러보다 먼저 받는다.
 */
export async function startMockWorker(): Promise<void> {
  const accountHandler = getGetMyAccountMockHandler((): SuccessResponseMyAccountResponse => ({
    status: 200,
    message: '요청이 성공했습니다.',
    data: MOCK_ACCOUNT,
  }));
  // 로그인 화면은 아무 이메일·비밀번호나 받는다. 토큰 값은 목 서버가 들어 있는지만 본다.
  const signInHandler = getSignInCompanyMockHandler({
    status: 200,
    message: '요청이 성공했습니다.',
    data: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' },
  });
  const signOutHandler = getSignOutMockHandler({ status: 200, message: '요청이 성공했습니다.' });
  await setupUserWorker(accountHandler, signInHandler, signOutHandler).start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
