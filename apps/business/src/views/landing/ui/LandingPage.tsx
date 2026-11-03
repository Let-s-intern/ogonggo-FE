import {
  CasesSection,
  ChannelSection,
  ConsultCta,
  FaqSection,
  LandingHero,
  LandingReasons,
  PackagesSection,
  PlacementShowcase,
  ProcessSection,
} from '@/widgets/business-landing';

/**
 * 기업서비스 랜딩(PRD `기업서비스 랜딩`). 로그인 없이 본다. 섹션 순서는 시안을 따른다 — 히어로 → 이유 → 오공고 지면
 * → 렛츠커리어 채널 → 함께 집행 → 함께한 회사·사례 → 진행 방법 → 자주 묻는 질문 → 상담 신청.
 */
export function LandingPage() {
  return (
    <main>
      <LandingHero />
      <LandingReasons />
      <PlacementShowcase />
      <ChannelSection />
      <PackagesSection />
      <CasesSection />
      <ProcessSection />
      <FaqSection />
      <ConsultCta />
    </main>
  );
}
