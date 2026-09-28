import { NO_AD_PARAMS, programStatus, type DataLayerParams } from '@/shared/analytics/dataLayer';
import { computeDaysRemaining, isRecruitmentClosed } from '@/shared/lib/dday';
import type { BootcampSummary } from './types';

/**
 * 명세 3장 "프로그램 정보" 7개. 모집 중이 아닌 상태(`DRAFT`·`CLOSED`)는 `BootcampBadge` 처럼
 * 마감으로 본다.
 */
export function toBootcampInfo(
  bootcamp: Pick<
    BootcampSummary,
    'id' | 'title' | 'status' | 'recruitmentType' | 'recruitmentEndAt' | 'closedAt'
  >,
): DataLayerParams {
  const closed =
    bootcamp.status !== 'RECRUITING' ||
    isRecruitmentClosed(bootcamp.recruitmentType, bootcamp.recruitmentEndAt, bootcamp.closedAt);
  return {
    content_type: 'bootcamp',
    program_id: String(bootcamp.id),
    program_name: bootcamp.title,
    program_status: programStatus(
      closed,
      computeDaysRemaining(bootcamp.recruitmentType, bootcamp.recruitmentEndAt),
    ),
    ...NO_AD_PARAMS,
  };
}
