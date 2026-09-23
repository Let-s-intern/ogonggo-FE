'use client';

import { useState } from 'react';
import { cn } from '@ogonggo/ui';
import Link from 'next/link';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import { BookmarkButton } from '@/features/bookmark';
import { computeDday, isDdayUrgent } from '@/shared/lib/dday';
import { weekdayLabel } from '../lib/calendar-grid';
import { DAY_JOBS_PAGE_SIZE } from '../lib/day-jobs';
import { parseCalendarDate, type JobCalendarDateBasis } from '../lib/query';

/** 목록 제목의 `08. 22. SAT`. */
function formatDayTitle(day: string): string {
  const date = parseCalendarDate(day) ?? new Date();
  return `${day.slice(5, 7)}. ${day.slice(8, 10)}. ${weekdayLabel(date)}`;
}

/**
 * 카드 한 장(`docs/asset/v6 공고달력/월간 보기.png` 오른쪽). 로고·회사명·북마크 → 제목 →
 * "고용형태 · 직무 · 경력"과 D-day 배지다. 직무는 모르면 그 자리만 뺀다(`JobCard`와 같은 규칙).
 *
 * 누르면 공고 상세로 간다. 달력 안에서는 그 이동을 가로채 모달로 띄운다
 * (`app/(site)/calendar/@modal/(..)jobs/[jobId]`).
 *
 * 북마크 버튼은 링크의 형제다. 카드 전체가 링크라 그 안에 버튼을 두면 잘못된 마크업이 되고
 * 누를 때 이동까지 함께 일어난다(PRD "카드 안의 버튼은 링크 밖에 둔다"). 그래서 뿌리가
 * `relative`인 `div`이고 버튼이 전에 아이콘이 있던 자리에 겹친다.
 *
 * **`item.bookmarked`는 늘 `false`다.** 달력을 받는 서버 컴포넌트가 토큰 없이 부르기 때문이다
 * (`../lib/query.ts`). 채워진 아이콘은 전적으로 브라우저의 id 모음에서 온다
 * (`features/bookmark`) — `BookmarkButton`이 그 값으로 덮어쓴다.
 *
 * **`recruitmentType`은 응답에 없어 `'PERIOD'`로 둔다.** 달력에 담기는 항목은 마감일이 있는
 * 공고뿐이다 — 마감일 없는 상시채용은 조회에서 제외된다(`JobCalendarView`의
 * `fetchCalendarItemsForMajors` 주석, `packages/api/src/mocks/handlers.ts`의
 * `getJobCalendarHandler`). 상시채용이 `ALWAYS_OPEN`으로 마감일이 없는 것과 대비되므로, 여기
 * 있는 항목은 전부 기간제(`PERIOD`)로 볼 수 있다.
 *
 * `export`하는 이유는 `DayHoverCard.tsx`가 격자 호버 카드에서도 같은 카드 마크업을 그대로 쓰기
 * 위해서다(Push 2, PRD 3절) — 카드 한 장의 모양은 오른쪽 목록이든 호버 카드든 같아야 한다.
 */
export function DayJobCard({ job }: { job: UserJobCalendarItemResponse }) {
  const dday = computeDday('PERIOD', job.recruitmentEndAt);
  const urgent = isDdayUrgent('PERIOD', job.recruitmentEndAt);
  const meta = [
    EMPLOYMENT_TYPE_LABELS[job.employmentType],
    job.jobField,
    EXPERIENCE_TYPE_LABELS[job.experienceType],
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="relative">
      <Link
        href={`/jobs/${job.id}`}
        scroll={false}
        className="block rounded-xl bg-white p-3 shadow-[0_2px_10px_rgba(17,24,39,0.06)] transition-shadow hover:shadow-[0_4px_14px_rgba(17,24,39,0.1)]"
      >
        <div className="flex items-start gap-3">
          <CompanyLogo companyName={job.companyName} className="h-10 w-10 rounded-lg" />
          <p className="flex-1 truncate pt-1 text-sm font-medium text-gray-800">
            {job.companyName}
          </p>
          {/* 북마크 버튼이 겹치는 자리. 빼면 회사명 칸이 36px 넓어져 잘리는 지점이 달라진다. */}
          <span aria-hidden="true" className="h-6 w-6 shrink-0" />
        </div>
        <p className="mt-4 truncate text-base font-bold text-gray-900">{job.title}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-gray-400">{meta.join(' · ')}</span>
          {dday ? (
            <span
              className={cn(
                'shrink-0 rounded-xs px-1.5 py-0.5 text-xs font-bold',
                urgent ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-600',
              )}
            >
              {dday}
            </span>
          ) : null}
        </div>
      </Link>
      <BookmarkButton
        kind="jobs"
        id={job.id}
        bookmarked={job.bookmarked}
        className="absolute top-3 right-3"
      />
    </div>
  );
}

