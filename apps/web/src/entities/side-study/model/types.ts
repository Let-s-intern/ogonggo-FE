import type { RecruitmentPostDetailResponse, RecruitmentPostSummaryResponse } from '@ogonggo/api';

/** `GET /api/v1/recruitment-posts` 의 목록 항목 하나. 포지션·썸네일은 목록 응답에 없다. */
export type SideStudySummary = RecruitmentPostSummaryResponse;

/**
 * `GET /api/v1/recruitment-posts/{postId}` 의 공개 상세. 목록에 없는 포지션·소통 수단·본문이
 * 있고, 목록에 있는 지원 수(`applicationCount`) 는 없다.
 */
export type SideStudyDetail = RecruitmentPostDetailResponse;

/** 사이드 프로젝트인지 스터디인지. 목록 탭 세 개가 이 값으로 갈린다. */
export type SideStudyKind = SideStudySummary['recruitmentType'];

/** 진행 방식. 부트캠프·채용공고의 `operationType` 과 같은 세 값이다. */
export type SideStudyOperationType = SideStudySummary['progressMethod'];

export type SideStudyPosition = SideStudyDetail['positions'][number];

export type SideStudyContactMethod = SideStudyDetail['contact']['method'];
