import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card, CardDescription, CardTitle } from './Card';

/**
 * 네모 상자 하나. `rounded-lg`(16px) 테두리에 흰 배경, 안쪽 여백 16px 이 전부다.
 *
 * `CardTitle`·`CardDescription` 은 같은 파일에서 따로 내보낸다. `Card` 가 자식을 감싸기만
 * 하므로 제목과 설명을 쓸지 말지는 부르는 쪽이 정한다.
 *
 * 첫 칸 아래 숫자는 브라우저가 실제로 그린 테두리 색과 반경이다. 목업과 대조할 때 눈이 아니라
 * 이 숫자를 본다.
 */
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

function MeasuredCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current) {
      const style = getComputedStyle(ref.current);
      setMeasured(
        `테두리 ${toHex(style.borderTopColor)} ${style.borderTopWidth} / 반경 ${style.borderTopLeftRadius} / 안쪽 여백 ${style.paddingTop} / 배경 ${toHex(style.backgroundColor)}`,
      );
    }
  }, []);

  return (
    <div>
      <Card ref={ref}>
        <CardTitle>오공고 주식회사</CardTitle>
        <CardDescription>프런트엔드 신입 · 서울 강남구</CardDescription>
      </Card>
      <p className="pt-2 font-mono text-xs text-gray-500">{measured ?? '읽는 중'}</p>
    </div>
  );
}

const meta: Meta<typeof Card> = {
  component: Card,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Card>;

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
    <div className="grid max-w-5xl grid-cols-2 gap-x-8 gap-y-8">
      <Cell caption="제목 + 설명 — 실측값을 함께">
        <MeasuredCard />
      </Cell>

      <Cell caption="제목만">
        <Card>
          <CardTitle>오공고 주식회사</CardTitle>
        </Card>
      </Cell>

      <Cell caption="설명만 — 제목 없이도 성립한다">
        <Card>
          <CardDescription>아직 등록된 공고가 없습니다.</CardDescription>
        </Card>
      </Cell>

      <Cell caption="아무 자식이나 받는다 — Card 는 감싸기만 한다">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>프런트엔드 신입</CardTitle>
            <Badge tone="urgent">D-2</Badge>
          </div>
          <CardDescription className="pt-1">오공고 주식회사 · 서울 강남구</CardDescription>
          <div className="pt-4">
            <Button size="sm">공고 확인하기</Button>
          </div>
        </Card>
      </Cell>

      <Cell caption="여백·테두리는 className 으로 덮어쓴다 — p-6">
        <Card className="p-6">
          <CardTitle>안쪽 여백을 넓힌 카드</CardTitle>
          <CardDescription>기본 16px 대신 24px.</CardDescription>
        </Card>
      </Cell>

      <Cell caption="목록에서 세로로 이어 놓았을 때">
        <div className="flex flex-col gap-3">
          <Card>
            <CardTitle className="text-base">한국후지필름 VMD 경력사원</CardTitle>
          </Card>
          <Card>
            <CardTitle className="text-base">오공고 테크 프런트엔드 신입</CardTitle>
          </Card>
        </div>
      </Cell>
    </div>
  ),
};
