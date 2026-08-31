import { PinIcon } from '@/shared/ui/icons';

/**
 * `home.png` 최상단 히어로 — 정적 마케팅 카피 그대로 하드코딩(배지 pill + 헤드라인 두 줄).
 * 데이터에 의존하지 않는 순수 정적 콘텐츠라 서버 컴포넌트로 둔다.
 *
 * 목업에서 이 블록은 화면 끝까지 채운 띠가 아니라 좌우 40px 떨어진 둥근 박스다(실측 1440px
 * 기준 42~1400, 모서리 24px). 아래 콘텐츠(`max-w-6xl`)보다 넓어서 그 폭에 맞추지 않는다.
 */
export function HomeHero() {
  return (
    <section className="mx-10 mt-6 self-stretch rounded-xl bg-blue-50 py-16 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm">
        <PinIcon className="h-4 w-4" />
        지원해볼 만한 공고만 엄선했어요
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-gray-900 md:text-4xl">
        커리어 여정에 <span className="italic text-green-500">딱!</span> 맞는
        <br />
        채용공고만 <span className="italic text-green-500">쏙!</span> 보여드려요
      </h1>
    </section>
  );
}
