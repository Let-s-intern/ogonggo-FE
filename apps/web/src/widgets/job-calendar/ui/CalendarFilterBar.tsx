import { cn } from '@ogonggo/ui';
import Link from 'next/link';
import { ChevronIcon, SearchIcon } from '@/shared/ui/icons';
import { buildJobCalendarHref, type JobCalendarQuery } from '../lib/query';

/**
 * 목업의 알약 하나(`docs/asset/공고달력.png`). **누를 수 없다** — `<button>`도 `<a>`도 아닌
 * `<div>`다. 필터를 걸 수 없다는 것을 생김새가 아니라 마크업으로 못 박는다.
 *
 * 크기·색은 목업에서 실측했다. 높이 36px(`h-9`), 테두리 `gray-200`(229,231,235),
 * 글자 `gray-400`(156,163,175) — 전체 공고 화면의 `SearchFilterBar`와 같은 값이다.
 */
function FilterPill({ label, leading, trailing }: {
  label: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex h-9 items-center gap-1 rounded-full border border-gray-200 px-3 text-sm text-gray-400">
      {leading}
      {label}
      {trailing}
    </div>
  );
}

/**
 * 목업의 체크박스 하나. 진짜 `<input type="checkbox">`가 아니다 — 세 개 중 둘은 누를 곳이
 * 없고(걸 값이 없다), 동작하는 `간략히 보기`는 상태가 URL 에 있어 링크로 옮기는 편이 맞다.
 * 그래서 이 함수는 생김새만 맡고, 누를 수 있는지는 부르는 쪽이 정한다.
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
          <svg viewBox="0 0 10 10" aria-hidden="true" className="h-2.5 w-2.5 text-white">
            <path
              d="M2 5.2L4.1 7.2L8 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className={cn('text-sm', checked ? 'font-bold text-gray-800' : 'text-gray-400')}>
        {label}
      </span>
    </span>
  );
}

export interface CalendarFilterBarProps {
  query: JobCalendarQuery;
}

/**
 * 공고 달력 상단의 필터 줄. `간략히 보기`를 뺀 **여섯 개는 동작하지 않는다**(PRD 3절·8.7).
 * 사이드·스터디의 `모집글 쓰기` 버튼과 같은 처리다 — 목업대로 그리되 클릭 핸들러를 붙이지 않는다.
 *
 * `GET /api/v1/jobs/calendar`의 응답은 `id`·`companyName`·`recruitmentStartAt`·
 * `recruitmentEndAt` 넷뿐이라(PRD 2절) 서버에서도 클라이언트에서도 거를 값이 없다. 무엇이
 * 없어서 못 거는지는 각 요소 위에 적었다.
 *
 * 실제로 동작하는 것은 `간략히 보기`(주간 뷰 전환)뿐이다.
 */
export function CalendarFilterBar({ query }: CalendarFilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* API 없음: 달력 응답에 제목도 본문도 없고 `q` 파라미터도 없다. 검색할 대상이 없다. */}
      <FilterPill label="공고 검색" leading={<SearchIcon className="h-4 w-4 text-gray-400" />} />
      {/* API 없음: 응답에 `employmentType`이 없다. 정규직·인턴을 구분할 값 자체가 없다. */}
      <FilterPill label="채용 형태" trailing={<ChevronIcon className="h-4 w-4 text-gray-400" />} />
      {/* API 없음: `jobMajor`(직무)는 응답은 물론 백엔드 스키마에도 아직 없다(PRD 11절). */}
      <FilterPill label="직무" trailing={<ChevronIcon className="h-4 w-4 text-gray-400" />} />
      {/* API 없음: 응답에 `experienceType`이 없다. 신입·경력을 구분할 값이 없다. */}
      <FilterPill label="경력" trailing={<ChevronIcon className="h-4 w-4 text-gray-400" />} />
      {/* 알약 묶음과 체크박스 묶음 사이는 목업에서 13px, 체크박스끼리는 18px 이다. */}
      <div className="ml-1 flex items-center gap-[18px]">
        {/*
          여섯 중 유일하게 동작한다 — 켜면 주간, 끄면 월간이고 기본은 월간이다(PRD 8.1).
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
        {/* API 없음: `recruitmentEndAt`으로 판단할 수는 있으나 PRD 3절이 그리기만 하기로 정했다. */}
        <FilterCheckbox label="마감공고 제외" checked />
        {/* API 없음: 응답에 `bookmarked`가 없다. 스크랩 여부를 알 방법이 없다. */}
        <FilterCheckbox label="스크랩 공고만" checked={false} />
      </div>
    </div>
  );
}
