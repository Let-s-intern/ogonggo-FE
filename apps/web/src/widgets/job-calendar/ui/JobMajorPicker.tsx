'use client';

import { cn } from '@ogonggo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { track } from '@/shared/analytics/dataLayer';
import { ALL_JOB_MAJOR_SLUGS, JOB_MAJORS } from '../lib/job-majors';
import { writeJobMajorCookie } from '../lib/major-cookie';
import { buildJobCalendarHref, type JobCalendarQuery } from '../lib/query';
import { CalendarPanel } from './CalendarPanel';

export interface JobMajorPickerProps {
  query: JobCalendarQuery;
}

/**
 * 관심 직무 선택(`docs/asset/v6 공고달력/관심직무 선택.png`, `관심직무 선택됨.png`). 필터 줄의
 * `직무`를 누르면 달력 자리에 열린다.
 *
 * 고르는 동안의 선택은 지역 상태다. 칸 하나 누를 때마다 URL 을 바꾸면 서버가 달력을 다시
 * 그리므로, `공고보기`를 눌렀을 때 한 번만 URL 에 옮긴다. 처음 값은 이미 걸려 있는 직무다.
 *
 * 몇 개든 고를 수 있다. 하나, 여럿, `전체 선택` 모두 된다. 전에는 최대 3개였는데, 달력 요청이
 * 고른 수와 상관없이 한 번이 되면서 막을 이유가 없어졌다(`JobCalendarView` 의
 * `fetchCalendarItemsForMajors`). `전체 선택` 은 전부 골라져 있으면 `전체 해제` 가 된다.
 *
 * `공고보기`는 하나 이상 골라야 눌린다. 빈 선택으로 전체를 보는 길은 없앴다 — 전체 공고를 한
 * 달력에 놓으면 한 칸에 수십 건이 쌓여 읽을 수 없다(`prd-calendar-major-gate.md`). 고른 것이
 * 없는 동안은 목업(`관심직무 선택.png`)처럼 회색 글자다.
 *
 * `초기화`는 선택만 비운다. 달력은 그대로 두고 이어서 다른 직무를 고르게 한다.
 */
export function JobMajorPicker({ query }: JobMajorPickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(query.majors);
  const empty = selected.length === 0;
  const all = selected.length === ALL_JOB_MAJOR_SLUGS.length;

  const toggle = (slug: string) =>
    setSelected((previous) =>
      previous.includes(slug) ? previous.filter((value) => value !== slug) : [...previous, slug],
    );

  return (
    <div className="flex flex-col">
      <CalendarPanel className="items-center px-6 pt-12 pb-10">
        <h2 className="text-2xl font-bold text-gray-900">관심 직무를 골라주세요</h2>
        <div className="mt-3 flex items-center gap-3">
          <p className="text-sm text-gray-700">* 여러 개를 고를 수 있어요</p>
          <button
            type="button"
            aria-pressed={all}
            onClick={() => setSelected(all ? [] : [...ALL_JOB_MAJOR_SLUGS])}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-500"
          >
            {all ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        {/* 목업은 5열이고 칸 사이가 가로 20px, 세로 20px 이다. */}
        <ul className="mt-11 grid w-full max-w-[908px] grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {JOB_MAJORS.map((major) => {
            const checked = selected.includes(major.slug);
            return (
              <li key={major.slug}>
                <button
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggle(major.slug)}
                  className={cn(
                    'flex h-[84px] w-full flex-col items-start justify-between rounded-md border px-3 py-3 text-left transition-colors',
                    checked
                      ? 'border-blue-500 bg-blue-50 text-blue-500'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      major.icon,
                      'block h-5 w-5',
                      checked ? 'text-blue-500' : 'text-gray-700',
                    )}
                  />
                  <span className="text-base">{major.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </CalendarPanel>
      {/* 목업에서 버튼 줄 위에는 가로선이 있고, 두 버튼은 가운데 모여 있다(공고보기 710px, 초기화 202px). */}
      <div className="flex justify-center gap-2 border-t border-gray-200 pt-3">
        <button
          type="button"
          disabled={empty}
          onClick={() => {
            // 주소를 바꾸기 전에 적는다. 다음에 `/calendar`로 그냥 들어와도 라우트가 이 값을
            // 읽어 같은 직무의 달력을 편다(`lib/major-cookie.ts`).
            writeJobMajorCookie(selected);
            trackMajorChange(query.majors, selected);
            router.push(buildJobCalendarHref(query, { majors: selected, picker: false }));
          }}
          className={cn(
            'h-9 w-full max-w-[710px] rounded-xs border text-sm transition-colors',
            empty
              ? 'cursor-not-allowed border-gray-200 text-gray-400'
              : 'border-blue-500 text-blue-500 hover:bg-blue-50',
          )}
        >
          공고보기
        </button>
        <button
          type="button"
          onClick={() => setSelected([])}
          className={cn(
            'h-9 w-[202px] shrink-0 rounded-xs bg-gray-100 text-sm transition-colors hover:bg-gray-200',
            empty ? 'text-gray-400' : 'text-gray-800',
          )}
        >
          초기화
        </button>
      </div>
    </div>
  );
}

/** 직무 선택을 바꿔 달력이 새로 걸러질 때, 빠진 직무와 더해진 직무마다 `filter_apply` 한 건씩. */
function trackMajorChange(previous: string[], next: string[]): void {
  const label = (slug: string) => JOB_MAJORS.find((major) => major.slug === slug)?.label ?? slug;
  for (const slug of previous.filter((value) => !next.includes(value))) {
    track('filter_apply', {
      filter_type: 'category',
      filter_value: label(slug),
      filter_action: 'deselect',
    });
  }
  for (const slug of next.filter((value) => !previous.includes(value))) {
    track('filter_apply', {
      filter_type: 'category',
      filter_value: label(slug),
      filter_action: 'select',
    });
  }
}
