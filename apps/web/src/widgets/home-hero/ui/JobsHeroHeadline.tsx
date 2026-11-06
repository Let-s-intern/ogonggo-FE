'use client';

import { useEffect, useState } from 'react';
import {
  getPublicJobHeadlineCount,
  type SuccessResponseUserJobHeadlineCountResponse,
  type UserJobHeadlineCountResponse,
} from '@ogonggo/api';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { HERO_CONTENT, jobsHeroLines } from '@/shared/lib/heroContent';
import { HeroLines } from './HeroLines';

export interface JobsHeroHeadlineProps {
  /** 오늘 올라온 공고 수(비로그인 숫자). 받지 못했으면 `null` 이고 둘째 줄이 숫자 없이 나간다. */
  count: number | null;
  /** 로딩 화면(`(home)/loading.tsx`)처럼 아직 아무것도 모를 때. 두 줄 모두 자리만 잡는다. */
  pending?: boolean;
}

/** 로그인한 사람의 공고 수 요청 상태. `failed` 면 비로그인 문구와 서버 숫자로 그린다. */
type MatchedCountState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; result: UserJobHeadlineCountResponse }
  | { kind: 'failed' };

/**
 * 홈 히어로 헤드라인(이슈 #573, #581). 첫 줄의 이름과 로그인한 사람의 숫자는 브라우저 저장소의 토큰으로만 알 수 있어
 * 클라이언트 컴포넌트다.
 *
 * - 비로그인: `지금 딱! 필요한` + 서버가 받은 오늘 올라온 공고 수(`count`)
 * - 로그인: 토큰을 붙여 `GET /api/v1/jobs/headline-count` 를 다시 받는다. `matchedWishJob` 이면 `{이름}에게 딱! 맞는` +
 *   희망 직무에 맞는 공고 수다. 아니면(희망 직무가 비었거나 맞는 공고가 0건, 기업 회원) 비로그인과 같다(2026-11-06 사용자).
 *
 * 서버는 로그인 여부를 모른다(`useMyAccount` 주석). 그래서 서버 렌더와 첫 하이드레이션은 첫 줄을 자리만 잡고 감춘다
 * (`invisible`). 토큰이 있으면 계정과 숫자를 모두 받을 때까지 둘째 줄도 감춘다 — 오늘 공고 수를 그렸다가 희망 직무
 * 숫자로 바꾸면 숫자가 깜빡인다. 글자는 DOM 에 그대로 있어 검색 봇은 비로그인 문구를 읽는다.
 *
 * 이름은 헤더의 `{이름} 님` 과 같은 규칙이다(`widgets/site-header/ui/SiteHeader.tsx`) — 기업 회원은 담당자 이름,
 * 그 밖에는 프로필 이름. 이름이 비었으면 비로그인 문구다.
 */
export function JobsHeroHeadline({ count, pending = false }: JobsHeroHeadlineProps) {
  const accountState = useMyAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const signedIn = accountState.kind !== 'signedOut';
  const [matched, setMatched] = useState<MatchedCountState>({ kind: 'idle' });
  useEffect(() => {
    if (!signedIn) {
      setMatched({ kind: 'idle' });
      return;
    }
    let active = true;
    setMatched({ kind: 'loading' });
    (getPublicJobHeadlineCount() as unknown as Promise<SuccessResponseUserJobHeadlineCountResponse>)
      .then((body) => {
        if (active) {
          setMatched(body.data ? { kind: 'done', result: body.data } : { kind: 'failed' });
        }
      })
      .catch(() => {
        if (active) {
          setMatched({ kind: 'failed' });
        }
      });
    return () => {
      active = false;
    };
  }, [signedIn]);

  const account = accountState.kind === 'ready' ? accountState.account : undefined;
  const name = (
    account?.role === 'COMPANY' ? account.companyProfile?.managerName : account?.profile?.name
  )?.trim();
  const result = matched.kind === 'done' ? matched.result : undefined;
  const personalized = result?.matchedWishJob && name ? result : undefined;
  // 맞춘 숫자가 아니면 오늘 올라온 공고 수다. 서버가 받지 못했으면 브라우저가 받은 같은 숫자를 쓴다.
  const todayCount = count ?? (result && !result.matchedWishJob ? result.count : null);

  const accountSettled = mounted && accountState.kind !== 'loading';
  const countSettled = !signedIn || matched.kind === 'done' || matched.kind === 'failed';
  const settled = accountSettled && countSettled;

  return (
    <HeroLines
      lines={
        personalized
          ? jobsHeroLines(name, personalized.count)
          : jobsHeroLines(undefined, todayCount)
      }
      accentClassName={HERO_CONTENT.jobs.theme.accentText}
      hiddenLines={pending ? [0, 1] : settled ? [] : signedIn ? [0, 1] : [0]}
    />
  );
}
