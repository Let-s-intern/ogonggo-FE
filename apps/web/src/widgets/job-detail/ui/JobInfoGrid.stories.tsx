import type { Meta, StoryObj } from '@storybook/react';
import { JobInfoGrid } from './JobInfoGrid';

/**
 * 경력·채용 유형·학력·지역 2x2 그리드. 실제 화면에서는 본문 열 안에 있고, 그 열의 폭은
 * `max-w-6xl` 컨테이너에서 좌우 `px-8` 을 뺀 뒤 `739fr : 323fr` 로 나눈 왼쪽이다
 * (`widgets/job-detail/ui/JobDetailView.tsx`). 스토리도 같은 격자를 세워 같은 폭을 만든다 —
 * 폭이 달라지면 2열 그리드의 칸 폭이 달라진다.
 */
const meta: Meta<typeof JobInfoGrid> = {
  title: '상세 조각/JobInfoGrid',
  component: JobInfoGrid,
  parameters: { layout: 'fullscreen' },
  args: {
    experienceType: 'EXPERIENCED',
    employmentType: 'FULL_TIME',
    educationLevel: 'BACHELOR',
    region: '서울',
  },
  decorators: [
    (Story) => (
      <div className="flex justify-center bg-white px-6 py-10">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 px-8 lg:grid-cols-[minmax(0,739fr)_minmax(0,323fr)] lg:gap-15">
          <div>
            <Story />
          </div>
          <div />
        </div>
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof JobInfoGrid>;

export const Default: Story = {};

/** 지역이 없으면 빈 칸이 아니라 "정보 없음" 이다. */
export const NoRegion: Story = {
  args: { region: undefined },
};
