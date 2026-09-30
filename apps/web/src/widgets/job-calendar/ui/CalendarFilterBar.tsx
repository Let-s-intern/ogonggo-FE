import { cn } from '@ogonggo/ui';
import Link from 'next/link';
import { EMPLOYMENT_TYPE_LABELS } from '@/entities/job/model/labels';
import { filterApplyEvents } from '@/shared/analytics/dataLayer';
import { TrackedLink } from '@/shared/analytics/TrackedLink';
import { ChevronIcon, SearchIcon } from '@/shared/ui/icons';
import {
  buildJobCalendarHref,
  KEYWORD_MAX_LENGTH,
  KEYWORD_MIN_LENGTH,
  type JobCalendarEmploymentType,
  type JobCalendarExperienceType,
  type JobCalendarQuery,
  toggleEnumValue,
} from '../lib/query';
import { BookmarkedOnlyFilterPill } from './BookmarkedOnlyFilterPill';

/**
 * 목업의 알약 하나(`docs/asset/공고달력.png`). 생김새만 맡는다 — 누를 수 있는지는 감싸는 쪽이
 * 정한다(`<summary>`, `<Link>`, `<form>`).
 *
 * 크기·색은 목업에서 실측했다. 높이 36px(`h-9`), 테두리 `gray-200`(229,231,235),
 * 글자 `gray-400`(156,163,175) — 전체 공고 화면의 `SearchFilterBar`와 같은 값이다.
 */
function FilterPill({
  label,
  leading,
  trailing,
  active = false,
  className,
}: {
  label: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** 켜진 알약은 파란 테두리와 글자다(`v6 공고달력/관심직무 선택됨.png`의 `직무`). */
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex h-9 items-center gap-1 rounded-full border px-3 text-sm',
        active ? 'border-blue-500 text-blue-500' : 'border-gray-200 text-gray-400',
        className,
      )}
    >
      {leading}
      {label}
      {trailing}
    </span>
  );
}

const EMPLOYMENT_TYPE_OPTIONS = Object.entries(EMPLOYMENT_TYPE_LABELS) as [
  JobCalendarEmploymentType,
  string,
][];

/**
 * `요구 경력` 알약의 값과 이름. `entities/job/model/labels.ts` 의 `EXPERIENCE_TYPE_LABELS` 를 쓰지
 * 않는 이유는 그쪽이 `BOTH` 와 `IRRELEVANT` 를 둘 다 `경력무관` 으로 부르기 때문이다 — 배지
 * 한 칸에는 문제가 없지만 목록으로 펼치면 같은 이름이 두 줄이 되어 무엇이 다른지 알 수 없다.
 * 이름은 API 문서의 표(`ListPublicJobCalendarParams`)를 그대로 옮겼다.
 */
const EXPERIENCE_TYPE_OPTIONS: [JobCalendarExperienceType, string][] = [
  ['NEWCOMER', '신입'],
  ['EXPERIENCED', '경력'],
  ['BOTH', '신입·경력'],
  ['IRRELEVANT', '경력무관'],
];

/**
 * 여럿을 고르는 알약. 항목을 누를 때마다 켜고 끈다(`toggleEnumValue`). 맨 위 `전체` 는 모두 해제다 —
 * 전부 고른 것도 전체와 같아 `전체` 에 체크가 간다. `<details>`/`<summary>` 로 여닫고 항목은 링크라
 * 이 줄이 클라이언트 컴포넌트가 될 이유가 없다. 여럿을 고르는 동안 닫히지 않게
 * `data-dropdown="keep-on-select"` 다(`shared/ui/DropdownDismiss.tsx`). 바깥을 누르거나 Esc 로 닫는다.
 *
 * 알약 글자는 고른 수에 따라 셋이다 — 없으면 이름(`채용 형태`), 하나면 그 값(`정규직`), 여럿이면
 * `정규직 외 1`.
 */
