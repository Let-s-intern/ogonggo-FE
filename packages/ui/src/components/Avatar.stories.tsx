import { type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

/**
 * Radix Avatar 위에 올린 것. 기본 크기는 40px(`h-10 w-10`) 이고 `className` 으로 바꾼다.
 *
 * 이미지가 없으면 `fallback` 글자가 파란 원 위에 흰 글씨로 나간다. 이미지가 있으면 그 위를
 * 덮는다 — 아래 두 칸이 그 두 경우다.
 *
 * 세 번째 칸은 `src` 는 있는데 받아오지 못한 경우다. Radix 가 `delayMs` 400ms 를 기다렸다가
 * `fallback` 으로 넘어간다. 기다리는 이유는, 이미지가 곧 도착할 때 글자가 한 번 깜빡였다가
 * 사라지는 것이 더 거슬리기 때문이다.
 *
 * 견본 이미지는 인라인 SVG 데이터 URI 다. 바깥 주소를 쓰면 네트워크가 없을 때 이 스토리가
 * "이미지 있음" 을 보여주지 못하고 조용히 fallback 만 나간다.
 */
const PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
      '<rect width="80" height="80" fill="#8BABFF"/>' +
      '<circle cx="40" cy="30" r="14" fill="#F5F9FF"/>' +
      '<path d="M12 80c0-16 13-26 28-26s28 10 28 26z" fill="#F5F9FF"/>' +
      '</svg>',
  );

const meta: Meta<typeof Avatar> = {
  component: Avatar,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Avatar>;

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div>
      <p className="pb-3 text-xs font-bold text-gray-500">{caption}</p>
      <div className="flex items-end gap-3">{children}</div>
    </div>
  );
}

/** 이미지 있음·없음을 비롯한 모든 변형을 한 화면에. */
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-4xl grid-cols-2 gap-x-8 gap-y-8">
      <Cell caption="이미지 있음">
        <Avatar src={PHOTO} alt="오공고 담당자" fallback="OG" />
      </Cell>

      <Cell caption="이미지 없음 — fallback 글자가 파란 원 위에">
        <Avatar fallback="OG" />
      </Cell>

      <Cell caption="이미지를 못 받아온 경우 — 400ms 뒤 fallback 으로">
        <Avatar src="/없는-경로.png" alt="받아오지 못한 사진" fallback="AD" />
      </Cell>

      <Cell caption="fallback 글자 수 — 한 글자·두 글자·세 글자">
        <Avatar fallback="오" />
        <Avatar fallback="OG" />
        <Avatar fallback="OGG" />
      </Cell>

      <Cell caption="크기는 className 이 정한다 — size-8 / 기본 40px / size-14">
        <Avatar fallback="OG" className="size-8 text-xs" />
        <Avatar fallback="OG" />
        <Avatar fallback="OG" className="size-14 text-lg" />
      </Cell>

      <Cell caption="여럿을 겹쳐 놓는 자리">
        <div className="flex -space-x-2">
          <Avatar src={PHOTO} alt="" fallback="OG" className="ring-2 ring-white" />
          <Avatar fallback="AD" className="ring-2 ring-white" />
          <Avatar fallback="+3" className="bg-gray-300 text-gray-700 ring-2 ring-white" />
        </div>
      </Cell>
    </div>
  ),
};
