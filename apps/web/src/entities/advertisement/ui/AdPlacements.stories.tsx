import type { Meta, StoryObj } from '@storybook/react';
import type { AdExposure } from '../model/types';
import { AdBanner } from './AdBanner';
import { AdLabel } from './AdLabel';
import { AdSideBanner } from './AdSideBanner';

/**
 * 광고 자리 세 형태 — 가로 배너, 사이드 배너, 광고 공고 카드용 `AD` 라벨. 이미지는 목과 같은 주소다.
 * 화면 폭을 줄이면 가로 배너가 MO 비율(750×200)로 바뀐다.
 */
const IMAGE =
  'https://letsintern-bucket.s3.ap-northeast-2.amazonaws.com/images/work24/3e73c50619eb40de51e78fd8da445c1bb850fb2b.jpg';

const ad = (overrides: Partial<AdExposure> = {}): AdExposure => ({
  itemId: 1,
  placementKey: 'MAIN_TOP_BANNER_RECRUIT',
  displayOrder: 1,
  target: 'JOB',
  postId: 6,
  postTitle: '2026년 8월 롯데컬처웍스 광고파트 경력사원 채용',
  companyName: '롯데컬처웍스',
  skillTags: [],
  bannerImageUrlPc: IMAGE,
  bannerImageUrlMo: IMAGE,
  ...overrides,
});

function AdPlacementsDemo() {
  return (
    <div className="flex max-w-page flex-col gap-8 p-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">가로 배너(이미지 소재)</h2>
        <AdBanner ads={[ad(), ad({ itemId: 2, displayOrder: 2 })]} />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">가로 배너(소재 없음)</h2>
        <AdBanner ads={[ad({ bannerImageUrlPc: undefined, bannerImageUrlMo: undefined })]} />
      </section>
      <section className="flex w-[323px] flex-col gap-2">
        <h2 className="text-sm font-bold">사이드 배너</h2>
        <AdSideBanner ad={ad({ placementKey: 'SIMILAR_TOP_RECRUIT' })} />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">AD 라벨</h2>
        <p className="flex items-center gap-2 text-sm">
          <AdLabel /> 광고 공고 카드 제목 옆
        </p>
      </section>
    </div>
  );
}

const meta: Meta<typeof AdPlacementsDemo> = {
  title: '광고/AdPlacements',
  component: AdPlacementsDemo,
  parameters: { layout: 'fullscreen' },
};

export default meta;

export const Default: StoryObj<typeof AdPlacementsDemo> = {};
