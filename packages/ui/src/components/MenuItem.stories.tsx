import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MenuItem } from './MenuItem';

/**
 * 목록 화면의 탭 줄과 헤더 내비게이션에 쓰는 글자 항목. 에셋(`docs/asset/v3-1/menu/`) 세 장이
 * 그대로 세 칸이다.
 *
 * 셋을 나란히 두는 이유는 굵기 때문이다. 따로 보면 `active` 가 굵어 보이는데 실제로는 색만
 * 진해진 것이고, 나란히 놓고 글자 폭을 재면 셋이 같다. 칸 아래 숫자가 그것을 보여준다.
 */
interface Variant {
  state: 'default' | 'active' | 'current';
  asset: string;
  meaning: string;
  /** 에셋에서 픽셀로 읽은 값(2026-09-21). `글자 / 밑줄` 순이다. */
  expected: string;
}

const VARIANTS: Variant[] = [
  {
    state: 'default',
    asset: 'image copy.png',
    meaning: '고르지 않은 항목',
    expected: '#6B7280 / 없음',
  },
  {
    state: 'active',
    asset: 'image copy 2.png',
    meaning: '눈길이 가야 하는 항목',
    expected: '#374151 / 없음',
  },
  {
    state: 'current',
    asset: 'image.png',
    meaning: '지금 보고 있는 화면',
    expected: '#030712 / #030712 1.5px',
  },
];

/*
 * 어떤 CSS 색이든 sRGB hex 로. 1x1 캔버스에 칠해 놓고 그 픽셀을 읽는다 — Tailwind v4 기본
 * 팔레트가 oklch 라 `getComputedStyle` 이 `oklch(...)` 를 그대로 돌려준다.
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
  color: string;
  weight: string;
  size: string;
  underline: string;
  width: string;
}

function VariantCell({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const style = getComputedStyle(ref.current);
    const transparent = style.borderBottomColor === 'rgba(0, 0, 0, 0)';
    setMeasured({
      color: toHex(style.color),
      weight: style.fontWeight,
      size: style.fontSize,
      underline: transparent
        ? '없음'
        : `${toHex(style.borderBottomColor)} ${style.borderBottomWidth}`,
      width: `${Math.round(ref.current.getBoundingClientRect().width * 100) / 100}px`,
    });
  }, []);

  return (
    <li className="w-52">
      <MenuItem ref={ref} state={variant.state}>
        Menu
      </MenuItem>
      <p className="pt-3 text-xs font-bold text-gray-900">state=&quot;{variant.state}&quot;</p>
      <p className="pt-1 text-xs text-gray-500">{variant.asset}</p>
      <p className="pt-2 font-mono text-xs text-gray-500">
        {measured ? `${measured.color} / ${measured.underline}` : '읽는 중'}
      </p>
      <p className="pt-1 font-mono text-xs text-gray-500">
        {measured ? `${measured.size} · 무게 ${measured.weight} · 폭 ${measured.width}` : ''}
      </p>
      <p className="pt-1 font-mono text-xs text-gray-400">에셋 {variant.expected}</p>
      <p className="pt-2 text-xs text-gray-500">{variant.meaning}</p>
    </li>
  );
}

const meta: Meta<typeof MenuItem> = {
  component: MenuItem,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof MenuItem>;

/** 세 상태를 한 줄에. 폭 세 개가 같은 값으로 찍히는지가 굵기 판정이다. */
export const Variants: Story = {
  render: () => (
    <div>
      <ul className="flex flex-wrap gap-4 pb-10">
        {VARIANTS.map((variant) => (
          <VariantCell key={variant.state} variant={variant} />
        ))}
      </ul>

      <h2 className="pb-1 text-sm font-bold text-gray-900">탭 줄로 늘어놓았을 때</h2>
      <p className="pb-3 text-xs text-gray-500">
        고르지 않은 항목도 같은 자리에 투명한 선을 두므로, 탭을 옮겨도 글자가 위아래로 움직이지
        않는다.
      </p>
      <nav className="flex items-center gap-5 pb-10" aria-label="교육 유형">
        <MenuItem state="current">전체</MenuItem>
        <MenuItem>부트캠프</MenuItem>
        <MenuItem>국비지원</MenuItem>
        <MenuItem>무료특강</MenuItem>
      </nav>

      <h2 className="pb-1 text-sm font-bold text-gray-900">링크는 쓰는 쪽이 감싼다</h2>
      <p className="pb-3 text-xs text-gray-500">
        이 컴포넌트는 <code className="text-gray-700">&lt;span&gt;</code> 이다.{' '}
        <code className="text-gray-700">packages/ui</code> 는{' '}
        <code className="text-gray-700">next/link</code> 를 모른다.
      </p>
      <nav className="flex items-center gap-5" aria-label="예시">
        <a href="#current" aria-current="page">
          <MenuItem state="current">채용공고</MenuItem>
        </a>
        <a href="#other">
          <MenuItem>교육·부트캠프</MenuItem>
        </a>
        <a href="#other">
          <MenuItem>사이드·스터디</MenuItem>
        </a>
      </nav>
    </div>
  ),
};
