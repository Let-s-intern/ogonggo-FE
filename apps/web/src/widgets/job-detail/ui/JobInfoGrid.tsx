import {
  EDUCATION_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPE_LABELS,
} from '@/entities/job/model/labels';
import type {
  JobEducationLevel,
  JobEmploymentType,
  JobExperienceType,
} from '@/entities/job/model/types';

export interface JobInfoGridProps {
  experienceType: JobExperienceType;
  employmentType: JobEmploymentType;
  educationLevel: JobEducationLevel;
  region?: string;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 md:flex-col md:items-start md:gap-1.5">
      <p className="shrink-0 text-sm text-blue-500 md:text-xs">{label}</p>
      <p className="min-w-0 text-sm font-semibold text-gray-800 md:text-base">{value}</p>
    </div>
  );
}

/**
 * 경력/채용유형/학력/지역 정보 박스. v12 시안(`docs/asset/v12 채용공고 상세/`)대로 데스크톱은
 * 4열 한 줄에 라벨 위·값 아래, 모바일은 2열(경력·채용 유형 / 학력·지역)에 라벨 옆·값이다. 라벨은
 * 파랑(`blue-500`), 값은 `gray-800` 이다. 라벨 매핑은 `entities/job/model/labels.ts`(`JobBadge`
 * 가 쓰는 것과 같은 맵)를 재사용한다. `region`은 부르는 쪽이 `formatRegion`으로 바꿔 넘긴다 — 없으면
 * 빈 칸 대신 "정보 없음"으로 대체한다(`.claude/rules/writing.md`).
 */
export function JobInfoGrid({
  experienceType,
  employmentType,
  educationLevel,
  region,
}: JobInfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 md:grid-cols-4 md:gap-x-4 md:px-10">
      <InfoCell label="경력" value={EXPERIENCE_TYPE_LABELS[experienceType]} />
      <InfoCell label="채용 유형" value={EMPLOYMENT_TYPE_LABELS[employmentType]} />
      <InfoCell label="학력" value={EDUCATION_LEVEL_LABELS[educationLevel]} />
      <InfoCell label="지역" value={region ?? '정보 없음'} />
    </div>
  );
}
