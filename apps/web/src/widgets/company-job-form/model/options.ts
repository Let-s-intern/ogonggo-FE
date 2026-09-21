import type { SelectOption } from '@ogonggo/ui';
import type {
  CreateCompanyJobRequestEducationLevel,
  CreateCompanyJobRequestEmploymentType,
  CreateCompanyJobRequestExperienceType,
} from '@ogonggo/api';
import { ANY_JOB_FIELD, JOB_FIELD_ROLES } from '@/features/sign-up/lib/careerOptions';
import { EDUCATION_LEVEL_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/entities/job/model/labels';

/**
 * 채용공고 작성 폼 드롭다운의 선택지(v5 PRD 3 절).
 *
 * 채용 유형과 학력은 `entities/job/model/labels.ts` 에서 온다 — 공개 상세가 그 말로 그리고
 * 있어, 작성 화면이 다른 말을 쓰면 쓴 사람이 자기 공고를 못 알아본다.
 *
 * **경력만 그 맵을 쓰지 않는다.** 거기서는 `BOTH` 와 `IRRELEVANT` 가 둘 다 `경력무관` 이라
 * 드롭다운에 같은 줄이 두 번 생긴다. 생성 타입이 적은 대로 `신입·경력` 과 `경력 무관` 으로
 * 가른다(`widgets/my-scraps/lib/query.ts` 의 경력 필터와 같은 판단이다).
 */

/** 고르기 전 첫 줄. `<select>` 는 값이 늘 있어야 해서 빈 문자열을 자리로 쓴다. */
const placeholder = (label: string): SelectOption => ({ value: '', label });

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

const EXPERIENCE_TYPE_LABELS: Record<CreateCompanyJobRequestExperienceType, string> = {
  NEWCOMER: '신입',
  EXPERIENCED: '경력',
  BOTH: '신입·경력',
  IRRELEVANT: '경력 무관',
};

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
 * 직무 분야. `jobField` 는 자유 문자열이고 고를 수 있는 값을 주는 API 가 없어, 이 저장소에
 * 있는 유일한 직군 열거(커리어 정보 화면) 를 쓴다 — 스크랩 목록의 직군 필터와 같은 목록이다
 * (`widgets/my-scraps/lib/query.ts`). 거기와 같은 값이어야 기업이 고른 직군으로 실제로
 * 걸러진다.
 *
 * `직군 무관` 은 뺀다. 그 값은 "내 희망 직무" 를 적는 칸의 것이지 공고에 붙는 값이 아니다.
 */
export const JOB_FIELD_OPTIONS: SelectOption[] = [
  placeholder('직무 분야를 선택해 주세요.'),
  ...JOB_FIELD_ROLES.filter(({ jobField }) => jobField !== ANY_JOB_FIELD).map(({ jobField }) => ({
    value: jobField,
    label: jobField,
  })),
];

/**
 * 지역 — 17 개 시·도에 `전국`·`해외` 둘을 더한 것이다.
 *
 * `region` 도 자유 문자열이고 목록을 주는 API 가 없는데 목업이 드롭다운이라 고를 목록이
 * 필요하다. 시·군·구까지 고르게 하지 않는 이유는 공개 목록에 지역 필터가 없어 그 아래가
 * 쓰이는 곳이 없기 때문이다. 자유 입력으로 두면 같은 지역이 `서울`·`서울시`·`서울특별시` 로
 * 갈린다.
 */
export const REGION_OPTIONS: SelectOption[] = [
  placeholder('채용시 근무 지역을 선택해 주세요.'),
  ...[
    '서울',
    '경기',
    '인천',
    '부산',
    '대구',
    '광주',
    '대전',
    '울산',
    '세종',
    '강원',
    '충북',
    '충남',
    '전북',
    '전남',
    '경북',
    '경남',
    '제주',
    '전국',
    '해외',
  ].map((value) => ({ value, label: value })),
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

/**
 * 근무 방식 — **저장되지 않는다.** 대응 필드가 `CreateCompanyJobRequest` 에 없어 칸은 목업대로
 * 그리되 비활성이다(v5 PRD 3 절). 선택지를 여기 적어 두는 것은 비활성 드롭다운에도 목업의
 * 선택지가 보여야 무엇을 고르는 칸인지 읽히기 때문이다. 필드가 생기면 이 배열은 그대로 두고
 * `disabled` 만 지우면 된다.
 */
export const WORK_ARRANGEMENT_OPTIONS: SelectOption[] = [
  placeholder('근무 방식을 선택해 주세요.'),
  ...['재택', '출근', '하이브리드'].map((value) => ({ value, label: value })),
];
