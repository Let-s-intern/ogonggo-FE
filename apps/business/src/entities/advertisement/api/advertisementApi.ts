import { httpClient } from '@ogonggo/api';
import type {
  AdApplication,
  AdApplicationListResponse,
  AdApplicationTab,
  AdCoupon,
  AdPlacementAvailabilityResponse,
  AdReport,
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

/** 내 광고 목록. 탭 옆 건수(`counts`)는 고른 탭과 상관없이 셋 다 온다. */
export async function fetchMyAdApplications(
  tab: AdApplicationTab,
  page: number,
): Promise<AdApplicationListResponse> {
  const body = await httpClient<Envelope<AdApplicationListResponse>>(
    `/api/v1/users/me/advertisements?tab=${tab}&page=${page}&size=10`,
  );
  return body.data;
}

export async function fetchMyAdApplication(id: number): Promise<AdApplication> {
  const body = await httpClient<Envelope<AdApplication>>(`/api/v1/users/me/advertisements/${id}`);
  return body.data;
}

/** 성과 리포트. 종료된 광고만 있다(아니면 409). */
export async function fetchAdReport(id: number): Promise<AdReport> {
  const body = await httpClient<Envelope<AdReport>>(`/api/v1/users/me/advertisements/${id}/report`);
  return body.data;
}

/** 소재 `이대로 게재`. 바뀐 신청 전체가 돌아온다. */
export async function approveAdCreative(id: number, creativeId: number): Promise<AdApplication> {
  const body = await httpClient<Envelope<AdApplication>>(
    `/api/v1/users/me/advertisements/${id}/creatives/${creativeId}/approve`,
    { method: 'POST' },
  );
  return body.data;
}

/** 소재 `수정 요청`. 바뀐 신청 전체가 돌아온다. */
export async function requestAdCreativeRevision(
  id: number,
  creativeId: number,
  message: string,
): Promise<AdApplication> {
  const body = await httpClient<Envelope<AdApplication>>(
    `/api/v1/users/me/advertisements/${id}/creatives/${creativeId}/revision-request`,
    { method: 'POST', body: JSON.stringify({ message }) },
  );
  return body.data;
}

export const myAdApplicationsKey = (tab: AdApplicationTab, page: number) =>
  ['advertisements', 'mine', tab, page] as const;
export const myAdApplicationKey = (id: number) => ['advertisements', 'mine', 'detail', id] as const;
export const adReportKey = (id: number) => ['advertisements', 'mine', 'report', id] as const;
