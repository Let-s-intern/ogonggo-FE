import { Badge } from '@ogonggo/ui';
import { BookmarkButton } from '@/features/bookmark';
import {
  isPromoted,
  type DataLayerEvent,
  type ProgramCardTracking,
} from '@/shared/analytics/dataLayer';
import { ImpressionTracker } from '@/shared/analytics/ImpressionTracker';
import { TrackedLink } from '@/shared/analytics/TrackedLink';
import { closedLabel, computeDday, isDdayUrgent } from '@/shared/lib/dday';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { CommentIcon, EyeIcon } from '@/shared/ui/icons';
import { toSideStudyInfo } from '../model/analytics';
import {
  AUTHOR_NICKNAME_FALLBACK,
  KIND_LABELS,
  OPERATION_TYPE_LABELS,
  POSITION_LABELS,
} from '../model/labels';
import type { SideStudySummary } from '../model/types';

export interface SideStudyCardProps {
  sideStudy: SideStudySummary;
  /** 목록 안의 자리. 주면 누를 때 `program_card_click`, 광고 카드면 노출 때 `program_impression` 이 나간다. */
  tracking?: ProgramCardTracking;
}

/**
 * `docs/asset/v14 사이드스터디 디자인 업데이트`의 목록 카드. 데스크톱과 모바일이 모양부터 다르다.
 *
 * - 데스크톱(`데스크탑.png`): 테두리 카드. 글 썸네일 위에 D-day 배지·`종류 · 진행방식`·북마크가
 *   겹치고, 그 아래 제목 두 줄 → 모집 직무 → 구분선 → 작성자·댓글·조회수.
 * - 모바일(`모바일.png`): 테두리 없는 한 줄 목록. 배지·메타·북마크 한 줄 → 제목 세 줄과 오른쪽
 *   작은 썸네일 → 모집 직무 → 구분선 → 작성자·댓글·조회수. 항목 사이 선은 목록(`SideStudyList`)이 긋는다.
 *
 * 시안은 제목 위에 회색 작은 글씨로 `스터디 명`을 두고 굵은 글씨에 한 줄 소개를 넣었지만, 목록
 * 응답(`RecruitmentPostSummaryResponse`)에는 한 줄 소개(`summary`)가 없다(상세에만 있다). 그래서
 * 굵은 자리에 제목을 두고 작은 줄은 뺐다.
 *
 * v3 카드에 있던 `모집 중 N/M` 배지, 기술 스택 해시태그, 작성자 정사각 썸네일은 시안에서 빠졌다.
 *
 * 같은 행의 카드는 높이를 맞추고(`h-full`) 작성자 줄을 바닥에 붙인다(`mt-auto`). 직무가 없는 글은
 * 그 줄이 비고, 데스크톱 제목은 한 줄이어도 두 줄 높이를 잡아 직무 줄이 같은 높이에 온다.
 *
 * 뿌리가 `<Link>`가 아니라 `relative`인 `div`인 이유는 북마크 버튼이다. 링크와 버튼을 형제로
 * 두고 버튼을 겹친다(PRD "카드 안의 버튼은 링크 밖에 둔다"). 모바일은 첫 줄 오른쪽 끝, 데스크톱은
 * 썸네일 오른쪽 위다.
 */
