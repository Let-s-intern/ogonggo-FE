import type { Meta, StoryObj } from '@storybook/react';
import { ApplyCta } from './ApplyCta';

/**
 * 상세 사이드바 맨 위 CTA. 사이드바 폭은 `max-w-6xl` 에서 좌우 `px-8` 을 뺀 뒤
 * `739fr : 323fr` 로 나눈 오른쪽이다(`widgets/job-detail/ui/JobDetailView.tsx`). 스토리도 같은
 * 격자를 세운다 — 버튼이 `flex-1` 이라 폭이 달라지면 버튼 폭이 달라진다.
 *
 * 북마크 칸은 `features/bookmark`의 `BookmarkCountButton`이라 react-query·토스트·라우터가 있어야
 * 그려진다. 스토리북 프리뷰에는 셋 다 없어서 이 스토리는 지금 CTA 버튼까지만 보여준다.
 * 프로바이더를 붙이는 자리는 `packages/ui/.storybook/preview.ts` 이고, 목록 카드 스토리 셋도
 * 같은 것을 기다린다 — 스토리마다 따로 감싸지 않는다.
 */
const meta: Meta<typeof ApplyCta> = {
  title: '상세 조각/ApplyCta',
  component: ApplyCta,
  parameters: { layout: 'fullscreen' },
  args: {
    href: 'https://recruit.lotte.co.kr/apply/announcement/detail/21931077',
    label: '지원하러 가기',
    kind: 'jobs',
    id: 1,
    bookmarked: false,
    bookmarkCount: 114,
  },
  decorators: [
    (Story) => (
      <div className="flex justify-center bg-white px-6 py-10">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 px-8 lg:grid-cols-[minmax(0,739fr)_minmax(0,323fr)] lg:gap-15">
          <div />
          <aside>
            <Story />
          </aside>
        </div>
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ApplyCta>;

export const Default: Story = {};

/** 북마크한 공고. 아이콘만 파랗게 찬다. */
export const Bookmarked: Story = { args: { bookmarked: true } };

/** 부트캠프 상세가 쓰는 문구. 같은 컴포넌트를 라벨만 바꿔 쓴다. */
export const BootcampLabel: Story = { args: { label: '신청하러 가기' } };

/** 지원 링크가 없으면 버튼 자체를 그리지 않고 북마크 칸만 남는다. */
export const NoHref: Story = { args: { href: undefined } };
