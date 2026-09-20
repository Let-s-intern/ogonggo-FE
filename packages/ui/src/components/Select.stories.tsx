import { type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';
import { Select } from './Select';

/**
 * 네이티브 `select`. 펼쳐진 목록은 브라우저가 그리므로 스토리북 안에서는 닫힌 모습만 보인다 —
 * 그게 이 컴포넌트를 직접 만들지 않은 이유이기도 하다.
 *
 * 높이가 `h-9`(36px) 라 `Input`·`Textarea`(44px) 보다 낮다. 같은 줄에 나란히 놓으면 바닥이
 * 어긋난다. 목록 화면의 필터 줄에 쓰는 것이라 그렇게 되어 있다.
 *
 * 폭도 `w-full` 이 아니다. 고른 글자 길이를 브라우저가 따라가므로 칸마다 폭이 달라진다.
 */
const OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'new', label: '신입' },
  { value: 'junior', label: '경력 1~3년' },
  { value: 'senior', label: '경력 4년 이상' },
];

const meta: Meta<typeof Select> = {
  component: Select,
  args: { options: OPTIONS },
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Select>;

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div>
      <p className="pb-2 text-xs font-bold text-gray-500">{caption}</p>
      {children}
    </div>
  );
}

/** 모든 변형을 한 화면에. */
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-4xl grid-cols-2 gap-x-8 gap-y-6">
      <Cell caption="기본 — 첫 항목이 선택된 상태">
        <Select options={OPTIONS} />
      </Cell>

      <Cell caption="값 있음 — 세 번째 항목">
        <Select options={OPTIONS} defaultValue="junior" />
      </Cell>

      <Cell caption="비활성 — 배경 gray-50, 글자 gray-400">
        <Select options={OPTIONS} defaultValue="junior" disabled />
      </Cell>

      <Cell caption="오류 — Field 가 문구를 그린다. 테두리는 바뀌지 않는다">
        <Field label="경력" htmlFor="select-error" error="경력을 골라 주세요." className="pb-0">
          <Select id="select-error" options={OPTIONS} />
        </Field>
      </Cell>

      <Cell caption="폭은 고른 글자를 따라간다 — 항목이 길면 칸도 넓어진다">
        <Select
          options={[
            { value: 'a', label: '짧게' },
            { value: 'b', label: '아주 길어진 항목 이름이 들어간 경우' },
          ]}
          defaultValue="b"
        />
      </Cell>

      <Cell caption="폭을 고정하고 싶으면 className 으로 준다 — w-full">
        <Select options={OPTIONS} className="w-full" />
      </Cell>
    </div>
  ),
};
