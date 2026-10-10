import { ConcernSummaryResponseCategory, ListPublicConcernsSort } from '@ogonggo/api';

/**
 * 카테고리 문구. 스펙(`ConcernSummaryResponse.category`) 의 설명과 같다.
 *
 * `satisfies Record<생성 enum, string>` 이라 백엔드가 카테고리를 더하면 여기서 빌드가 깨진다 —
 * 라벨이 없는 칩이 조용히 빈 글자로 그려지는 것을 막는다. 사용처는 `CONCERN_CATEGORY_LABELS[category]`
 * 로 읽으면 되고, 상세·저장 요청의 카테고리 타입도 같은 문자열 합집합이라 그대로 들어간다.
 */
export const CONCERN_CATEGORY_LABELS = {
  JOB_POSTING: '공고 질문',
  CAREER: '직무·커리어',
  APPLICATION_INTERVIEW: '서류·면접',
  SIDE_EXPERIENCE: '사이드·경험',
  ETC: '기타',
} satisfies Record<ConcernSummaryResponseCategory, string>;

/**
 * 카테고리를 화면에 늘어놓는 순서. 스펙이 적은 순서이고 시안의 칩(`공고 질문`, `직무·커리어`,
 * `서류·면접`, `사이드·경험`, `기타`) 순서와 같다. 목록의 칩과 작성 모달의 주제 칩이 함께 쓴다.
 */
export const CONCERN_CATEGORIES = Object.values(ConcernSummaryResponseCategory);

/**
 * 목록 정렬 문구. 채용공고·부트캠프 정렬 드롭다운과 같이 짧게 쓴다(`최신순`, `조회순`).
 * 스펙 설명은 `조회 많은 순`·`답변 많은 순` 이다.
 */
export const CONCERN_SORT_LABELS = {
  LATEST: '최신순',
  VIEW_COUNT: '조회순',
  COMMENT_COUNT: '답변순',
} satisfies Record<ListPublicConcernsSort, string>;

/** 정렬을 드롭다운에 늘어놓는 순서. 첫 값이 기본값(`LATEST`) 이다. */
export const CONCERN_SORTS = Object.values(ListPublicConcernsSort);

/** 닉네임이 없는 작성자(렛츠커리어 프로필이 없음) 의 표시 이름. PRD 결정 5. */
export const ANONYMOUS_NICKNAME = '익명';
