import { httpClient } from './lib/http-client';

export interface AdvertisementReportMetrics {
  total: number;
  uniqueUsers: number;
  perUser: number;
}

export interface AdvertisementContractReportResponse {
  contractId: number;
  from: string;
  to: string;
  generatedAt: string;
  summary: {
    impressions: AdvertisementReportMetrics;
    clicks: AdvertisementReportMetrics;
  };
  daily: Array<{
    date: string;
    category: string;
    position: string | null;
    impressions: AdvertisementReportMetrics;
    clicks: AdvertisementReportMetrics;
  }>;
  positions: Array<{
    category: string;
    position: string | null;
    clicks: AdvertisementReportMetrics;
  }>;
  jobRoleDistribution: Array<{
    key: string;
    label: string;
    uniqueClickers: number;
  }>;
}

export interface SuccessResponse<T> {
  status: number;
  message: string;
  data: T;
}

export type AdvertisementEventType = 'IMPRESSION' | 'CLICK';

export interface CreateAdvertisementEventRequest {
  exposureId: number;
  eventType: AdvertisementEventType;
  anonymousId: string;
}

/** 계약 report route는 BE branch OpenAPI의 Orval 재생성 때 generated/user로 이동한다. */
export function getAdvertisementContractReport(
  contractId: number,
  params: { from: string; to: string },
  options?: RequestInit,
): Promise<SuccessResponse<AdvertisementContractReportResponse>> {
  const query = new URLSearchParams(params);
  return httpClient(`/api/v1/advertisement-contracts/${contractId}/report?${query}`, {
    ...options,
    method: 'GET',
  });
}

/** 이벤트마다 새 idempotency key를 쓰고, 같은 HTTP 요청의 재시도에는 같은 key를 넘긴다. */
export function createAdvertisementEvent(
  request: CreateAdvertisementEventRequest,
  idempotencyKey: string,
  options?: RequestInit,
): Promise<SuccessResponse<null>> {
  return httpClient('/api/v1/advertisement-events', {
    ...options,
    method: 'POST',
    headers: {
      ...options?.headers,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(request),
  });
}
