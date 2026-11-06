'use client';

import { useEffect, useState } from 'react';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { HERO_CONTENT, jobsHeroLines } from '@/shared/lib/heroContent';
import { HeroLines } from './HeroLines';

export interface JobsHeroHeadlineProps {
  /** 모집 중인 공고 수. 받지 못했으면 `null` 이고 둘째 줄이 숫자 없이 나간다. */
  count: number | null;
  /** 로딩 화면(`(home)/loading.tsx`)처럼 아직 아무것도 모를 때. 두 줄 모두 자리만 잡는다. */
  pending?: boolean;
}

/**
 * 홈 히어로 헤드라인(이슈 #573). 첫 줄의 이름은 브라우저 저장소의 토큰으로만 알 수 있어 클라이언트 컴포넌트다.
 *
 * 토큰이 브라우저에만 있어 서버는 로그인 여부를 모른다(`useMyAccount` 주석). 그래서 서버 렌더와 첫 하이드레이션은
 * 첫 줄을 자리만 잡고 감춘다(`invisible`) — 비로그인 문구로 그렸다가 이름으로 바꾸면 로그인한 사람에게 문구가
 * 깜빡인다. 마운트 뒤 토큰이 없으면 바로, 있으면 계정을 받은 뒤(실패해도) 보인다. 글자는 DOM 에 그대로 있어
 * 검색 봇은 비로그인 문구를 읽는다. 둘째 줄(공고 수)은 로그인과 상관없어 처음부터 보인다.
 *
 * 이름은 헤더의 `{이름} 님` 과 같은 규칙이다(`widgets/site-header/ui/SiteHeader.tsx`) — 기업 회원은 담당자 이름,
 * 그 밖에는 프로필 이름. 이름이 비었으면 비로그인 문구다.
 */
export function JobsHeroHeadline({ count, pending = false }: JobsHeroHeadlineProps) {
  const accountState = useMyAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const settled = mounted && accountState.kind !== 'loading';
  const account = accountState.kind === 'ready' ? accountState.account : undefined;
  const name =
    account?.role === 'COMPANY' ? account.companyProfile?.managerName : account?.profile?.name;

  return (
    <HeroLines
      lines={jobsHeroLines(name?.trim() || undefined, count)}
      accentClassName={HERO_CONTENT.jobs.theme.accentText}
      hiddenLines={pending ? [0, 1] : settled ? [] : [0]}
    />
  );
}
