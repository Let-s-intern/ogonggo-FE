'use client';

import { useEffect, useState } from 'react';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { jobsHeroLines } from '@/shared/lib/heroContent';
import { HeroLines } from './HeroLines';

/**
 * 채용공고 홈 헤드라인. 첫 줄의 이름은 브라우저 저장소의 토큰으로만 알 수 있어 클라이언트 컴포넌트다.
 *
 * 서버 렌더와 첫 하이드레이션에서는 계정을 모르므로 첫 줄을 자리만 잡고 감춘다(`invisible`). 비로그인으로
 * 그렸다가 로그인한 사람에게 이름으로 바뀌면 문구가 깜빡이기 때문이다. 마운트 뒤 계정 상태가 정해지면
 * (`signedOut` · `ready` · `error`) 보인다. 둘째 줄(공고 수)은 계정과 상관없어 처음부터 보인다.
 */
export function JobsHeroHeadline({ total }: { total: number }) {
  const account = useMyAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const settled = mounted && account.kind !== 'loading';
  const ready = account.kind === 'ready' ? account.account : undefined;
  const name = ready?.role === 'COMPANY' ? ready.companyProfile?.managerName : ready?.profile?.name;

  return (
    <HeroLines lines={jobsHeroLines(name || undefined, total)} hiddenLines={settled ? [] : [0]} />
  );
}
