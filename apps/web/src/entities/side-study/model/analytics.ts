import { NO_AD_PARAMS, programStatus, type DataLayerParams } from '@/shared/analytics/dataLayer';
import { computeDaysRemaining, isRecruitmentClosed } from '@/shared/lib/dday';
import type { SideStudySummary } from './types';

/** 명세 3장 "프로그램 정보" 7개. 사이드 프로젝트와 스터디 모두 `side_study` 다. */
export function toSideStudyInfo(
  sideStudy: Pick<SideStudySummary, 'id' | 'title' | 'recruitmentStatus' | 'recruitmentEndDate'>,
): DataLayerParams {
  const closed =
    sideStudy.recruitmentStatus === 'CLOSED' ||
    isRecruitmentClosed('PERIOD', sideStudy.recruitmentEndDate);
  return {
    content_type: 'side_study',
    program_id: String(sideStudy.id),
    program_name: sideStudy.title,
    program_status: programStatus(
      closed,
      computeDaysRemaining('PERIOD', sideStudy.recruitmentEndDate),
    ),
    ...NO_AD_PARAMS,
  };
}
