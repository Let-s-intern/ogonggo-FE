import { Card } from '@ogonggo/ui';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import type { BootcampDetail } from '@/entities/bootcamp/model/types';
import { DdayBadge } from '@/shared/ui/DdayBadge';
import { EyeIcon } from '@/shared/ui/icons';

export interface BootcampDetailHeaderCardProps {
  bootcamp: BootcampDetail;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 헤더의 마감일시 문구("7/25(토) 23:59 마감"). 채용공고 상세의 같은 문구를 만드는
 * `widgets/job-detail/ui/JobDetailHeaderCard.tsx`의 `formatDeadlineText`와 같은 형식이다 —
 * 위젯끼리 임포트하지 않으므로(`widgets/README.md`) 여기에 따로 둔다. 상시 모집은
 * `recruitmentType`이 `ALWAYS_OPEN`인 건(픽스처 9번)이다.
 */
function formatDeadlineText(
  recruitmentType: BootcampDetail['recruitmentType'],
  recruitmentEndAt?: string,
): string {
  if (recruitmentType === 'ALWAYS_OPEN') {
    return '상시 모집';
  }
  if (!recruitmentEndAt) {
    return '마감일 미정';
  }
  const end = new Date(recruitmentEndAt);
  const weekday = WEEKDAY_LABELS[end.getDay()];
  const hours = String(end.getHours()).padStart(2, '0');
  const minutes = String(end.getMinutes()).padStart(2, '0');
  return `${end.getMonth() + 1}/${end.getDate()}(${weekday}) ${hours}:${minutes} 마감`;
}

/**
 * `교육부트캠프 상세페이지.png` 상단 카드 — 대표 이미지 + 회사명 + `교육 · <프로그램 유형>` +
 * 제목 + 구분선 + D-day 배지 · 마감 일시 · 조회수. 여백(`p-8`)과 구성은 채용공고 상세 헤더
 * 카드와 같은 값이다.
 *
 * 목업의 로고 자리는 회색 사각형이다. 부트캠프 응답에는 회사 로고가 없고 대표 이미지
 * (`representativeImageUrl`)가 있어 그것을 그린다 — 목록 카드(`BootcampCard`)가 같은 URL을
 * 쓰는 것과 같은 이유로 `next/image`가 아니라 `<img>`다(외부 호스트 등록 없이 그린다).
 *
 * API 없음: 목업 헤더 우측의 "댓글" 아이콘·수는 그리지 않는다 — 응답의 `commentCount`는 새싹의
 * 수강후기 수라 목업의 댓글과 다른 값이고, 채용공고 상세에서도 같은 이유로 뺐다(PRD 8절).
 */
export function BootcampDetailHeaderCard({ bootcamp }: BootcampDetailHeaderCardProps) {
  return (
    <Card className="bg-gray-50 p-8">
      <div className="flex items-center gap-3">
        <Thumbnail
          src={bootcamp.representativeImageUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-md shadow-sm"
        />
        <div>
          <p className="font-bold text-gray-900">{bootcamp.companyName}</p>
          <p className="text-sm text-gray-500">교육 · {bootcamp.programType}</p>
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">{bootcamp.title}</h1>
      <hr className="my-6 border-gray-200" />
      <div className="flex items-center gap-3 text-sm">
        <DdayBadge
          recruitmentType={bootcamp.recruitmentType}
          recruitmentEndAt={bootcamp.recruitmentEndAt}
        />
        <span className="text-gray-500">
          {formatDeadlineText(bootcamp.recruitmentType, bootcamp.recruitmentEndAt)}
        </span>
        <span className="ml-auto flex items-center gap-1 text-gray-400">
          <EyeIcon className="h-4 w-4" />
          {bootcamp.viewCount}
        </span>
      </div>
    </Card>
  );
}
