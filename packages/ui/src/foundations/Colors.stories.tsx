import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * `packages/ui/src/styles/tokens.css` 의 색 토큰 전부. 원본은 `docs/image.png`(SECTION 01
 * Color Parameter System) 이고 이 스토리가 그 표를 대신한다.
 *
 * hex 를 손으로 적지 않는다. 각 칸은 `getComputedStyle` 로 `--color-*` 를 그 자리에서 읽어
 * 보여준다. 손으로 적으면 `tokens.css` 를 고친 날 이 문서만 조용히 낡는다.
 *
 * 그래서 `swatch` 는 이름을 조립하지 않고 문자열로 적어 둔다. Tailwind 는 소스를 문자열로
 * 훑기 때문에, `bg-blue-${step}` 으로 만들면 그 유틸리티가 CSS 에 생성되지 않아 칸이 전부
 * 투명해진다.
 *
 * 파랑 13 단계와 회색 13 단계는 Tailwind 기본 팔레트를 덮어쓴 것이다. `00`·`150` 두 단계는
 * Tailwind 에 없는 자리라 새로 생긴 것이고, 나머지 11 개는 같은 이름의 기본값을 바꾼 것이다.
 * 그래서 `blue-600` 은 이 저장소에서만 #3B60E6 이다.
 */
interface Swatch {
  /** `tokens.css` 에 적힌 변수 이름. */
  token: string;
  /** 문자열로 적어야 스캐너에 걸린다. */
  className: string;
  /** 글자를 칸 위에 얹을 때 밝은 배경인지. */
  dark: boolean;
}

const BLUE: Swatch[] = [
  { token: '--color-blue-00', className: 'bg-blue-00', dark: false },
  { token: '--color-blue-50', className: 'bg-blue-50', dark: false },
  { token: '--color-blue-100', className: 'bg-blue-100', dark: false },
  { token: '--color-blue-150', className: 'bg-blue-150', dark: false },
  { token: '--color-blue-200', className: 'bg-blue-200', dark: false },
  { token: '--color-blue-300', className: 'bg-blue-300', dark: false },
  { token: '--color-blue-400', className: 'bg-blue-400', dark: false },
  { token: '--color-blue-500', className: 'bg-blue-500', dark: true },
  { token: '--color-blue-600', className: 'bg-blue-600', dark: true },
  { token: '--color-blue-700', className: 'bg-blue-700', dark: true },
  { token: '--color-blue-800', className: 'bg-blue-800', dark: true },
  { token: '--color-blue-900', className: 'bg-blue-900', dark: true },
  { token: '--color-blue-950', className: 'bg-blue-950', dark: true },
];

const GRAY: Swatch[] = [
  { token: '--color-gray-00', className: 'bg-gray-00', dark: false },
  { token: '--color-gray-50', className: 'bg-gray-50', dark: false },
  { token: '--color-gray-100', className: 'bg-gray-100', dark: false },
  { token: '--color-gray-150', className: 'bg-gray-150', dark: false },
  { token: '--color-gray-200', className: 'bg-gray-200', dark: false },
  { token: '--color-gray-300', className: 'bg-gray-300', dark: false },
  { token: '--color-gray-400', className: 'bg-gray-400', dark: false },
  { token: '--color-gray-500', className: 'bg-gray-500', dark: true },
  { token: '--color-gray-600', className: 'bg-gray-600', dark: true },
  { token: '--color-gray-700', className: 'bg-gray-700', dark: true },
  { token: '--color-gray-800', className: 'bg-gray-800', dark: true },
  { token: '--color-gray-900', className: 'bg-gray-900', dark: true },
  { token: '--color-gray-950', className: 'bg-gray-950', dark: true },
];

interface SemanticSwatch extends Swatch {
  name: string;
  textClassName: string;
  usedBy: string;
}

/**
 * 의미색 네 개. 단계가 없는 단일 값이라 `bg-*` 보다 `text-*` 로 쓰는 자리가 많다.
 *
 * 네 개 모두 Tailwind 기본 팔레트의 500 단계와 같은 값이다 — `emerald-500`, `amber-500`,
 * `red-500`, `sky-500`. 그래도 이름을 따로 두는 이유는 "이 색이 무엇을 뜻하는지" 가 `red-500`
 * 에는 없고 `--color-error` 에는 있기 때문이다.
 */
