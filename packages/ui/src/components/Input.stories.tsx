import { type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';
import { Input } from './Input';

/**
 * 한 줄 입력. 네이티브 `input` 에 테두리와 높이만 얹은 것이라 `type` 이든 `maxLength` 든 그대로
 * 통한다.
 *
 * 오류 상태는 `Input` 이 스스로 그리지 않는다. 빨간 문구는 감싸는 `Field` 의 `error` 가 그리고
 * `Input` 의 테두리는 그대로 `gray-300` 이다. 아래 네 번째 칸이 그 모습이고, 실제 폼이 오류를
 * 보여주는 방식도 이것이다.
 *
 * 초점 상태는 마우스 없이 볼 수 없어 마지막 칸을 `autoFocus` 로 두었다. 테두리가 `blue-500` 이
 * 되고 `blue-100` 링이 붙는다.
 */
const meta: Meta<typeof Input> = {
  component: Input,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Input>;

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div>
      <p className="pb-2 text-xs font-bold text-gray-500">{caption}</p>
      {children}
    </div>
  );
}

/** 모든 변형을 한 화면에. 테두리 색과 글자 색을 나란히 놓고 봐야 판단이 선다. */
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-4xl grid-cols-2 gap-x-8 gap-y-6">
      <Cell caption="기본 — placeholder 만">
        <Input placeholder="검색어를 입력하세요" />
      </Cell>

      <Cell caption="값 있음">
        <Input defaultValue="프런트엔드 신입" />
      </Cell>

      <Cell caption="비활성 — 배경 gray-50, 글자 gray-400">
        <Input defaultValue="프런트엔드 신입" disabled />
      </Cell>

      <Cell caption="오류 — Field 가 문구를 그린다. 테두리는 바뀌지 않는다">
        <Field
          label="담당자 이메일"
          htmlFor="input-error"
          error="이미 등록된 이메일입니다."
          className="pb-0"
        >
          <Input id="input-error" defaultValue="hr@ogonggo.com" />
        </Field>
      </Cell>

      <Cell caption="비활성 + placeholder">
        <Input placeholder="심사 중에는 입력할 수 없습니다" disabled />
      </Cell>

      <Cell caption="초점 — 테두리 blue-500, 링 blue-100">
        <Input defaultValue="초점이 들어온 상태" autoFocus />
      </Cell>
    </div>
  ),
};
