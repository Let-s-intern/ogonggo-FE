import type { Meta, StoryObj } from '@storybook/react';
import { BOOTCAMP_MOCK } from '@/entities/card-mocks';
import { BootcampCard } from './BootcampCard';

/**
 * 부트캠프 목록 카드. 폭은 `JobCard` 스토리와 같은 268px 다 — 두 목록이 같은 4열 그리드를 쓴다.
 *
 * 목데이터의 `representativeImageUrl` 은 빈 문자열이라 `Thumbnail` 의 폴백(흰 배경 가운데
 * 오공고 로고) 으로 떨어진다. 실제 목록도 이미지가 없으면 같은 그림이다.
 */
const meta: Meta<typeof BootcampCard> = {
  title: '카드 셋/BootcampCard',
  component: BootcampCard,
  args: { bootcamp: BOOTCAMP_MOCK },
  decorators: [
    (Story) => (
      <div className="w-[268px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof BootcampCard>;

export const Default: Story = {};

/** 마감된 과정. 배지가 회색 `마감` 으로 바뀐다. */
export const Closed: Story = {
  args: { bootcamp: { ...BOOTCAMP_MOCK, status: 'CLOSED' } },
};