export function SideStudyCard({ sideStudy, tracking }: SideStudyCardProps) {
  const meta = `${KIND_LABELS[sideStudy.recruitmentType]} · ${OPERATION_TYPE_LABELS[sideStudy.progressMethod]}`;
  const positions = sideStudy.positions.map((position) => POSITION_LABELS[position]);

  const info = toSideStudyInfo(sideStudy);
  const listParams = tracking
    ? { ...info, list_position: tracking.listPosition, page_number: tracking.pageNumber }
    : null;
  const clickEvents: DataLayerEvent[] = listParams
    ? [{ event: 'program_card_click', params: listParams }]
    : [];

  const card = (
    <div className="relative h-full">
      <TrackedLink
        href={`/side-studies/${sideStudy.id}`}
        className="group flex h-full flex-col gap-3 px-4 py-6 md:rounded-2xl md:border md:border-gray-100 md:bg-white md:p-4 md:transition-shadow md:hover:shadow-md"
        events={clickEvents}
      >
        {/* 모바일 첫 줄. 오른쪽 끝은 북마크 버튼이 겹치는 자리라 비워 둔다. */}
        <p className="flex h-6 items-center gap-2 pr-8 md:hidden">
          <SideStudyBadge sideStudy={sideStudy} />
          <span className="truncate text-xs text-gray-500">{meta}</span>
        </p>

        {/*
          데스크톱 썸네일. 시안은 Gray 100 바탕에 검정 1→0 세로 그라데이션을 20% 로 덮는다(시안 픽셀:
          맨 위 #C3C4C6, 맨 아래 #F3F4F6). 흰 글씨가 사진·로고 위에서도 읽히게 하는 막이다.
        */}
        <div className="relative hidden aspect-[8/5] w-full overflow-hidden rounded-lg bg-gray-100 md:block">
          <Thumbnail src={sideStudy.thumbnailUrl} alt="" className="h-full w-full" />
          <div className="absolute inset-0 bg-linear-to-b from-black/20 to-transparent" />
          <p className="absolute top-3 right-10 left-3 flex items-center gap-2">
            <SideStudyBadge sideStudy={sideStudy} />
            <span className="truncate text-xs font-medium text-white">{meta}</span>
          </p>
        </div>

        <div className="flex items-start gap-4 md:flex-col md:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:w-full">
            <p className="line-clamp-3 text-sm font-bold break-words text-gray-900 transition-colors group-hover:text-blue-500 md:line-clamp-2 md:min-h-12 md:text-base">
              {sideStudy.title}
            </p>
            {positions.length > 0 ? (
              <p className="flex min-w-0 items-center gap-1.5 text-sm text-gray-600">
                <span
                  aria-hidden="true"
                  className="icon-[lucide--id-card] block h-4 w-4 shrink-0 text-blue-500"
                />
                <span className="truncate">{positions.join('  ')}</span>
              </p>
            ) : null}
          </div>
          {/* 모바일 썸네일. 데스크톱은 위의 큰 썸네일이 대신한다. */}
          <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 md:hidden">
            <Thumbnail src={sideStudy.thumbnailUrl} alt="" className="h-full w-full" />
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-3">
          <span className="block h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
            <Thumbnail src={sideStudy.author.profileImageUrl} alt="" className="h-full w-full" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
            {sideStudy.author.nickname ?? AUTHOR_NICKNAME_FALLBACK}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <CommentIcon className="h-3.5 w-3.5" />
              {sideStudy.commentCount}
            </span>
            <span className="flex items-center gap-1">
              <EyeIcon className="h-3.5 w-3.5" />
              {sideStudy.viewCount}
            </span>
          </span>
        </div>
      </TrackedLink>
      {/*
       * 모바일은 첫 줄(위 여백 24px, 높이 24px) 오른쪽 끝, 데스크톱은 썸네일(카드 안쪽 16px)
       * 오른쪽 위에서 12px 안쪽이다.
       */}
      <BookmarkButton
        kind="side-studies"
        id={sideStudy.id}
        bookmarked={sideStudy.bookmarked}
        className="absolute top-6 right-4 flex h-6 items-center md:top-7 md:right-7"
        iconClassName="h-5 w-5"
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

/**
 * 시안의 배지는 D-day(`D-7`) 하나다. 마감이 하루 이하로 남았으면 채용공고·부트캠프 카드처럼
 * 주황으로 바꾼다. `CLOSED`(모집장이 마감했거나 마감일이 지나 자동 마감된 글)와, 아직 `CLOSED`
 * 로 바뀌지 않았지만 마감일이 지난 글은 회색 `마감`이다.
 */
function SideStudyBadge({ sideStudy }: { sideStudy: SideStudySummary }) {
  const dday =
    sideStudy.recruitmentStatus === 'CLOSED'
      ? null
      : computeDday('PERIOD', sideStudy.recruitmentEndDate);

  if (!dday) {
    return (
      <Badge tone="neutral" className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold">
        {closedLabel('side-study')}
      </Badge>
    );
  }

  return (
    <Badge
      tone={isDdayUrgent('PERIOD', sideStudy.recruitmentEndDate) ? 'urgent' : 'main'}
      className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold whitespace-nowrap"
    >
      {dday}
    </Badge>
  );
}
