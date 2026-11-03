import { httpClient } from '@ogonggo/api';
import type { AdPlacementAvailabilityResponse } from '@ogonggo/api/src/mocks/fixtures/advertisement-types';

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
