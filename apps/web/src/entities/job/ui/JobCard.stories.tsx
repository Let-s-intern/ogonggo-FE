import type { Meta, StoryObj } from '@storybook/react';
import { JOB_MOCK } from '@/entities/card-mocks';
import { JobCard } from './JobCard';

/**
 * 채용공고 목록 카드. 실제 목록은 `max-w-6xl px-4` 안의 `grid-cols-4 gap-x-4` 라서 카드 한 장의
 * 폭이 268px 다 — 스토리도 같은 폭에 둔다. 폭이 달라지면 제목 줄바꿈이 달라져 카드 높이도
 * 달라지고, 세 카드를 비교하는 일 자체가 무의미해진다.
 *
 * 나란히 놓고 본 실측은 `카드 셋/셋 나란히` 에 있다.
 */
const meta: Meta<typeof JobCard> = {
  title: '카드 셋/JobCard',
  component: JobCard,
  args: { job: JOB_MOCK },
  decorators: [
    (Story) => (
      <div className="w-[268px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof JobCard>;

export const Default: Story = {};

/** 상시채용은 D-day 배지가 아예 없다 — 메타 줄 오른쪽이 빈다. */
export const AlwaysOpen: Story = {
  args: { job: { ...JOB_MOCK, recruitmentType: 'ALWAYS_OPEN', recruitmentEndAt: undefined } },
};
