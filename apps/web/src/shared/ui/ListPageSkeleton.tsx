export interface ListPageSkeletonProps {
  /** 카드 수. 한 페이지 건수는 MSW 핸들러가 정한다 — 부트캠프 12장, 사이드·스터디 8장이다. */
  cardCount: number;
  /**
   * 카드 아래쪽에 해시태그·댓글·조회수 줄이 한 줄 더 있는지. 사이드·스터디 카드만 있다
   * (`entities/side-study/ui/SideStudyCard.tsx`).
   */
  hasCardFooter?: boolean;
}

/**
 * 목록 화면(`/bootcamps`, `/side-studies`)의 로딩 스켈레톤 — 히어로 박스 + 컨트롤 한 줄 +
 * 4열 카드 그리드 + 페이지네이션.
 *
 * 히어로는 `widgets/home-hero/ui/HomeHero.tsx`를 그대로 그리지 않고 같은 크기의 자리만 잡는다.
 * 문구(배지·헤드라인)가 화면마다 다르고 `views/*-list`에 인라인으로 적혀 있어서, 여기서 다시
 * 적으면 한쪽만 고쳤을 때 높이가 어긋난다. 대신 박스 클래스
 * (`mx-10 mt-6 self-stretch rounded-xl bg-blue-50 py-16`)와 안쪽 요소의 line-height를 그대로
 * 따라가서 높이가 같아진다 — 배지 36px(`text-sm` + `py-2`), 헤드라인 두 줄
 * (`text-3xl` 36px, `md:text-4xl` 40px), 그 사이 `mt-6`.
 *
 * 카드 한 장은 `aspect-[8/5]` 썸네일 + 메타 줄 + 회사명·닉네임 줄 + 제목 두 줄
 * (`line-clamp-2 text-sm`)이다. 카드 높이를 실제와 맞추는 기준은 한 장이 아니라 행이다 —
 * `ul`이 그리드라 같은 행의 `li`는 가장 높은 카드에 맞춰 늘어난다. 그래서 제목은 최대인
 * 두 줄(40px)로 그린다.
 *
 * 맥동은 Tailwind `animate-pulse`이고, 같이 붙은 `ogonggo-skeleton`은
 * `prefers-reduced-motion: reduce`에서 그 맥동을 끄기 위한 표식이다(`app/globals.css`).
 */
export function ListPageSkeleton({ cardCount, hasCardFooter = false }: ListPageSkeletonProps) {
  return (
    <div className="ogonggo-skeleton flex w-full animate-pulse flex-col items-center" role="status">
      <span className="sr-only">불러오는 중</span>

      <section
        aria-hidden="true"
        className="mx-10 mt-6 flex flex-col items-center self-stretch rounded-xl bg-blue-50 py-16"
      >
        <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm shadow-sm">
          <span className="block h-5 w-56 rounded bg-blue-100" />
        </span>
        <span className="mt-6 block h-9 w-72 rounded bg-blue-100 md:h-10" />
        <span className="block h-9 w-96 rounded bg-blue-100 md:h-10" />
      </section>

      <div
        aria-hidden="true"
        className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10"
      >
        <div className="flex w-full flex-col gap-6">
          {/* 컨트롤 한 줄 — 왼쪽 탭들(`text-lg`, 28px), 오른쪽 버튼·토글(`h-9`, 36px). */}
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-7 w-16 rounded bg-gray-100" />
              ))}
            </div>
            <div className="h-9 w-28 rounded-full bg-gray-100" />
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {Array.from({ length: cardCount }, (_, index) => (
              <li key={index} className="flex flex-col gap-2">
                <div className="aspect-[8/5] w-full rounded-lg bg-gray-100 shadow-sm" />
                {/* 메타 줄 — 배지가 들어 있어 20px이다(`text-xs`의 16px이 아니다). */}
                <div className="h-5 w-full rounded bg-gray-100" />
                <div className="h-5 w-24 rounded bg-gray-100" />
                {/* 제목은 `line-clamp-2`라 최대 40px. 두 줄로 보이게 하되 바깥 높이는 40px에
                    묶어 둔다 — 막대 두 개를 그냥 쌓으면 카드가 8px 길어진다. */}
                <div className="flex h-10 flex-col justify-between">
                  <div className="h-4 rounded bg-gray-100" />
                  <div className="h-4 w-2/3 rounded bg-gray-100" />
                </div>
                {hasCardFooter ? <div className="h-4 w-full rounded bg-gray-100" /> : null}
              </li>
            ))}
          </ul>

          {/* 페이지네이션 — 링크 한 칸이 `h-8 w-8`이다. */}
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index} className="h-8 w-8 rounded-md bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
