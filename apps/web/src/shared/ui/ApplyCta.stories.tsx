import type { Meta, StoryObj } from '@storybook/react';
import { ApplyCta } from './ApplyCta';

/**
 * 상세 사이드바 맨 위 CTA. 사이드바 폭은 `max-w-6xl` 에서 좌우 `px-8` 을 뺀 뒤
 * `739fr : 323fr` 로 나눈 오른쪽이다(`widgets/job-detail/ui/JobDetailView.tsx`). 스토리도 같은
 * 격자를 세운다 — 버튼이 `flex-1` 이라 폭이 달라지면 버튼 폭이 달라진다.
 *
 * 북마크 칸은 `features/bookmark`의 `BookmarkCountButton`이라 react-query·토스트·라우터가 있어야
 * 그려진다. 셋은 `packages/ui/.storybook/` 이 전역으로 댄다 — `preview.tsx` 가 앞의 둘을
 * 데코레이터로, `main.ts` 의 alias 가 `next/navigation` 을 스텁으로 준다. 목록 카드 스토리 셋도
 * 같은 것을 쓴다.
 *
 * 스토리북에는 로그인 토큰이 없어 버튼은 비로그인 상태로 그려진다. 누르면 요청 대신 로그인
 * 화면으로 가려 하고, 스텁 라우터가 그 이동을 콘솔에 남긴다.
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
