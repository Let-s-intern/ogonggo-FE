import { ConcernSummaryResponseCategory, ListPublicConcernsSort, enumLabels } from '@ogonggo/api';

/**
 * 카테고리 문구. enum 카탈로그의 `ConcernCategory` 다. 사용처는 `CONCERN_CATEGORY_LABELS[category]`
 * 로 읽으면 되고, 상세·저장 요청의 카테고리 타입도 같은 문자열 합집합이라 그대로 들어간다.
 */
export const CONCERN_CATEGORY_LABELS: Record<ConcernSummaryResponseCategory, string> =
  enumLabels('ConcernCategory');

/**
 * 카테고리를 화면에 늘어놓는 순서. 스펙이 적은 순서이고 시안의 칩(`공고 질문`, `직무·커리어`,
 * `서류·면접`, `사이드·경험`, `기타`) 순서와 같다. 목록의 칩과 작성 모달의 주제 칩이 함께 쓴다.
 */
export const CONCERN_CATEGORIES = Object.values(ConcernSummaryResponseCategory);

/** 목록 정렬 문구. enum 카탈로그의 `ConcernSortType` 이다. */
export const CONCERN_SORT_LABELS: Record<ListPublicConcernsSort, string> =
  enumLabels('ConcernSortType');

/** 정렬을 드롭다운에 늘어놓는 순서. 첫 값이 기본값(`LATEST`) 이다. */
export const CONCERN_SORTS = Object.values(ListPublicConcernsSort);

/** 닉네임이 없는 작성자(렛츠커리어 프로필이 없음) 의 표시 이름. PRD 결정 5. */
export const ANONYMOUS_NICKNAME = '익명';
