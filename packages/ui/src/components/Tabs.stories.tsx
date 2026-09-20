import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';

type Audience = 'user' | 'company';

const ITEMS = [
  { value: 'user', label: '일반 회원' },
  { value: 'company', label: '기업 회원' },
] as const;

const meta: Meta<typeof Tabs<Audience>> = {
  component: Tabs,
  render: function Render(args) {
    const [value, setValue] = useState<Audience>(args.value);
    return (
      <div className="w-104">
        <Tabs {...args} value={value} onValueChange={setValue} />
      </div>
    );
  },
  args: { items: ITEMS, value: 'user', onValueChange: () => {}, 'aria-label': '회원 구분' },
};
export default meta;

type Story = StoryObj<typeof Tabs<Audience>>;

export const First: Story = {};
export const Second: Story = { args: { value: 'company' } };
/** 아이콘은 `currentColor` 로 그려 탭 글자색을 따른다. */
export const WithIcon: Story = {
  args: {
    items: ITEMS.map((item) => ({
      ...item,
      icon: <span aria-hidden="true" className="icon-[lucide--circle] block size-5" />,
    })),
  },
};
