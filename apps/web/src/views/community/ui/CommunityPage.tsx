import { Community } from '@/widgets/community';
import { ConcernListBanner } from '@/widgets/concern-list';
import { ForBusinessBanner } from '@/widgets/for-business-banner';

/**
 * `/community` — 오공고 커뮤니티 소개. 맨 아래는 시안대로 PC 는 FOR BUSINESS 배너, MO 는 취준 고민 배너다.
 * 둘 다 이미 있는 위젯을 쓴다.
 */
export function CommunityPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-page-padded flex-col gap-14 px-5 py-6 md:gap-20 md:py-10 md:pb-24">
        <Community />
        <div className="hidden md:block">
          <ForBusinessBanner />
        </div>
        <div className="md:hidden">
          <ConcernListBanner />
        </div>
      </div>
    </main>
  );
}
