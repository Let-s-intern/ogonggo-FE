import { isRecruitmentClosed } from '@/shared/lib/dday';
import type { CompanyPostRow } from '../lib/fetch';

/**
 * 공고가 지금 서 있는 단계. 카드의 `작성 → 검수 → 게시 → 종료` 표시가 이 값으로 그려진다.
 *
 * `작성` 은 단계로 머무는 일이 없어 값에 없다. 기업 회원 공고는 만들자마자(임시저장이어도) 검수
 * 대기에 들어간다(BE `Job.reviewStatus` 의 초기값).
 */
export type CompanyPostStage = 'REVIEWING' | 'REJECTED' | 'PUBLISHED' | 'ENDED';

/**
 * 응답 값으로 단계를 고른다. 위에서부터 처음 맞는 줄을 쓴다(`prd-company-mypage-posts.md` 의 판정 표).
 *
 * - 승인됐는데 게시가 아니면 관리자가 숨긴 공고다. 기업 회원에게는 반려와 같게 보인다(2026-10-20, 사용자).
 * - 반려가 종료보다 앞선다. 마감일이 지났어도 고칠 것이 남았다는 것을 먼저 보인다.
 * - `reviewStatus` 가 없는 것은 기업 공고에 나오지 않지만, 오면 승인된 것으로 본다.
 */
export function companyPostStage(
  row: Pick<
    CompanyPostRow,
    'reviewStatus' | 'publicationStatus' | 'recruitmentType' | 'recruitmentEndAt' | 'closedAt'
  >,
): CompanyPostStage {
  const review = row.reviewStatus ?? 'APPROVED';
  if (review === 'REJECTED' || (review === 'APPROVED' && row.publicationStatus !== 'PUBLISHED')) {
    return 'REJECTED';
  }
  if (isRecruitmentClosed(row.recruitmentType, row.recruitmentEndAt, row.closedAt)) {
    return 'ENDED';
  }
  return review === 'PENDING' ? 'REVIEWING' : 'PUBLISHED';
}
