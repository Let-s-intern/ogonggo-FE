import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * 타이포 스케일 12 단계. 원본은 `docs/asset/v3-1/typography.png` 이고 토큰은
 * `packages/ui/src/styles/tokens.css` 의 `--text-*` 다.
 *
 * 순서와 묶음을 에셋과 똑같이 맞춘 것이 이 스토리의 요점이다. 에셋은 큰 것부터 내려오며
 * Xxlarge·Xlarge·Large·Medium·Small·Xsmall·Xxsmall 일곱 묶음으로 나뉘는데, 스토리북을 에셋
 * 옆에 띄워 놓고 줄끼리 맞대 보려면 같은 순서여야 한다. 토큰 이름순(2xs→7xl)으로 놓으면
 * 방향이 뒤집혀 대조가 안 된다.
 *
 * `size`·`lineHeight`·`letterSpacing` 은 에셋에 적힌 값이고, 오른쪽의 "실측" 열은 브라우저가
 * 실제로 그린 값을 `getComputedStyle` 로 읽은 것이다. 둘이 다르면 그 자리에서 보인다.
 *
 * 무게는 토큰이 정하지 않는다. 에셋이 크기 하나에 무게를 여럿 허용하므로(22px 은 다섯 개)
 * 토큰에 묶으면 못 쓰는 조합이 생긴다. 그래서 `weights` 는 "이 크기에서 에셋이 허용한 무게"
 * 목록이고, 샘플은 그중 맨 앞 것으로 그린다.
 */
interface Step {
  /** `--text-*` 의 이름. */
  token: string;
  /** 문자열로 적어야 Tailwind 스캐너에 걸린다. */
  className: string;
  /** 에셋에 적힌 px. */
  size: number;
  /** 에셋에 적힌 px. */
  lineHeight: number;
  /** 에셋에 적힌 % 문자열. */
  letterSpacing: string;
  /** 에셋이 이 크기에 허용한 무게. 맨 앞 것으로 샘플을 그린다. */
  weights: string;
  /** 샘플을 그릴 무게 유틸리티. 문자열로 적어야 스캐너에 걸린다. */
  weightClassName: string;
  /** 토큰이 에셋과 다르게 들어간 자리. 이유는 tokens.css 주석에 있다. */
  note?: string;
}

interface Group {
  /** 에셋의 Scale Category. */
  category: string;
  steps: Step[];
}

const GROUPS: Group[] = [
  {
    category: 'Xxlarge',
    steps: [
      {
        token: '--text-7xl',
        className: 'text-7xl',
        size: 36,
        lineHeight: 48,
        letterSpacing: '-2.8%',
        weights: 'Semibold',
        weightClassName: 'font-semibold',
      },
      {
        token: '--text-6xl',
        className: 'text-6xl',
        size: 32,
        lineHeight: 42,
        letterSpacing: '-2.6%',
        weights: 'Medium',
        weightClassName: 'font-medium',
      },
    ],
  },
  {
    category: 'Xlarge',
    steps: [
      {
        token: '--text-5xl',
        className: 'text-5xl',
        size: 28,
        lineHeight: 38,
        letterSpacing: '-2.5%',
        weights: 'Bold / Semibold / Medium',
        weightClassName: 'font-bold',
      },
    ],
  },
  {
    category: 'Large',
    steps: [
      {
        token: '--text-4xl',
        className: 'text-4xl',
        size: 26,
        lineHeight: 34,
        letterSpacing: '-2.4%',
        weights: 'Semibold / Medium / Light',
        weightClassName: 'font-semibold',
      },
    ],
  },
  {
    category: 'Medium',
    steps: [
      {
        token: '--text-3xl',
        className: 'text-3xl',
        size: 24,
        lineHeight: 32,
        letterSpacing: '-2.4%',
        weights: 'Bold / Semibold / Medium / Light',
        weightClassName: 'font-bold',
      },
      {
        token: '--text-2xl',
        className: 'text-2xl',
        size: 22,
        lineHeight: 30,
        letterSpacing: '-2.2%',
        weights: 'Bold / Semibold / Medium / Light / Thin',
        weightClassName: 'font-bold',
      },
    ],
  },
  {
    category: 'Small',
    steps: [
      {
        token: '--text-xl',
        className: 'text-xl',
        size: 20,
        lineHeight: 28,
        letterSpacing: '-2%',
        weights: 'Bold / Semibold / Medium / Regular / Light',
        weightClassName: 'font-bold',
      },
      {
        token: '--text-lg',
        className: 'text-lg',
        size: 18,
        lineHeight: 26,
        letterSpacing: '-0.12%',
        weights: 'Bold / Semibold / Medium / Regular / Light',
        weightClassName: 'font-bold',
        note: '토큰은 -1.2%. 에셋의 -0.12% 는 실효 -0.02px 라 사실상 0 이고, 이웃이 -2%·-0.6%·-1.5% 라 오타로 보고 한 자리 옮겼다. 디자이너 확인 대기.',
      },
    ],
  },
  {
    category: 'Xsmall',
    steps: [
      {
        token: '--text-base',
        className: 'text-base',
        size: 16,
        lineHeight: 24,
        letterSpacing: '-0.6%',
        weights: 'Bold / Semibold / Medium / Regular / Light',
        weightClassName: 'font-bold',
        note: '에셋은 행간이 무게별로 갈린다 — Bold·Semibold·Medium 은 24, Regular·Light 는 26. 크기당 토큰 하나를 지키려고 굵은 쪽 24 로 넣었다.',
      },
      {
        token: '--text-sm',
        className: 'text-sm',
        size: 14,
        lineHeight: 20,
        letterSpacing: '-1.5%',
        weights: 'Bold / Semibold / Medium / Regular / Light',
        weightClassName: 'font-bold',
        note: '에셋은 행간이 무게별로 갈린다 — Bold·Semibold·Medium 은 20, Regular·Light 는 22. 굵은 쪽 20 으로 넣었다.',
      },
    ],
  },
  {
    category: 'Xxsmall',
    steps: [
      {
        token: '--text-xs',
        className: 'text-xs',
        size: 12,
        lineHeight: 16,
        letterSpacing: '-2.5%',
        weights: 'Bold / Semibold / Medium / Regular',
        weightClassName: 'font-bold',
      },
      {
        token: '--text-2xs',
        className: 'text-2xs',
        size: 11,
        lineHeight: 14,
        letterSpacing: '-3.3%',
        weights: 'Semibold',
        weightClassName: 'font-semibold',
      },
    ],
  },
];

