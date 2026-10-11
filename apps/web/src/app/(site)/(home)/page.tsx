import { ListPublicJobsSort } from '@ogonggo/api';
import { HomePage } from '@/views/home';
import {
  parseEmploymentTypes,
  parseExperienceTypes,
  parseJobRoleSelection,
  parseKeywordParam,
} from '@/widgets/job-list';

interface HomeSearchParams {
  page?: string;
  sort?: string;
  /** 같은 이름이 되풀이되면 배열로 온다. 첫 값만 쓴다. */
  q?: string | string[];
  /** 채용 형태·요구 경력. 여럿이면 같은 이름이 되풀이돼 배열로 온다. */
  employmentType?: string | string[];
  experienceType?: string | string[];
  /** 직무 필터. 여럿이면 같은 이름이 되풀이돼 배열로 온다. */
  jobField?: string | string[];
  jobRole?: string | string[];
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function parseSort(value: string | undefined): ListPublicJobsSort {
  return value === ListPublicJobsSort.VIEW_COUNT
    ? ListPublicJobsSort.VIEW_COUNT
    : ListPublicJobsSort.LATEST;
}

export default async function Page({ searchParams }: { searchParams: Promise<HomeSearchParams> }) {
  const { page, sort, q, employmentType, experienceType, jobField, jobRole } = await searchParams;

  return (
    <HomePage
      page={parsePage(page)}
      sort={parseSort(sort)}
      q={parseKeywordParam(q)}
      employmentTypes={parseEmploymentTypes(employmentType)}
      experienceTypes={parseExperienceTypes(experienceType)}
      {...parseJobRoleSelection(jobField, jobRole)}
    />
  );
}
