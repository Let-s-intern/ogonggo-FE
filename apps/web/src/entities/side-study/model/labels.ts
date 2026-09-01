import type { SideStudyKind, SideStudyOperationType } from './types';

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
