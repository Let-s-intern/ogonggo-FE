import { Badge, Card, cn } from '@ogonggo/ui';
import { BookmarkButton } from '@/features/bookmark';
import {
  isPromoted,
  type DataLayerEvent,
  type ProgramCardTracking,
} from '@/shared/analytics/dataLayer';
import { ImpressionTracker } from '@/shared/analytics/ImpressionTracker';
import { TrackedLink } from '@/shared/analytics/TrackedLink';
import { computeDaysRemaining } from '@/shared/lib/dday';
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

/** 카드 해시태그는 기술 스택에서 앞의 세 개만 쓴다 — 목업의 태그 줄이 한 줄이다. */
const HASHTAG_LIMIT = 3;

/**
 * `사이드 스터디 디자인변경.png`(v3)의 목록 카드 — 작성자 썸네일 + `종류 · 진행방식`·닉네임 +
 * 북마크 → 제목 → 모집 배지 → 해시태그·댓글·조회수. 글자 크기는 `entities/job/ui/JobCard.tsx`,
 * `entities/bootcamp/ui/BootcampCard.tsx`와 같다.
 *
 * v1에서 바뀐 곳은 셋이다. 작성자 프로필 이미지가 왼쪽에 생기면서 메타 줄과 닉네임 줄이 그
 * 오른쪽으로 묶였고, 오른쪽 위에 있던 모집 배지가 제목 아래 자기 줄로 내려왔고, 테두리가
 * `Card` 기본값(`gray-200`)보다 한 단계 옅어졌다. `Card` 쪽 기본값은 그대로 둔다 — 바꾸면
 * 채용공고·부트캠프 카드까지 같이 옅어진다.
 *
 * 모집 직무(포지션)는 모집 배지와 붙여 둔다(`SideStudyStatus`). 무슨 사람을 찾는지가 남은
 * 자리 수와 함께 읽혀야 지원할지 고를 수 있다. 목업은 해시태그 속에 넣었지만 해시태그는 기술
 * 스택 앞 세 개만 담아 포지션이 밀려난다. 데스크톱은 배지 오른쪽, 모바일은 썸네일 옆 좁은
 * 자리라 직무를 배지 위에 세로로 쌓는다.
 *
 * 데스크톱 제목은 한 줄이어도 두 줄 높이를 잡는다(`md:min-h-10`, `text-sm` 의 줄 높이 20px 두 줄).
 * 그래야 제목 아래 배지 줄이 같은 행의 카드끼리 같은 높이에 온다. 같은 행의 카드는 높이를
 * 맞추고(`h-full`) 해시태그 줄을 바닥에 붙인다 — 제목이 한 줄인 카드에서 아래 줄이 떠 보이지 않게.
 *
 * 뿌리가 `<Link>`가 아니라 `relative`인 `div`인 이유는 북마크 버튼이다. 링크와 버튼을 형제로
 * 두고 버튼을 첫 줄 오른쪽 끝에 겹친다(PRD "카드 안의 버튼은 링크 밖에 둔다"). 세 카드 가운데
 * 여기만 아이콘이 흐름 안에 있었어서, 그 자리는 빈 칸(`BookmarkSlot`)으로 남겨 둔다 — 빼면
 * 옆 칸이 32px 넓어져 닉네임이 잘리는 지점이 달라지고 긴 닉네임이 버튼 밑으로 들어간다.
 */
