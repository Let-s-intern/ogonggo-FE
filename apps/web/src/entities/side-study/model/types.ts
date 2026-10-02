import type { RecruitmentPostDetailResponse, RecruitmentPostSummaryResponse } from '@ogonggo/api';

/**
 * `GET /api/v1/recruitment-posts` 의 목록 항목 하나. 썸네일은 목록 응답에 없다.
 *
 * `positions` 는 백엔드가 목록 응답에 더하는 중이다(LC-3434). 생성 타입에 들어오기 전과 배포 전
 * 응답에는 없어 선택으로 둔다. codegen 뒤 생성 타입에 생기면 이 덧붙임을 지운다.
 */
export type SideStudySummary = RecruitmentPostSummaryResponse & {
  positions?: RecruitmentPostDetailResponse['positions'];
};

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
