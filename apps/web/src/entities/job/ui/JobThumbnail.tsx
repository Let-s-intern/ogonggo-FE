import { cn } from '@ogonggo/ui';
import { BookmarkIcon } from '@/shared/ui/icons';
import { CompanyLogo } from './CompanyLogo';

export interface JobThumbnailProps {
  companyName: string;
  bookmarked: boolean;
}

/**
 * 카드 상단 썸네일. 채용공고 자체의 사진은 크롤러가 아예 수집하지 않는 데이터라(어떤 필드에도
 * 없다) 지어내지 않는다 — 대신 실제로 있는 유일한 이미지인 회사 로고(`CompanyLogo`, 없으면
 * 회색 placeholder로 이미 알아서 떨어진다)를 재사용한다. 목업 실측 비율은 4:3보다 낮은(더
 * 납작한) `8:5`에 가깝다. 북마크 아이콘은 `job.bookmarked` 표시 전용 — 클릭해도 상태가 바뀌지
 * 않는다(PRD 7절).
 *
 * D-day는 이 박스 위에 얹지 않는다 — 목업 실측 결과 인기 공고·전체 공고 카드 모두 D-day가
 * 썸네일 "아래" 메타 줄의 평문 텍스트다. 배지 스타일은 상세 페이지(`JobDetailHeaderCard`)에만
 * 쓴다.
 *
 * `CompanyLogo`의 기본값(`object-cover`)을 여기서만 `object-contain`으로 되돌린다 — 이 박스는
 * `8:5`로 넓어서 `cover`를 쓰면 로고가 세로 기준으로 과하게 확대돼 옆으로 심하게 잘린다. 정사각형에
 * 가까운 다른 곳(상세 헤더 64×64, 비슷한 공고 48×48)은 기본값 그대로 `cover`를 쓴다.
 */
export function JobThumbnail({ companyName, bookmarked }: JobThumbnailProps) {
  return (
    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-m bg-white shadow-sm">
      <CompanyLogo
        companyName={companyName}
        className={cn(
          'absolute inset-0 h-full w-full object-contain p-4 shadow-none',
        )}
      />
      <BookmarkIcon filled={bookmarked} className="absolute right-2 top-2 h-6 w-6" />
    </div>
  );
}
