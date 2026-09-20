import { type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';
import { Textarea } from './Textarea';

/**
 * 여러 줄 입력. `Input` 과 달리 높이를 스스로 정하지 않는다 — `rows` 나 `h-*` 를 부르는 쪽이
 * 준다. 자동으로 늘어나지도 않는다.
 *
 * 글자 크기도 `Input`(`text-base`, 16px) 과 다른 `text-sm`(14px) 이다. 둘을 한 폼에 세로로
 * 놓으면 이 차이가 보인다.
 *
 * 오류 상태는 `Textarea` 가 스스로 그리지 않는다. `Input` 과 같이 감싸는 `Field` 의 `error` 가
 * 빨간 문구를 그리고 테두리는 `gray-300` 그대로다.
 */
const meta: Meta<typeof Textarea> = {
  component: Textarea,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Textarea>;

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div>
      <p className="pb-2 text-xs font-bold text-gray-500">{caption}</p>
      {children}
    </div>
  );
}

const SAMPLE =
  '프런트엔드 신입 개발자를 찾습니다.\n\n· React, TypeScript 경험\n· 학력 무관, 포트폴리오 필수';

/** 모든 변형을 한 화면에. */
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-4xl grid-cols-2 gap-x-8 gap-y-6">
      <Cell caption="기본 — placeholder 만, rows 4">
        <Textarea rows={4} placeholder="공고 본문을 붙여 넣으세요" />
      </Cell>

      <Cell caption="값 있음">
        <Textarea rows={4} defaultValue={SAMPLE} />
      </Cell>

      <Cell caption="비활성 — 배경 gray-50, 글자 gray-400">
        <Textarea rows={4} defaultValue={SAMPLE} disabled />
      </Cell>

      <Cell caption="오류 — Field 가 문구를 그린다. 테두리는 바뀌지 않는다">
        <Field
          label="공고 본문"
          htmlFor="textarea-error"
          error="본문은 20자 이상이어야 합니다."
          className="pb-0"
        >
          <Textarea id="textarea-error" rows={3} defaultValue="채용합니다" />
        </Field>
      </Cell>

      <Cell caption="높이를 부르는 쪽이 준다 — rows 2">
        <Textarea rows={2} placeholder="짧은 메모" />
      </Cell>

      <Cell caption="초점 — 테두리 blue-500, 링 blue-100">
        <Textarea rows={2} defaultValue="초점이 들어온 상태" autoFocus />
      </Cell>
    </div>
  ),
};
