import { cn } from '@ogonggo/ui';
import Link from 'next/link';
import { EMPLOYMENT_TYPE_LABELS } from '@/entities/job/model/labels';
import { ChevronIcon, SearchIcon } from '@/shared/ui/icons';
import {
  buildJobCalendarHref,
  KEYWORD_MAX_LENGTH,
  KEYWORD_MIN_LENGTH,
  type JobCalendarEmploymentType,
  type JobCalendarExperienceType,
  type JobCalendarQuery,
} from '../lib/query';

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
}: {
  label: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** 켜진 알약은 파란 테두리와 글자다(`v6 공고달력/관심직무 선택됨.png`의 `직무`). */
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        'flex h-9 items-center gap-1 rounded-full border px-3 text-sm',
        active ? 'border-blue-500 text-blue-500' : 'border-gray-200 text-gray-400',
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
 * `경력` 알약의 값과 이름. `entities/job/model/labels.ts` 의 `EXPERIENCE_TYPE_LABELS` 를 쓰지
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
 * 값 하나를 고르는 알약. `<details>`/`<summary>` 로 여닫고 고르는 순간 이동하는
 * `widgets/job-list/ui/SearchFilterBar.tsx` 의 `FilterDropdown` 과 같은 방식이다 —
 * 자바스크립트 없이 열리고, 이 줄이 클라이언트 컴포넌트가 될 이유가 없다.
 *
 * 맨 위 줄은 "고르지 않음" 으로 돌아가는 길이다. 고른 뒤에 필터를 뺄 방법이 없으면 알약이
 * 한 번 걸리고 나서 되돌아갈 수 없다.
 */
function FilterDropdown<TValue extends string>({
  label,
  selected,
  options,
  buildHref,
}: {
  label: string;
  selected: TValue | undefined;
  options: [TValue, string][];
  buildHref: (value: TValue | undefined) => string;
}) {
  const currentLabel = options.find(([value]) => value === selected)?.[1] ?? label;

  return (
    <details className="group relative">
      {/* 기본 삼각형 표식을 지운다. 꺾쇠는 알약 안에 따로 있다. */}
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <FilterPill
          label={currentLabel}
          active={selected !== undefined}
          trailing={<ChevronIcon className="h-4 w-4 group-open:rotate-180" />}
        />
      </summary>
      <ul className="absolute right-0 z-10 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-md">
        <li>
          <Link
            href={buildHref(undefined)}
            className={cn(
              'block px-3 py-1.5 text-sm',
              selected === undefined
                ? 'font-semibold text-blue-500'
                : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            {label}
          </Link>
        </li>
        {options.map(([value, optionLabel]) => (
          <li key={value}>
            <Link
              href={buildHref(value)}
              className={cn(
                'block px-3 py-1.5 text-sm',
                value === selected
                  ? 'font-semibold text-blue-500'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {optionLabel}
            </Link>
          </li>
        ))}
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
    <form action="/calendar" method="GET" className="flex items-center">
      {[...carried].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <FilterPill
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
            className="w-24 bg-transparent text-gray-800 outline-none placeholder:text-gray-400"
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
function FilterCheckbox({ label, checked }: { label: string; checked: boolean }) {
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
 * 목업의 `마감일 기준` 토글(v6). 켜진 모양 그대로 그리고 **누를 수 없다** — 달력은 지금도 마감일
 * 기준으로만 놓이고(`MonthGrid`·`WeekGrid`), 끄면 무엇 기준이 되는지 목업도 정하지 않았다.
 * 옆의 체크박스들과 같은 처리다.
 */
function DeadlineBasisToggle() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-5 w-9 items-center justify-end rounded-full bg-blue-500 p-0.5">
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>
      <span className="text-sm font-bold text-gray-800">마감일 기준</span>
    </span>
  );
}

export interface CalendarFilterBarProps {
  query: JobCalendarQuery;
}

/**
 * 공고 달력 상단의 필터 줄. `간략히 보기`와 `직무`를 뺀 나머지는 **동작하지 않는다**(PRD 3절·8.7).
 * 사이드·스터디의 `모집글 쓰기` 버튼과 같은 처리다 — 목업대로 그리되 클릭 핸들러를 붙이지 않는다.
 *
 * `GET /api/v1/jobs/calendar`의 응답은 `id`·`companyName`·`recruitmentStartAt`·
 * `recruitmentEndAt` 넷뿐이라(PRD 2절) 서버에서도 클라이언트에서도 거를 값이 없다. 무엇이
 * 없어서 못 거는지는 각 요소 위에 적었다.
 *
 * 실제로 동작하는 것은 `간략히 보기`(주간 뷰 전환)와 `직무`(관심 직무 선택 화면, v6)다.
 */
export function CalendarFilterBar({ query }: CalendarFilterBarProps) {
  return (
    // v6 목업은 알약 줄 아래에 체크박스 줄을 오른쪽 끝에 맞춰 둔다. 두 줄 사이는 목업 실측 16px 이다.
    <div className="flex flex-col items-end gap-4">
      <div className="flex items-center gap-2">
        <KeywordFilter query={query} />
        <FilterDropdown
          label="채용 형태"
          selected={query.employmentType}
          options={EMPLOYMENT_TYPE_OPTIONS}
          buildHref={(value) => buildJobCalendarHref(query, { employmentType: value })}
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
          label="경력"
          selected={query.experienceType}
          options={EXPERIENCE_TYPE_OPTIONS}
          buildHref={(value) => buildJobCalendarHref(query, { experienceType: value })}
        />
      </div>
      {/* 체크박스끼리는 목업에서 18px 이다. */}
      <div className="flex items-center gap-[18px]">
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
        {/* API 없음: 응답에 `bookmarked`가 없다. 스크랩 여부를 알 방법이 없다. */}
        <FilterCheckbox label="스크랩 공고만" checked={false} />
        <DeadlineBasisToggle />
      </div>
    </div>
  );
}
