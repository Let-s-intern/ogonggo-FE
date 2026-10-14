import type { Meta, StoryObj } from '@storybook/react';
import { SIDE_STUDY_MOCK } from '@/entities/card-mocks';
import { SideStudyCard } from './SideStudyCard';

/**
 * 사이드·스터디 목록 카드. 폭은 다른 두 카드와 같은 283px 다.
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
 * 첫 첨부 사진이 있는 글. 프로필 줄 아래 8:5 상자를 사진이 채운다. 사진이 없는 `Default` 는 같은
 * 상자에 오공고 로고가 뜬다. 스토리북은 `/icon-192.png` 하나만 붙여 그것을 사진 자리에 쓴다.
 */
export const WithThumbnail: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, thumbnailUrl: '/icon-192.png' } },
};

/** 사진 주소가 깨진 글. `Thumbnail` 이 오공고 로고로 떨어져 사진이 없는 글과 같아진다. */
export const BrokenThumbnail: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, thumbnailUrl: '/no-such-image.png' } },
};

/** 마감된 모집글. 배지가 회색 `마감` 으로 바뀌고 지원 수·정원이 사라진다. */
export const Closed: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, recruitmentStatus: 'CLOSED' } },
};

/** 모집 직무가 많은 글. 배지는 그대로 두고 직무 줄만 말줄임으로 자른다. */
export const ManyPositions: Story = {
  args: {
    sideStudy: {
      ...SIDE_STUDY_MOCK,
      positions: ['BACKEND', 'FRONTEND', 'DESIGN', 'PM', 'MARKETING', 'ETC'],
    },
  },
};

/** 모집 직무가 없는 글. 배지만 남는다. */
export const NoPositions: Story = {
  args: { sideStudy: { ...SIDE_STUDY_MOCK, positions: [] } },
};
