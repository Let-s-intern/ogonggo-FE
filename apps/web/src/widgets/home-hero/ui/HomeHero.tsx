import { Fragment } from 'react';
import { PinIcon } from '@/shared/ui/icons';

export interface HomeHeroProps {
  /** 배지 pill 문구. 앞의 핀 아이콘은 화면마다 같아서 props로 받지 않는다. */
  badge: string;
  /** 헤드라인. 배열 한 칸이 한 줄이고, 줄 사이는 `<br />`이다. */
  headlineLines: string[];
  /**
   * 헤드라인 안에서 초록 이탤릭으로 강조할 단어들(홈의 `딱!`, `쏙!`). 화면에 따라 강조가
   * 아예 없기도 해서(`교육부트캠프.png`의 히어로) 기본값은 빈 배열이다.
   */
  emphasisWords?: string[];
}

/** 정규식 메타문자가 섞인 강조 단어(`딱!`의 `!` 등)를 그대로 찾도록 이스케이프한다. */
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function renderLine(line: string, emphasisWords: string[]) {
  if (emphasisWords.length === 0) {
    return line;
  }

  const pattern = new RegExp(`(${emphasisWords.map(escapeRegExp).join('|')})`, 'g');
  return line.split(pattern).map((part, index) =>
    emphasisWords.includes(part) ? (
      <span key={index} className="italic text-green-500">
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

/**
 * `home.png`·`교육부트캠프.png` 최상단 히어로 — 데이터에 의존하지 않는 정적 마케팅 카피라
 * 서버 컴포넌트로 둔다. 문구는 화면마다 달라 props로 받는다(배지 pill + 헤드라인 여러 줄 +
 * 강조 단어). 박스 자체(색·여백·라운드)는 두 목업이 같아서 여기 남는다.
 *
 * 목업에서 이 블록은 화면 끝까지 채운 띠가 아니라 좌우 40px 떨어진 둥근 박스다(실측 1440px
 * 기준 42~1400, 모서리 24px). 아래 콘텐츠(`max-w-6xl`)보다 넓어서 그 폭에 맞추지 않는다.
 */
export function HomeHero({ badge, headlineLines, emphasisWords = [] }: HomeHeroProps) {
  return (
    <section className="mx-10 mt-6 self-stretch rounded-xl bg-blue-50 py-16 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm">
        <PinIcon className="h-4 w-4" />
        {badge}
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-gray-900 md:text-4xl">
        {headlineLines.map((line, index) => (
          <Fragment key={index}>
            {index > 0 ? <br /> : null}
            {renderLine(line, emphasisWords)}
          </Fragment>
        ))}
      </h1>
    </section>
  );
}
