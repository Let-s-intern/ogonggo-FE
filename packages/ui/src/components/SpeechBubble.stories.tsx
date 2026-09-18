import type { Meta, StoryObj } from '@storybook/react';
import { CircleIconButton } from './CircleIconButton';
import { SpeechBubble } from './SpeechBubble';

const meta: Meta<typeof SpeechBubble> = {
  component: SpeechBubble,
  args: { children: '최근 로그인' },
};
export default meta;

type Story = StoryObj<typeof SpeechBubble>;

export const Default: Story = {};
/** 가리킬 버튼을 `relative` 로 감싸고 말풍선을 그 위에 띄운다. */
export const OverButton: Story = {
  render: (args) => (
    <div className="pt-12">
      <div className="relative inline-flex">
        <SpeechBubble
          {...args}
          id="recent"
          className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2"
        />
        <CircleIconButton label="카카오 로그인" aria-describedby="recent" />
      </div>
    </div>
  ),
};
