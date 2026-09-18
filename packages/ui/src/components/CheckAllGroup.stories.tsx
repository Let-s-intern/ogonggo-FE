import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CheckAllGroup } from './CheckAllGroup';

type Term = 'age' | 'terms' | 'privacy' | 'marketing';

const ITEMS = [
  { value: 'age', label: '[필수] 만 14세 이상입니다.' },
  {
    value: 'terms',
    label: (
      <>
        [필수] <span className="text-blue-500">서비스 이용약관</span> 동의
      </>
    ),
    trailing: (
      <button type="button" className="text-sm text-gray-400">
        보기
      </button>
    ),
  },
  {
    value: 'privacy',
    label: (
      <>
        [필수] <span className="text-blue-500">개인정보 수집 및 이용</span> 동의
      </>
    ),
    trailing: (
      <button type="button" className="text-sm text-gray-400">
        보기
      </button>
    ),
  },
  { value: 'marketing', label: '[선택] 채용 소식을 가장 먼저 받아볼래요!' },
] as const;

const meta: Meta<typeof CheckAllGroup<Term>> = {
  component: CheckAllGroup,
  render: function Render(args) {
    const [checked, setChecked] = useState<Term[]>([...args.checked]);
    return (
      <div className="w-112">
        <CheckAllGroup {...args} checked={checked} onCheckedChange={setChecked} />
      </div>
    );
  },
  args: { allLabel: '전체 동의', items: ITEMS, checked: [], onCheckedChange: () => {} },
};
export default meta;

type Story = StoryObj<typeof CheckAllGroup<Term>>;

export const None: Story = {};
export const Partial: Story = { args: { checked: ['age', 'terms'] } };
/** 항목이 모두 체크되면 전체 동의도 체크로 보인다. */
export const All: Story = { args: { checked: ['age', 'terms', 'privacy', 'marketing'] } };
