'use client';

import { useState } from 'react';
import type { UserTodayJobSummaryResponse } from '@ogonggo/api';
import { CircleIconButton, cn } from '@ogonggo/ui';
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
      {/* 세 탭 목록을 같은 칸에 겹쳐 두고 고른 탭만 보인다. 칸 높이가 가장 높은 탭에 맞춰져, 탭을 바꿔도
          히어로 박스가 줄었다 늘었다 하지 않는다 — 오공고 PICK 카드에만 추천 이유 상자가 붙어 탭마다 높이가
          달랐다(2026-10-12, 사용자). 숨긴 탭은 `inert` 로 포커스·스크린 리더에서 뺀다. */}
      <div className="grid">
        {tabs.map((tab) => (
          <div
            key={tab}
            inert={tab !== active}
            className={cn('col-start-1 row-start-1 min-w-0', tab !== active && 'invisible')}
          >
            <TabList tab={tab} items={itemsByTab[tab]} />
          </div>
        ))}
      </div>
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

/** PC 에서 한 번에 보이고 화살표 한 번에 넘어가는 카드 수. 그리드 네 칸과 같다. */
const PAGE_SIZE = 4;

function TabList({ tab, items }: { tab: TabKey; items: JobSummary[] }) {
  const [page, setPage] = useState(0);

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">표시할 공고가 없습니다.</p>;
  }

  // PC 는 네 장씩 넘긴다. 목록에는 전부 두고 지금 쪽이 아닌 카드만 md 이상에서 숨긴다 — 모바일은 같은
  // 목록을 손가락으로 끝까지 넘기기 때문이다. 오공고 PICK 은 운영자가 고른 만큼 들어온다.
  const lastPage = Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1);
  const current = Math.min(page, lastPage);
  const start = current * PAGE_SIZE;

  return (
    <div className="relative">
      {/* 모바일은 가로로 넘긴다(`docs/asset/v12 채용공고 상세/모바일 목록.webp`). 화면 끝까지 넘기도록
          좌우 여백만큼 밖으로 빼고 안에서 다시 들인다. 카드 폭은 시안(375px 에서 249px)을 따라 이 목록
          안쪽 폭의 72% 다(화면의 72% 가 아니다). 375px 에서 박스 안쪽 311px 의 72% 는 224px 라 최소
          폭 240px 가 되고, 같은 모양인 오늘의 추천 공고(343px)는 247px 다. 범위를 둬서 320px 폰과 큰
          폰 모두 옆 카드가 보인다. */}
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
        {items.map((job, index) => (
          <li
            key={job.id}
            className={cn(
              'w-[72%] max-w-[320px] min-w-[240px] shrink-0 snap-start md:w-auto md:max-w-none md:min-w-0',
              (index < start || index >= start + PAGE_SIZE) && 'md:hidden',
            )}
          >
            <JobCard
              variant="featured"
              job={job}
              recommendation={tab === 'pick' ? recommendationOf(job) : undefined}
              tracking={{ listSource: 'main', listPosition: index + 1, pageNumber: 1 }}
            />
          </li>
        ))}
      </ul>
      {lastPage > 0 ? (
        <>
          <PageArrow
            direction="prev"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          />
          <PageArrow
            direction="next"
            disabled={current === lastPage}
            onClick={() => setPage(current + 1)}
          />
        </>
      ) : null}
    </div>
  );
}

/** PC 의 좌우 넘김 화살표. 목록 양 끝 가운데에 반쯤 걸쳐 놓인다. 모바일은 손가락으로 넘겨 그리지 않는다. */
function PageArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <CircleIconButton
      label={direction === 'prev' ? '이전 추천 공고' : '다음 추천 공고'}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 hidden size-10 -translate-y-1/2 border border-gray-200 bg-white shadow-md disabled:invisible md:flex',
        direction === 'prev' ? '-left-5' : '-right-5',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block h-5 w-5 text-gray-700',
          direction === 'prev' ? 'icon-[lucide--chevron-left]' : 'icon-[lucide--chevron-right]',
        )}
      />
    </CircleIconButton>
  );
}