function FilterDropdown<TValue extends string>({
  label,
  filterType,
  selected,
  options,
  buildHref,
}: {
  label: string;
  /** GTM `filter_apply` 의 `filter_type`. `employment` | `experience` */
  filterType: string;
  selected: readonly TValue[];
  options: [TValue, string][];
  buildHref: (values: TValue[]) => string;
}) {
  const labelOf = (value: TValue) => options.find(([option]) => option === value)?.[1] ?? value;
  const allValues = options.map(([value]) => value);
  const currentLabel =
    selected.length === 0
      ? label
      : selected.length === 1
        ? labelOf(selected[0]!)
        : `${labelOf(selected[0]!)} 외 ${selected.length - 1}`;
  const itemClass = (checked: boolean) =>
    cn(
      'flex items-center justify-between gap-2 px-3 py-1.5 text-sm',
      checked ? 'font-semibold text-blue-500' : 'text-gray-600 hover:bg-gray-50',
    );
  const check = (checked: boolean) => (
    <span
      aria-hidden="true"
      className={cn('icon-[lucide--check] block h-4 w-4 shrink-0', !checked && 'invisible')}
    />
  );

  return (
    <details data-dropdown="keep-on-select" className="group relative">
      {/* 기본 삼각형 표식을 지운다. 꺾쇠는 알약 안에 따로 있다. */}
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <FilterPill
          label={currentLabel}
          active={selected.length > 0}
          trailing={<ChevronIcon className="h-4 w-4 group-open:rotate-180" />}
        />
      </summary>
      {/* 모바일은 알약이 왼쪽부터 쌓여 오른쪽 맞춤이면 목록이 화면 왼쪽 밖으로 잘린다. */}
      <ul className="absolute left-0 z-10 mt-1 w-36 md:right-0 md:left-auto rounded-md border border-gray-200 bg-white py-1 shadow-md">
        <li>
          <TrackedLink
            href={buildHref([])}
            scroll={false}
            role="menuitemcheckbox"
            aria-checked={selected.length === 0}
            events={filterApplyEvents(filterType, selected.join(',') || undefined, undefined)}
            className={itemClass(selected.length === 0)}
          >
            전체
            {check(selected.length === 0)}
          </TrackedLink>
        </li>
        {options.map(([value, optionLabel]) => {
          const checked = selected.includes(value);
          return (
            <li key={value}>
              <TrackedLink
                href={buildHref(toggleEnumValue(allValues, selected, value))}
                // 여러 개를 연달아 고르는 동안 화면이 맨 위로 튀지 않게 한다.
                scroll={false}
                role="menuitemcheckbox"
                aria-checked={checked}
                events={
                  checked
                    ? filterApplyEvents(filterType, value, undefined)
                    : filterApplyEvents(filterType, undefined, value)
                }
                className={itemClass(checked)}
              >
                {optionLabel}
                {check(checked)}
              </TrackedLink>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/**
 * 검색어 알약. 자유 텍스트라 `<Link>` 로는 못 만들어 `<form method="GET">` 하나를 쓴다 —
 * 전체 공고 화면(`SearchFilterBar`)과 같은 방법이다.
 *
 * 나머지 상태를 실어 보내는 `<input type="hidden">` 은 **`buildJobCalendarHref` 가 만든 주소를
 * 되읽어** 만든다. 손으로 나열하면 필터가 하나 늘 때마다 여기 한 줄을 빠뜨리게 되고, 검색하는
 * 순간 다른 필터가 조용히 풀린다.
 *
 * `minLength` 는 서버가 두 글자 이상만 받기 때문이다(`parseKeyword`). 한 글자로 제출하면
 * 브라우저가 막고, 비우고 제출하면 검색어가 빠진다 — 그것이 검색을 푸는 길이다.
 */
function KeywordFilter({ query }: { query: JobCalendarQuery }) {
  const carried = new URLSearchParams(
    buildJobCalendarHref(query, { keyword: undefined }).split('?')[1] ?? '',
  );

  return (
    // 모바일은 검색이 한 줄을 다 쓰고 필터 알약들이 다음 줄로 내려간다.
    <form action="/calendar" method="GET" className="flex w-full items-center md:w-auto">
      {[...carried].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <FilterPill
        className="flex-1 md:flex-none"
        active={query.keyword !== undefined}
        leading={<SearchIcon className="h-4 w-4" />}
        label={
          <input
            type="search"
            name="keyword"
            defaultValue={query.keyword}
            placeholder="공고 검색"
            minLength={KEYWORD_MIN_LENGTH}
            maxLength={KEYWORD_MAX_LENGTH}
            aria-label="공고 검색"
            className="w-full min-w-0 bg-transparent text-gray-800 md:w-24 outline-none placeholder:text-gray-400"
          />
        }
      />
      {/* 돋보기는 장식이라 제출할 곳이 따로 있어야 한다. 입력이 하나라 엔터로도 제출되지만
          그 암묵 제출에만 기대면 보조기술에서 `검색` 이라는 조작이 사라진다. */}
      <button type="submit" className="sr-only">
        검색
      </button>
    </form>
  );
}

/**
 * 목업의 체크박스 하나. 진짜 `<input type="checkbox">`가 아니다 — 상태가 전부 URL 에 있어
 * 링크로 옮기는 편이 맞다. 그래서 이 함수는 생김새만 맡고, 누를 수 있는지는 부르는 쪽이 정한다.
 *
 * 켜짐은 `gray-800`(31,41,55) 채움 + 굵은 글씨, 꺼짐은 `gray-400`(156,163,175) 테두리 + 같은
 * 색 글씨다. 상자는 14px 정사각형이다. 전부 목업 실측값이다.
 */
export function FilterCheckbox({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px]',
          checked ? 'bg-gray-800' : 'border border-gray-400',
        )}
      >
        {checked ? (
          <span aria-hidden="true" className="icon-[lucide--check] block h-2.5 w-2.5 text-white" />
        ) : null}
      </span>
      <span className={cn('text-sm', checked ? 'font-bold text-gray-800' : 'text-gray-400')}>
        {label}
      </span>
    </span>
  );
}

/**
 * 목업의 `마감일 기준` 토글(v6). 켜짐(마감일 기준)은 파란 배경 + 오른쪽 원이고 이미 그려져
 * 있던 모양이다. 꺼짐(시작일 기준) 모양은 이 화면 목업에 없어
 * `packages/ui/src/components/Toggle.tsx`(저장소의 범용 스위치)의 꺼짐 색(`bg-gray-300`)과
 * 원 위치(왼쪽)를 그대로 따랐다(`.claude/tasks/memos/결정-calendar-date-basis-toggle-push1-2026-09-23.md`
 * 1절).
 *
 * 상태가 URL 쿼리에 있어(`dateBasis`) `간략히 보기`·`마감공고 제외`와 같이 링크 한 줄이다.
 */
function DeadlineBasisToggle({ query }: { query: JobCalendarQuery }) {
  const isDeadlineBasis = query.dateBasis !== 'start';

  return (
    <Link
      href={buildJobCalendarHref(query, { dateBasis: isDeadlineBasis ? 'start' : 'deadline' })}
      role="checkbox"
      aria-checked={isDeadlineBasis}
      // 모바일은 체크박스 줄 오른쪽 끝에 붙는다.
      className="ml-auto flex items-center gap-2 rounded-full md:ml-0"
    >
      <span
        className={cn(
          'flex h-5 w-9 items-center rounded-full p-0.5',
          isDeadlineBasis ? 'justify-end bg-blue-500' : 'justify-start bg-gray-300',
        )}
      >
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>
      <span className="text-sm font-bold text-gray-800">
        {isDeadlineBasis ? '마감일 기준' : '시작일 기준'}
      </span>
    </Link>
  );
}

export interface CalendarFilterBarProps {
  query: JobCalendarQuery;
}

/**
 * 공고 달력 상단의 필터 줄. `채용 형태`·`요구 경력`·`마감공고 제외`·`공고 검색`·`스크랩 공고만`·
 * `간략히 보기`·`직무`·`마감일 기준`이 실제로 동작한다(Push 1).
 */
export function CalendarFilterBar({ query }: CalendarFilterBarProps) {
  return (
    // v6 목업은 알약 줄 아래에 체크박스 줄을 오른쪽 끝에 맞춰 둔다. 두 줄 사이는 목업 실측 16px 이다.
    // 모바일은 검색 한 줄, 알약 셋 한 줄, 체크박스 한 줄이고 `마감일 기준`이 체크박스 줄 오른쪽
    // 끝이다. 시안은 알약 한 줄 가로 스크롤인데, 드롭다운이 알약 아래로 떨어져서 스크롤 상자 안에
    // 두면 잘린다.
    <div className="flex w-full flex-col items-start gap-4 md:w-auto md:items-end">
      <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
        <KeywordFilter query={query} />
        <FilterDropdown
          label="채용 형태"
          filterType="employment"
          selected={query.employmentTypes}
          options={EMPLOYMENT_TYPE_OPTIONS}
          buildHref={(values) => buildJobCalendarHref(query, { employmentTypes: values })}
        />
        {/*
          관심 직무 선택 화면을 여닫는다(v6). **고른 직무가 있을 때만 링크다.** 고른 것이 없으면
          선택 화면이 언제나 열려 있어(`JobCalendarView`) 닫고 돌아갈 달력이 없다 — 누를 수 있게
          두면 주소만 바뀌고 화면은 그대로라 눌린 것이 먹지 않은 것처럼 보인다. 그때는 옆의
          못 누르는 알약들과 같은 회색 알약이다(목업 `관심직무 선택.png`).

          고른 직무가 있으면 파랗게 켜진다 — 지금 달력이 걸러져 있다는 표시다. 상태가 URL 에 있어
          `간략히 보기`와 같이 링크 한 줄이다.
        */}
        {query.majors.length > 0 ? (
          <Link
            href={buildJobCalendarHref(query, { picker: !query.picker })}
            aria-expanded={query.picker}
            className="rounded-full"
          >
            <FilterPill
              label="직무"
              active
              trailing={
                <ChevronIcon direction={query.picker ? 'up' : 'down'} className="h-4 w-4" />
              }
            />
          </Link>
        ) : (
          <FilterPill label="직무" trailing={<ChevronIcon className="h-4 w-4 text-gray-400" />} />
        )}
        <FilterDropdown
          label="요구 경력"
          filterType="experience"
          selected={query.experienceTypes}
          options={EXPERIENCE_TYPE_OPTIONS}
          buildHref={(values) => buildJobCalendarHref(query, { experienceTypes: values })}
        />
      </div>
      {/* 체크박스끼리는 목업에서 18px 이다. */}
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 md:w-auto md:gap-[18px]">
        {/*
          체크박스 중 유일하게 동작한다 — 켜면 주간, 끄면 월간이고 기본은 월간이다(PRD 8.1).
          상태가 URL 쿼리에 있어서(PRD 7절) 토글이 링크 한 줄로 끝나고, 이 줄이 클라이언트
          컴포넌트가 될 이유도 없다. `role="checkbox"`는 생김새가 체크박스이기 때문이다 —
          마크업은 링크지만 보조기술에는 켜짐·꺼짐이 있는 상자로 읽혀야 한다.
        */}
        <Link
          href={buildJobCalendarHref(query, { brief: !query.brief })}
          role="checkbox"
          aria-checked={query.brief}
          className="rounded-xs"
        >
          <FilterCheckbox label="간략히 보기" checked={query.brief} />
        </Link>
        {/*
          `excludeClosed`. **기본은 꺼짐이다** — 목업은 켜진 모양으로 그려 두었지만, 기본으로
          켜면 달력이 처음부터 데이터를 숨기고 그 사실이 주소에도 남지 않는다. 다른 필터와 같이
          "걸어야 줄어든다" 로 맞춘다.
        */}
        <Link
          href={buildJobCalendarHref(query, { excludeClosed: !query.excludeClosed })}
          role="checkbox"
          aria-checked={query.excludeClosed}
          className="rounded-xs"
        >
          <FilterCheckbox label="마감공고 제외" checked={query.excludeClosed} />
        </Link>
        <BookmarkedOnlyFilterPill query={query} />
        <DeadlineBasisToggle query={query} />
      </div>
    </div>
  );
}
