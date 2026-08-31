import { BookmarkIcon } from '@/shared/ui/icons';

export interface JobThumbnailProps {
  bookmarked: boolean;
}

/**
 * 카드 상단의 회색 placeholder 박스. 목업 자체가 실사진이 아니라 회색 박스라(PRD 10절) 이미지
 * URL을 지어내지 않고 빈 박스로 둔다. 목업 실측 비율은 4:3보다 낮은(더 납작한) `8:5`에 가깝다.
 * 북마크 아이콘은 `job.bookmarked` 표시 전용 — 클릭해도 상태가 바뀌지 않는다(PRD 7절).
 *
 * D-day는 이 박스 위에 얹지 않는다 — 목업을 다시 확인해 보니 인기 공고·전체 공고 카드 모두
 * D-day가 썸네일 "아래" 메타 줄의 평문 텍스트다(썸네일에 얹힌 배지가 아니다). 배지 스타일은
 * 상세 페이지(`JobDetailHeaderCard`)에만 쓴다.
 */
export function JobThumbnail({ bookmarked }: JobThumbnailProps) {
  return (
    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-m bg-gray-100">
      <BookmarkIcon filled={bookmarked} className="absolute right-2 top-2 h-6 w-6" />
    </div>
  );
}
