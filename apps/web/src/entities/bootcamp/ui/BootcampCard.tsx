import Link from 'next/link';
import { BookmarkIcon } from '@/shared/ui/icons';
import { TUITION_TYPE_LABELS } from '../model/labels';
import type { BootcampSummary } from '../model/types';
import { BootcampBadge } from './BootcampBadge';

export interface BootcampCardProps {
  bootcamp: BootcampSummary;
}

/**
 * `교육부트캠프.png`의 목록 카드 — 썸네일 + 북마크 아이콘 → `프로그램유형 · 수강료구분` 메타
 * 줄 + 배지 → 회사명 → 제목. 여백·라운드·글자 크기는 `entities/job/ui/JobCard.tsx`와 같다
 * (두 목록의 카드가 같은 그리드 안에서 같은 크기로 보여야 한다).
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
    <Link href={`/bootcamps/${bootcamp.id}`} className="flex flex-col gap-2">
      <div className="relative aspect-[8/5] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm">
        <img
          src={bootcamp.representativeImageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
        {/* API 없음: `UserBootcampSummaryResponse`에 북마크 여부 필드가 없다(채용공고의
            `bookmarked`에 해당하는 것이 부트캠프 응답에는 아예 없다). 목업에 아이콘이 있어
            자리는 그리되 항상 빈 아이콘이다 — 실제 API로 붙일 때 목록 응답에 북마크 여부
            필드가 필요하다. 토글은 이 PRD의 범위 밖이다(PRD 8절). */}
        <BookmarkIcon className="absolute right-2 top-2 h-6 w-6" />
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
  );
}
