import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  component: Toggle,
  render: function Render(args) {
    const [checked, setChecked] = useState(args.checked);
    return (
      <Toggle
        {...args}
        checked={checked}
        onChange={setChecked}
        label={checked ? '노출' : '비노출'}
      />
    );
  },
  args: { checked: true, onChange: () => {} },
};
export default meta;

type Story = StoryObj<typeof Toggle>;

export const On: Story = {};
export const Off: Story = { args: { checked: false } };
export const Disabled: Story = { args: { disabled: true } };
