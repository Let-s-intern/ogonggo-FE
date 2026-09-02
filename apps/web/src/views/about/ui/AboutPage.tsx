import { AboutHero } from '@/widgets/about-hero';
import { AboutMarquee } from '@/widgets/about-marquee';
import { AboutOutro } from '@/widgets/about-outro';
import { AboutPillars } from '@/widgets/about-pillars';
import { AboutStats } from '@/widgets/about-stats';

/**
 * 서비스 소개 페이지(이슈 #18). 런칭 전에는 티저로, 런칭 후에는 소개 페이지로 쓴다.
 *
 * 헤더·푸터가 붙지 않는다 — `app/site-chrome.tsx`가 이 경로를 제외한다. 기존 웹과 오가는
 * 링크를 두지 않기로 했는데 헤더 자체가 채용공고·부트캠프·사이드스터디로 가는 링크 묶음이라
 * 그대로 두면 조건이 깨진다.
 *
 * 이 컴포넌트는 서버 컴포넌트로 남는다. 움직이는 부분만 각 위젯이 클라이언트 컴포넌트다.
 */
export function AboutPage() {
  return (
    <main className="bg-white">
      <AboutHero />
      <AboutMarquee />
      <AboutPillars />
      <AboutStats />
      <AboutOutro />
    </main>
  );
}
