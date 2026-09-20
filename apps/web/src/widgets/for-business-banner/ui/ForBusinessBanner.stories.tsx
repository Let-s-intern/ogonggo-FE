import type { Meta, StoryObj } from '@storybook/react';
import { ForBusinessBanner } from './ForBusinessBanner';

/**
 * 홈 하단과 상세 하단에 같이 쓰는 CTA 배너. 두 화면 모두 `max-w-6xl` 컨테이너 안에 여백 없이
 * 꽉 채운다(`views/job-detail/ui/JobDetailPage.tsx`, `views/home/ui/HomePage.tsx`).
 *
 * 받는 props 가 없어 스토리는 하나다. 두 버튼 모두 갈 곳이 아직 없어 눌러도 아무 일도 일어나지
 * 않는다(컴포넌트 주석).
 */
const meta: Meta<typeof ForBusinessBanner> = {
  title: '상세 조각/ForBusinessBanner',
  component: ForBusinessBanner,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex justify-center bg-white px-6 py-10">
        <div className="w-full max-w-6xl">
          <Story />
        </div>
      </div>
    ),
  ],
};
export default meta;

export const Default: StoryObj<typeof ForBusinessBanner> = {};