/** 에셋이 모든 줄에 쓰는 문장. 같은 문장이어야 줄끼리 맞대 볼 수 있다. */
const SAMPLE = '인턴, 신입 커리어의 첫 시작 함께해요!';

interface Measured {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
}

function StepRow({ step }: { step: Step }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const style = getComputedStyle(ref.current);
    setMeasured({
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      fontWeight: style.fontWeight,
    });
  }, []);

  return (
    <div className="border-t border-gray-100 py-3">
      <div className="grid grid-cols-[1fr_5rem_7rem_16rem_7rem] items-baseline gap-4">
        <p ref={ref} className={`${step.className} ${step.weightClassName} text-gray-900`}>
          {SAMPLE}
        </p>
        <span className="text-sm text-gray-900">{step.size}</span>
        <span className="text-sm text-gray-900">{step.letterSpacing}</span>
        <span className="text-sm text-gray-900">{step.weights}</span>
        <span className="text-sm text-gray-900">{step.lineHeight}</span>
      </div>
      <p className="pt-1 font-mono text-xs text-gray-500">
        {step.token} · 실측{' '}
        {measured
          ? `크기 ${measured.fontSize} / 행간 ${measured.lineHeight} / 자간 ${measured.letterSpacing} / 무게 ${measured.fontWeight}`
          : '읽는 중'}
      </p>
      {step.note ? (
        <p className="max-w-3xl pt-1 text-xs text-warning">에셋과 다름 — {step.note}</p>
      ) : null}
    </div>
  );
}

function TypeScale() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Typography</h1>
      <p className="pt-1 text-sm text-gray-500">
        12 단계. 원본 <code className="text-gray-700">docs/asset/v3-1/typography.png</code> 과 같은
        순서·같은 묶음으로 두었다. 글꼴은 전 단계 Pretendard Variable 하나다.
      </p>
      <p className="pt-1 pb-6 text-sm text-gray-500">
        Size·Letter Spacing·Weight·Line Height 는 에셋에 적힌 값이고, 줄 아래 회색 글씨가 브라우저가
        실제로 그린 값이다. 주황색 줄은 토큰이 에셋과 일부러 다르게 들어간 자리다.
      </p>

      <div className="grid grid-cols-[1fr_5rem_7rem_16rem_7rem] gap-4 pb-1 text-xs font-bold text-gray-500">
        <span>Scale Category</span>
        <span>Size</span>
        <span>Letter Spacing</span>
        <span>Weight</span>
        <span>Line Height</span>
      </div>

      {GROUPS.map((group) => (
        <section key={group.category} className="pt-6">
          <h2 className="text-base font-bold text-blue-500">{group.category}</h2>
          {group.steps.map((step) => (
            <StepRow key={step.token} step={step} />
          ))}
        </section>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'fullscreen' },
  render: () => <TypeScale />,
};

export default meta;

export const Typography: StoryObj<typeof meta> = {};
