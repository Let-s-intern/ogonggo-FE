import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { companyPostNewHref } from '../lib/routes';
import { CompanyPostsCta } from './CompanyPostsCta';
import type { CompanyPostsQuery } from '../lib/query';

export interface CompanyPostsProps {
  query: CompanyPostsQuery;
}

/**
 * `작성한 공고`(v5 PRD 2 절). 제목 줄 + 탭 둘 + 표 + 페이지네이션 + 하단 CTA 배너다.
 *
 * **목업(`docs/asset/v5 기업회원 마이페이지/작성한 공고.png`) 에 v4 잔재가 남아 있다.**
 * 디자이너가 v4 의 `작성한 모집글` 화면을 복사해 바뀌는 부분만 고쳐 넘겼고, 제목·부제·표
 * 머리글·행 메타에 모집글 용어가 그대로 있다. 여기 문구는 목업이 아니라 task 1.1 의 표를
 * 따른다 — 기업 회원 화면에 "사이드 프로젝트 · 스터디 모집글" 이 있으면 자기 공고 목록이
 * 아닌 것으로 읽힌다.
 *
 * | 목업 | 쓰는 것 |
 * |---|---|
 * | 작성한 사이드 프로젝트 · 스터디 모집글 | 작성한 공고 |
 * | 사이드 · 스터디확인해요. | 등록한 공고의 상태를 한곳에서 확인해요. |
 * | 새 모집글 작성하기 | 새 공고 작성하기 |
 */
export function CompanyPosts({ query }: CompanyPostsProps) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">작성한 공고</h1>
          <p className="pt-2 text-sm text-gray-500">등록한 공고의 상태를 한곳에서 확인해요.</p>
        </div>
        <Button asChild className="whitespace-nowrap">
          <Link href={companyPostNewHref(query.tab)}>새 공고 작성하기</Link>
        </Button>
      </header>

      <CompanyPostsCta tab={query.tab} />
    </section>
  );
}
