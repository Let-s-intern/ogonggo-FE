'use client';

import type { ApplicationBoardTab } from '@/features/application-board';
import { MyPageListTabs, type MyPageListTab } from '@/widgets/mypage-list';
import { buildApplicationBoardHref, type ApplicationBoardQuery } from '../lib/query';
import { ApplicationBoardFilterRow } from './ApplicationBoardFilterRow';
import { ApplicationBoardKanban } from './ApplicationBoardKanban';
import { ApplicationBoardList } from './ApplicationBoardList';

/** 목업의 탭 이름. v4 스크랩 화면과 같은 셋이다. */
const TABS: readonly MyPageListTab<ApplicationBoardTab>[] = [
  { value: 'jobs', label: '채용 공고' },
  { value: 'bootcamps', label: '교육 · 부트캠프' },
  { value: 'side-studies', label: '사이드 · 스터디' },
];

export interface ApplicationBoardProps {
  query: ApplicationBoardQuery;
}

/**
 * `지원 · 신청 관리` 본문(PRD "화면"). 탭 셋 + 필터 줄 + 칸반 또는 리스트다.
 *
 * **두 보기가 같은 것을 다르게 늘어놓는다.** 어느 단계를 그릴지도, 무엇으로 거를지도, 어떻게
 * 옮길지도 같다 — 갈리는 것은 배치와 조작 모양뿐이다. 무엇을 그릴지는 주소의 `view` 가 정한다.
 *
 * **제목과 하단 배너는 여기 없다.** 그 둘은 이 본문을 `/mypage/scraps` 에 끼우는 쪽의 것이고,
 * 이 위젯은 어느 자리에 놓이든 같은 것을 그린다.
 *
 * 탭 줄은 v4 목록 화면들이 쓰는 `MyPageListTabs` 다. 목업의 탭 뒤에는 건수가 붙어 있지만
 * 넘기지 않는다 — 그 수는 필터와 무관한 탭 전체 건수이고, 단계별로 갈린 지금 요청들로는 셀 수
 * 없다(Push 1 결과보고서 "Push 2·3 이 풀어야 할 것"). 0 을 그리면 "비었다" 로 읽힌다.
 */
export function ApplicationBoard({ query }: ApplicationBoardProps) {
  return (
    <div className="flex flex-col gap-6">
      <MyPageListTabs
        items={TABS}
        current={query.tab}
        buildHref={(tab) => buildApplicationBoardHref(query, { tab })}
        aria-label="지원 · 신청 종류"
      />
      <ApplicationBoardFilterRow query={query} />
      {query.view === 'list' ? (
        <ApplicationBoardList query={query} />
      ) : (
        <ApplicationBoardKanban query={query} />
      )}
    </div>
  );
}
