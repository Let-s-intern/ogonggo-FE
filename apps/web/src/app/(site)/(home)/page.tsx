import type { Metadata } from 'next';
import { ListPublicJobsSort } from '@ogonggo/api';
import { HomePage } from '@/views/home';
import {
  buildJobListHref,
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

/**
 * 정렬·검색·필터 주소는 같은 공고를 다른 순서·부분으로 보일 뿐이라 기본 목록을 정식 주소로 둔다.
 * 쪽(`page`)은 다른 공고를 보이므로 자기 자신이다 — 1쪽으로 몰면 뒤쪽에만 링크된 공고가 발견되지 않는다.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const canonical = buildJobListHref(
    { page: parsePage(page), sort: ListPublicJobsSort.LATEST },
    { page: parsePage(page) },
  );
  return { alternates: { canonical } };
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
