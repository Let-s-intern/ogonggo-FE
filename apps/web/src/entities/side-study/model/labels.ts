import type {
  SideStudyContactMethod,
  SideStudyKind,
  SideStudyOperationType,
  SideStudyPosition,
} from './types';

/**
 * 카드 메타 줄(`종류 · 진행방식`)과 목록 탭이 같은 라벨을 쓴다 —
 * `entities/bootcamp/model/labels.ts`와 같은 이유로 한 곳에 모은다.
 */
export const KIND_LABELS: Record<SideStudyKind, string> = {
  SIDE_PROJECT: '사이드 프로젝트',
  STUDY: '스터디',
};

/** 부트캠프의 같은 이름 라벨과 값이 같다. 두 화면이 같은 세 값을 쓴다. */
export const OPERATION_TYPE_LABELS: Record<SideStudyOperationType, string> = {
  ONLINE: '온라인',
  OFFLINE: '오프라인',
  HYBRID: '온·오프라인',
};

/** 작성자 닉네임이 없을 때. 모집글 응답의 `author.nickname` 은 선택 필드다. */
export const AUTHOR_NICKNAME_FALLBACK = '익명';

/** 모집 포지션. 문구는 스펙 설명(`RecruitmentPostDetailResponse.positions`) 그대로다. */
export const POSITION_LABELS: Record<SideStudyPosition, string> = {
  BACKEND: '백엔드',
  FRONTEND: '프론트엔드',
  DESIGN: '디자인',
  PM: '기획',
  MOBILE: '모바일',
  ETC: '기타',
};

/** 소통 수단. 문구는 스펙 설명(`RecruitmentPostContactResponse.method`) 그대로다. */
export const CONTACT_METHOD_LABELS: Record<SideStudyContactMethod, string> = {
  OPEN_KAKAO: '카카오톡 오픈채팅',
  EMAIL: '이메일',
};
