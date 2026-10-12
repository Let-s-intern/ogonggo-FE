'use client';

import { useState } from 'react';
import type { UserTodayJobSummaryResponse } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { JobCard } from '@/entities/job/ui/JobCard';
import type { JobSummary } from '@/entities/job/model/types';

type TabKey = 'pick' | 'popular' | 'intern' | 'newcomer';

const TAB_LABELS: Record<TabKey, string> = {
  pick: '오공고 PICK',
  popular: '인기 공고',
  intern: '인턴 TOP4',
  newcomer: '신입 TOP4',
};

export interface PopularJobsTabsProps {
  /** 운영자가 고른 공고. 비면 첫 탭이 `인기 공고` 로 바뀐다. */
  picks: UserTodayJobSummaryResponse[];
  popular: JobSummary[];
  intern: JobSummary[];
  newcomer: JobSummary[];
}

/**
 * 탭 전환은 URL이 아닌 클라이언트 state로만 다룬다 — "전체 공고" 검색·필터와 달리 공유·새로고침
 * 시 유지할 필요가 없는 화면 상태다(Push 4 task 파일 2.2절). 세 리스트는 서버 컴포넌트
 * (`PopularJobs`)가 이미 나눠 내려준다.
 */
export function PopularJobsTabs({ picks, popular, intern, newcomer }: PopularJobsTabsProps) {
  const firstTab: TabKey = picks.length > 0 ? 'pick' : 'popular';
  const tabs: TabKey[] = [firstTab, 'intern', 'newcomer'];
  const [active, setActive] = useState<TabKey>(firstTab);
  const itemsByTab: Record<TabKey, JobSummary[]> = { pick: picks, popular, intern, newcomer };
  const items = itemsByTab[active];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-bold text-gray-900">오늘의 추천 공고</h2>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors',
                active === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800',
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">표시할 공고가 없습니다.</p>
      ) : (
        // 모바일은 가로로 넘긴다(`docs/asset/v12 채용공고 상세/모바일 목록.webp`). 화면 끝까지 넘기도록
        // 좌우 여백만큼 밖으로 빼고 안에서 다시 들인다. 카드 폭은 시안(375px 에서 249px)을 따라 이 목록
        // 안쪽 폭의 72% 다(화면의 72% 가 아니다). 375px 에서 박스 안쪽 311px 의 72% 는 224px 라 최소
        // 폭 240px 가 되고, 같은 모양인 오늘의 추천 공고(343px)는 247px 다. 범위를 둬서 320px 폰과 큰
        // 폰 모두 옆 카드가 보인다.
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
          {items.map((job, index) => (
            <li
              key={job.id}
              className="w-[72%] max-w-[320px] min-w-[240px] shrink-0 snap-start md:w-auto md:max-w-none md:min-w-0"
            >
              <JobCard
                variant="featured"
                job={job}
                recommendation={active === 'pick' ? recommendationOf(job) : undefined}
                tracking={{ listSource: 'main', listPosition: index + 1, pageNumber: 1 }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 오공고 PICK 카드의 추천 문구. 스펙은 필수 문자열이지만 `null` 이 오면 `JobCard` 의 `trim()` 이 렌더
 * 중에 터져 홈 전체가 오류 화면이 된다. 응답 경계에서 빈 문자열로 만든다.
 */
function recommendationOf(job: JobSummary) {
  const pick = job as Partial<UserTodayJobSummaryResponse>;
  return {
    title: pick.recommendationTitle ?? '',
    description: pick.recommendationDescription ?? '',
  };
}
