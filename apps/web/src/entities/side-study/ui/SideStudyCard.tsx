import Link from 'next/link';
import { Badge, Card } from '@ogonggo/ui';
import { BookmarkButton } from '@/features/bookmark';
import { computeDaysRemaining } from '@/shared/lib/dday';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { CommentIcon, EyeIcon } from '@/shared/ui/icons';
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
 *
 * 뿌리가 `<Link>`가 아니라 `relative`인 `div`인 이유는 북마크 버튼이다. 링크와 버튼을 형제로
 * 두고 버튼을 첫 줄 오른쪽 끝에 겹친다(PRD "카드 안의 버튼은 링크 밖에 둔다"). 세 카드 가운데
 * 여기만 아이콘이 흐름 안에 있었어서, 그 자리는 빈 칸(`BookmarkSlot`)으로 남겨 둔다 — 빼면
 * 옆 칸이 32px 넓어져 닉네임이 잘리는 지점이 달라지고 긴 닉네임이 버튼 밑으로 들어간다.
 */
export function SideStudyCard({ sideStudy }: SideStudyCardProps) {
  const metaParts = [
    KIND_LABELS[sideStudy.recruitmentType],
    OPERATION_TYPE_LABELS[sideStudy.progressMethod],
  ];
  const hashtags = sideStudy.technologyStacks.slice(0, HASHTAG_LIMIT);

  return (
    <div className="relative h-full">
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
            <BookmarkSlot />
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
      {/*
       * 첫 줄 오른쪽 끝, `BookmarkSlot`이 비워 둔 자리에 정확히 겹친다. 카드 안쪽 여백이 16px
       * 이고 첫 줄이 48px(작성자 썸네일)이라, 16px 에서 시작하는 48px 상자 안에서 세로 가운데가
       * 아이콘의 원래 자리다.
       */}
      <BookmarkButton
        kind="side-studies"
        id={sideStudy.id}
        bookmarked={sideStudy.bookmarked}
        className="absolute top-4 right-4 flex h-12 items-center"
        iconClassName="h-5 w-5"
      />
    </div>
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
 * 작성자 프로필 이미지. 48px 정사각이고, 값이 없거나 주소가 깨지면 `shared/ui/Thumbnail.tsx`가
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
    <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
      <Thumbnail src={src} alt="" className="h-full w-full" />
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
