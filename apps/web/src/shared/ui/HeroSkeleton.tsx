/**
 * 히어로 박스(`widgets/home-hero/ui/HomeHero.tsx`)의 자리만 잡는 스켈레톤. 홈과 목록 둘이
 * 같은 박스를 쓴다.
 *
 * 진짜 `HomeHero`를 그리지 않는다. 문구(배지·헤드라인)가 화면마다 다르고 `views/*`에
 * 인라인으로 적혀 있어서, 여기서 다시 적으면 한쪽만 고쳤을 때 높이가 어긋난다. 대신 박스
 * 클래스(`mx-10 mt-6 self-stretch rounded-xl bg-blue-50 py-16`)와 안쪽 요소의 line-height를
 * 그대로 따라가서 높이가 같아진다 — 배지 36px(`text-sm` + `py-2`), 헤드라인 두 줄
 * (`text-3xl` 36px, `md:text-4xl` 40px), 그 사이 `mt-6`. 실측 1440px에서 268px로 일치한다.
 */
export function HeroSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="ogonggo-skeleton mx-10 mt-6 flex animate-pulse flex-col items-center self-stretch rounded-xl bg-blue-50 py-16"
    >
      <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm shadow-sm">
        <span className="block h-5 w-56 rounded bg-blue-100" />
      </span>
      <span className="mt-6 block h-9 w-72 rounded bg-blue-100 md:h-10" />
      <span className="block h-9 w-96 rounded bg-blue-100 md:h-10" />
    </section>
  );
}
