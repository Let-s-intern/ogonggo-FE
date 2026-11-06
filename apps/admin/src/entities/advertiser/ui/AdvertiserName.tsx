import { Badge } from '@ogonggo/ui';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';

/** 광고주 이름과 회원·비회원 표시. 배너·광고 공고 표의 `광고주` 칸과 고른 광고주 표시가 같이 쓴다. */
export function AdvertiserName({ advertiser }: { advertiser: AdvertiserSummary | null }) {
  if (!advertiser) {
    return <span className="text-sm text-gray-400">없음</span>;
  }
  return (
    <span className="flex items-center gap-1.5">
      <Badge tone={advertiser.type === 'MEMBER' ? 'main' : 'neutral'}>
        {advertiser.type === 'MEMBER' ? '회원' : '비회원'}
      </Badge>
      <span className="text-sm text-gray-900">{advertiser.name}</span>
    </span>
  );
}
