import { enumLabels } from '@ogonggo/api';

import type {
  SideStudyContactMethod,
  SideStudyKind,
  SideStudyOperationType,
  SideStudyPosition,
} from './types';

/**
 * 카드 메타 줄(`종류 · 진행방식`)과 목록 탭이 같은 라벨을 쓴다 —
 * `entities/bootcamp/model/labels.ts`와 같은 이유로 한 곳에 모은다. 라벨은 enum 카탈로그에서 온다.
 */
export const KIND_LABELS: Record<SideStudyKind, string> = enumLabels('RecruitmentPostType');

/** 부트캠프의 같은 이름 라벨과 값이 같다. 두 화면이 같은 세 값을 쓴다. */
export const OPERATION_TYPE_LABELS: Record<SideStudyOperationType, string> = enumLabels(
  'RecruitmentPostProgressMethod',
);

/** 작성자 닉네임이 없을 때. 모집글 응답의 `author.nickname` 은 선택 필드다. */
export const AUTHOR_NICKNAME_FALLBACK = '익명';

/** 모집 포지션. enum 카탈로그의 `RecruitmentPostPosition` 이다. */
export const POSITION_LABELS: Record<SideStudyPosition, string> =
  enumLabels('RecruitmentPostPosition');

/** 소통 수단. enum 카탈로그의 `RecruitmentPostContactMethod` 다. */
export const CONTACT_METHOD_LABELS: Record<SideStudyContactMethod, string> = enumLabels(
  'RecruitmentPostContactMethod',
);
