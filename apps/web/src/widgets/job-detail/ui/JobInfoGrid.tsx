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
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * 경력/채용유형/학력/지역 2x2 정보 그리드. 라벨 매핑은 `entities/job/model/labels.ts`(`JobBadge`
 * 가 쓰는 것과 같은 맵)를 재사용한다. `region`은 자유 문자열이라 라벨 맵이 없다 — 없으면
 * 빈 칸 대신 "정보 없음"으로 대체한다(`.claude/rules/writing.md`).
 */
export function JobInfoGrid({
  experienceType,
  employmentType,
  educationLevel,
  region,
}: JobInfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <InfoCell label="경력" value={EXPERIENCE_TYPE_LABELS[experienceType]} />
      <InfoCell label="채용 유형" value={EMPLOYMENT_TYPE_LABELS[employmentType]} />
      <InfoCell label="학력" value={EDUCATION_LEVEL_LABELS[educationLevel]} />
      <InfoCell label="지역" value={region ?? '정보 없음'} />
    </div>
  );
}
