import type { ConcernCategory } from '@/entities/concern/model/types';

/** 제목 최대 길이. 스펙(`SaveConcernRequest.title` 의 `@maxLength 100`) 과 같다. */
export const TITLE_MAX_LENGTH = 100;

/** 본문 최대 길이. 스펙(`SaveConcernRequest.content` 의 `@maxLength 2000`) 과 같다. */
export const CONTENT_MAX_LENGTH = 2000;

/** 폼이 들고 있는 값. 저장 요청(`SaveConcernRequest`) 과 한 칸씩 짝이 맞는다. */
export interface ConcernFormValues {
  category: ConcernCategory;
  title: string;
  content: string;
}

/** 수정할 고민글. 모달을 수정 모드로 여는 값이고, 폼의 처음 값이 된다. */
export interface ConcernFormInitial extends ConcernFormValues {
  id: number;
}

export interface ConcernFormCheck {
  titleTooLong: boolean;
  contentTooLong: boolean;
  /** 보낼 수 있는 상태인지. 제목·본문이 비어 있지 않고(공백만도 빈 것) 길이를 넘지 않아야 한다. */
  submittable: boolean;
}

/**
 * 보내기 전 검사. 길이는 `String.length` 로 센다 — 백엔드(`@Size`) 가 자바 문자열 길이로 세므로
 * 이모지처럼 두 칸을 쓰는 글자도 같은 값이 나온다.
 *
 * 길이는 다듬기 전 글자로 잰다. 보내는 값은 앞뒤 공백을 뗀 것이라 더 짧아지지만, 화면의 글자 수와
 * 막는 기준이 어긋나지 않게 한 가지로 센다.
 */
export function checkConcernForm(values: ConcernFormValues): ConcernFormCheck {
  const titleTooLong = values.title.length > TITLE_MAX_LENGTH;
  const contentTooLong = values.content.length > CONTENT_MAX_LENGTH;
  return {
    titleTooLong,
    contentTooLong,
    submittable:
      values.title.trim() !== '' &&
      values.content.trim() !== '' &&
      !titleTooLong &&
      !contentTooLong,
  };
}
