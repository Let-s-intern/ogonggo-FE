import { Card } from '@ogonggo/ui';
import { JobDday } from '@/entities/job/ui/JobDday';
import type { JobRecruitmentType } from '@/entities/job/model/types';
import { EyeIcon } from '@/shared/ui/icons';

export interface JobDetailHeaderCardProps {
  companyName: string;
  region?: string;
  title: string;
  recruitmentType: JobRecruitmentType;
  recruitmentEndAt?: string;
  viewCount: number;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 상세 헤더 마감일시 문구("7/25(토) 23:59 마감"). `entities/job/ui/JobMeta.tsx`의
 * `formatDeadline`은 목록 카드용 짧은 표기("~7.25 마감")라 요일·시각이 없다 — 이 화면
 * 전용으로 로컬에 둔다.
 */
function formatDeadlineText(recruitmentType: JobRecruitmentType, recruitmentEndAt?: string): string {
  if (recruitmentType === 'ALWAYS_OPEN') {
    return '상시채용';
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
 * 상세 페이지 상단 회사 정보 헤더 — 로고 placeholder, 회사명·지역(업종은 대응 필드 없어 뺀다,
 * PRD 10절), 제목, D-day 배지·마감일시, 조회수. "댓글" 아이콘·수는 뺀다(PRD 10절).
 */
export function JobDetailHeaderCard({
  companyName,
  region,
  title,
  recruitmentType,
  recruitmentEndAt,
  viewCount,
}: JobDetailHeaderCardProps) {
  return (
    <Card className="bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 rounded-m bg-gray-200" />
        <div>
          <p className="font-bold text-gray-900">{companyName}</p>
          {region ? <p className="text-sm text-gray-500">{region}</p> : null}
        </div>
      </div>
      <h1 className="mt-4 text-xl font-bold text-gray-900">{title}</h1>
      <hr className="my-4 border-gray-200" />
      <div className="flex items-center gap-3 text-sm">
        <JobDday recruitmentType={recruitmentType} recruitmentEndAt={recruitmentEndAt} />
        <span className="text-gray-500">{formatDeadlineText(recruitmentType, recruitmentEndAt)}</span>
        <span className="ml-auto flex items-center gap-1 text-gray-400">
          <EyeIcon className="h-4 w-4" />
          {viewCount}
        </span>
      </div>
    </Card>
  );
}
