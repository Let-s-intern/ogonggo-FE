import type { ReactNode } from 'react';
import { CardGridSkeleton } from '@/shared/ui/CardGridSkeleton';
import { HeroSkeleton } from '@/shared/ui/HeroSkeleton';

export interface ListPageSkeletonProps {
  /** 카드 수. 한 페이지 건수는 MSW 핸들러가 정한다 — 부트캠프 12장, 사이드·스터디 8장이다. */
  cardCount: number;
  /**
   * 카드 아래쪽에 해시태그·댓글·조회수 줄이 한 줄 더 있는지. 사이드·스터디 카드만 있다
   * (`entities/side-study/ui/SideStudyCard.tsx`).
   */
  hasCardFooter?: boolean;
  /** 썸네일 없이 테두리 안에 글자만 있는 카드인지(`CardGridSkeleton` 의 같은 이름 prop). */
  framed?: boolean;
  /**
   * 목록 아래 가로 선 다음에 올 내용. 지금 넘어오는 것은 `ForBusinessBanner` 하나다.
   * 위젯을 여기서 직접 가져오지 않는 이유는 `shared`가 다른 레이어를 가져다 쓰지 않기
   * 때문이다(`shared/README.md`). 상세 화면의 로딩도 같은 식으로 `app` 쪽에서 배너를 붙인다.
   */
  footer?: ReactNode;
}

/**
 * 목록 화면(`/bootcamps`, `/side-studies`)의 로딩 스켈레톤 — 히어로 박스 + 컨트롤 한 줄 +
 * 4열 카드 그리드 + 페이지네이션 + 가로 선 + `FOR BUSINESS` 배너.
 *
 * 배너만 맥동하지 않는다. 데이터가 필요 없는 정적 위젯이라 로딩 중에 이미 최종 모습으로 둘 수
 * 있고, 그러면 그 부분은 높이가 어긋날 여지가 없다(`app/(home)/loading.tsx`와 같은 판단이다).
 *
 * 홈(`app/(home)/loading.tsx`)은 이 화면 위에 인기 공고 섹션과 광고 자리가 하나씩 더 있어서
 * 이걸 그대로 쓰지 못한다. 겹치는 두 조각(`HeroSkeleton`, `CardGridSkeleton`)만 나눠 쓴다.
 *
 * 맥동은 Tailwind `animate-pulse`이고, 같이 붙은 `ogonggo-skeleton`은
 * `prefers-reduced-motion: reduce`에서 그 맥동을 끄기 위한 표식이다(`app/globals.css`).
 */
export function ListPageSkeleton({
  cardCount,
  hasCardFooter = false,
  framed = false,
  footer,
}: ListPageSkeletonProps) {
  return (
    <div className="flex w-full flex-col items-center" role="status">
      <span className="sr-only">불러오는 중</span>

      <HeroSkeleton />

      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <div
          aria-hidden="true"
          className="ogonggo-skeleton flex w-full animate-pulse flex-col gap-6"
        >
          {/* 컨트롤 한 줄 — 왼쪽 탭들(`text-lg`, 28px), 오른쪽 버튼·토글(`h-9`, 36px). */}
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-7 w-16 rounded bg-gray-100" />
              ))}
            </div>
            <div className="h-9 w-28 rounded-full bg-gray-100" />
          </div>

          <CardGridSkeleton
            count={cardCount}
            gapClass="gap-x-4 gap-y-8"
            hasCardFooter={hasCardFooter}
            framed={framed}
          />

          {/* 페이지네이션 — 링크 한 칸이 `h-8 w-8`이다. */}
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index} className="h-8 w-8 rounded-md bg-gray-100" />
            ))}
          </div>
        </div>

        {footer ? (
          <>
            <div className="w-full border-t border-gray-100" />
            <div className="w-full">{footer}</div>
          </>
        ) : null}
      </div>
    </div>
  );
}
