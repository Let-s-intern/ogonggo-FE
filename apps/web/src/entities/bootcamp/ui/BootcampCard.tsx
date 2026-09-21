import Link from 'next/link';
import { BookmarkButton } from '@/features/bookmark';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { TUITION_TYPE_LABELS } from '../model/labels';
import type { BootcampSummary } from '../model/types';
import { BootcampBadge } from './BootcampBadge';

export interface BootcampCardProps {
  bootcamp: BootcampSummary;
}

/**
 * `교육부트캠프.png`의 목록 카드 — 썸네일 + 북마크 버튼 → `프로그램유형 · 수강료구분` 메타
 * 줄 + 배지 → 회사명 → 제목. 여백·라운드·글자 크기는 `entities/job/ui/JobCard.tsx`와 같다
 * (두 목록의 카드가 같은 그리드 안에서 같은 크기로 보여야 한다).
 *
 * `h-full`은 `JobCard`와 같은 이유다 — 같은 행에 제목 줄 수가 갈릴 때 아랫변을 맞춘다. 뿌리가
 * `<Link>`가 아니라 `relative`인 `div`인 것도 `JobCard`와 같은 이유다 — 링크와 북마크 버튼을
 * 형제로 둔다(PRD "카드 안의 버튼은 링크 밖에 둔다").
 *
 * 채용공고 카드와 다른 곳은 썸네일뿐이다. 부트캠프는 `representativeImageUrl`이라는 진짜
 * 대표 이미지가 응답에 있어서 `JobThumbnail`(회사 로고를 대신 쓰는 박스)을 재사용하지 않고
 * 그 URL을 그대로 그린다. `CompanyLogo`와 같은 이유로 `next/image`가 아니라 `<img>`다 —
 * 외부 호스트(`sesac.seoul.kr`)라 `next.config.ts`에 도메인을 등록해야 하고, 목데이터 단계에서
 * 그 설정을 늘릴 이유가 없다. 로드에 실패하면 뒤의 회색 박스가 그대로 보인다.
 */
export function BootcampCard({ bootcamp }: BootcampCardProps) {
  const metaParts = [bootcamp.programType, TUITION_TYPE_LABELS[bootcamp.tuitionType]];

  return (
    <div className="relative h-full">
      <Link href={`/bootcamps/${bootcamp.id}`} className="flex h-full flex-col gap-2">
        <div className="relative aspect-[8/5] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm">
          <Thumbnail src={bootcamp.representativeImageUrl} alt="" className="h-full w-full" />
        </div>
        <p className="flex items-center justify-between gap-2 text-xs text-gray-400">
          <span className="truncate">{metaParts.join(' · ')}</span>
          <BootcampBadge
            recruitmentType={bootcamp.recruitmentType}
            recruitmentEndAt={bootcamp.recruitmentEndAt}
            status={bootcamp.status}
          />
        </p>
        <p className="text-sm text-gray-500">{bootcamp.companyName}</p>
        <p className="line-clamp-2 text-sm font-bold text-gray-900">{bootcamp.title}</p>
      </Link>
      <BookmarkButton
        kind="bootcamps"
        id={bootcamp.id}
        bookmarked={bootcamp.bookmarked}
        className="absolute top-2 right-2"
      />
    </div>
  );
}
