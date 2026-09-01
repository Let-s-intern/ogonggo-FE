import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import {
  buildSideStudyListHref,
  SIDE_STUDY_TABS,
  type SideStudyListQuery,
  type SideStudyTab,
} from '../lib/query';

/** API 없음: 탭 세 개는 백엔드에 대응 파라미터가 없다 — 매핑은 `lib/query.ts`의 `TAB_KINDS`. */
const TAB_LABELS: Record<SideStudyTab, string> = {
  all: '전체',
  project: '사이드 프로젝트',
  study: '스터디',
};

export interface SideStudyListControlsProps {
  query: SideStudyListQuery;
}

/**
 * `사이드스터디.png`의 카드 그리드 바로 위 한 줄 — 왼쪽에 탭 세 개. 자바스크립트 없이 URL
 * 쿼리 파라미터를 바꾸는 `<Link>`다(부트캠프 목록의 탭과 같은 방식).
 *
 * 부트캠프 목록과 달리 오른쪽에 정렬 드롭다운도 `모집 중만` 토글도 없다 — 목업의 그 자리에는
 * `모집글 쓰기` 버튼이 있다(PRD 4.3).
 */
export function SideStudyListControls({ query }: SideStudyListControlsProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <nav className="flex items-center gap-5 text-lg" aria-label="모집글 종류">
        {SIDE_STUDY_TABS.map((tab) => (
          <Link
            key={tab}
            href={buildSideStudyListHref(query, { tab })}
            aria-current={tab === query.tab ? 'page' : undefined}
            className={cn(
              tab === query.tab ? 'font-bold text-gray-900' : 'font-medium text-gray-400',
            )}
          >
            {TAB_LABELS[tab]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
