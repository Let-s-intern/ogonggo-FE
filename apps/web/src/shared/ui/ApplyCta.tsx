import { Button } from '@ogonggo/ui';
import { BookmarkIcon } from '@/shared/ui/icons';

export interface ApplyCtaProps {
  /** 지원·신청 링크. 없으면 버튼 자체를 그리지 않고 북마크 칸만 남는다. */
  href?: string;
  /** 채용공고는 "지원하러 가기", 부트캠프는 "신청하러 가기"다(목업 문구). */
  label: string;
  bookmarked: boolean;
  bookmarkCount: number;
  /**
   * `href`가 없을 때 버튼을 감추는 대신 비활성 버튼으로 남긴다. 기본값은 감추는 쪽이라
   * 채용공고·부트캠프의 동작은 그대로다.
   *
   * 사이드·스터디가 이걸 켠다. 지어낸 목데이터라 신청 주소를 만들 수 없어 12건 모두
   * `applicationUrl`이 비어 있고, 감추면 목업에서 가장 큰 요소가 화면에서 통째로 사라진다.
   */
  keepButtonWhenNoHref?: boolean;
}

/**
 * 상세 사이드바 최상단 CTA — 버튼 + 북마크 아이콘·카운트.
 *
 * API 없음: 북마크 토글에 붙일 API가 없다. 아이콘은 `bookmarked` 표시 전용이라 눌러도 상태가
 * 바뀌지 않는다(PRD 2절 표의 "공통 / 북마크 토글", PRD 8절). 목록 카드
 * (`entities/bootcamp/ui/BootcampCard.tsx`, `entities/side-study/ui/SideStudyCard.tsx`)의
 * 북마크 아이콘과 같은 처리이고, 붙이려면 북마크 등록·해제 엔드포인트가 먼저 있어야 한다.
 *
 * 원래 `widgets/job-detail/ui/JobApplyCta.tsx`였다. 부트캠프 상세가 문구와 링크만 다른 같은
 * 것을 쓰게 되어(`교육부트캠프 상세페이지.png`의 "신청하러 가기") 호출부가 둘이 된 지금
 * 여기로 옮겼다(PRD 7절 — 두 곳 이상일 때만 옮긴다).
 */
export function ApplyCta({
  href,
  label,
  bookmarked,
  bookmarkCount,
  keepButtonWhenNoHref = false,
}: ApplyCtaProps) {
  return (
    <div className="flex items-center gap-2">
      {href ? (
        <Button asChild className="flex-1">
          <a href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        </Button>
      ) : keepButtonWhenNoHref ? (
        <Button disabled className="flex-1">
          {label}
        </Button>
      ) : null}
      <div className="flex h-11 flex-col items-center justify-center rounded-md border border-gray-300 px-3 text-xs text-gray-500">
        <BookmarkIcon filled={bookmarked} className="h-4 w-4" />
        <span>{bookmarkCount}</span>
      </div>
    </div>
  );
}
