import type { Meta, StoryObj } from '@storybook/react';
import { SIDE_STUDY_MOCK } from '@/entities/card-mocks';
import { SideStudyCard } from './SideStudyCard';

/**
 * 사이드·스터디 목록 카드. 폭은 다른 두 카드와 같은 268px 다.
 *
 * 이 카드만 `Card` 로 감싸 테두리가 있고 `h-full` 로 같은 행의 높이를 따라간다. 혼자 있는
 * 스토리에서는 늘어날 대상이 없어 내용만큼만 높아진다 — 높이 비교는 `카드 셋/셋 나란히` 에서
 * 본다.
 */
const meta: Meta<typeof SideStudyCard> = {
  title: '카드 셋/SideStudyCard',
  component: SideStudyCard,
  args: { sideStudy: SIDE_STUDY_MOCK },
  decorators: [
    (Story) => (
      <div className="w-[268px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SideStudyCard>;

export const Default: Story = {};

/** 마감된 모집글. 배지가 회색 `마감` 으로 바뀌고 지원 수·정원이 사라진다. */
export const Closed: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, recruitmentStatus: 'CLOSED' } },
};
