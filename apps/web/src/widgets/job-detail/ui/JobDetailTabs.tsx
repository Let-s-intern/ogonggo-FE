'use client';

import { useSearchParams } from 'next/navigation';
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import { nextTabIndex } from '../lib/tabKeyboard';

export type JobDetailTab = 'analysis' | 'original';

const TAB_ITEMS: readonly { value: JobDetailTab; label: string }[] = [
  { value: 'analysis', label: '공고 분석' },
  { value: 'original', label: '공고 원문' },
];

const TAB_PARAM = 'tab';

export interface JobDetailTabsProps {
  /**
   * 고른 탭을 주소의 `?tab=original` 과 맞출지. 상세 페이지는 맞추고, 공고 달력·스크랩 화면의 모달은
   * 모달 아래 화면의 주소를 건드리면 안 되므로 상태로만 둔다.
   */
  syncUrl?: boolean;
  /** `공고 분석` 탭 내용. 처음 열리는 탭이다. */
  analysis: ReactNode;
  /** `공고 원문` 탭 내용. */
  original: ReactNode;
}

interface TabViewProps {
  tab: JobDetailTab;
  onSelect: (tab: JobDetailTab) => void;
  analysis: ReactNode;
  original: ReactNode;
}

/**
 * 채용공고 상세 왼쪽 열의 `공고 분석` / `공고 원문` 탭(`docs/asset/v12 채용공고 상세/상세 기본.webp`).
 * 고른 탭의 내용만 그린다 — 두 탭은 같은 본문을 다르게 보여 줘서 둘 다 그리면 글이 두 번 나온다.
 *
 * 페이지 배치(`syncUrl`)의 첫 탭은 주소가 정한다. `?tab=original` 이면 원문, 없으면 분석이다. 서버 렌더
 * 에서도 같은 값을 읽으므로 `?tab=original` 로 열면 처음부터 원문 탭이다.
 */
export function JobDetailTabs({ syncUrl = false, analysis, original }: JobDetailTabsProps) {
  return syncUrl ? (
    <UrlTabs analysis={analysis} original={original} />
  ) : (
    <StateTabs analysis={analysis} original={original} />
  );
}

/**
 * 탭이 주소의 `?tab=` 를 따른다. 바꿀 때 `history.pushState` 로 주소만 더한다 — 라우터로 옮기면 서버
 * 렌더를 한 번 더 거쳐 탭이 늦게 넘어간다. `pushState` 는 Next 라우터와 이어져 있어(`useSearchParams`
 * 가 따라 바뀐다) 뒤로 가기를 눌러도 이전 탭으로 돌아온다. 다른 쿼리(`utm_*` 등)는 그대로 둔다.
 */
function UrlTabs({ analysis, original }: Pick<TabViewProps, 'analysis' | 'original'>) {
  const searchParams = useSearchParams();
  const tab: JobDetailTab = searchParams.get(TAB_PARAM) === 'original' ? 'original' : 'analysis';

  const handleSelect = (next: JobDetailTab) => {
    if (next === tab) {
      return;
    }
    const url = new URL(window.location.href);
    if (next === 'original') {
      url.searchParams.set(TAB_PARAM, 'original');
    } else {
      url.searchParams.delete(TAB_PARAM);
    }
    window.history.pushState(null, '', url);
  };

  return <TabView tab={tab} onSelect={handleSelect} analysis={analysis} original={original} />;
}

function StateTabs({ analysis, original }: Pick<TabViewProps, 'analysis' | 'original'>) {
  const [tab, setTab] = useState<JobDetailTab>('analysis');
  return <TabView tab={tab} onSelect={setTab} analysis={analysis} original={original} />;
}

/**
 * 모바일은 두 탭이 폭을 반씩 나눠 글자가 가운데에 오고, 데스크톱은 왼쪽에 붙어 나란히 선다. 탭 줄 아래
 * 가는 선은 전체 폭이고, 고른 탭의 파란 밑줄이 그 선 위에 겹친다.
 *
 * 키보드는 탭 패턴을 따른다. 고른 탭만 Tab 순서에 들고, 왼쪽·오른쪽 화살표와 Home·End 로 옮기면 클릭과
 * 같이 `onSelect` 로 탭이 바뀌고 포커스가 따라간다.
 */
function TabView({ tab, onSelect, analysis, original }: TabViewProps) {
  const id = useId();
  const tabId = (value: JobDetailTab) => `${id}-tab-${value}`;
  const panelId = `${id}-panel`;
  const selectedIndex = TAB_ITEMS.findIndex((item) => item.value === tab);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = nextTabIndex(event, selectedIndex, TAB_ITEMS.length);
    const item = next === null ? undefined : TAB_ITEMS[next];
    if (!item) {
      return;
    }
    event.preventDefault();
    onSelect(item.value);
    document.getElementById(tabId(item.value))?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="공고 내용" className="flex border-b border-gray-100 md:gap-6">
        {TAB_ITEMS.map((item) => {
          const selected = item.value === tab;
          return (
            <button
              key={item.value}
              id={tabId(item.value)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(item.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                '-mb-px flex-1 border-b-2 pb-3 text-center text-sm transition-colors md:flex-none md:px-0.5 md:text-base',
                selected
                  ? 'border-blue-500 font-semibold text-blue-500'
                  : 'border-transparent font-medium text-gray-400 hover:text-gray-600',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(tab)} className="pt-5 md:pt-9">
        {tab === 'original' ? original : analysis}
      </div>
    </div>
  );
}
