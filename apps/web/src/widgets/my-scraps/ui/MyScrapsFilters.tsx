import { STATUS_LABELS, TUITION_TYPE_LABELS } from '@/entities/bootcamp/model/labels';
import { EMPLOYMENT_TYPE_LABELS } from '@/entities/job/model/labels';
import {
  ALL_ROLES_SUFFIX,
  ANY_JOB_FIELD,
  JOB_FIELD_ROLES,
} from '@/features/sign-up/lib/careerOptions';
import { MyPageFilterDropdown } from '@/widgets/mypage-list';
import {
  buildMyScrapsHref,
  BOOTCAMP_STATUSES,
  EMPLOYMENT_TYPES,
  TUITION_TYPES,
  type MyScrapsQuery,
} from '../lib/query';

const EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPES.map(
  (value) => [value, EMPLOYMENT_TYPE_LABELS[value]] as const,
);

/**
 * `entities/job/model/labels.ts` 의 `EXPERIENCE_TYPE_LABELS` 를 쓰지 않는다. 그 맵은 `BOTH` 와
 * `IRRELEVANT` 를 둘 다 `경력무관` 으로 적는데, 카드 한 장에서는 어느 쪽이든 읽는 사람에게
 * 같은 뜻이라 문제가 없지만 **고르는 목록에서는 똑같은 말이 두 줄 나온다.** 고를 수 없는
 * 목록이 된다.
 *
 * 그래서 네 값을 생성 타입의 설명 표(`ListMyJobBookmarksParams.experienceType`) 그대로 적는다.
 */
const EXPERIENCE_TYPE_OPTIONS = [
  ['NEWCOMER', '신입'],
  ['EXPERIENCED', '경력'],
  ['BOTH', '신입·경력'],
  ['IRRELEVANT', '경력 무관'],
] as const;

/**
 * 직군 목록. `jobField` 는 자유 문자열이고 고를 수 있는 값을 주는 API 가 없어, 이 저장소에
 * 있는 유일한 직군·직무 열거인 커리어 정보 화면의 목록을 쓴다.
 *
 * `직군 무관` 과 `<직군> 직무 전체` 는 뺀다. 그 둘은 "내 희망 직무" 를 적는 칸의 값이지 공고에
 * 붙는 값이 아니고, API 설명이 "공고의 값과 정확히 같은지로 거릅니다" 라고 적고 있어 공고에
 * 없는 값을 보내면 언제나 0 건이다. 근거는
 * `.claude/tasks/memos/결정-마이페이지-push2-2026-09-21.md` 3 절.
 */
const JOB_FIELD_OPTIONS = JOB_FIELD_ROLES.filter(({ jobField }) => jobField !== ANY_JOB_FIELD).map(
  ({ jobField }) => [jobField, jobField] as const,
);

function jobRoleOptions(jobField?: string): readonly (readonly [string, string])[] {
  const field = JOB_FIELD_ROLES.find((entry) => entry.jobField === jobField);
  return (field?.jobRoles ?? [])
    .filter((jobRole) => !jobRole.endsWith(ALL_ROLES_SUFFIX))
    .map((jobRole) => [jobRole, jobRole] as const);
}

const TUITION_TYPE_OPTIONS = TUITION_TYPES.map(
  (value) => [value, TUITION_TYPE_LABELS[value]] as const,
);
const STATUS_OPTIONS = BOOTCAMP_STATUSES.map((value) => [value, STATUS_LABELS[value]] as const);

export interface MyScrapsFiltersProps {
  query: MyScrapsQuery;
}

/**
 * 탭마다 다른 필터 드롭다운들(PRD 2 절의 표). 사이드·스터디 탭은 이 컴포넌트가 아예 불리지
 * 않는다 — `listMyRecruitmentPostBookmarks` 가 `page`·`size` 만 받는다.
 *
 * 직무 드롭다운은 직군을 고른 뒤에만 나온다. 직군이 정해지기 전에는 고를 수 있는 직무가
 * 130 개라 목록이 화면을 덮고, 직군과 짝이 맞지 않는 직무를 고르면 결과가 0 건이 된다.
 * 직군을 바꾸면 직무는 지운다.
 */
export function MyScrapsFilters({ query }: MyScrapsFiltersProps) {
  if (query.tab === 'bootcamps') {
    return (
      <>
        <MyPageFilterDropdown
          label="수강료"
          selected={query.tuitionType}
          options={TUITION_TYPE_OPTIONS}
          buildHref={(tuitionType) => buildMyScrapsHref(query, { tuitionType })}
        />
        <MyPageFilterDropdown
          label="모집 상태"
          selected={query.status}
          options={STATUS_OPTIONS}
          buildHref={(status) => buildMyScrapsHref(query, { status })}
        />
      </>
    );
  }

  return (
    <>
      <MyPageFilterDropdown
        label="채용 형태"
        selected={query.employmentType}
        options={EMPLOYMENT_TYPE_OPTIONS}
        buildHref={(employmentType) => buildMyScrapsHref(query, { employmentType })}
      />
      <MyPageFilterDropdown
        label="경력"
        selected={query.experienceType}
        options={EXPERIENCE_TYPE_OPTIONS}
        buildHref={(experienceType) => buildMyScrapsHref(query, { experienceType })}
      />
      <MyPageFilterDropdown
        label="직군"
        selected={query.jobField}
        options={JOB_FIELD_OPTIONS}
        buildHref={(jobField) => buildMyScrapsHref(query, { jobField, jobRole: undefined })}
        className="w-48"
      />
      {query.jobField ? (
        <MyPageFilterDropdown
          label="직무"
          selected={query.jobRole}
          options={jobRoleOptions(query.jobField)}
          buildHref={(jobRole) => buildMyScrapsHref(query, { jobRole })}
          className="w-48"
        />
      ) : null}
    </>
  );
}
