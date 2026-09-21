import type { SelectOption } from '@ogonggo/ui';
import type {
  CreateRecruitmentPostRequestContactMethod,
  CreateRecruitmentPostRequestPositionsItem,
  CreateRecruitmentPostRequestProgressMethod,
  CreateRecruitmentPostRequestRecruitmentType,
} from '@ogonggo/api';
import {
  CONTACT_METHOD_LABELS,
  KIND_LABELS,
  OPERATION_TYPE_LABELS,
  POSITION_LABELS,
} from '@/entities/side-study/model/labels';

/**
 * 작성 폼 드롭다운의 선택지(PRD 5 절).
 *
 * 문구는 전부 `entities/side-study/model/labels.ts` 에서 온다 — 같은 값을 공개 상세 화면이
 * 이미 그 말로 그리고 있어, 작성 화면이 다른 말을 쓰면 쓴 사람이 자기 글을 못 알아본다.
 *
 * 인원과 기간만 이 파일이 값을 정한다. 둘 다 백엔드가 정수만 받고 범위를 주지 않는데, 목업이
 * 자유 입력이 아니라 드롭다운이라 고를 목록이 필요하다.
 */

/** 고르기 전 첫 줄. `<select>` 는 값이 늘 있어야 해서 빈 문자열을 자리로 쓴다. */
const placeholder = (label: string): SelectOption => ({ value: '', label });

export const RECRUITMENT_TYPE_OPTIONS: SelectOption[] = [
  placeholder('사이드 프로젝트/스터디'),
  ...(['SIDE_PROJECT', 'STUDY'] as CreateRecruitmentPostRequestRecruitmentType[]).map((value) => ({
    value,
    label: KIND_LABELS[value],
  })),
];

export const PROGRESS_METHOD_OPTIONS: SelectOption[] = [
  placeholder('온라인/오프라인'),
  ...(['ONLINE', 'OFFLINE', 'HYBRID'] as CreateRecruitmentPostRequestProgressMethod[]).map(
    (value) => ({ value, label: OPERATION_TYPE_LABELS[value] }),
  ),
];

export const CONTACT_METHOD_OPTIONS: SelectOption[] = [
  placeholder('카카오톡 오픈 채팅/이메일'),
  ...(['OPEN_KAKAO', 'EMAIL'] as CreateRecruitmentPostRequestContactMethod[]).map((value) => ({
    value,
    label: CONTACT_METHOD_LABELS[value],
  })),
];

/**
 * 모집 인원 1~10 명. 백엔드는 정수라면 무엇이든 받지만 목업이 드롭다운이라 끝이 필요하고,
 * 사이드 프로젝트·스터디 한 팀의 크기가 그 언저리다. 더 큰 팀을 적을 수 없다는 말이 오면
 * 이 배열만 늘리면 된다.
 */
export const CAPACITY_OPTIONS: SelectOption[] = [
  placeholder('인원을 선택해 주세요.'),
  ...Array.from({ length: 10 }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}명`,
  })),
];

/**
 * 진행 기간 1~12 개월. **목업의 시작·종료 날짜 쌍이 아니다**(PRD 5 절) — 백엔드가 받는 것은
 * `activityDurationMonths` 개월 정수 하나다. 공개 상세도 `N개월` 로 그린다
 * (`widgets/side-study-detail/ui/SideStudyDetailHeaderCard.tsx`).
 */
export const DURATION_OPTIONS: SelectOption[] = [
  placeholder('기간을 선택해 주세요.'),
  ...Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}개월`,
  })),
];

/**
 * 모집 포지션 여섯 고정. **목업의 자유 입력이 아니다**(PRD 5 절). 포지션별 인원 칸도 없다 —
 * 인원은 `capacity` 하나뿐이다.
 */
export const POSITION_VALUES: readonly CreateRecruitmentPostRequestPositionsItem[] = [
  'BACKEND',
  'FRONTEND',
  'DESIGN',
  'PM',
  'MOBILE',
  'ETC',
];

export const POSITION_OPTION_LABELS = POSITION_LABELS;
