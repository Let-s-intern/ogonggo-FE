import type { ConcernImageResponse } from '@ogonggo/api';
import type { ConcernCategory } from '@/entities/concern/model/types';
import type { ImageAttachment } from '@/shared/ui/ImageAttachmentField';

/** 제목 최대 길이. 스펙(`SaveConcernRequest.title` 의 `@maxLength 100`) 과 같다. */
export const TITLE_MAX_LENGTH = 100;

/**
 * 폼이 들고 있는 값. 저장 요청(`SaveConcernRequest`) 과 한 칸씩 짝이 맞는다. `attachments` 는 첨부 칸의
 * 사진이고 다 올라간 것의 id 가 `imageIds` 가 된다.
 *
 * 본문 길이는 막지 않는다. 백엔드 한도는 직렬화 20만 자라 사람이 쓰는 길이로 닿지 않는다.
 */
export interface ConcernFormValues {
  category: ConcernCategory;
  title: string;
  /** 본문. Lexical EditorState JSON 문자열이다. */
  content: string;
  /** `content` 의 서식 없는 글자. 요청에는 실리지 않고 본문이 비었는지 볼 때만 쓴다. */
  contentText: string;
  attachments: ImageAttachment[];
}

/** 수정할 고민글. 모달을 수정 모드로 여는 값이고, 폼의 처음 값이 된다. */
export interface ConcernFormInitial extends Omit<ConcernFormValues, 'attachments' | 'contentText'> {
  id: number;
  /**
   * 글에 붙은 사진. 첨부 칸의 처음 미리보기가 되고, 저장 때 남은 것의 id 를 보낸다 — 빠진 사진은 백엔드가
   * 지운다.
   */
  images: ConcernImageResponse[];
}

export interface ConcernFormCheck {
  titleTooLong: boolean;
  /**
   * 보낼 수 있는 상태인지. 제목과 본문의 서식 없는 글자(`contentText`)가 비어 있지 않고(공백만도 빈 것)
   * 제목이 길이를 넘지 않아야 한다.
   */
  submittable: boolean;
}

/**
 * 보내기 전 검사. 제목 길이는 `String.length` 로 센다 — 백엔드(`@Size`) 가 자바 문자열 길이로 세므로
 * 이모지처럼 두 칸을 쓰는 글자도 같은 값이 나온다.
 *
 * 길이는 다듬기 전 글자로 잰다. 보내는 값은 앞뒤 공백을 뗀 것이라 더 짧아지지만, 화면의 글자 수와
 * 막는 기준이 어긋나지 않게 한 가지로 센다.
 *
 * 빈 본문은 `content` 가 아니라 `contentText` 로 본다. 빈 편집기도 EditorState JSON 은 비어 있지 않다.
 */
export function checkConcernForm(values: ConcernFormValues): ConcernFormCheck {
  const titleTooLong = values.title.length > TITLE_MAX_LENGTH;
  return {
    titleTooLong,
    submittable: values.title.trim() !== '' && values.contentText.trim() !== '' && !titleTooLong,
  };
}
