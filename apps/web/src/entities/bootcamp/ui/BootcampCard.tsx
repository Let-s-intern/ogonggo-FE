import { BookmarkButton } from '@/features/bookmark';
import {
  isPromoted,
  type DataLayerEvent,
  type ProgramCardTracking,
} from '@/shared/analytics/dataLayer';
import { ImpressionTracker } from '@/shared/analytics/ImpressionTracker';
import { TrackedLink } from '@/shared/analytics/TrackedLink';
import { toBootcampInfo } from '../model/analytics';
import { TUITION_TYPE_LABELS } from '../model/labels';
import type { BootcampSummary } from '../model/types';
import { BootcampBadge } from './BootcampBadge';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';

export interface BootcampCardProps {
  bootcamp: BootcampSummary;
  /** 목록 안의 자리. 주면 누를 때 `program_card_click`, 광고 카드면 노출 때 `program_impression` 이 나간다. */
  tracking?: ProgramCardTracking;
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
 * 썸네일은 채용공고 카드와 같은 `JobThumbnail`이다. 대표 이미지(`representativeImageUrl`)를
 * 사진으로 볼지 로고로 볼지 같은 기준으로 가르고, 로고는 같은 넓이로 맞춰 그린다. 대표 이미지가
 * 없는 고용24 과정은 운영 회사 로고(`logoUrl`)다. 두 카드가 같은 그리드·같은 지면에 놓이므로
 * 규칙이 갈리면 로고 크기가 카드마다 달라 보인다(2026-10-02, 부트캠프 로고만 제각각 컸다).
 */
export function BootcampCard({ bootcamp, tracking }: BootcampCardProps) {
  const metaParts = [bootcamp.programType, TUITION_TYPE_LABELS[bootcamp.tuitionType]];
  const badge = (
    <BootcampBadge
      recruitmentType={bootcamp.recruitmentType}
      recruitmentEndAt={bootcamp.recruitmentEndAt}
      status={bootcamp.status}
    />
  );

  const info = toBootcampInfo(bootcamp);
  const listParams = tracking
    ? { ...info, list_position: tracking.listPosition, page_number: tracking.pageNumber }
    : null;
  const clickEvents: DataLayerEvent[] = listParams
    ? [{ event: 'program_card_click', params: listParams }]
    : [];

  const card = (
    <div className="relative h-full">
      <TrackedLink
        href={`/bootcamps/${bootcamp.id}`}
        className="group flex h-full flex-col gap-2"
        events={clickEvents}
      >
        <JobThumbnail
          companyName={bootcamp.companyName}
          coverImageUrl={bootcamp.representativeImageUrl}
          logoUrl={bootcamp.logoUrl}
        />
        <p className="flex items-center justify-between gap-2 text-xs text-gray-400">
          <span className="truncate">{metaParts.join(' · ')}</span>
          <span className="hidden md:inline-flex">{badge}</span>
        </p>
        <p className="text-sm text-gray-500">{bootcamp.companyName}</p>
        <p className="line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-blue-500">
          {bootcamp.title}
        </p>
        {/* 모바일은 제목 아래다(`docs/asset/v9 mobile/부트캠프.png`). `JobCard` 와 같은 이유다. */}
        <span className="flex md:hidden">{badge}</span>
      </TrackedLink>
      <BookmarkButton
        kind="bootcamps"
        id={bootcamp.id}
        bookmarked={bootcamp.bookmarked}
        className="absolute top-2 right-2"
      />
    </div>
  );

  return listParams && isPromoted(info) ? (
    <ImpressionTracker event="program_impression" params={listParams}>
      {card}
    </ImpressionTracker>
  ) : (
    card
  );
}
