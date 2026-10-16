import type { Meta, StoryObj } from '@storybook/react';
import {
  JOB_CLOSED_MOCK,
  JOB_LONG_TITLE_MOCK,
  JOB_MOCK,
  JOB_RECOMMENDATION_MOCK,
  JOB_WITH_LOGO_MOCK,
} from '@/entities/card-mocks';
import { JobCard } from './JobCard';

/**
 * 채용공고 목록 카드. 실제 목록은 `max-w-page-padded px-5` 안의 `grid-cols-4 gap-x-4` 라서 카드 한 장의
 * 폭이 283px 다 — 스토리도 같은 폭에 둔다. 폭이 달라지면 제목 줄바꿈이 달라져 카드 높이도
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
      <div className="w-[283px]">
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

/** 오늘의 추천 공고. 제목 아래에 굵은 파란 제목 한 줄과 회색 설명 최대 세 줄이 든 박스가 붙는다. */
export const WithRecommendation: Story = {
  args: { recommendation: JOB_RECOMMENDATION_MOCK },
};

/** 문구가 길어도 제목은 한 줄, 설명은 세 줄에서 자른다. 박스 높이는 세 줄 기준으로 고정이다. */
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

/**
 * `featured` 는 인기 공고·오늘의 추천 공고가 쓰는 테두리 카드다. 화면 폭(md, 768px)에 따라 모양이
 * 바뀐다 — md 이상은 위 카드와 같은 세로 카드를 흰 상자에 담고, md 미만은 위에 제목, 아래 한 줄에
 * 작은 로고·직무·기업명·D-day 를 둔 가로로 넓은 카드다. 스토리북 뷰포트가 md 이상이면 앞의 것만
 * 보이므로 `FeaturedMobile` 로 시작하는 스토리는 뷰포트를 모바일로 맞춘다.
 */
export const Featured: Story = {
  args: { variant: 'featured' },
};

/** 추천 박스가 있는 `featured`. 박스는 제목 아래, 카드 안쪽 끝에 붙는다. */
export const FeaturedWithRecommendation: Story = {
  args: { variant: 'featured', recommendation: JOB_RECOMMENDATION_MOCK },
};

/** 모바일 모양. 추천 박스가 없다. 로고가 있으면 정사각 칸에 로고가 들어간다. */
export const FeaturedMobile: Story = {
  args: { variant: 'featured', job: JOB_WITH_LOGO_MOCK },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/** 모바일 모양, 추천 박스가 있다. 오늘의 추천 공고만 이 모양이다. */
export const FeaturedMobileWithRecommendation: Story = {
  args: {
    variant: 'featured',
    job: JOB_WITH_LOGO_MOCK,
    recommendation: JOB_RECOMMENDATION_MOCK,
  },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/** 제목이 세 줄을 넘으면 세 번째 줄에서 말줄임이 된다. 북마크 자리 때문에 제목 오른쪽이 비어 있다. */
export const FeaturedMobileLongTitle: Story = {
  args: { variant: 'featured', job: JOB_LONG_TITLE_MOCK },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/** 로고가 없는 공고는 칸이 비지 않고 기본 로고(오공고)가 들어간다. */
export const FeaturedMobileNoLogo: Story = {
  args: { variant: 'featured', job: JOB_MOCK },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/** 마감된 공고는 알약 자리에 회색 `마감` 이 뜬다. */
export const FeaturedMobileClosed: Story = {
  args: { variant: 'featured', job: JOB_CLOSED_MOCK },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};
