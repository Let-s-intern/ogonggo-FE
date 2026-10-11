import type { Meta, StoryObj } from '@storybook/react';
import { JOB_MOCK, JOB_RECOMMENDATION_MOCK } from '@/entities/card-mocks';
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

/** 상시채용은 D-day 자리에 `상시모집` 배지가 뜬다. */
export const AlwaysOpen: Story = {
  args: { job: { ...JOB_MOCK, recruitmentType: 'ALWAYS_OPEN', recruitmentEndAt: undefined } },
};

/** 오늘의 추천 공고. 제목 아래에 굵은 파란 제목 한 줄과 회색 설명 한 줄이 든 박스가 붙는다. */
export const WithRecommendation: Story = {
  args: { recommendation: JOB_RECOMMENDATION_MOCK },
};

/** 문구가 길어도 박스는 각각 한 줄에서 자른다. 카드 높이가 늘지 않는다. */
export const LongRecommendation: Story = {
  args: {
    recommendation: {
      title: '경력 없이 시작하고 싶다면 이 공고부터 눌러 보세요 정말로 추천합니다',
      description:
        '실무 중심 프로젝트와 멘토링으로 빠르게 성장할 수 있는 환경입니다 지금 바로 확인해 보세요',
    },
  },
};

/** 제목·설명이 모두 비면 박스 없이 일반 카드다. */
export const EmptyRecommendation: Story = {
  args: { recommendation: { title: '', description: '' } },
};
