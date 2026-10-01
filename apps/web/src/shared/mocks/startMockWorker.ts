import {
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
  getGetMyAccountMockHandler,
} from '@ogonggo/api';
import { setupUserWorker } from '@ogonggo/api/src/mocks/browser';
import { type MockRole, readMockRole } from '@/shared/config/mocks';

/**
 * 목데이터 모드에서 보여 줄 내 계정. 생성된 가짜 응답은 역할이 무작위라 마이페이지가 일반·기업
 * 사이를 오가며 튕긴다. 역할을 고정하고 이름 칸만 읽을 수 있는 값으로 채운다.
 */
function mockAccount(role: MockRole): MyAccountResponse {
  const base = {
    userId: 1,
    status: 'ACTIVE',
    joinedAt: '2026-09-01T00:00:00Z',
    passwordChangeable: true,
  } as const;
  if (role === 'COMPANY') {
    return {
      ...base,
      role,
      email: 'company@example.com',
      companyProfile: { organizationName: '오공고 테스트 기업', managerName: '김담당' },
    };
  }
  return {
    ...base,
    role,
    email: 'user@example.com',
    profile: { name: '김오공', nickname: '오공이' },
  };
}

/** 브라우저 워커를 띄운다. 끝날 때까지 기다려야 첫 요청이 워커를 지나치지 않는다. */
export async function startMockWorker(): Promise<void> {
  const accountHandler = getGetMyAccountMockHandler((): SuccessResponseMyAccountResponse => ({
    status: 200,
    message: '요청이 성공했습니다.',
    data: mockAccount(readMockRole()),
  }));
  await setupUserWorker(accountHandler).start({ onUnhandledRequest: 'bypass', quiet: true });
}
