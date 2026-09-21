import { Button } from '@ogonggo/ui';
import { BookmarkCountButton, type BookmarkKind } from '@/features/bookmark';

export interface ApplyCtaProps {
  /** 지원·신청 링크. 없으면 버튼 자체를 그리지 않고 북마크 칸만 남는다. */
  href?: string;
  /** 채용공고는 "지원하러 가기", 부트캠프는 "신청하러 가기"다(목업 문구). */
  label: string;
  /** 북마크할 대상. 종류마다 등록·해제 경로가 달라 `BookmarkCountButton`이 이것으로 가른다. */
  kind: BookmarkKind;
  id: number;
  /** 서버가 준 값. 브라우저의 id 모음이 도착하면 그쪽이 이긴다. */
  bookmarked: boolean;
  bookmarkCount: number;
}

/**
 * 상세 사이드바 최상단 CTA — 버튼 + 북마크 아이콘·카운트.
 *
 * 북마크 칸은 `features/bookmark`의 `BookmarkCountButton`이다. 채용공고·부트캠프·사이드 스터디
 * 상세 셋이 이 컴포넌트를 공유하므로, 종류와 id 만 받으면 세 화면의 북마크가 여기 한 곳에서
 * 끝난다. 그래서 `kind`·`id`가 props 에 있다.
 *
 * **기업 회원에게는 북마크 칸이 통째로 없다.** 개수와 버튼이 한 칸이라 따로 떼면 누를 수 없는
 * 개수만 남는다. 기업 회원의 상세 CTA 는 지원·신청 버튼 하나다 — 그 판단은
 * `BookmarkCountButton`이 하고(`null`을 돌려준다), 여기서는 버튼이 `flex-1`이라 자리를 채운다.
 *
 * 원래 `widgets/job-detail/ui/JobApplyCta.tsx`였다. 부트캠프 상세가 문구와 링크만 다른 같은
 * 것을 쓰게 되어(`교육부트캠프 상세페이지.png`의 "신청하러 가기") 호출부가 둘이 된 지금
 * 여기로 옮겼다(PRD 7절 — 두 곳 이상일 때만 옮긴다).
 */
export function ApplyCta({ href, label, kind, id, bookmarked, bookmarkCount }: ApplyCtaProps) {
  return (
    <div className="flex items-center gap-2">
      {href ? (
        <Button asChild className="flex-1">
          <a href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        </Button>
      ) : null}
      <BookmarkCountButton
        kind={kind}
        id={id}
        bookmarked={bookmarked}
        bookmarkCount={bookmarkCount}
      />
    </div>
  );
}
