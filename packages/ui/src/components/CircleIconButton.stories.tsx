import type { Meta, StoryObj } from '@storybook/react';
import { CircleIconButton } from './CircleIconButton';

const meta: Meta<typeof CircleIconButton> = {
  component: CircleIconButton,
  args: {
    label: '검색',
    children: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-5 text-gray-700">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M17 17L13.4 13.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
};
export default meta;

type Story = StoryObj<typeof CircleIconButton>;

export const Default: Story = {};
/** 브랜드 색은 토큰이 아니라 `className` 으로 준다. */
export const BrandColor: Story = {
  args: {
    label: '카카오 로그인',
    className: 'bg-[#FEE500]',
    children: (
      <svg viewBox="0 0 18 18" aria-hidden="true" className="size-5">
        <path
          d="M9 .6C4.03.6 0 3.71 0 7.55c0 2.39 1.56 4.5 3.93 5.75l-1 3.64c-.09.33.28.58.56.4l4.38-2.9c.37.04.75.06 1.13.06 4.97 0 9-3.11 9-6.95S13.97.6 9 .6Z"
          fill="black"
        />
      </svg>
    ),
  },
};
export const Disabled: Story = { args: { disabled: true } };
