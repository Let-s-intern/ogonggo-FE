import type { Meta, StoryObj } from '@storybook/react';
import { Callout } from './Callout';

const meta: Meta<typeof Callout> = {
  component: Callout,
  args: { children: '저장했습니다.' },
  argTypes: { tone: { control: 'select', options: ['info', 'success', 'warning', 'error'] } },
};
export default meta;

type Story = StoryObj<typeof Callout>;

export const Info: Story = { args: { tone: 'info', children: '아직 연결되지 않은 화면입니다.' } };
export const Success: Story = { args: { tone: 'success' } };
export const Warning: Story = {
  args: { tone: 'warning', children: '먼저 고정된 공지가 풀립니다.' },
};
export const Error: Story = { args: { tone: 'error', children: '불러오지 못했습니다.' } };
