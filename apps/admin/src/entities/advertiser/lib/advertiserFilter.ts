import type { SelectOption } from '@ogonggo/ui';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';

/**
 * 표의 `광고주` 거르기 선택지. 지금 표에 있는 광고주만 고른다 — 자리마다 몇 건뿐이라 서버에 따로 묻지 않고 받은 행에서
 * 만든다. `noneLabel` 을 주면 광고주가 없는 행(값 `none`)도 고를 수 있다.
 */
export function advertiserFilterOptions(
  rows: { advertiser: AdvertiserSummary | null }[],
  noneLabel?: string,
): SelectOption[] {
  const seen = new Map<number, string>();
  for (const { advertiser } of rows) {
    if (advertiser) {
      seen.set(advertiser.id, advertiser.name);
    }
  }
  return [
    { value: '', label: '광고주 전체' },
    ...[...seen].map(([id, name]) => ({ value: String(id), label: name })),
    ...(noneLabel && rows.some((row) => row.advertiser === null)
      ? [{ value: 'none', label: noneLabel }]
      : []),
  ];
}
