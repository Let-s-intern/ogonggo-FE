import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * 모서리 반경 토큰. 원본은 `docs/image-2.png`(SECTION 04 Border Radius Scale) 이다.
 *
 * 이름이 `xs`/`sm`/`md`/`lg` 인 이유는 `tokens.css` 주석에 있다 — 짧게 옮기면, `s`·`m`·`l` 로
 * 두면 `rounded-l` 이 Tailwind 의 "왼쪽 모서리" 유틸리티와 겹쳐 한쪽 모서리만 적용되는 버그가
 * 난다. `sm`/`md`/`lg` 는 방향 이름이 아니라서 안전하다.
 *
 * `xl`(24px) 은 `docs/image-2.png` 에 없다. 디자인 문서 밖의 토큰이라 이 스토리에서 따로
 * 표시하고, 어디서 왜 쓰는지를 칸 안에 적어 둔다.
 */
interface RadiusStep {
  /** 디자인 문서에 적힌 이름. 없으면 빈 문자열. */
  designName: string;
  /** `tokens.css` 의 변수 이름. */
  token: string;
  /** 문자열로 적어야 Tailwind 스캐너에 걸린다. */
  className: string;
  /** 어디서 쓰는지. */
  usedBy: string;
  /** 디자인 문서에 없는 토큰. */
  offScale?: string;
}

const STEPS: RadiusStep[] = [
  {
    designName: 'Radius XS',
    token: '--radius-xs',
    className: 'rounded-xs',
    usedBy: 'SpeechBubble, 가입·로그인 폼의 작은 상자, 달력의 날짜 칸',
  },
  {
    designName: 'Radius S',
    token: '--radius-sm',
    className: 'rounded-sm',
    usedBy: 'Badge — 디자인 문서의 Tag 예시와 같은 8px',
  },
  {
    designName: 'Radius M',
    token: '--radius-md',
    className: 'rounded-md',
    usedBy: 'Button, Input, Textarea, Select — 문서의 Button·Input 예시와 같은 12px',
  },
  {
    designName: 'Radius L',
    token: '--radius-lg',
    className: 'rounded-lg',
    usedBy: 'Card, Modal, EmptyState — 문서의 Card 예시와 같은 16px',
  },
  {
    designName: '',
    token: '--radius-xl',
    className: 'rounded-xl',
    usedBy: 'ActionAlert 의 알림 카드, HeroSkeleton 의 히어로 자리',
    offScale:
      '디자인 문서(docs/image-2.png)에 없고 tokens.css 에만 있다. 2026-08-31 커밋 cb3ecae 가 더했다 — 홈 히어로가 home.png 에서 좌우 40px 떨어진 24px 라운드 박스라 L(16px) 로는 맞지 않았다. 히어로 자체는 지금 이미지가 모서리를 그리고, 토큰은 그 자리의 로딩 자리(HeroSkeleton)와 ActionAlert 두 곳이 쓴다. 저장소 전체에서 두 번뿐이므로 새 화면에서 고를 기본값이 아니다.',
  },
  {
    designName: 'Radius Full',
    token: '--radius-full',
    className: 'rounded-full',
    usedBy: 'Avatar, CircleIconButton, Toggle 손잡이 — 원이 되어야 하는 것 전부',
  },
];

function Swatch({ step }: { step: RadiusStep }) {
  const ref = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current) {
      setRadius(getComputedStyle(ref.current).borderTopLeftRadius);
    }
  }, []);

  return (
    <li className="w-56">
      <div ref={ref} className={`${step.className} h-44 w-44 border border-gray-200 bg-gray-100`} />
      <p className="pt-3 text-base font-bold text-gray-900">
        {step.designName === '' ? <span className="text-warning">스케일 밖</span> : step.designName}
      </p>
      <p className="pt-0.5 font-mono text-xs text-gray-500">{step.token}</p>
      <p className="pt-0.5 text-sm text-gray-500">실측 {radius ?? '읽는 중'}</p>
      <p className="pt-2 text-xs text-gray-500">{step.usedBy}</p>
      {step.offScale ? <p className="pt-2 text-xs text-warning">{step.offScale}</p> : null}
    </li>
  );
}

/**
 * 디자인 문서의 Usage Examples 를 실제 컴포넌트로 다시 그린 것.
 *
 * 문서는 그림이라 값이 맞는지 확인할 수 없다. 여기 있는 것은 진짜 `Badge`·`Button`·`Input`·
 * `Card` 와 같은 클래스를 쓰는 상자라, 컴포넌트가 문서에서 벗어나면 이 줄에서 먼저 보인다.
 */
const USAGE = [
  { label: 'Tag', className: 'rounded-sm', expect: 'Radius S (8px)' },
  { label: 'Button', className: 'rounded-md', expect: 'Radius M (12px)' },
  { label: 'Input', className: 'rounded-md', expect: 'Radius M (12px)' },
  { label: 'Card', className: 'rounded-lg', expect: 'Radius L (16px)' },
];

function UsageRow({ item }: { item: (typeof USAGE)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current) {
      setRadius(getComputedStyle(ref.current).borderTopLeftRadius);
    }
  }, []);

  return (
    <li className="w-56">
      <p className="pb-2 text-sm font-bold text-gray-900">{item.label}</p>
      <div
        ref={ref}
        className={`${item.className} h-12 w-full border border-gray-200 bg-gray-50`}
      />
      <p className="pt-2 text-xs text-gray-500">
        {item.expect} · 실측 {radius ?? '읽는 중'}
      </p>
    </li>
  );
}

function RadiusScale() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Border Radius</h1>
      <p className="pt-1 pb-8 text-sm text-gray-500">
        토큰 {STEPS.length} 개. 원본 <code className="text-gray-700">docs/image-2.png</code> 는 다섯
        개(XS, S, M, L, Full)까지이고, <code className="text-gray-700">--radius-xl</code> 은 그
        밖이라 주황색으로 표시했다. 상자 아래 "실측" 은 브라우저가 실제로 그린 값이다.
      </p>

      <ul className="flex flex-wrap gap-6 pb-12">
        {STEPS.map((step) => (
          <Swatch key={step.token} step={step} />
        ))}
      </ul>

      <h2 className="text-lg font-bold text-gray-900">Usage Examples</h2>
      <p className="pt-1 pb-4 text-sm text-gray-500">
        디자인 문서가 짝지어 둔 자리들. 컴포넌트가 실제로 쓰는 클래스와 같다.
      </p>
      <ul className="flex flex-wrap gap-6">
        {USAGE.map((item) => (
          <UsageRow key={item.label} item={item} />
        ))}
      </ul>
    </div>
  );
}

const meta: Meta = {
  title: 'Foundations/Radius',
  parameters: { layout: 'fullscreen' },
  render: () => <RadiusScale />,
};

export default meta;

export const Radius: StoryObj<typeof meta> = {};