export interface DayJobPanelProps {
  /** 고른 날. `YYYY-MM-DD`. */
  day: string;
  /**
   * 그 날 마감하는 공고. **달력이 이미 받아 둔 값이다** — 제목·고용형태·경력·북마크까지 여기
   * 있는 칸으로 카드가 다 채워져(2026-09-23 스펙 동기화) 상세를 따로 부르지 않는다. 예전에는
   * `api/load-day-jobs.ts`가 하루 5건씩 상세를 불렀는데, 그 파일은 지웠다(Push 1 task 3.2, 커밋
   * 메시지 참고).
   */
  items: UserJobCalendarItemResponse[];
  /**
   * `마감일 기준` 토글 값. 제목 옆 배지·`aria-label`·빈 상태 문구가 "마감"/"시작" 중 어느
   * 쪽을 쓸지 정한다 — `items` 를 고르는 기준(`MonthCalendar`)과 항상 같은 값이어야 한다.
   */
  dateBasis: JobCalendarDateBasis;
}

/**
 * 월간 오른쪽의 날짜별 공고 목록(v6). 격자에서 날짜를 누르면 그 날 마감하는(시작일 기준이면
 * 시작하는) 공고를 보인다.
 *
 * `더보기`는 이제 네트워크 요청이 아니라 이미 받은 `items`를 더 드러내는 것뿐이다 — 그래서
 * 지역 상태(`visibleCount`) 하나로 끝난다.
 */
export function DayJobPanel({ day, items, dateBasis }: DayJobPanelProps) {
  const basisLabel = dateBasis === 'start' ? '시작' : '마감';
  const [visibleCount, setVisibleCount] = useState(DAY_JOBS_PAGE_SIZE);
  // 날이 바뀌면 다시 5건부터 보인다. 렌더 중에 맞추는 것은 `MonthCalendar`의 `selectedDay`와
  // 같은 방법이다 — 이펙트로 미루면 한 프레임 이전 날의 나머지가 보였다가 접힌다.
  const [renderedDay, setRenderedDay] = useState(day);
  if (renderedDay !== day) {
    setRenderedDay(day);
    setVisibleCount(DAY_JOBS_PAGE_SIZE);
  }

  const jobs = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <section aria-label={`${formatDayTitle(day)} ${basisLabel} 공고`} className="flex flex-col">
      {/* 제목 줄은 왼쪽 달력의 `2026.08` 줄과 같은 높이에 온다. */}
      <h2 className="flex h-10 items-center gap-3">
        <span className="text-xl font-bold text-gray-900">{formatDayTitle(day)}</span>
        <span className="text-xl text-gray-400">({items.length})</span>
        {/*
          어느 기준으로 고른 날짜별 목록인지 알려주는 작은 배지. `aria-label`·빈 상태 문구가
          이미 "마감"/"시작"을 말로 알려주므로, 눈으로 보는 사람에게도 같은 정보를 준다
          (`.claude/tasks/memos/결정-calendar-date-basis-toggle-push1-2026-09-23.md` 2절 — 이
          자리의 목업이 아직 없어 저장소의 회색 알약 색(`gray-100`/`gray-500`)을 그대로 썼다).
        */}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {basisLabel}
        </span>
      </h2>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">이 날 {basisLabel}하는 공고가 없어요</p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {jobs.map((job) => (
            <li key={job.id} className="border-b border-gray-200 py-2 first:pt-0 last:border-b-0">
              <DayJobCard job={job} />
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + DAY_JOBS_PAGE_SIZE)}
          className="mt-4 self-center py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          더보기
        </button>
      ) : null}
    </section>
  );
}
