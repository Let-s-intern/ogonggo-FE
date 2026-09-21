import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toast, ToastProvider, useToast } from './Toast';

const meta: Meta<typeof Toast> = {
  component: Toast,
  args: { message: '스크랩한 공고에 담았어요' },
  argTypes: { tone: { control: 'select', options: ['default', 'error'] } },
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {};

export const Error: Story = {
  args: { tone: 'error', message: '내려간 공고라 북마크할 수 없어요' },
};

export const WithAction: Story = {
  args: { action: { label: '보기', onClick: () => {} } },
};

/** 두 줄까지 보이고 넘치면 말줄임인지 본다. */
export const LongMessage: Story = {
  args: {
    message:
      '스크랩한 공고에 담았어요. 마이페이지의 스크랩한 공고에서 채용공고·부트캠프·사이드 스터디를 탭으로 나눠 볼 수 있어요.',
    action: { label: '보기', onClick: () => {} },
  },
};

/**
 * 실제로 뜨는 자리와 동작을 보는 스토리.
 *
 * 자리(바닥에서 24px 위, 가로 가운데), 타이머(기본 3초·오류 5초), 마우스를 올린 동안 멈추는지,
 * 연달아 띄웠을 때 하나만 떠 있는지, 토스트가 없을 때도 `aria-live` 영역이 있는지를 여기서 잰다.
 */
export const InProvider: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <ToastProvider>
      <ShowToastButtons />
    </ToastProvider>
  ),
};

function ShowToastButtons() {
  const { show } = useToast();
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-wrap gap-2 p-6">
      <button
        type="button"
        className="rounded-sm border border-gray-300 px-3 py-2 text-sm"
        onClick={() => {
          setCount(count + 1);
          show({
            message: `스크랩한 공고에 담았어요 (${count + 1})`,
            action: { label: '보기', onClick: () => {} },
          });
        }}
      >
        기본 토스트
      </button>
      <button
        type="button"
        className="rounded-sm border border-gray-300 px-3 py-2 text-sm"
        onClick={() => show({ tone: 'error', message: '내려간 공고라 북마크할 수 없어요' })}
      >
        오류 토스트
      </button>
    </div>
  );
}
