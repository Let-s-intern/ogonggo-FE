import { GetJobsSort } from '@ogonggo/api';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import type { JobEmploymentType, JobExperienceType } from '@/entities/job/model/types';
import { HomePage } from '@/views/home';

interface HomeSearchParams {
  page?: string;
  sort?: string;
  q?: string;
  employmentType?: string;
  experienceType?: string;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function parseSort(value: string | undefined): GetJobsSort {
  return value === GetJobsSort.VIEW_COUNT ? GetJobsSort.VIEW_COUNT : GetJobsSort.LATEST;
}

function parseEmploymentType(value: string | undefined): JobEmploymentType | undefined {
  return value && value in EMPLOYMENT_TYPE_LABELS ? (value as JobEmploymentType) : undefined;
}

function parseExperienceType(value: string | undefined): JobExperienceType | undefined {
  return value && value in EXPERIENCE_TYPE_LABELS ? (value as JobExperienceType) : undefined;
}

export default async function Page({ searchParams }: { searchParams: Promise<HomeSearchParams> }) {
  const { page, sort, q, employmentType, experienceType } = await searchParams;

  return (
    <HomePage
      page={parsePage(page)}
      sort={parseSort(sort)}
      q={q || undefined}
      employmentType={parseEmploymentType(employmentType)}
      experienceType={parseExperienceType(experienceType)}
    />
  );
}
