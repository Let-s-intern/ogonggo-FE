'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { cn } from '@ogonggo/ui';
import Link from 'next/link';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import { computeDday, isDdayUrgent } from '@/shared/lib/dday';
import { BookmarkIcon } from '@/shared/ui/icons';
import { loadDayJobs, type DayJob } from '../api/load-day-jobs';
import { weekdayLabel } from '../lib/calendar-grid';
import { DAY_JOBS_PAGE_SIZE } from '../lib/day-jobs';
import { parseCalendarDate } from '../lib/query';

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
 * 북마크는 표시만 한다. 누르는 것은 상세의 `ApplyCta`가 맡는다 — 카드 전체가 링크라 그 안에
 * 또 누를 곳을 두면 어느 쪽이 눌렸는지 헷갈린다.
 */
function DayJobCard({ job }: { job: DayJob }) {
  const dday = computeDday(job.recruitmentType, job.recruitmentEndAt);
  const urgent = isDdayUrgent(job.recruitmentType, job.recruitmentEndAt);
  const meta = [
    EMPLOYMENT_TYPE_LABELS[job.employmentType],
    job.jobMajor,
    EXPERIENCE_TYPE_LABELS[job.experienceType],
  ].filter((part): part is string => Boolean(part));

  return (
    <Link
      href={`/jobs/${job.id}`}
      scroll={false}
      className="block rounded-xl bg-white p-3 shadow-[0_2px_10px_rgba(17,24,39,0.06)] transition-shadow hover:shadow-[0_4px_14px_rgba(17,24,39,0.1)]"
    >
      <div className="flex items-start gap-3">
        <CompanyLogo companyName={job.companyName} className="h-10 w-10 rounded-lg" />
        <p className="flex-1 truncate pt-1 text-sm font-medium text-gray-800">{job.companyName}</p>
        <BookmarkIcon filled={job.bookmarked} className="h-6 w-6 shrink-0" />
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
  );
}

export interface DayJobPanelProps {
  /** 고른 날. `YYYY-MM-DD`. */
  day: string;
  /** 그 날 마감하는 공고의 id. 달력 응답에서 온 순서 그대로다. */
  jobIds: number[];
}

/**
 * 월간 오른쪽의 날짜별 공고 목록(v6). 격자에서 날짜를 누르면 그 날 마감하는 공고를 보인다.
 *
 * 카드 값은 상세를 다섯 건씩 불러 채운다(`../api/load-day-jobs.ts`). 쿼리 키에 날짜와 id 목록을
 * 같이 넣어, 다른 날을 눌렀다 돌아오면 이미 불러온 카드를 다시 부르지 않는다.
 */
export function DayJobPanel({ day, jobIds }: DayJobPanelProps) {
  const query = useInfiniteQuery({
    queryKey: ['calendar-day-jobs', day, jobIds.join(',')],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      loadDayJobs(jobIds.slice(pageParam, pageParam + DAY_JOBS_PAGE_SIZE)),
    getNextPageParam: (_last, pages) => {
      const next = pages.length * DAY_JOBS_PAGE_SIZE;
      return next < jobIds.length ? next : undefined;
    },
    enabled: jobIds.length > 0,
  });
  const jobs = query.data?.pages.flat() ?? [];

  return (
    <section aria-label={`${formatDayTitle(day)} 마감 공고`} className="flex flex-col">
      {/* 제목 줄은 왼쪽 달력의 `2026.08` 줄과 같은 높이에 온다. */}
      <h2 className="flex h-10 items-center gap-3">
        <span className="text-xl font-bold text-gray-900">{formatDayTitle(day)}</span>
        <span className="text-xl text-gray-400">({jobIds.length})</span>
      </h2>

      {jobIds.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">이 날 마감하는 공고가 없어요</p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {jobs.map((job) => (
            <li key={job.id} className="border-b border-gray-200 py-2 first:pt-0 last:border-b-0">
              <DayJobCard job={job} />
            </li>
          ))}
          {query.isPending || query.isFetchingNextPage ? (
            <li aria-hidden="true" className="ogonggo-skeleton animate-pulse py-2">
              <div className="h-[116px] rounded-xl bg-gray-100" />
            </li>
          ) : null}
        </ul>
      )}

      {query.isError ? (
        <p className="mt-4 text-sm text-gray-500">공고를 불러오지 못했어요</p>
      ) : null}

      {query.hasNextPage && !query.isFetchingNextPage ? (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          className="mt-4 self-center py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          더보기
        </button>
      ) : null}
    </section>
  );
}
