import type { ListMyJobBookmarksJobField } from '@ogonggo/api';
import {
  EMPLOYMENT_TYPE_LABELS,
  JOB_FIELD_LABELS,
  JOB_ROLES,
  jobRolesOf,
} from '@/entities/job/model/labels';
import { MyPageFilterDropdown } from '@/widgets/mypage-list';
import {
  buildMyScrapsHref,
  BOOTCAMP_CATEGORIES,
  EMPLOYMENT_TYPES,
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
 * 직군·직무 목록. 백엔드의 직군·직무 enum 이다(ogonggo-BE LC-3385) — 공고에 붙는 값과 같은
 * 목록이라 고른 값으로 실제로 걸러진다. 직무는 고른 직군에 속한 것만 보인다.
 */
const JOB_FIELD_OPTIONS = (Object.keys(JOB_FIELD_LABELS) as ListMyJobBookmarksJobField[]).map(
  (value) => [value, JOB_FIELD_LABELS[value]] as const,
);

function jobRoleOptions(jobField: ListMyJobBookmarksJobField) {
  return jobRolesOf(jobField).map((jobRole) => [jobRole, JOB_ROLES[jobRole].label] as const);
}

/**
 * 부트캠프 분류. 이름은 공개 목록의 탭과 같다(`widgets/bootcamp-list/ui/BootcampListControls.tsx`) —
 * `KDT` 가 `부트캠프`, `SESAC` 이 `새싹` 이다.
 */
const CATEGORY_LABELS = { KDT: '부트캠프', SESAC: '새싹' } as const;
const CATEGORY_OPTIONS = BOOTCAMP_CATEGORIES.map(
  (value) => [value, CATEGORY_LABELS[value]] as const,
);

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
      <MyPageFilterDropdown
        label="분류"
        selected={query.category}
        options={CATEGORY_OPTIONS}
        buildHref={(category) => buildMyScrapsHref(query, { category })}
      />
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
        label="요구 경력"
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
