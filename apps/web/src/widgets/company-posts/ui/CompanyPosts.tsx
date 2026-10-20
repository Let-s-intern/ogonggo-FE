'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@ogonggo/ui';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import copy from '../config/copy.json';
import { fetchCompanyPosts, TAB_NOUNS, type CompanyPostsPage } from '../lib/fetch';
import { closeCompanyPost, deleteCompanyPost } from '../lib/mutate';
import { buildCompanyPostsHref, type CompanyPostsQuery } from '../lib/query';
import { companyPostNewHref } from '../lib/routes';
import { CompanyPostCard } from './CompanyPostCard';
import { CompanyPostsCta } from './CompanyPostsCta';

type State = { kind: 'loading' } | { kind: 'ready'; page: CompanyPostsPage } | { kind: 'error' };

export interface CompanyPostsProps {
  query: CompanyPostsQuery;
}

/**
 * 기업 회원의 `채용공고` · `부트캠프` 목록(v5 PRD 2 절, B2 시안 `prd-company-mypage-posts.md`).
 * 제목 줄 + 카드 목록 + 페이지네이션 + 하단 CTA 배너다. 어느 종류인지는 경로가 정하고, 사이드바
 * 메뉴가 둘로 나뉘어 있어 화면 안의 탭은 없다.
 *
 * 카드마다 `작성 → 검수 → 게시 → 종료` 단계를 보인다(`model/stage.ts`). 단계로 거르는 필터는 없다.
 * `listMyJobs`·`listMyBootcamps` 가 받는 것이 `page`·`size` 뿐이라 거를 것도 정렬할 것도
 * 없다. 근거는 `.claude/tasks/memos/결정-기업-마이페이지-push2-2026-09-21.md` 1 절.
 *
 * 목록은 브라우저에서 읽는다. 로그인 토큰이 브라우저 저장소에만 있어 서버 컴포넌트가 읽으면
 * 토큰 없이 나간다 — 마이페이지 목록 화면 넷과 같다.
 */
export function CompanyPosts({ query }: CompanyPostsProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  /** 삭제 뒤 목록을 다시 읽으려고 올리는 값. 주소는 그대로인데 내용만 바뀐다. */
  const [reloadToken, setReloadToken] = useState(0);
  /** 요청이 도는 카드. 그 카드의 메뉴를 잠근다. */
  const [pendingId, setPendingId] = useState<string | null>(null);
  /**
   * 한 동작이 실패했을 때의 말. 목록을 오류 화면으로 바꾸지 않고 목록 위에 한 줄 띄운다 —
   * 읽어 온 목록을 버리면 무엇이 왜 안 됐는지 볼 화면이 사라진다(v4 `MyPosts` 와 같다).
   */
  const [actionError, setActionError] = useState<string | null>(null);
  /**
   * `기업/기관 정보` 에 올린 로고. 목록 응답에 공고별 로고가 없어(`CompanyJobSummaryResponse`)
   * 카드 썸네일을 이것으로 채운다. 계정은 마이페이지 껍데기와 같은 요청을 나눠 쓴다.
   *
   * 채용공고 카드의 썸네일은 회사 로고 자리라 이것이 먼저다. 부트캠프 카드는 대표 이미지가
   * 먼저고, 대표 이미지가 없을 때만 이것을 쓴다.
   */
  const account = useMyAccount();
  const companyLogoUrl =
    account.kind === 'ready' ? account.account.companyProfile?.logoUrl || undefined : undefined;
  /**
   * 무엇을 읽을지는 주소가 정한다. `query` 객체는 렌더마다 새로 만들어져 효과의 의존값이 될
   * 수 없는데, 주소 문자열은 탭과 페이지를 그대로 담고 있어 같은 값이면 같은 요청이다.
   */
  const href = buildCompanyPostsHref(query);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    fetchCompanyPosts(queryRef.current)
      .then((page) => {
        if (active) {
          setState({ kind: 'ready', page });
        }
      })
      .catch(() => {
        if (active) {
          setState({ kind: 'error' });
        }
      });
    return () => {
      active = false;
    };
  }, [href, reloadToken]);

  /** 한 카드에 거는 동작 하나. 도는 동안 그 카드를 잠그고, 끝나면 목록을 다시 읽는다. */
  const mutate = (key: string, failure: string, run: () => Promise<unknown>) => {
    setPendingId(key);
    setActionError(null);
    run()
      .then(() => setReloadToken((token) => token + 1))
      .catch(() => setActionError(failure))
      .finally(() => setPendingId(null));
  };

  const rows = state.kind === 'ready' ? state.page.rows : [];
  const pageInfo =
    state.kind === 'ready'
      ? state.page.pageInfo
      : { pageNum: query.page, pageSize: 0, totalElements: 0, totalPages: 0 };
  return (
    <section className="flex flex-col gap-5 md:gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-gray-950">{TAB_NOUNS[query.tab]}</h1>
          <p className="pt-2 text-sm text-gray-500">{copy.list[query.tab].subtitle}</p>
        </div>
        <Button asChild className="w-full gap-1 whitespace-nowrap md:w-auto">
          <Link href={companyPostNewHref(query.tab)}>
            <span aria-hidden="true" className="icon-[lucide--plus] block h-5 w-5" />
            {TAB_NOUNS[query.tab]} 작성하기
          </Link>
        </Button>
      </header>

      {actionError ? (
        <p role="alert" className="text-sm text-error">
          {actionError}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <CompanyPostCard
              key={row.key}
              row={{
                ...row,
                thumbnailUrl:
                  query.tab === 'jobs'
                    ? (companyLogoUrl ?? row.thumbnailUrl)
                    : (row.thumbnailUrl ?? companyLogoUrl),
              }}
              tab={query.tab}
              pending={pendingId === row.key}
              onDelete={() =>
                mutate(row.key, `${TAB_NOUNS[query.tab]}를 삭제하지 못했습니다.`, () =>
                  deleteCompanyPost(query.tab, row.id),
                )
              }
              onClose={() =>
                mutate(row.key, `${TAB_NOUNS[query.tab]}를 마감하지 못했습니다.`, () =>
                  closeCompanyPost(query.tab, row.id),
                )
              }
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-gray-200 px-4 py-16 text-center text-sm text-gray-500">
          {state.kind === 'loading'
            ? '불러오는 중입니다.'
            : state.kind === 'error'
              ? '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
              : `작성한 ${TAB_NOUNS[query.tab]}가 없습니다.`}
        </p>
      )}

      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildCompanyPostsHref(query, { page })}
      />

      <CompanyPostsCta tab={query.tab} />
    </section>
  );
}