export function SideStudyCard({ sideStudy, tracking }: SideStudyCardProps) {
  const metaParts = [
    KIND_LABELS[sideStudy.recruitmentType],
    OPERATION_TYPE_LABELS[sideStudy.progressMethod],
  ];
  const hashtags = sideStudy.technologyStacks.slice(0, HASHTAG_LIMIT);

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
        className="block h-full"
        events={clickEvents}
      >
        <Card className="flex h-full flex-col gap-2 border-gray-100 transition-shadow hover:shadow-md md:gap-3">
          {/*
            모바일은 카드가 좁아 로고 아래로 메타·작성자를 내린다(`docs/asset/v9 mobile/사이드 스터디.png`).
            모집 상태 배지는 모바일에서 썸네일 오른쪽 빈자리에 둔다 — 제목 아래 한 줄을 따로 쓰면
            채용공고·부트캠프 카드보다 카드가 길어진다.
          */}
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">
            {/* 모바일은 오른쪽 위에 겹치는 북마크(20px)만큼 비워 둔다. */}
            <div className="flex w-full min-w-0 items-center gap-2 pr-7 md:w-auto md:pr-0">
              <AuthorThumbnail src={sideStudy.author.profileImageUrl} />
              <span className="flex min-w-0 md:hidden">
                <SideStudyStatus sideStudy={sideStudy} stacked />
              </span>
            </div>
            <div className="w-full min-w-0 md:w-auto md:flex-1">
              <p className="truncate text-xs text-gray-400">{metaParts.join(' · ')}</p>
              <p className="truncate text-sm text-gray-600">
                {sideStudy.author.nickname ?? AUTHOR_NICKNAME_FALLBACK}
              </p>
            </div>
            <span className="hidden md:block">
              <BookmarkSlot />
            </span>
          </div>
          <p className="line-clamp-2 text-sm font-bold text-gray-900 md:min-h-10">
            {sideStudy.title}
          </p>
          <span className="hidden min-w-0 md:flex">
            <SideStudyStatus sideStudy={sideStudy} />
          </span>
          <p className="mt-auto flex flex-col items-start gap-1 text-xs text-gray-400 md:flex-row md:items-center md:justify-between md:gap-2">
            <span className="max-w-full truncate">
              {hashtags.map((tag) => `#${tag}`).join(' ')}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1">
                <CommentIcon className="h-3.5 w-3.5" />
                {sideStudy.commentCount}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon className="h-3.5 w-3.5" />
                {sideStudy.viewCount}
              </span>
            </span>
          </p>
        </Card>
      </TrackedLink>
      {/*
       * 첫 줄 오른쪽 끝, `BookmarkSlot`이 비워 둔 자리에 정확히 겹친다. 카드 안쪽 여백이 16px
       * 이고 첫 줄이 작성자 썸네일 높이(모바일 40px, 데스크톱 48px)라, 16px 에서 시작하는 그
       * 높이의 상자 안에서 세로 가운데가 아이콘의 원래 자리다.
       */}
      <BookmarkButton
        kind="side-studies"
        id={sideStudy.id}
        bookmarked={sideStudy.bookmarked}
        className="absolute top-4 right-4 flex h-10 items-center md:h-12"
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
 * 북마크 버튼이 겹치는 자리. 버튼은 링크 밖에 있어야 해서(PRD "카드 안의 버튼은 링크 밖에
 * 둔다") 이 줄에는 빈 칸만 남는다.
 *
 * 빈 칸을 남기는 이유는 옆 칸의 폭이다. 이 자리를 빼면 닉네임·메타 줄이 32px(아이콘 20px +
 * 간격 12px) 넓어져 잘리는 지점이 달라지고, 긴 닉네임이 버튼 밑으로 들어간다. 그래서 버튼을
 * 그리지 않는 기업 회원에게도 이 칸은 남는다 — 보이지 않는 여백이라 빈 버튼과 달리 누를 것이
 * 있어 보이지 않는다.
 */
function BookmarkSlot() {
  return <span aria-hidden="true" className="h-5 w-5 shrink-0" />;
}

/**
 * 작성자 프로필 이미지. 정사각(모바일 40px, 데스크톱 48px)이고, 값이 없거나 주소가 깨지면 `shared/ui/Thumbnail.tsx`가
 * 흰 배경 위 오공고 로고로 떨어진다. 상세 헤더(`widgets/side-study-detail`)와 같은 폴백이다.
 *
 * 로고 크기를 여기서 덮어쓰지 않는다. `Thumbnail`이 로고 폭을 박스 폭의 절반이되 24~96px로
 * 자르고, 그 상한·하한이 이 48px 자리를 이미 계산에 넣은 실측값이다(48px 박스에서 24px).
 *
 * **목업을 의도적으로 벗어난다.** `사이드 스터디 디자인변경.png`(v3)는 이 자리를 회색 사각형
 * 으로 그리지만, 그보다 뒤인 v4가 "썸네일이 없으면 오공고 로고"를 서비스 전체 규칙으로 정했고
 * (`prd-mypage-user.md` 7절) 공고 카드·부트캠프 카드·상세 헤더가 이미 그 규칙을 따른다. 목록
 * 카드만 회색으로 남기면 같은 글의 목록과 상세에서 같은 작성자가 다르게 보인다.
 *
 * 이 주석은 전에 "`Thumbnail`을 쓰면 카드가 클라이언트 컴포넌트가 된다"고 적고 있었는데 그것은
 * 사실이 아니다. `'use client'` 컴포넌트를 서버 컴포넌트가 import 하는 것은 허용되고 클라이언트
 * 경계는 그 컴포넌트 자신에서 시작한다 — `SideStudyCard`는 서버 컴포넌트로 남고 썸네일만 작은
 * 섬이 된다. 그 비용은 카드 안에 `useState`를 직접 둘 때 생기는 것이었다.
 */
function AuthorThumbnail({ src }: { src?: string }) {
  return (
    <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100 md:h-12 md:w-12">
      <Thumbnail src={src} alt="" className="h-full w-full" />
    </span>
  );
}

/**
 * 모집 배지와 모집 직무(`백엔드 · 마케팅`). 데스크톱은 배지 오른쪽에 한 줄로, 모바일
 * (`stacked`)은 직무를 배지 위에 둔다. 직무가 길면 한 줄에서 자르고 배지는 줄어들지 않는다.
 * 직무가 없는 글(응답에 아직 없거나 빈 배열)은 배지만 남는다.
 */
function SideStudyStatus({
  sideStudy,
  stacked = false,
}: {
  sideStudy: SideStudySummary;
  stacked?: boolean;
}) {
  const positions = (sideStudy.positions ?? []).map((position) => POSITION_LABELS[position]);
  return (
    <span
      className={cn(
        'flex min-w-0',
        stacked ? 'flex-col-reverse items-start gap-1' : 'items-center gap-2',
      )}
    >
      <span className="shrink-0">
        <SideStudyBadge sideStudy={sideStudy} />
      </span>
      {positions.length > 0 ? (
        <span className="max-w-full truncate text-xs font-medium text-gray-600">
          {positions.join(' · ')}
        </span>
      ) : null}
    </span>
  );
}

/**
 * 목업의 배지는 두 문구뿐이다 — `모집 중 N/M`(지원 수/정원) 또는 `마감`(PRD 4.3).
 * 마감이 하루 이하로 남았으면 문구는 그대로 두고 색만 주황으로 바꾼다. 채용공고·부트캠프
 * 카드가 그 자리에 D-day를 넣는 것과 다른데, 여기서는 남은 자리 수가 더 중요한 정보다.
 *
 * 모양은 채용공고·부트캠프 카드의 D-day 배지와 같은 작은 알약이다(`rounded-full px-2 py-0.5`).
 * 모바일은 썸네일 오른쪽, 데스크톱은 제목 아래에 놓인다(`SideStudyCard`).
 *
 * `CLOSED`는 모집장이 마감한 글과 마감일이 지나 자동 마감된 글을 모두 포함한다. `N`은
 * 삭제되지 않은 지원 전체 건수(`applicationCount`)이고 수락 여부와 무관하다.
 */
function SideStudyBadge({ sideStudy }: { sideStudy: SideStudySummary }) {
  if (sideStudy.recruitmentStatus === 'CLOSED') {
    return (
      <Badge tone="neutral" className="rounded-full px-2 py-0.5 text-xs font-bold">
        마감
      </Badge>
    );
  }

  const daysRemaining = computeDaysRemaining('PERIOD', sideStudy.recruitmentEndDate);
  const urgent = daysRemaining !== null && daysRemaining <= 1;

  return (
    <Badge
      tone={urgent ? 'urgent' : 'main'}
      className="rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap"
    >
      {`모집 중 ${sideStudy.applicationCount}/${sideStudy.capacity}`}
    </Badge>
  );
}
