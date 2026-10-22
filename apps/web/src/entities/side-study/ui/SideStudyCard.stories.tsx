import type { Meta, StoryObj } from '@storybook/react';
import { SIDE_STUDY_MOCK } from '@/entities/card-mocks';
import { SideStudyCard } from './SideStudyCard';

/**
 * 사이드·스터디 목록 카드. 폭은 다른 두 카드와 같은 283px 다.
 *
 * md 이상은 테두리 카드이고 `h-full` 로 같은 행의 높이를 따라간다. md 아래는 테두리 없는 한 줄
 * 목록 항목이라 모양이 다르다 — 툴바의 뷰포트를 바꿔 본다.
 */
const meta: Meta<typeof SideStudyCard> = {
  title: '카드 셋/SideStudyCard',
  component: SideStudyCard,
  args: { sideStudy: SIDE_STUDY_MOCK },
  decorators: [
    (Story) => (
      <div className="w-[283px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SideStudyCard>;

export const Default: Story = {};

/**
 * 첫 첨부 사진이 있는 글. 맨 위 8:5 상자(모바일은 오른쪽 작은 상자)를 사진이 채운다. 사진이 없는
 * `Default` 는 같은 상자가 Gray 100 으로 빈다. 스토리북은 `/icon-192.png` 하나만 붙여 그것을 사진 자리에 쓴다.
 */
export const WithThumbnail: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, thumbnailUrl: '/icon-192.png' } },
};

/** 사진 주소가 깨진 글. 빈 Gray 100 상자로 떨어져 사진이 없는 글과 같아진다. */
export const BrokenThumbnail: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, thumbnailUrl: '/no-such-image.png' } },
};

/** 마감된 모집글. D-day 배지가 회색 `마감` 으로 바뀐다. */
export const Closed: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, recruitmentStatus: 'CLOSED' } },
};

/** 모집 직무가 많은 글. 직무 줄을 한 줄에서 말줄임으로 자른다. */
export const ManyPositions: Story = {
  args: {
    sideStudy: {
      ...SIDE_STUDY_MOCK,
      positions: ['BACKEND', 'FRONTEND', 'DESIGN', 'PM', 'MARKETING', 'ETC'],
    },
  },
};

/** 모집 직무가 없는 글. 직무 줄이 빠진다. */
export const NoPositions: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, positions: [] } },
};
