import { Badge } from '@ogonggo/ui';
import { BookmarkIcon } from '@/shared/ui/icons';

export interface JobThumbnailProps {
  bookmarked: boolean;
  /** 미리 계산한 D-day 문구(`entities/job/model/dday.ts`의 `computeDday`). 없으면 배지를 생략한다. */
  dday?: string | null;
}

/**
 * 카드 상단의 회색 placeholder 박스. 목업 자체가 실사진이 아니라 회색 박스라(PRD 10절) 이미지
 * URL을 지어내지 않고 빈 박스로 둔다. 북마크 아이콘은 `job.bookmarked` 표시 전용 — 클릭해도
 * 상태가 바뀌지 않는다(PRD 7절).
 */
export function JobThumbnail({ bookmarked, dday }: JobThumbnailProps) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-m bg-gray-100">
      {dday ? (
        <Badge tone="urgent" className="absolute left-2 top-2">
          {dday}
        </Badge>
      ) : null}
      <BookmarkIcon filled={bookmarked} className="absolute right-2 top-2 h-5 w-5" />
    </div>
  );
}
