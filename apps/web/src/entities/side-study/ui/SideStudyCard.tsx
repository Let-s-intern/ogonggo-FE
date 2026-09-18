import Link from 'next/link';
import { Badge, Card } from '@ogonggo/ui';
import { computeDaysRemaining } from '@/shared/lib/dday';
import { BookmarkIcon, CommentIcon, EyeIcon } from '@/shared/ui/icons';
import { AUTHOR_NICKNAME_FALLBACK, KIND_LABELS, OPERATION_TYPE_LABELS } from '../model/labels';
import type { SideStudySummary } from '../model/types';

export interface SideStudyCardProps {
  sideStudy: SideStudySummary;
}

/** 카드 해시태그는 기술 스택에서 앞의 세 개만 쓴다 — 목업의 태그 줄이 한 줄이다. */
const HASHTAG_LIMIT = 3;

/**
 * `사이드스터디.png`의 목록 카드 — `종류 · 진행방식` 메타 줄 + 배지 → 작성자 닉네임 + 북마크 →
 * 제목 → 해시태그 → 댓글·조회수. 글자 크기는 `entities/job/ui/JobCard.tsx`,
 * `entities/bootcamp/ui/BootcampCard.tsx`와 같다.
 *
 * 목업의 썸네일과 해시태그의 모집 포지션은 없다. 목록 응답(`RecruitmentPostSummaryResponse`) 에
 * 둘 다 없어 화면을 응답에 맞췄다(PRD Push 5 "사용자 결정"). 썸네일이 빠지면 카드가 글자만
 * 남아 그리드 안에서 경계가 보이지 않으므로 `Card`(`@ogonggo/ui`) 테두리로 감싸고, 썸네일 위에
 * 있던 북마크 아이콘은 닉네임 줄 오른쪽으로 옮겼다. 같은 행의 카드는 높이를 맞추고(`h-full`)
 * 해시태그 줄을 바닥에 붙인다 — 제목이 한 줄인 카드에서 아래 줄이 떠 보이지 않게.
 */
export function SideStudyCard({ sideStudy }: SideStudyCardProps) {
  const metaParts = [
    KIND_LABELS[sideStudy.recruitmentType],
    OPERATION_TYPE_LABELS[sideStudy.progressMethod],
  ];
  const hashtags = sideStudy.technologyStacks.slice(0, HASHTAG_LIMIT);

  return (
    <Link href={`/side-studies/${sideStudy.id}`} className="block h-full">
      <Card className="flex h-full flex-col gap-2">
        <p className="flex items-center justify-between gap-2 text-xs text-gray-400">
          <span className="truncate">{metaParts.join(' · ')}</span>
          <SideStudyBadge sideStudy={sideStudy} />
        </p>
        <p className="flex items-center justify-between gap-2 text-sm text-gray-500">
          <span className="truncate">{sideStudy.author.nickname ?? AUTHOR_NICKNAME_FALLBACK}</span>
          {/* 표시 전용이다. 북마크 토글은 이 PRD의 범위 밖이다(PRD 8절). */}
          <BookmarkIcon filled={sideStudy.bookmarked} className="h-5 w-5 shrink-0" />
        </p>
        <p className="line-clamp-2 text-sm font-bold text-gray-900">{sideStudy.title}</p>
        <p className="mt-auto flex items-center justify-between gap-2 text-xs text-gray-400">
          <span className="truncate">{hashtags.map((tag) => `#${tag}`).join(' ')}</span>
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
    </Link>
  );
}

/**
 * 목업의 배지는 두 문구뿐이다 — `모집 중 N/M`(지원 수/정원) 또는 `마감`(PRD 4.3).
 * 마감이 하루 이하로 남았으면 문구는 그대로 두고 색만 주황으로 바꾼다. 채용공고·부트캠프
 * 카드가 그 자리에 D-day를 넣는 것과 다른데, 여기서는 남은 자리 수가 더 중요한 정보다.
 *
 * `CLOSED` 는 모집장이 마감한 글과 마감일이 지나 자동 마감된 글을 모두 포함한다. `N` 은
 * 삭제되지 않은 지원 전체 건수(`applicationCount`) 이고 수락 여부와 무관하다.
 */
function SideStudyBadge({ sideStudy }: { sideStudy: SideStudySummary }) {
  if (sideStudy.recruitmentStatus === 'CLOSED') {
    return (
      <Badge tone="neutral" className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
        마감
      </Badge>
    );
  }

  const daysRemaining = computeDaysRemaining('PERIOD', sideStudy.recruitmentEndDate);
  const urgent = daysRemaining !== null && daysRemaining <= 1;

  return (
    <Badge
      tone={urgent ? 'urgent' : 'main'}
      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
    >
      {`모집 중 ${sideStudy.applicationCount}/${sideStudy.capacity}`}
    </Badge>
  );
}
