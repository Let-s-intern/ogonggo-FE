import { LandingHero, LandingReasons } from '@/widgets/business-landing';

/**
 * 기업서비스 랜딩(PRD `기업서비스 랜딩`). 로그인 없이 본다. 섹션 순서는 시안을 따른다.
 */
export function LandingPage() {
  return (
    <main>
      <LandingHero />
      <LandingReasons />
    </main>
  );
}
