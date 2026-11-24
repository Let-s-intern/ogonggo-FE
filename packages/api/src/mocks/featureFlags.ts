import { http, HttpResponse, type HttpHandler } from 'msw';
import type { UserFeatureFlagResponse } from '../generated/user/models';

/**
 * 공개 기능 플래그 목록(`GET /api/v1/feature-flags`)의 목. key 와 켜짐 여부만 준다.
 *
 * 기본은 운영과 같이 `ad_report_cost_efficiency` 가 켜짐이다. 화면에서 다른 경우를 보려면 브라우저 콘솔에서 정한다.
 *
 *   localStorage.setItem('ogonggo-mock:feature-flags', '{"ad_report_cost_efficiency":false}')  // 끔
 *   localStorage.setItem('ogonggo-mock:feature-flags:fail', '1')                                // 목록 요청이 500
 *   localStorage.setItem('ogonggo-mock:feature-flags', '{}')                                    // key 가 없음
 *
 * 지우면 기본으로 돌아간다. 어드민 목(`./admin/featureFlags.ts`)과 오리진이 달라 값을 나누지 않는다.
 */

const FLAGS_KEY = 'ogonggo-mock:feature-flags';
const FAIL_KEY = `${FLAGS_KEY}:fail`;

const read = (key: string): string | null => {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const currentFlags = (): UserFeatureFlagResponse[] => {
  const raw = read(FLAGS_KEY);
  if (raw === null) return [{ key: 'ad_report_cost_efficiency', enabled: true }];
  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return Object.entries(parsed).map(([key, enabled]) => ({ key, enabled }));
  } catch {
    return [];
  }
};

const listHandler = http.get('*/api/v1/feature-flags', () => {
  if (read(FAIL_KEY) === '1') {
    return HttpResponse.json(
      { status: 500, code: 'INTERNAL_SERVER_ERROR', message: '서버 오류' },
      { status: 500 },
    );
  }
  return HttpResponse.json(
    { status: 200, message: 'OK', data: { items: currentFlags() } },
    { status: 200 },
  );
});

export const featureFlagHandlers: HttpHandler[] = [listHandler];
