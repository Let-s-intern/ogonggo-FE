'use client';

import { useState } from 'react';
import { cn } from '@ogonggo/ui';
import type { JobSummary } from '@/entities/job/model/types';
import { PopularJobCard } from './PopularJobCard';

type TabKey = 'popular' | 'intern' | 'newcomer';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'popular', label: '인기 공고' },
  { key: 'intern', label: '인턴 TOP4' },
  { key: 'newcomer', label: '신입 TOP4' },
];

export interface PopularJobsTabsProps {
  popular: JobSummary[];
  intern: JobSummary[];
  newcomer: JobSummary[];
}

/**
 * 탭 전환은 URL이 아닌 클라이언트 state로만 다룬다 — "전체 공고" 검색·필터와 달리 공유·새로고침
 * 시 유지할 필요가 없는 화면 상태다(Push 4 task 파일 2.2절). 세 리스트는 서버 컴포넌트
 * (`PopularJobs`)가 이미 나눠 내려준다.
 */
export function PopularJobsTabs({ popular, intern, newcomer }: PopularJobsTabsProps) {
  const [active, setActive] = useState<TabKey>('popular');
  const itemsByTab: Record<TabKey, JobSummary[]> = { popular, intern, newcomer };
  const items = itemsByTab[active];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">인기 공고</h2>
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium',
                active === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">표시할 공고가 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((job) => (
            <li key={job.id}>
              <PopularJobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
