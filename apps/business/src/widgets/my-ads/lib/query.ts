import type { AdApplicationTab } from '@/entities/advertisement';

export interface MyAdsQuery {
  tab: AdApplicationTab;
  page: number;
}

export const MY_ADS_PATH = '/mypage/company/ads';

const TABS: readonly AdApplicationTab[] = ['ALL', 'ACTIVE', 'ENDED'];

/** `?tab=ACTIVE&page=2`. 모르는 값은 기본(전체, 1쪽)으로. */
export function parseMyAdsQuery(params: Record<string, string | undefined>): MyAdsQuery {
  const tab = TABS.find((each) => each === params.tab) ?? 'ALL';
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  return { tab, page };
}

export function buildMyAdsHref({ tab, page }: MyAdsQuery): string {
  const query = new URLSearchParams();
  if (tab !== 'ALL') query.set('tab', tab);
  if (page > 1) query.set('page', String(page));
  const search = query.toString();
  return search ? `${MY_ADS_PATH}?${search}` : MY_ADS_PATH;
}

export const myAdDetailHref = (id: number) => `${MY_ADS_PATH}/${id}`;
export const myAdReportHref = (id: number) => `${MY_ADS_PATH}/${id}/report`;
