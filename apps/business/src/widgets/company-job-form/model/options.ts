import type { SelectOption } from '@ogonggo/ui';
import type {
  CreateCompanyJobRequestEducationLevel,
  CreateCompanyJobRequestEmploymentType,
  CreateCompanyJobRequestExperienceType,
  CreateCompanyJobRequestJobField,
  CreateCompanyJobRequestRegion,
} from '@ogonggo/api';
import {
  EDUCATION_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPE_LABELS,
  JOB_FIELD_LABELS,
  REGION_LABELS,
} from '@/entities/job/model/labels';

/**
 * 채용공고 작성 폼 드롭다운의 선택지(v5 PRD 3 절).
 *
 * 채용 유형·경력·학력은 `entities/job/model/labels.ts` 에서 온다 — 공개 상세가 그 말로 그리고
 * 있어, 작성 화면이 다른 말을 쓰면 쓴 사람이 자기 공고를 못 알아본다.
 */

/** 고르기 전 첫 줄. `<select>` 는 값이 늘 있어야 해서 빈 문자열을 자리로 쓴다. */
const placeholder = (label: string): SelectOption => ({ value: '', label });

/**
 * 고용 형태에서 `일학습병행`(`WORK_STUDY`)·`미래내일 일경험`(`WORK_EXPERIENCE`)은 뺀다. 기업이 직접
 * 올리는 공고에서는 고르지 않게 한 의도된 제외다(2026-10-20 사용자 결정). 이미 그 값을 가진 공고는
 * 공개 화면이 그대로 그린다.
 */
export const EMPLOYMENT_TYPE_OPTIONS: SelectOption[] = [
  placeholder('고용 형태를 선택해 주세요.'),
  ...(
    [
      'FULL_TIME',
      'CONTRACT',
      'INTERN',
      'PART_TIME',
      'ETC',
    ] as CreateCompanyJobRequestEmploymentType[]
  ).map((value) => ({ value, label: EMPLOYMENT_TYPE_LABELS[value] })),
];

export const EXPERIENCE_TYPE_OPTIONS: SelectOption[] = [
  placeholder('경력을 선택해 주세요.'),
  ...(
    ['NEWCOMER', 'EXPERIENCED', 'BOTH', 'IRRELEVANT'] as CreateCompanyJobRequestExperienceType[]
  ).map((value) => ({ value, label: EXPERIENCE_TYPE_LABELS[value] })),
];

export const EDUCATION_LEVEL_OPTIONS: SelectOption[] = [
  placeholder('필요 학력을 선택해 주세요.'),
  ...(
    [
      'ANY',
      'HIGH_SCHOOL',
      'ASSOCIATE',
      'BACHELOR',
      'MASTER',
      'DOCTORATE',
    ] as CreateCompanyJobRequestEducationLevel[]
  ).map((value) => ({ value, label: EDUCATION_LEVEL_LABELS[value] })),
];

/**
 * 직무 분야 — 백엔드의 직군 enum 이다(ogonggo-BE LC-3385). 라벨은 공개 화면과 같은
 * `JOB_FIELD_LABELS` 에서 온다. 스크랩 목록의 직군 필터와 같은 목록이라 기업이 고른 직군으로
 * 실제로 걸러진다.
 */
export const JOB_FIELD_OPTIONS: SelectOption[] = [
  placeholder('직무 분야를 선택해 주세요.'),
  ...(Object.keys(JOB_FIELD_LABELS) as CreateCompanyJobRequestJobField[]).map((value) => ({
    value,
    label: JOB_FIELD_LABELS[value],
  })),
];

/**
 * 지역 — 백엔드의 시·도 enum 이다(`전국`·`해외` 포함, 광주는 `전남광주`로 묶인다). 라벨은
 * 공개 상세와 같은 `REGION_LABELS` 에서 온다.
 *
 * 시·군·구(`subRegion`)까지 고르게 하지 않는 이유는 공개 목록에 그 아래 필터가 없어 쓰이는
 * 곳이 없기 때문이다.
 */
export const REGION_OPTIONS: SelectOption[] = [
  placeholder('채용시 근무 지역을 선택해 주세요.'),
  ...(Object.keys(REGION_LABELS) as CreateCompanyJobRequestRegion[]).map((value) => ({
    value,
    label: REGION_LABELS[value],
  })),
];

/**
 * 읽어 온 값이 목록에 없으면 그 값을 한 줄 더해 준다.
 *
 * `jobField` 와 `region` 은 자유 문자열이라 크롤러가 넣은 공고에 `서울 강남구` 같은 값이
 * 들어 있다. 목록에 없는 값을 `<select>` 에 넣으면 브라우저가 첫 줄로 되돌리고, 그대로
 * 저장하면 원래 값이 조용히 사라진다.
 */
export function withCurrentValue(options: SelectOption[], value: string): SelectOption[] {
  if (!value || options.some((option) => option.value === value)) {
    return options;
  }
  return [...options, { value, label: value }];
}
