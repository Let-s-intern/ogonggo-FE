import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './SearchInput';

/**
 * 검색 입력. 에셋(`docs/asset/v3-1/search/`) 세 장이 그대로 세 칸이다.
 *
 * 세 장은 서로 다른 상태가 아니라 한 컨트롤의 세 장면이다. 테두리 색이 셋 다 `#E5E7EB` 라
 * **포커스에 파란 테두리가 없고**, 폭이 다른 것은 쓰는 자리가 정하는 것이라 상태가 아니다.
 * 실제로 갈리는 것은 "값이 있는가" 하나이고, 그때만 오른쪽에 지우기 버튼이 붙는다.
 */
interface Scene {
  name: string;
  asset: string;
  note: string;
  placeholder: string;
  defaultValue?: string;
  /** 에셋의 폭. 컨트롤의 상태가 아니라 그 그림이 그렇게 잘려 있다는 뜻이다. */
  width: string;
}

const SCENES: Scene[] = [
  {
    name: '기본',
    asset: 'image.png',
    note: '짧은 알약. 플레이스홀더만 있고 지우기 버튼이 없다',
    placeholder: 'search',
    width: 'w-[99px]',
  },
  {
    name: '포커스',
    asset: 'image copy.png',
    note: '폭만 넓어진다. 테두리는 기본과 같은 회색이다',
    placeholder: 'search typing...',
    width: 'w-[320px]',
  },
  {
    name: '입력 중',
    asset: 'image copy 2.png',
    note: '값이 있어 지우기 버튼이 붙는다. 글자색이 한 단계 진하다',
    placeholder: 'search typing...',
    defaultValue: 'search typing...',
    width: 'w-[320px]',
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
  padding: string;
}

function SceneCell({ scene }: { scene: Scene }) {
  const ref = useRef<HTMLInputElement>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const style = getComputedStyle(ref.current);
    setMeasured({
      border: `${toHex(style.borderTopColor)} ${style.borderTopWidth}`,
      background: toHex(style.backgroundColor),
      color: toHex(style.color),
      height: style.height,
      padding: `${style.paddingLeft} / ${style.paddingRight}`,
    });
  }, []);

  return (
    <li className="w-80">
      <SearchInput
        ref={ref}
        name="q"
        placeholder={scene.placeholder}
        defaultValue={scene.defaultValue}
        wrapperClassName={scene.width}
      />
      <p className="pt-3 text-xs font-bold text-gray-900">{scene.name}</p>
      <p className="pt-1 text-xs text-gray-500">{scene.asset}</p>
      <p className="pt-2 font-mono text-xs text-gray-500">
        {measured ? `테두리 ${measured.border} · 바탕 ${measured.background}` : '읽는 중'}
      </p>
      <p className="pt-1 font-mono text-xs text-gray-500">
        {measured ? `글자 ${measured.color} · 높이 ${measured.height}` : ''}
      </p>
      <p className="pt-1 font-mono text-xs text-gray-500">
        {measured ? `안쪽 여백 ${measured.padding}` : ''}
      </p>
      <p className="pt-2 text-xs text-gray-500">{scene.note}</p>
    </li>
  );
}

const meta: Meta<typeof SearchInput> = {
  component: SearchInput,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof SearchInput>;

/** 세 장면을 한 줄에. 지우기 버튼은 값이 있는 칸에만 있다. */
export const Variants: Story = {
  render: () => (
    <div>
      <ul className="flex flex-wrap gap-4 pb-10">
        {SCENES.map((scene) => (
          <SceneCell key={scene.name} scene={scene} />
        ))}
      </ul>

      <h2 className="pb-1 text-sm font-bold text-gray-900">지우기</h2>
      <p className="pb-3 text-xs text-gray-500">
        버튼을 누르면 값이 비고 버튼 자신이 사라진다. 글자를 다시 치면 되돌아온다.
      </p>
      <SearchInput
        name="q"
        placeholder="공고 검색"
        defaultValue="프런트엔드"
        wrapperClassName="w-[320px]"
      />

      <h2 className="pt-10 pb-1 text-sm font-bold text-gray-900">
        자바스크립트 없는 폼 안에서도 같다
      </h2>
      <p className="pb-3 text-xs text-gray-500">
        값을 리액트 상태로 들지 않으므로 <code className="text-gray-700">defaultValue</code> 가
        그대로 제출된다. 쓰는 자리가 그런 폼이다.
      </p>
      <form action="#" method="GET" className="w-[320px]">
        <SearchInput name="q" placeholder="공고 검색" />
      </form>
    </div>
  ),
};
