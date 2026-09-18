import { Card } from '@ogonggo/ui';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import {
  AUTHOR_NICKNAME_FALLBACK,
  KIND_LABELS,
  OPERATION_TYPE_LABELS,
} from '@/entities/side-study/model/labels';
import type { SideStudyDetail } from '@/entities/side-study/model/types';
import { parseLocalDate } from '@/shared/lib/localDate';
import { DdayBadge } from '@/shared/ui/DdayBadge';
import { EyeIcon } from '@/shared/ui/icons';

export interface SideStudyDetailHeaderCardProps {
  sideStudy: SideStudyDetail;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 헤더의 모집 기간 문구("2026/7/10(토) ~ 7/25(토) 마감"). 목업은 끝에 마감 시각(`23:59`) 을
 * 붙이지만 모집글은 날짜만 준다(`recruitmentStartDate`, `recruitmentEndDate`) — 시각은 적지
 * 않는다. 날짜는 시간대 없이 읽는다(`shared/lib/localDate.ts`). 연도는 시작일에만 붙는다.
 *
 * 채용공고·부트캠프 헤더의 같은 자리를 만드는 `formatDeadlineText`와 같은 역할이고, 위젯끼리
 * 임포트하지 않으므로(`widgets/README.md`) 여기에 따로 둔다.
 */
function formatRecruitmentPeriod(sideStudy: SideStudyDetail): string {
  const formatDate = (value: string, withYear: boolean): string => {
    const date = parseLocalDate(value);
    const weekday = WEEKDAY_LABELS[date.getDay()];
    const day = `${date.getMonth() + 1}/${date.getDate()}(${weekday})`;
    return withYear ? `${date.getFullYear()}/${day}` : day;
  };

  return `${formatDate(sideStudy.recruitmentStartDate, true)} ~ ${formatDate(sideStudy.recruitmentEndDate, false)} 마감`;
}

/**
 * `사이드스터디 상세페이지.png` 상단 카드 — 모집장 닉네임 + 제목 + 우측 종류 라벨 + 구분선 +
 * D-day 배지 · 모집 기간 · 조회수. 여백(`p-8`)과 구성은 채용공고·부트캠프 상세 헤더 카드와
 * 같은 값이라 세 상세 화면의 글자 시작 x가 한 줄로 맞는다.
 *
 * 목업의 프로필 자리에는 모집장 프로필 사진(`author.profileImageUrl`) 을 그린다. 없거나
 * 불러오지 못하면 `Thumbnail` 의 기본 이미지로 떨어진다. 닉네임은 선택 필드라 없으면 대체
 * 문구를 쓴다.
 *
 * 닉네임 아래 줄은 목업에 `~~ · ~~`라는 두 칸짜리 자리 표시만 있어 무엇이 들어가는지 갈리지
 * 않는다. 우측 라벨이 이미 종류를 말하고 있으므로 남은 두 가지, 진행 방식과 활동 기간
 * (`activityDurationMonths` 개월) 을 넣는다.
 *
 * API 없음: 목업 우측 하단에는 조회수와 나란히 댓글 수도 있으나 그리지 않는다. 댓글·대댓글이
 * 이 PRD의 범위 밖이고(PRD 8절, 2026-09-01 결정) 사이드바의 댓글 영역 자리도 `비슷한
 * 사이드·스터디`로 대체했다 — 스레드가 없는 화면에 개수만 남으면 눌러도 갈 곳이 없다.
 * 목록 카드는 카드 안에서 정보 한 줄로 끝나므로 거기서는 그대로 그린다.
 */
export function SideStudyDetailHeaderCard({ sideStudy }: SideStudyDetailHeaderCardProps) {
  const subtitleParts = [
    OPERATION_TYPE_LABELS[sideStudy.progressMethod],
    `${sideStudy.activityDurationMonths}개월`,
  ];

  return (
    <Card className="bg-gray-50 p-8">
      <div className="flex items-center gap-3">
        <Thumbnail
          src={sideStudy.author.profileImageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-md shadow-sm"
        />
        <div>
          <p className="font-bold text-gray-900">
            {sideStudy.author.nickname ?? AUTHOR_NICKNAME_FALLBACK}
          </p>
          <p className="text-sm text-gray-500">{subtitleParts.join(' · ')}</p>
        </div>
      </div>
      <div className="mt-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{sideStudy.title}</h1>
        <span className="shrink-0 text-sm font-bold text-blue-600">
          {KIND_LABELS[sideStudy.recruitmentType]}
        </span>
      </div>
      <hr className="my-6 border-gray-200" />
      <div className="flex items-center gap-3 text-sm">
        {/* 모집글에는 상시 모집이 없다 — 마감일이 필수라 `PERIOD`를 고정으로 넘긴다. 마감일이
            지났으면 `DdayBadge`가 아무것도 그리지 않는다(`shared/lib/dday.ts`). */}
        <DdayBadge recruitmentType="PERIOD" recruitmentEndAt={sideStudy.recruitmentEndDate} />
        <span className="text-gray-500">{formatRecruitmentPeriod(sideStudy)}</span>
        <span className="ml-auto flex items-center gap-1 text-gray-400">
          <EyeIcon className="h-4 w-4" />
          {sideStudy.viewCount}
        </span>
      </div>
    </Card>
  );
}
