import { httpClient } from '@ogonggo/api';
import type { AdReport } from '../model/types';

const reportPath = (contractId: number, contractProductId: number) =>
  `/api/v1/users/me/advertisement-contracts/${contractId}/products/${contractProductId}/report`;

const periodQuery = (from: string, to: string) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return query ? `?${query}` : '';
};

/**
 * 상품별 리포트(`GET .../products/{contractProductId}/report?from=&to=`). 생성 클라이언트가 아직 없어(task 7.1) 같은
 * `httpClient` 로 직접 부른다. 토큰·재발급은 그대로 따라온다. 빈 `from`·`to` 는 보내지 않고 백엔드 기본값(상품 기간
 * 전체, 진행 중이면 오늘까지)에 맡긴다. 못 여는 상품이면 409 `HttpError` 다.
 */
export async function fetchAdReport(
  contractId: number,
  contractProductId: number,
  from: string,
  to: string,
): Promise<AdReport> {
  const body = await httpClient<{ data: AdReport }>(
    `${reportPath(contractId, contractProductId)}${periodQuery(from, to)}`,
  );
  return body.data;
}
