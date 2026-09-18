/**
 * 목록은 모집글 API 의 생성 타입이다(`getRecruitmentPosts`). 상세는 아직 손으로 쓴 가정
 * (`packages/api/src/mocks/fixtures/side-study.ts`) 을 쓴다 — 상세 화면이 옮겨 가면 함께 바뀐다.
 *
 * 값이 아니라 타입만 가져오므로(`import type`) 픽스처가 앱 번들에 들어가지는 않는다.
 */
import type { RecruitmentPostSummaryResponse } from '@ogonggo/api';
import type {
  SideStudyDetail,
  SideStudyDetailResponse,
} from '@ogonggo/api/src/mocks/fixtures/side-study';

/** `GET /api/v1/recruitment-posts` 의 목록 항목 하나. 포지션·썸네일은 목록 응답에 없다. */
export type SideStudySummary = RecruitmentPostSummaryResponse;

/** 사이드 프로젝트인지 스터디인지. 목록 탭 세 개가 이 값으로 갈린다. */
export type SideStudyKind = SideStudySummary['recruitmentType'];

/** 진행 방식. 부트캠프·채용공고의 `operationType` 과 같은 세 값이다. */
export type SideStudyOperationType = SideStudySummary['progressMethod'];

export type { SideStudyDetail, SideStudyDetailResponse };
