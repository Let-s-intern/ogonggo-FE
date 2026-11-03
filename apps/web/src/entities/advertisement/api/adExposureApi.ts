import { httpClient } from '@ogonggo/api';
import type { AdExposure, AdPlacementKey } from '../model/types';

/**
 * 구좌 하나의 노출용 광고. 노출 순서(`displayOrder`)대로 돌려준다.
 *
 * **실패해도 던지지 않는다.** 광고 자리는 덤이라, 광고 API 가 죽었다고 홈·상세가 오류 화면이 되면 안 된다. 실패하면
 * 빈 목록이고, 자리는 접힌다.
 */
export async function fetchAdExposures(
  placementKey: AdPlacementKey,
  jobField?: string,
): Promise<AdExposure[]> {
  const params = new URLSearchParams({ placementKey });
  if (jobField) {
    params.set('jobField', jobField);
  }
  try {
    const response = await httpClient<{ data?: AdExposure[] }>(
      `/api/v1/advertisements/exposures?${params.toString()}`,
    );
    return [...(response.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  } catch {
    return [];
  }
}
