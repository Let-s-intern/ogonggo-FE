'use client';

import { cn } from '@ogonggo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { JOB_MAJORS, MAX_JOB_MAJORS } from '../lib/job-majors';
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
 * 세 개를 고른 뒤에는 고르지 않은 칸을 막는다. 네 번째를 누르면 가장 먼저 고른 것을 밀어내는
 * 방식도 있지만, 누른 사람이 모르는 사이에 선택이 바뀐다.
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
  const full = selected.length >= MAX_JOB_MAJORS;
  const empty = selected.length === 0;

  const toggle = (slug: string) =>
    setSelected((previous) =>
      previous.includes(slug) ? previous.filter((value) => value !== slug) : [...previous, slug],
    );

  return (
    <div className="flex flex-col">
      <CalendarPanel className="items-center px-6 pt-12 pb-10">
        <h2 className="text-2xl font-bold text-gray-900">관심 직무를 골라주세요</h2>
        <p className="mt-3 text-sm text-gray-700">* 최대 {MAX_JOB_MAJORS}개 선택 가능</p>
        {/* 목업은 5열이고 칸 사이가 가로 20px, 세로 20px 이다. */}
        <ul className="mt-11 grid w-full max-w-[908px] grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {JOB_MAJORS.map((major) => {
            const checked = selected.includes(major.slug);
            return (
              <li key={major.slug}>
                <button
                  type="button"
                  aria-pressed={checked}
                  disabled={!checked && full}
                  onClick={() => toggle(major.slug)}
                  className={cn(
                    'flex h-[84px] w-full flex-col items-start justify-between rounded-md border px-3 py-3 text-left transition-colors',
                    checked
                      ? 'border-blue-500 bg-blue-50 text-blue-500'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300',
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200',
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
          onClick={() =>
            router.push(buildJobCalendarHref(query, { majors: selected, picker: false }))
          }
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
