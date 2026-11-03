import type { ReactNode } from 'react';
import { jobsHeroLines } from '@/shared/lib/heroContent';
import { fetchJobTotal } from '../api/fetchJobTotal';
import { HeroLines } from './HeroLines';
import { HomeHero } from './HomeHero';
import { JobsHeroHeadline } from './JobsHeroHeadline';

/**
 * 채용공고 홈의 히어로. 헤드라인에 전체 공고 수가 들어간다. 공고 수를 받지 못하면 헤드라인을 바꾸지 않고
 * 기존 문구(`HERO_CONTENT.jobs`)로 그린다 — `채용공고가 0개` 가 보이면 서비스가 빈 것처럼 읽힌다.
 */
export async function JobsHomeHero({ children }: { children?: ReactNode }) {
  const total = await fetchJobTotal();

  return (
    <HomeHero
      screen="jobs"
      headline={total === undefined ? undefined : <JobsHeroHeadline total={total} />}
    >
      {children}
    </HomeHero>
  );
}

/**
 * 공고 수를 받기 전(홈 `loading.tsx`)의 히어로. 헤드라인 두 줄은 자리만 잡고 감춘다 — 옛 문구나 `0개` 를
 * 그렸다가 바뀌면 문구가 깜빡인다.
 */
export function JobsHomeHeroPlaceholder({ children }: { children?: ReactNode }) {
  return (
    <HomeHero
      screen="jobs"
      headline={<HeroLines lines={jobsHeroLines(undefined, 0)} hiddenLines={[0, 1]} />}
    >
      {children}
    </HomeHero>
  );
}
