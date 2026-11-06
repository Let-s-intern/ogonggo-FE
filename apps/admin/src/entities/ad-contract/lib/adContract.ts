import type { AdContractSummary } from '@ogonggo/api/src/ad-contracts';

/** KST 벽시계 시각을 시각으로. */
function kstTime(value: string): number {
  return Date.parse(`${value}+09:00`);
}

export type AdContractStatus = 'ACTIVE' | 'UPCOMING' | 'ENDED';

/** 계약 기간으로 정한다. 시작 포함, 끝 미포함(배너·광고 공고의 노출 기간과 같은 규칙). */
export function adContractStatus(contract: AdContractSummary, now = Date.now()): AdContractStatus {
  if (now < kstTime(contract.startAt)) return 'UPCOMING';
  if (kstTime(contract.endAt) <= now) return 'ENDED';
  return 'ACTIVE';
}

export const AD_CONTRACT_STATUS_BADGES: Record<
  AdContractStatus,
  { label: string; tone: 'success' | 'main' | 'neutral' }
> = {
  ACTIVE: { label: '진행 중', tone: 'success' },
  UPCOMING: { label: '예정', tone: 'main' },
  ENDED: { label: '종료', tone: 'neutral' },
};

/**
 * 새 배너·광고 공고에 미리 고를 계약. 진행 중인 것(여럿이면 먼저 끝나는 것), 없으면 가장 가까운 예정, 그것도 없으면 없음.
 * 끝난 계약은 고르지 않는다.
 */
export function defaultAdContract<T extends AdContractSummary>(
  contracts: readonly T[],
  now = Date.now(),
): T | null {
  const byStatus = (status: AdContractStatus) =>
    contracts.filter((contract) => adContractStatus(contract, now) === status);
  const active = byStatus('ACTIVE').sort((a, b) => (a.endAt < b.endAt ? -1 : 1));
  if (active[0]) return active[0];
  const upcoming = byStatus('UPCOMING').sort((a, b) => (a.startAt < b.startAt ? -1 : 1));
  return upcoming[0] ?? null;
}

/** `11월 홈 배너` 처럼 이름이 있으면 이름, 없으면 `계약 3번`. */
export function adContractName(contract: AdContractSummary): string {
  return contract.name ?? `계약 ${contract.id}번`;
}

/** `1,500,000원`. */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 노출 기간이 계약 기간 밖으로 나가는가. 열린 끝(`null`)은 계약 끝을 넘는 것으로 본다. 경고만 하고 저장은 막지 않는다.
 */
export function isOutsideContract(
  period: { startAt: string | null; endAt: string | null },
  contract: AdContractSummary,
): boolean {
  return (
    period.startAt === null ||
    period.startAt < contract.startAt ||
    period.endAt === null ||
    period.endAt > contract.endAt
  );
}
