import type { Meta, StoryObj } from '@storybook/react';
import { ActionAlert } from './ActionAlert';

const meta: Meta<typeof ActionAlert> = {
  component: ActionAlert,
  args: { message: '허용되었습니다.', onDismiss: () => {}, duration: 1_000_000 },
  argTypes: { tone: { control: 'select', options: ['success', 'danger', 'info'] } },
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ActionAlert>;

export const Success: Story = {};
export const Danger: Story = { args: { tone: 'danger', message: '반려했습니다.' } };
export const Info: Story = { args: { tone: 'info', message: '저장하지 않은 판정이 있습니다.' } };
export const WithDetail: Story = {
  args: { message: '허용되었습니다.', detail: '2026년 8월 한국후지필름 VMD 경력사원 채용' },
};
