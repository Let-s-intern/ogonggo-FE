import { BizApplyForm } from './BizApplyForm';
import { BizFloatingApply } from './BizFloatingApply';
import { BizHero } from './BizHero';
import { BizPageView } from './BizPageView';
import { BizSiteHeader } from './BizSiteHeader';
import { BizApplySide, BizChannels, BizFaq, BizFooter, BizIntro } from './BizSections';

/**
 * 출시 기념 무료 홍보 이벤트(`/biz`). 기존 `biz.ogonggo.co.kr`(`apps/launch-notice`)을 옮겨 왔다.
 *
 * 사이트 공통 레이아웃(`app/(site)/layout.tsx`) 밖이라 헤더·푸터가 붙지 않는다. 외부(콜드메일)에서 바로
 * 들어온 사람에게는 별도 사이트처럼 보여야 한다(PRD 1절). 로그인한 사람에게만 `BizSiteHeader` 가 헤더를 내린다.
 *
 * 순서: 히어로, 소개 방식, 홍보 채널, 신청, FAQ, 푸터. 시안 `biz-mock/index.html` 기준이다.
 */
export function BizPage() {
  return (
    <div className="min-w-0 overflow-x-clip bg-white tracking-[-0.012em] text-gray-900">
      <BizSiteHeader />
      <BizHero />
      <main>
        <BizIntro />
        <BizChannels />
        <section id="apply" className="scroll-mt-16 bg-blue-00 py-16 md:py-24">
          <div className="mx-auto grid max-w-[1120px] items-start gap-10 px-5 md:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <BizApplySide />
            <BizApplyForm />
          </div>
        </section>
        <BizFaq />
      </main>
      <BizFooter />
      <BizFloatingApply />
      <BizPageView />
    </div>
  );
}
