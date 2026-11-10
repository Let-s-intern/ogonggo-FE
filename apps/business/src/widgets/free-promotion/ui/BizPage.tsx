import { BizApplyForm } from './BizApplyForm';
import { BizFloatingApply } from './BizFloatingApply';
import { BizHero } from './BizHero';
import { RevealOnScroll } from '@/widgets/landing/RevealOnScroll';
import { BizApplySide, BizChannels, BizFaq, BizIntro } from './BizSections';
import { CONTAINER } from './styles';

/**
 * 출시 기념 무료 홍보 이벤트(`/free-promotion`). 기준은 `apps/web/src/views/biz/ui/BizPage.tsx` 다.
 *
 * web 은 사이트 레이아웃 밖에 두고 로그인한 사람에게만 오공고 헤더를 내리며 자기 푸터를 단다. 이 앱에서는 앱
 * 레이아웃(`app/layout.tsx`)의 비즈니스 헤더·푸터 안에 둔다. 이미 기업용 사이트라 오공고 서비스 헤더와 섞일
 * 일이 없고, 헤더의 로그인·공고등록으로 이어져야 한다. 그래서 `BizSiteHeader`·`BizFooter` 는 옮기지 않았다.
 *
 * 순서: 히어로, 소개 방식, 홍보 채널, 신청, FAQ. 시안 `biz-mock/index.html` 기준이다.
 */
export function BizPage() {
  return (
    <div className="min-w-0 overflow-x-clip bg-white break-keep text-gray-900 [&_h1]:text-balance [&_h2]:text-balance [&_h3]:text-balance [&_p]:text-pretty">
      <BizHero />
      <BizIntro />
      <BizChannels />
      <section id="apply" className="scroll-mt-16 bg-blue-00 py-16 md:py-24">
        <div
          className={`${CONTAINER} grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14`}
        >
          <BizApplySide />
          <BizApplyForm />
        </div>
      </section>
      <BizFaq />
      <BizFloatingApply />
      <RevealOnScroll />
    </div>
  );
}
