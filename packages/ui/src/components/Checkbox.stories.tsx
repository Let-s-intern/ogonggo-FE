import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  render: function Render(args) {
    const [checked, setChecked] = useState(args.checked);
    return <Checkbox {...args} checked={checked} onChange={setChecked} />;
  },
  args: { checked: false, onChange: () => {}, label: '[필수] 만 14세 이상입니다.' },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { checked: true } };
/** 글자 일부만 색을 달리하려면 요소로 넘긴다. */
export const RichLabel: Story = {
  args: {
    label: (
      <>
        [필수] <span className="text-blue-500">서비스 이용약관</span> 동의
      </>
    ),
  },
};
export const Disabled: Story = { args: { disabled: true } };
