import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  args: { children: 'Primary Button' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['md', 'sm'] },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Secondary' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Ghost' } };
