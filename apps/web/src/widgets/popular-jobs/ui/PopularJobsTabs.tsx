'use client';

import { useState } from 'react';
import { cn } from '@ogonggo/ui';
import { JobCard } from '@/entities/job/ui/JobCard';
import type { JobSummary } from '@/entities/job/model/types';

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-bold text-gray-900">인기 공고</h2>
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors',
                active === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800',
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
        // 모바일은 가로로 넘긴다(`docs/asset/v9 mobile/채용공고 목록.png`). 화면 끝까지 넘기도록
        // 좌우 여백만큼 밖으로 빼고 안에서 다시 들인다.
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
          {items.map((job, index) => (
            <li key={job.id} className="w-[158px] shrink-0 snap-start md:w-auto">
              <JobCard
                job={job}
                tracking={{ listSource: 'main', listPosition: index + 1, pageNumber: 1 }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
