import { type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';
import { Input } from './Input';

/**
 * `Field` 는 라벨과 보조 문구만 그리고, 입력은 `children` 으로 받는다. 그래서 "비활성" 은
 * `Field` 의 상태가 아니라 안에 넣은 입력의 상태다 — 아래 마지막 칸이 그 경우다.
 *
 * `hint` 와 `error` 는 둘 다 들어와도 `error` 만 나간다. 고칠 것이 있을 때 안내 문구가 옆에
 * 남아 있으면 무엇을 읽어야 하는지 흐려지기 때문이다. 아래 네 번째 칸이 그 동작을 보여준다.
 */
const meta: Meta<typeof Field> = {
  component: Field,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Field>;

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div>
      <p className="pb-2 text-xs font-bold text-gray-500">{caption}</p>
      {children}
    </div>
  );
}

/** 모든 변형을 한 화면에. 하나씩 쪼개 두면 문구 색과 간격을 견줄 수가 없다. */
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-4xl grid-cols-2 gap-x-8">
      <Cell caption="기본">
        <Field label="회사명" htmlFor="field-default">
          <Input id="field-default" placeholder="오공고 주식회사" />
        </Field>
      </Cell>

      <Cell caption="값 있음">
        <Field label="회사명" htmlFor="field-filled">
          <Input id="field-filled" defaultValue="오공고 주식회사" />
        </Field>
      </Cell>

      <Cell caption="보조 문구(hint)">
        <Field label="채용 마감일" htmlFor="field-hint" hint="상시 채용이면 비워 둡니다.">
          <Input id="field-hint" placeholder="2026-10-31" />
        </Field>
      </Cell>

      <Cell caption="오류 — hint 를 같이 넘겨도 error 만 나간다">
        <Field
          label="채용 마감일"
          htmlFor="field-error"
          hint="상시 채용이면 비워 둡니다."
          error="날짜 형식이 올바르지 않습니다."
        >
          <Input id="field-error" defaultValue="2026/10/31" />
        </Field>
      </Cell>

      <Cell caption="필수 — 라벨 뒤에 빨간 별">
        <Field label="담당자 이메일" htmlFor="field-required" required>
          <Input id="field-required" type="email" placeholder="hr@ogonggo.com" />
        </Field>
      </Cell>

      <Cell caption="비활성 — Field 가 아니라 안에 넣은 입력의 상태다">
        <Field label="사업자등록번호" htmlFor="field-disabled" hint="심사 중에는 고칠 수 없습니다.">
          <Input id="field-disabled" defaultValue="123-45-67890" disabled />
        </Field>
      </Cell>
    </div>
  ),
};
