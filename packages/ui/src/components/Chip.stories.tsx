import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from './Chip';

/**
 * 목록 필터 줄의 선택 칩. 에셋(`docs/asset/v3-1/chip/`) 네 장이 그대로 네 칸이다.
 *
 * 넷을 반드시 한 줄에 나란히 둔다. 회색과 비활성화는 따로 보면 거의 같아 보이는데, 나란히
 * 놓으면 바탕이 하나는 연회색이고 하나는 흰색이라는 것이 바로 보인다 — 그 차이가 "고를 수
 * 있는 것" 과 "고를 수 없는 것" 을 가른다.
 *
 * 칸 아래 숫자는 브라우저가 실제로 그린 값이다. 에셋과 대조할 때 눈이 아니라 이 숫자를 본다.
 */
interface Variant {
  name: string;
  asset: string;
  tone: 'blue' | 'gray' | 'ghost';
  disabled?: boolean;
  /** 에셋에서 픽셀로 읽은 값(2026-09-21). `배경 / 글자 / 테두리` 순이다. */
  expected: string;
}

const VARIANTS: Variant[] = [
  { name: 'blue', asset: '블루.png', tone: 'blue', expected: '#4A76FF / #F5F9FF / 없음' },
  { name: 'gray', asset: '회색.png', tone: 'gray', expected: '#F3F4F6 / #6B7280 / #E5E7EB' },
  { name: 'ghost', asset: '투명.png', tone: 'ghost', expected: '없음 / #111827 / 없음' },
  {
    name: 'disabled',
    asset: '비활성화.png',
    tone: 'gray',
    disabled: true,
    expected: '#FFFFFF / #9CA3AF / #E5E7EB',
  },
];

/*
 * 어떤 CSS 색이든 sRGB hex 로. 1x1 캔버스에 칠해 놓고 그 픽셀을 읽는다.
 *
 * `getComputedStyle` 이 늘 `rgb(...)` 를 주지 않는 것이 이 함수가 있는 이유다. Tailwind v4 기본
 * 팔레트는 oklch 로 적혀 있어 크롬이 `oklch(...)` 를 그대로 돌려준다. `Badge.stories.tsx` 가
 * 같은 이유로 같은 함수를 갖고 있다.
 */
function toHex(color: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d');
  if (!context) {
    return color;
  }
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const pixel = context.getImageData(0, 0, 1, 1).data;
  return (
    '#' +
    [pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

interface Measured {
  background: string;
  color: string;
  border: string;
  height: string;
  radius: string;
}

function VariantCell({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const style = getComputedStyle(ref.current);
    const transparent = style.backgroundColor === 'rgba(0, 0, 0, 0)';
    const borderless =
      style.borderTopColor === 'rgba(0, 0, 0, 0)' || style.borderTopWidth === '0px';
    setMeasured({
      background: transparent ? '없음' : toHex(style.backgroundColor),
      color: toHex(style.color),
      border: borderless ? '없음' : toHex(style.borderTopColor),
      height: style.height,
      radius: style.borderTopLeftRadius,
    });
  }, []);

  return (
    <li className="w-56">
      <Chip ref={ref} tone={variant.tone} disabled={variant.disabled}>
        Chip
      </Chip>
      <p className="pt-3 text-xs font-bold text-gray-900">{variant.name}</p>
      <p className="pt-1 text-xs text-gray-500">{variant.asset}</p>
      <p className="pt-2 font-mono text-xs text-gray-500">
        {measured ? `${measured.background} / ${measured.color} / ${measured.border}` : '읽는 중'}
      </p>
      <p className="pt-1 font-mono text-xs text-gray-500">
        {measured ? `높이 ${measured.height} · 모서리 ${measured.radius}` : ''}
      </p>
      <p className="pt-1 font-mono text-xs text-gray-400">에셋 {variant.expected}</p>
    </li>
  );
}

const meta: Meta<typeof Chip> = {
  component: Chip,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Chip>;

/** 네 상태를 한 줄에. 이 스토리의 존재 이유가 이 한 줄이다. */
export const Variants: Story = {
  render: () => (
    <div>
      <ul className="flex flex-wrap gap-4 pb-10">
        {VARIANTS.map((variant) => (
          <VariantCell key={variant.name} variant={variant} />
        ))}
      </ul>

      <h2 className="pb-3 text-sm font-bold text-gray-900">실제 문구를 넣었을 때</h2>
      <div className="flex flex-wrap items-center gap-2 pb-10">
        <Chip tone="blue">프런트엔드</Chip>
        <Chip tone="gray">백엔드</Chip>
        <Chip tone="ghost">전체</Chip>
        <Chip tone="gray" disabled>
          마감된 공고
        </Chip>
      </div>

      <h2 className="pb-3 text-sm font-bold text-gray-900">tone 을 넘기지 않으면 gray 다</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Chip>기본값</Chip>
        <Chip tone="gray">gray 를 명시</Chip>
      </div>
    </div>
  ),
};
