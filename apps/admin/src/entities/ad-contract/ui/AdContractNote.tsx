import type { AdContractSummary } from '@ogonggo/api/src/ad-contracts';
import { adContractName, isOutsideContract } from '../lib/adContract';

/**
 * 표의 `광고주` 칸 아래 작은 글자로 이어 둔 계약을 적는다. 노출 기간이 계약 기간 밖이면 함께 알린다. 배너 세팅·광고 공고
 * 세팅·광고주별 광고가 같이 쓴다.
 */
export function AdContractNote({
  contract,
  period,
}: {
  contract: AdContractSummary | null;
  period: { startAt: string | null; endAt: string | null };
}) {
  if (!contract) {
    return null;
  }
  return (
    <span className="block text-xs text-gray-500">
      계약 {adContractName(contract)}
      {isOutsideContract(period, contract) ? (
        <span className="text-orange-600"> · 계약 기간 밖</span>
      ) : null}
    </span>
  );
}