const SEMANTIC: SemanticSwatch[] = [
  {
    name: 'Success Green',
    token: '--color-success',
    className: 'bg-success',
    textClassName: 'text-success',
    dark: true,
    usedBy: 'Badge(success), Callout(success), ActionAlert(success)',
  },
  {
    name: 'Warning Amber',
    token: '--color-warning',
    className: 'bg-warning',
    textClassName: 'text-warning',
    dark: true,
    usedBy: 'Callout(warning)',
  },
  {
    name: 'Error Red',
    token: '--color-error',
    className: 'bg-error',
    textClassName: 'text-error',
    dark: true,
    usedBy: 'Field 의 필수 표시와 오류 문구, Callout(error), ConfirmDelete 삭제 버튼',
  },
  {
    name: 'Info Blue',
    token: '--color-info',
    className: 'bg-info',
    textClassName: 'text-info',
    dark: true,
    usedBy: 'Callout(info)',
  },
];

const ALL_TOKENS = [
  ...BLUE.map((swatch) => swatch.token),
  ...GRAY.map((swatch) => swatch.token),
  ...SEMANTIC.map((swatch) => swatch.token),
];

/** `:root` 에 실려 있는 커스텀 속성을 그대로 읽는다. 색이 아니라 문자열이라 hex 가 그대로 온다. */
function useTokenValues(): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const computed = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const token of ALL_TOKENS) {
      next[token] = computed.getPropertyValue(token).trim().toUpperCase();
    }
    setValues(next);
  }, []);

  return values;
}

function Ramp({
  title,
  description,
  swatches,
  values,
}: {
  title: string;
  description: string;
  swatches: Swatch[];
  values: Record<string, string>;
}) {
  return (
    <section className="pb-10">
      <h2 className="text-lg font-bold text-gray-900">
        {title} <span className="font-normal text-gray-500">{swatches.length} 단계</span>
      </h2>
      <p className="pt-1 pb-4 text-sm text-gray-500">{description}</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
        {swatches.map((swatch) => (
          <li key={swatch.token} className="overflow-hidden rounded-md border border-gray-200">
            <div className={`${swatch.className} h-20 w-full`} />
            <div className="px-3 py-2">
              <p className="truncate text-xs font-bold text-gray-900">{swatch.token}</p>
              <p className="pt-0.5 font-mono text-xs text-gray-500">
                {values[swatch.token] ?? '읽는 중'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ColorTokens() {
  const values = useTokenValues();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Color</h1>
      <p className="pt-1 pb-8 text-sm text-gray-500">
        칸 {BLUE.length} + {GRAY.length} + {SEMANTIC.length} 개.{' '}
        <code className="text-gray-700">packages/ui/src/styles/tokens.css</code> 의{' '}
        <code className="text-gray-700">--color-*</code> 를 그 자리에서 읽어 적는다. 원본은{' '}
        <code className="text-gray-700">docs/image.png</code>.
      </p>

      <Ramp
        title="Primary Accent Ramp (Blue)"
        description="Tailwind 기본 파랑을 통째로 덮어쓴 값이다. 00 과 150 은 Tailwind 에 없던 자리다."
        swatches={BLUE}
        values={values}
      />

      <Ramp
        title="System Neutral Ramp (Grays)"
        description="gray-00 은 흰색이고 gray-950 은 거의 검정이다. 본문은 gray-900, 보조 문구는 gray-500 을 쓴다."
        swatches={GRAY}
        values={values}
      />

      <section>
        <h2 className="text-lg font-bold text-gray-900">
          Semantic State Indicators{' '}
          <span className="font-normal text-gray-500">{SEMANTIC.length} 개</span>
        </h2>
        <p className="pt-1 pb-4 text-sm text-gray-500">
          단계가 없는 단일 값이다. 배경으로 쓸 때보다 글자색으로 쓰는 자리가 많다.
        </p>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3">
          {SEMANTIC.map((swatch) => (
            <li key={swatch.token} className="rounded-md border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <span className={`${swatch.className} block size-4 shrink-0 rounded-full`} />
                <span className={`${swatch.textClassName} text-base font-bold`}>{swatch.name}</span>
              </div>
              <p className="pt-2 text-xs font-bold text-gray-900">{swatch.token}</p>
              <p className="pt-0.5 font-mono text-xs text-gray-500">
                {values[swatch.token] ?? '읽는 중'}
              </p>
              <p className="pt-2 text-xs text-gray-500">{swatch.usedBy}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const meta: Meta = {
  title: 'Foundations/Colors',
  parameters: { layout: 'fullscreen' },
  render: () => <ColorTokens />,
};

export default meta;

export const Colors: StoryObj<typeof meta> = {};
