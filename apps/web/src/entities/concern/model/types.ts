import type { ConcernSummaryResponse } from '@ogonggo/api';

/**
 * `GET /api/v1/concerns` 와 `GET /api/v1/concerns/popular` 의 고민글 하나. 목록과 인기 고민이
 * 같은 모양이다. 본문 전체(`content`) 가 실려 오고 미리보기 줄임은 화면이 한다.
 */
export type ConcernSummary = ConcernSummaryResponse;

/** 카테고리 다섯 값. 상세·저장 요청의 카테고리 타입도 같은 문자열 합집합이다. */
export type ConcernCategory = ConcernSummary['category'];
