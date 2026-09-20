import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

/**
 * 상태 표시 칩. 톤 다섯 개가 전부다.
 *
 * 다섯 개를 반드시 한 줄에 나란히 둔다. 톤마다 스토리를 따로 두면 "이 주황이 저 빨강과
 * 구분되는가" 를 볼 수 없고, 실제로 v3 에서 그것 때문에 색 판단이 한 번 미뤄졌다.
 *
 * 칸 아래 숫자는 브라우저가 실제로 그린 글자색과 배경색이다. 목업과 대조할 때 눈이 아니라
 * 이 숫자를 본다.
 */
const TONES = ['main', 'success', 'urgent', 'danger', 'neutral'] as const;

const MEANING: Record<(typeof TONES)[number], string> = {
  main: '기본 강조. 분류, 태그',
  success: '끝났고 잘 됐다. 승인, 등록 완료',
  urgent: '서둘러야 한다. 마감 임박',
  danger: '잘못됐다. 제재, 숨김 — urgent 와 달리 되돌려야 할 상태다',
  neutral: '아무 뜻 없음. 기본값',
};

/*
 * 어떤 CSS 색이든 sRGB hex 로. 1x1 캔버스에 칠해 놓고 그 픽셀을 읽는다.
 *
 * `getComputedStyle` 이 늘 `rgb(...)` 를 주지 않는다는 것이 이 함수가 있는 이유다. Tailwind v4
 * 기본 팔레트는 oklch 로 적혀 있어 크롬이 `oklch(0.577 0.245 27.325)` 를 그대로 돌려준다.
 * 거기서 숫자를 뽑아 16진수로 바꾸면 `#0024100` 같은 뜻 없는 문자열이 나온다 — 실제로 그렇게
 * 적었다가 이 스토리의 urgent·danger 값이 전부 엉터리였다.
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

function ToneCell({ tone }: { tone: (typeof TONES)[number] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [measured, setMeasured] = useState<{ color: string; background: string } | null>(null);

  useEffect(() => {
    if (ref.current) {
      const style = getComputedStyle(ref.current);
      setMeasured({ color: toHex(style.color), background: toHex(style.backgroundColor) });
    }
  }, []);

  return (
    <li className="w-52">
      <Badge ref={ref} tone={tone}>
        {tone}
      </Badge>
      <p className="pt-3 text-xs font-bold text-gray-900">tone=&quot;{tone}&quot;</p>
      <p className="pt-1 font-mono text-xs text-gray-500">
        {measured ? `글자 ${measured.color} / 배경 ${measured.background}` : '읽는 중'}
      </p>
      <p className="pt-1 text-xs text-gray-500">{MEANING[tone]}</p>
    </li>
  );
}

const meta: Meta<typeof Badge> = {
  component: Badge,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Badge>;

/** 톤 다섯 개를 한 줄에. 이 스토리의 존재 이유가 이 한 줄이다. */
export const Variants: Story = {
  render: () => (
    <div>
      <ul className="flex flex-wrap gap-4 pb-10">
        {TONES.map((tone) => (
          <ToneCell key={tone} tone={tone} />
        ))}
      </ul>

      <h2 className="pb-3 text-sm font-bold text-gray-900">실제 문구를 넣었을 때</h2>
      <div className="flex flex-wrap items-center gap-2 pb-10">
        <Badge tone="main">프런트엔드</Badge>
        <Badge tone="success">승인됨</Badge>
        <Badge tone="urgent">D-2</Badge>
        <Badge tone="danger">숨김</Badge>
        <Badge tone="neutral">상시</Badge>
      </div>

      <h2 className="pb-3 text-sm font-bold text-gray-900">tone 을 넘기지 않으면 neutral 이다</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>기본값</Badge>
        <Badge tone="neutral">neutral 을 명시</Badge>
      </div>
    </div>
  ),
};
