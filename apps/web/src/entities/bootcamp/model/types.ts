import type { UserBootcampDetailResponse, UserBootcampSummaryResponse } from '@ogonggo/api';

/** `GET /api/v1/bootcamps`의 목록 항목 하나 — 본문·커리큘럼·파트너사는 없다. */
export type BootcampSummary = UserBootcampSummaryResponse;

/**
 * `GET /api/v1/bootcamps/{bootcampId}`의 상세 — BootcampSummary의 모든 필드 + 본문 필드 +
 * `curriculums`/`partners`.
 *
 * 목록·상세는 기업 회원용(`/api/v1/users/me/bootcamps`)이 아니라 공개 화면이 쓰는
 * `getBootcamps`/`getBootcamp1` 쪽 응답이다(PRD 3절). `CompanyBootcamp*`와 헷갈리지 않는다.
 */
export type BootcampDetail = UserBootcampDetailResponse;

export type BootcampOperationType = BootcampSummary['operationType'];
export type BootcampTuitionType = BootcampSummary['tuitionType'];
export type BootcampStatus = BootcampSummary['status'];
export type BootcampRecruitmentType = BootcampSummary['recruitmentType'];
