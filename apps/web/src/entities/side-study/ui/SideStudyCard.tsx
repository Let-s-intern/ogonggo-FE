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
 * `사이드 스터디 디자인변경.png`(v3)의 목록 카드 — 작성자 썸네일 + `종류 · 진행방식`·닉네임 +
 * 북마크 → 제목 → 모집 배지 → 해시태그·댓글·조회수. 글자 크기는 `entities/job/ui/JobCard.tsx`,
 * `entities/bootcamp/ui/BootcampCard.tsx`와 같다.
 *
 * v1에서 바뀐 곳은 셋이다. 작성자 프로필 이미지가 왼쪽에 생기면서 메타 줄과 닉네임 줄이 그
 * 오른쪽으로 묶였고, 오른쪽 위에 있던 모집 배지가 제목 아래 자기 줄로 내려왔고, 테두리가
 * `Card` 기본값(`gray-200`)보다 한 단계 옅어졌다. `Card` 쪽 기본값은 그대로 둔다 — 바꾸면
 * 채용공고·부트캠프 카드까지 같이 옅어진다.
 *
 * 목업의 해시태그 속 모집 포지션은 없다. 목록 응답(`RecruitmentPostSummaryResponse`)에 없어
 * 화면을 응답에 맞췄다(PRD Push 5 "사용자 결정"). 같은 행의 카드는 높이를 맞추고(`h-full`)
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
      <Card className="flex h-full flex-col gap-3 border-gray-100 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <AuthorThumbnail src={sideStudy.author.profileImageUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-gray-400">{metaParts.join(' · ')}</p>
            <p className="truncate text-sm text-gray-600">
              {sideStudy.author.nickname ?? AUTHOR_NICKNAME_FALLBACK}
            </p>
          </div>
          {/* 표시 전용이다. 북마크 토글은 이 PRD의 범위 밖이다(PRD 8절). */}
          <BookmarkIcon filled={sideStudy.bookmarked} className="h-5 w-5 shrink-0" />
        </div>
        <p className="line-clamp-2 text-sm font-bold text-gray-900">{sideStudy.title}</p>
        <SideStudyBadge sideStudy={sideStudy} />
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
 * 작성자 프로필 이미지. 48px 정사각이고 값이 없으면 목업 그대로 회색 사각형만 남는다.
 *
 * `shared/ui/Thumbnail.tsx`를 쓰지 않는 이유는 폴백이 다르기 때문이다. 그쪽은 기본 썸네일
 * 이미지로 떨어지는데(빈 박스가 "못 불러왔다"와 "원래 없다"를 구분해 주지 않아서), 프로필
 * 이미지는 "원래 없다"가 흔한 선택 필드이고 목업도 그 자리를 회색 사각형으로 그린다.
 *
 * 그래서 `onError` 상태도 두지 않는다 — 주소가 깨져도 `alt=""`인 이미지는 아무것도 그리지 않아
 * 뒤의 회색 바탕이 그대로 남는다. 상태를 두면 이 카드가 클라이언트 컴포넌트가 되는데, 목록
 * 한 페이지에 여덟 장이 서버에서 그려지는 쪽이 낫다.
 *
 * `next/image`도 쓰지 않는다. 작성자 프로필 이미지의 호스트를 미리 알 수 없어
 * `next.config.ts`에 등록할 수 없다(`Thumbnail.tsx`와 같은 이유).
 */
function AuthorThumbnail({ src }: { src?: string }) {
  return (
    <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}
    </span>
  );
}

/**
 * 목업의 배지는 두 문구뿐이다 — `모집 중 N/M`(지원 수/정원) 또는 `마감`(PRD 4.3).
 * 마감이 하루 이하로 남았으면 문구는 그대로 두고 색만 주황으로 바꾼다. 채용공고·부트캠프
 * 카드가 그 자리에 D-day를 넣는 것과 다른데, 여기서는 남은 자리 수가 더 중요한 정보다.
 *
 * v3에서 모양이 `Badge` 기본값(`rounded-sm px-2 py-1`)과 같아져 덮어쓸 것이 글자 크기뿐이다.
 * 제목 아래 자기 줄에 혼자 있어서 `self-start`로 폭을 글자에 맞춘다 — 없으면 `flex-col`의
 * 기본 늘이기에 걸려 카드 폭만큼 늘어난다.
 *
 * `CLOSED`는 모집장이 마감한 글과 마감일이 지나 자동 마감된 글을 모두 포함한다. `N`은
 * 삭제되지 않은 지원 전체 건수(`applicationCount`)이고 수락 여부와 무관하다.
 */
function SideStudyBadge({ sideStudy }: { sideStudy: SideStudySummary }) {
  if (sideStudy.recruitmentStatus === 'CLOSED') {
    return (
      <Badge tone="neutral" className="self-start text-xs font-bold">
        마감
      </Badge>
    );
  }

  const daysRemaining = computeDaysRemaining('PERIOD', sideStudy.recruitmentEndDate);
  const urgent = daysRemaining !== null && daysRemaining <= 1;

  return (
    <Badge tone={urgent ? 'urgent' : 'main'} className="self-start text-xs font-bold">
      {`모집 중 ${sideStudy.applicationCount}/${sideStudy.capacity}`}
    </Badge>
  );
}
