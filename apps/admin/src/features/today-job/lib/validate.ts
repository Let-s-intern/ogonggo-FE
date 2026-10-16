/**
 * 추천 문구 검증.
 *
 * 한도는 백엔드 스펙의 `AdminTodayJobRequest` 에 적힌 `@maxLength` 다(제목 30, 설명 200). 스펙의
 * `@minLength` 는 0 이지만 빈 문구는 화면에서 막는다 — 서버가 빈 문자열을 받는지 확인되지 않았고
 * 설명 글이 "모두 적어야 한다" 고 한다(`.claude/tasks/todo/prd-admin-today-jobs.md` 결정 3). 서버가
 * 받는다는 것이 확인되면 `MIN` 을 0 으로 내려 푼다.
 *
 * 길이는 앞뒤 공백을 뺀 뒤의 `length` 로 잰다. 공백만 적은 칸이 통과하면 사용자 화면의 카드가
 * 빈 줄로 나간다.
 */

export const RECOMMENDATION_TITLE_MIN = 1;
export const RECOMMENDATION_TITLE_MAX = 30;
export const RECOMMENDATION_DESCRIPTION_MIN = 1;
export const RECOMMENDATION_DESCRIPTION_MAX = 200;

export interface RecommendationValue {
  title: string;
  description: string;
}

/** 칸마다 실패한 이유. 통과한 칸은 키가 없다. */
export interface RecommendationErrors {
  title?: string;
  description?: string;
}

/** 검증이 보는 글자 수. 입력칸 옆의 `12/30` 도 이 값을 쓴다. */
export const recommendationLength = (text: string): number => text.trim().length;

function validateText(
  text: string,
  { label, min, max }: { label: string; min: number; max: number },
): string | undefined {
  const length = recommendationLength(text);
  if (length < min) {
    return `${label}을 입력해 주세요.`;
  }
  if (length > max) {
    return `${label}은 ${max}자 이하로 입력해 주세요. 지금 ${length}자입니다.`;
  }
  return undefined;
}

export function validateRecommendation(value: RecommendationValue): RecommendationErrors {
  const errors: RecommendationErrors = {};
  const title = validateText(value.title, {
    label: '추천 제목',
    min: RECOMMENDATION_TITLE_MIN,
    max: RECOMMENDATION_TITLE_MAX,
  });
  const description = validateText(value.description, {
    label: '추천 설명',
    min: RECOMMENDATION_DESCRIPTION_MIN,
    max: RECOMMENDATION_DESCRIPTION_MAX,
  });
  if (title) {
    errors.title = title;
  }
  if (description) {
    errors.description = description;
  }
  return errors;
}

export const isRecommendationValid = (value: RecommendationValue): boolean => {
  const errors = validateRecommendation(value);
  return !errors.title && !errors.description;
};
