import { httpClient } from '@ogonggo/api';
import type {
  AdCoupon,
  AdPlacementAvailabilityResponse,
  CreateAdApplicationRequest,
  CreateAdApplicationResponse,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';

/**
 * 광고 API. **백엔드에 아직 없고 MSW 목에만 있다**(`packages/api/src/mocks/advertisements.ts`, 요청서
 * `.claude/tasks/memos/백엔드-요청-광고-시스템.md`). 생성 클라이언트가 없어 `httpClient` 로 부르고 타입은 목 전용
 * 타입을 쓴다. 백엔드가 생기면 코드젠 함수로 바꾼다. 어드민(`apps/admin/src/entities/advertisement`)과 같은 방식이다.
 */

interface Envelope<T> {
  status: number;
  message: string;
  data: T;
}

/** 구좌별 기간 잔여. 비로그인 공개. 광고주명·금액은 오지 않는다. */
export async function fetchAdAvailability(): Promise<AdPlacementAvailabilityResponse[]> {
  const body = await httpClient<Envelope<AdPlacementAvailabilityResponse[]>>(
    '/api/v1/advertisements/availability',
  );
  return body.data;
}

export const AD_AVAILABILITY_QUERY_KEY = ['advertisements', 'availability'] as const;

/** 내 광고 쿠폰. 기업회원만. 경로는 비즈니스 요청서(`백엔드-요청-광고-시스템-business.md`)의 것이다. */
export async function fetchMyAdCoupons(): Promise<AdCoupon[]> {
  const body = await httpClient<Envelope<AdCoupon[]>>('/api/v1/users/me/advertisement-coupons');
  return body.data;
}

export const MY_AD_COUPONS_QUERY_KEY = ['advertisements', 'coupons'] as const;

/** 회사 이메일로 인증번호를 보낸다. 목만 있다(비즈니스 요청서 3). */
export async function sendCompanyEmailCode(email: string): Promise<void> {
  await httpClient('/api/v1/auth/company/email-verifications', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** 인증번호를 확인한다. 틀리면 `HttpError`(400). */
export async function confirmCompanyEmailCode(email: string, code: string): Promise<void> {
  await httpClient('/api/v1/auth/company/email-verifications/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/** 광고 신청 생성. 기업회원으로 로그인한 뒤에 부른다. 잔여 없음·쿠폰 불가는 409, 규칙 위반은 400. */
export async function createAdApplication(
  request: CreateAdApplicationRequest,
): Promise<CreateAdApplicationResponse> {
  const body = await httpClient<Envelope<CreateAdApplicationResponse>>(
    '/api/v1/users/me/advertisements',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
  return body.data;
}
