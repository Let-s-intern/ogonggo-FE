import { Card } from '@ogonggo/ui';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { KIND_LABELS, OPERATION_TYPE_LABELS } from '@/entities/side-study/model/labels';
import type { SideStudyDetail } from '@/entities/side-study/model/types';
import { DdayBadge } from '@/shared/ui/DdayBadge';
import { EyeIcon } from '@/shared/ui/icons';

export interface SideStudyDetailHeaderCardProps {
  sideStudy: SideStudyDetail;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 헤더의 모집 기간 문구("2026/7/10(토) ~ 7/25(토) 23:59 마감") — 목업이 쓰는 형식 그대로다.
 * 연도는 시작일에만 붙고 마감 시각은 끝에 한 번 나온다.
 *
 * `recruitmentEndAt`이 없는 건(픽스처 id 5)은 상시 모집이라 마감 시각 대신 그렇게 적는다.
 * 채용공고·부트캠프 헤더의 같은 자리를 만드는 `formatDeadlineText`와 같은 역할이고, 위젯끼리
 * 임포트하지 않으므로(`widgets/README.md`) 여기에 따로 둔다.
 */
function formatRecruitmentPeriod(sideStudy: SideStudyDetail): string {
  const formatDate = (value: string, withYear: boolean): string => {
    const date = new Date(value);
    const weekday = WEEKDAY_LABELS[date.getDay()];
    const day = `${date.getMonth() + 1}/${date.getDate()}(${weekday})`;
    return withYear ? `${date.getFullYear()}/${day}` : day;
  };

  const start = sideStudy.recruitmentStartAt
    ? formatDate(sideStudy.recruitmentStartAt, true)
    : undefined;

  if (!sideStudy.recruitmentEndAt) {
    return start ? `${start} 시작 · 상시 모집` : '상시 모집';
  }

  const end = new Date(sideStudy.recruitmentEndAt);
  const hours = String(end.getHours()).padStart(2, '0');
  const minutes = String(end.getMinutes()).padStart(2, '0');
  const endText = `${formatDate(sideStudy.recruitmentEndAt, !start)} ${hours}:${minutes} 마감`;

  return start ? `${start} ~ ${endText}` : endText;
}

/**
 * `사이드스터디 상세페이지.png` 상단 카드 — 모집장 닉네임 + 제목 + 우측 종류 라벨 + 구분선 +
 * D-day 배지 · 모집 기간 · 조회수. 여백(`p-8`)과 구성은 채용공고·부트캠프 상세 헤더 카드와
 * 같은 값이라 세 상세 화면의 글자 시작 x가 한 줄로 맞는다.
 *
 * 목업의 프로필 자리는 회색 사각형이다. 지어낸 목데이터라 걸어 둘 이미지가 없어 목록 카드
 * (`SideStudyCard`)의 썸네일과 같은 회색 박스로 둔다.
 *
 * 닉네임 아래 줄은 목업에 `~~ · ~~`라는 두 칸짜리 자리 표시만 있어 무엇이 들어가는지 갈리지
 * 않는다. 우측 라벨이 이미 종류를 말하고 있으므로 남은 두 가지, 진행 방식과 예상 진행 기간을
 * 넣는다(`expectedDuration`이 없으면 진행 방식만 남는다).
 *
 * API 없음: 목업 우측 하단에는 조회수와 나란히 댓글 수도 있으나 그리지 않는다. 댓글·대댓글이
 * 이 PRD의 범위 밖이고(PRD 8절, 2026-09-01 결정) 사이드바의 댓글 영역 자리도 `비슷한
 * 사이드·스터디`로 대체했다 — 스레드가 없는 화면에 개수만 남으면 눌러도 갈 곳이 없다.
 * 목록 카드는 카드 안에서 정보 한 줄로 끝나므로 거기서는 그대로 그린다.
 */
export function SideStudyDetailHeaderCard({ sideStudy }: SideStudyDetailHeaderCardProps) {
  const subtitleParts = [
    OPERATION_TYPE_LABELS[sideStudy.operationType],
    ...(sideStudy.expectedDuration ? [sideStudy.expectedDuration] : []),
  ];

  return (
    <Card className="bg-gray-50 p-8">
      <div className="flex items-center gap-3">
        <Thumbnail
          src={sideStudy.thumbnailUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-md shadow-sm"
        />
        <div>
          <p className="font-bold text-gray-900">{sideStudy.authorNickname}</p>
          <p className="text-sm text-gray-500">{subtitleParts.join(' · ')}</p>
        </div>
      </div>
      <div className="mt-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{sideStudy.title}</h1>
        <span className="shrink-0 text-sm font-bold text-blue-600">
          {KIND_LABELS[sideStudy.kind]}
        </span>
      </div>
      <hr className="my-6 border-gray-200" />
      <div className="flex items-center gap-3 text-sm">
        {/* 사이드·스터디에는 상시 모집 구분이 따로 없다 — `recruitmentEndAt`이 없으면 상시라서
            `PERIOD`를 고정으로 넘긴다. 마감일이 없으면 `DdayBadge`가 알아서 아무것도 그리지
            않는다(`shared/lib/dday.ts`). */}
        <DdayBadge recruitmentType="PERIOD" recruitmentEndAt={sideStudy.recruitmentEndAt} />
        <span className="text-gray-500">{formatRecruitmentPeriod(sideStudy)}</span>
        <span className="ml-auto flex items-center gap-1 text-gray-400">
          <EyeIcon className="h-4 w-4" />
          {sideStudy.viewCount}
        </span>
      </div>
    </Card>
  );
}
