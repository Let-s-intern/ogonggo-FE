import Link from 'next/link';
import { Button, MenuItem } from '@ogonggo/ui';
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
 *
 * 탭 글자는 `BootcampListControls`와 같이 `MenuItem`이 그린다 — 현재 탭에 밑줄이 생기고,
 * 글자 크기만 `text-lg`로 덮어쓴다. 이유는 그쪽 주석에 적었다.
 */
export function SideStudyListControls({ query }: SideStudyListControlsProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <nav className="flex items-center gap-5" aria-label="모집글 종류">
        {SIDE_STUDY_TABS.map((tab) => (
          <Link
            key={tab}
            href={buildSideStudyListHref(query, { tab })}
            aria-current={tab === query.tab ? 'page' : undefined}
          >
            <MenuItem state={tab === query.tab ? 'current' : 'default'} className="text-lg">
              {TAB_LABELS[tab]}
            </MenuItem>
          </Link>
        ))}
      </nav>
      {/* 작성 화면은 마이페이지 안에 있다(`/mypage/posts/new`, v4 PRD 5 절). 로그인하지 않았으면
          `MyPageLayout` 의 가드가 `/login?redirect=` 로 보내고, 로그인하면 이 자리로 돌아온다. */}
      <Button size="sm" className="rounded-full px-4" asChild>
        <Link href="/mypage/posts/new">모집글 쓰기</Link>
      </Button>
    </div>
  );
}
