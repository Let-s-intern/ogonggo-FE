import type { Meta, StoryObj } from '@storybook/react';
import { StatTile } from './StatTile';

const meta: Meta<typeof StatTile> = {
  component: StatTile,
  args: { label: '미답변 문의', value: 7, unit: '건' },
};
export default meta;

type Story = StoryObj<typeof StatTile>;

export const Default: Story = {};
export const NoUnit: Story = { args: { label: '오늘 등록된 콘텐츠', value: 12, unit: undefined } };
export const Large: Story = { args: { label: '누적 조회 수', value: 1284309, unit: '회' } };
export const Zero: Story = { args: { label: '이번 주 신규 회원', value: 0, unit: '명' } };
