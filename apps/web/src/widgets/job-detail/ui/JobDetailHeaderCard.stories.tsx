import type { Meta, StoryObj } from '@storybook/react';
import { JobDetailHeaderCard } from './JobDetailHeaderCard';

/**
 * 공고 상세 맨 위 헤더 카드. 실제 화면에서는 `max-w-6xl` 컨테이너에 여백 없이 꽉 차므로
 * (`widgets/job-detail/ui/JobDetailView.tsx`) 스토리도 같은 폭에 둔다.
 *
 * 마감일시는 "오늘 + 7일" 로 만든다 — 고정 날짜를 적으면 며칠 뒤 이 스토리가 "마감일 미정" 을
 * 보여주게 된다.
 */
const endAt = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
})();

const meta: Meta<typeof JobDetailHeaderCard> = {
  title: '상세 조각/JobDetailHeaderCard',
  component: JobDetailHeaderCard,
  parameters: { layout: 'fullscreen' },
  args: {
    companyName: '롯데컬처웍스',
    region: '서울',
    title: '2026년 8월 롯데컬처웍스 광고파트 경력사원 채용',
    recruitmentType: 'PERIOD',
    recruitmentEndAt: endAt,
    viewCount: 836,
  },
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

type Story = StoryObj<typeof JobDetailHeaderCard>;

export const Default: Story = {};

/** 상시채용. D-day 배지가 `상시` 로 바뀌고 마감일시 문구도 `상시채용` 이 된다. */
export const AlwaysOpen: Story = {
  args: { recruitmentType: 'ALWAYS_OPEN', recruitmentEndAt: undefined },
};

/** 지역이 없는 공고. 크롤러가 `work_location` 을 못 받은 건이 실제로 더 많다. */
export const NoRegion: Story = {
  args: { region: undefined },
};
