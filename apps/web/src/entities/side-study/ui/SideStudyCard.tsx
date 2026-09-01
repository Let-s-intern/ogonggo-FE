import Link from 'next/link';
import { Badge } from '@ogonggo/ui';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { computeDaysRemaining } from '@/shared/lib/dday';
import { BookmarkIcon, CommentIcon, EyeIcon } from '@/shared/ui/icons';
import { KIND_LABELS, OPERATION_TYPE_LABELS } from '../model/labels';
import type { SideStudySummary } from '../model/types';

export interface SideStudyCardProps {
  sideStudy: SideStudySummary;
}

/** 카드 해시태그는 모집 포지션과 기술 스택에서 앞의 세 개만 쓴다 — 목업의 태그 줄이 한 줄이다. */
const HASHTAG_LIMIT = 3;

/**
 * `사이드스터디.png`의 목록 카드 — 썸네일 + 북마크 → `종류 · 진행방식` 메타 줄 + 배지 →
 * 작성자 닉네임 → 제목 → 해시태그 → 댓글·조회수. 여백·라운드·글자 크기는
 * `entities/job/ui/JobCard.tsx`, `entities/bootcamp/ui/BootcampCard.tsx`와 같다.
 *
 * 썸네일은 회색 박스다. 목데이터를 지어냈으니 걸어 둘 이미지가 없고, `CompanyLogo`가 로고를
 * 모를 때 하는 것과 같은 처리로 둔다(Push 3 task 파일 선행 조건의 결정). `thumbnailUrl`이
 * 응답에 있으면 그때 이 자리에 그린다.
 *
 * 상세(`/side-studies/{id}`)는 Push 4에서 만든다. 링크는 지금 걸어 둔다 —
 * `BootcampCard`도 상세보다 먼저 목록이 만들어졌다.
 */
export function SideStudyCard({ sideStudy }: SideStudyCardProps) {
  const metaParts = [KIND_LABELS[sideStudy.kind], OPERATION_TYPE_LABELS[sideStudy.operationType]];
  const hashtags = [...sideStudy.positions, ...sideStudy.techStack].slice(0, HASHTAG_LIMIT);

  return (
    <Link href={`/side-studies/${sideStudy.id}`} className="flex flex-col gap-2">
      <div className="relative aspect-[8/5] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm">
        <Thumbnail src={sideStudy.thumbnailUrl} alt="" className="h-full w-full" />
        {/* API 없음: 북마크 토글은 이 PRD의 범위 밖이라 `bookmarked` 표시 전용이다(PRD 8절).
            누르는 동작을 붙이려면 사이드·스터디 북마크 API가 먼저 있어야 한다 — 지금은
            엔드포인트 자체가 없다. */}
        <BookmarkIcon filled={sideStudy.bookmarked} className="absolute right-2 top-2 h-6 w-6" />
      </div>
      <p className="flex items-center justify-between gap-2 text-xs text-gray-400">
        <span className="truncate">{metaParts.join(' · ')}</span>
        <SideStudyBadge sideStudy={sideStudy} />
      </p>
      <p className="text-sm text-gray-500">{sideStudy.authorNickname}</p>
      <p className="line-clamp-2 text-sm font-bold text-gray-900">{sideStudy.title}</p>
      <p className="flex items-center justify-between gap-2 text-xs text-gray-400">
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
    </Link>
  );
}

/**
 * 목업의 배지는 두 문구뿐이다 — `모집 중 N/M`(현재 인원/정원) 또는 `마감`(PRD 4.3).
 * 마감이 하루 이하로 남았으면 문구는 그대로 두고 색만 주황으로 바꾼다. 채용공고·부트캠프
 * 카드가 그 자리에 D-day를 넣는 것과 다른데, 여기서는 남은 자리 수가 더 중요한 정보다.
 */
function SideStudyBadge({ sideStudy }: { sideStudy: SideStudySummary }) {
  if (sideStudy.closed) {
    return (
      <Badge tone="neutral" className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
        마감
      </Badge>
    );
  }

  const daysRemaining = computeDaysRemaining('PERIOD', sideStudy.recruitmentEndAt);
  const urgent = daysRemaining !== null && daysRemaining <= 1;

  return (
    <Badge
      tone={urgent ? 'urgent' : 'main'}
      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
    >
      {`모집 중 ${sideStudy.appliedCount}/${sideStudy.capacity}`}
    </Badge>
  );
}
