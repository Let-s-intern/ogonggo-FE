import { HttpError, httpClient } from '@ogonggo/api';
import { getAccessToken } from '@/shared/api/authTokens';
import { handleUnauthorized } from '@/shared/api/reissue';
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

/**
 * 리포트 CSV(`.../report.csv`, 날짜별·소재별 행)를 받아 파일로 내려받는다. `httpClient` 는 본문을 JSON 으로 읽어서
 * 여기서는 `fetch` 를 직접 쓰고, 토큰과 401 재발급은 `httpClient` 와 같은 함수를 빌린다.
 */
export async function downloadAdReportCsv(
  contractId: number,
  contractProductId: number,
  from: string,
  to: string,
  fileName: string,
): Promise<void> {
  const url = `${reportPath(contractId, contractProductId)}.csv${periodQuery(from, to)}`;
  const send = (token: string | null) =>
    fetch(url, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  const sent = getAccessToken();
  let response = await send(sent);
  if (response.status === 401 && (await handleUnauthorized(url, sent))) {
    response = await send(getAccessToken());
  }
  if (!response.ok) {
    throw new HttpError(`GET ${url} failed: ${response.status}`, response.status);
  }
  const href = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(href);
}
