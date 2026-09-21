import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterButton } from './FilterButton';

/**
 * 목록 필터 줄의 드롭다운 트리거. 에셋(`docs/asset/v3-1/filter/`) 세 장이 그대로 세 칸이다.
 *
 * `selected`(연파랑 배경) 를 보려고 만든 스토리다. 지금 앱에는 이 상태를 그리는 코드가 없다 —
 * `FilterDropdown` 은 값을 고르면 테두리만 파래지고 `SortToggle` 은 언제나 회색이다.
 *
 * 세 칸을 전부 진짜 `<details>` 안에 넣었다. 이 컴포넌트는 `<summary>` 를 돌려주므로 껍데기
 * 밖에서 혼자 그리면 실제로 쓰일 때와 다른 것을 보게 된다.
 */
interface Variant {
  state: 'default' | 'open' | 'selected';
  asset: string;
  meaning: string;
  /** 에셋에서 픽셀로 읽은 값(2026-09-21). `테두리 / 배경 / 글자` 순이다. */
  expected: string;
}

const VARIANTS: Variant[] = [
  {
    state: 'default',
    asset: 'image copy.png',
    meaning: '아직 아무것도 고르지 않았다',
    expected: '#E5E7EB / 없음 / #9CA3AF',
  },
  {
    state: 'open',
    asset: 'image copy 2.png',
    meaning: '목록이 펼쳐져 있다',
    expected: '#4A76FF / 없음 / #4A76FF',
  },
  {
    state: 'selected',
    asset: 'image.png',
    meaning: '값을 골랐다',
    expected: '없음 / #EBF1FF / #4A76FF',
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
  border: string;
  background: string;
  color: string;
  height: string;
  weight: string;
}

function VariantCell({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLElement>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const style = getComputedStyle(ref.current);
    const none = 'rgba(0, 0, 0, 0)';
    setMeasured({
      border: style.borderTopColor === none ? '없음' : toHex(style.borderTopColor),
      background: style.backgroundColor === none ? '없음' : toHex(style.backgroundColor),
      color: toHex(style.color),
      height: style.height,
      weight: style.fontWeight,
    });
  }, []);

  return (
    <li className="w-60">
      {/* `open` 칸만 진짜로 펼쳐 둔다. 꺾쇠가 뒤집혔는지 여기서 보인다. */}
      <details className="group relative w-fit" open={variant.state === 'open'}>
        <FilterButton ref={ref} state={variant.state}>
          Filter
        </FilterButton>
        {/* 목록을 `absolute` 로 띄우는 것은 두 호출부가 이미 하는 방식이다. 흐름에 두면 펼친
            칸만 드롭다운 폭까지 넓어져 세 칸을 나란히 비교할 수 없다. */}
        <ul className="absolute left-0 z-10 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-md">
          <li className="px-3 py-1.5 text-sm text-gray-600">목록은 호출부의 것</li>
        </ul>
      </details>
      <p className="pt-3 text-xs font-bold text-gray-900">state=&quot;{variant.state}&quot;</p>
      <p className="pt-1 text-xs text-gray-500">{variant.asset}</p>
      <p className="pt-2 font-mono text-xs text-gray-500">
        {measured ? `${measured.border} / ${measured.background} / ${measured.color}` : '읽는 중'}
      </p>
      <p className="pt-1 font-mono text-xs text-gray-500">
        {measured ? `높이 ${measured.height} · 무게 ${measured.weight}` : ''}
      </p>
      <p className="pt-1 font-mono text-xs text-gray-400">에셋 {variant.expected}</p>
      <p className="pt-2 text-xs text-gray-500">{variant.meaning}</p>
    </li>
  );
}

const meta: Meta<typeof FilterButton> = {
  component: FilterButton,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof FilterButton>;

/** 세 상태를 한 줄에. `selected` 가 실제로 연파랑 배경으로 나오는지가 이 스토리의 요점이다. */
export const Variants: Story = {
  render: () => (
    <div>
      <ul className="flex flex-wrap gap-4 pb-56">
        {VARIANTS.map((variant) => (
          <VariantCell key={variant.state} variant={variant} />
        ))}
      </ul>

      <h2 className="pb-1 text-sm font-bold text-gray-900">꺾쇠 회전</h2>
      <p className="pb-3 text-xs text-gray-500">
        접힌 것과 펼친 것을 나란히. 펼친 쪽의 꺾쇠가 180도 돌아 있다.
      </p>
      <div className="flex flex-wrap items-start gap-4">
        <details className="group w-fit">
          <FilterButton>채용 형태</FilterButton>
        </details>
        <details className="group w-fit" open>
          <FilterButton state="open">채용 형태</FilterButton>
        </details>
      </div>
    </div>
  ),
};
