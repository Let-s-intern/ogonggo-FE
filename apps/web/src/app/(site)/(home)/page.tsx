import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ListPublicJobsSort } from '@ogonggo/api';
import { HomePage } from '@/views/home';
import { buildSiteJsonLd } from '@/shared/lib/siteJsonLd';
import { serializeJsonLd } from '@/widgets/job-detail';
import {
  buildJobListHref,
  JOB_FILTER_COOKIE_NAME,
  parseEmploymentTypes,
  parseExperienceTypes,
  parseJobRoleSelection,
  parseKeywordParam,
  parseRememberedJobFilters,
  parseRegions,
} from '@/widgets/job-list';

interface HomeSearchParams {
  page?: string;
  sort?: string;
  /** 같은 이름이 되풀이되면 배열로 온다. 첫 값만 쓴다. */
  q?: string | string[];
  /** 채용 형태·요구 경력. 여럿이면 같은 이름이 되풀이돼 배열로 온다. */
  employmentType?: string | string[];
  experienceType?: string | string[];
  /** 근무 지역(시·도). 하나만 쓴다. 되풀이돼 배열로 와도 첫 값만 읽는다. */
  region?: string | string[];
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

/**
 * 주소에 필터 쿼리가 하나도 없으면 **마지막으로 건 필터를 쿠키에서 꺼내 그 주소로 보낸다**
 * (`widgets/job-list/lib/filterCookie.ts`). 서버가 여기서 주소를 바꾸므로 필터 없는 목록이 잠깐
 * 보였다 바뀌지 않는다. 검색어·정렬은 주소의 것을 그대로 두고 쪽만 1쪽으로 돌아간다.
 *
 * 쿼리가 있는지는 거르기 전의 원본으로 본다. `?employmentType=` 처럼 값이 틀린 주소도 사용자가 적은
 * 필터 주소이므로 덮지 않는다. 쿠키의 필터는 거른 결과가 비면 보내지 않는다.
 */
export default async function Page({ searchParams }: { searchParams: Promise<HomeSearchParams> }) {
  const { page, sort, q, employmentType, experienceType, region, jobField, jobRole } =
    await searchParams;

  const hasFilterQuery = [employmentType, experienceType, region, jobField, jobRole].some(
    (value) => value !== undefined,
  );
  if (!hasFilterQuery) {
    const remembered = parseRememberedJobFilters(
      (await cookies()).get(JOB_FILTER_COOKIE_NAME)?.value,
    );
    if (remembered) {
      redirect(
        buildJobListHref({ page: 1, sort: parseSort(sort), q: parseKeywordParam(q) }, remembered),
      );
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildSiteJsonLd()) }}
      />
      <HomePage
        page={parsePage(page)}
        sort={parseSort(sort)}
        q={parseKeywordParam(q)}
        employmentTypes={parseEmploymentTypes(employmentType)}
        experienceTypes={parseExperienceTypes(experienceType)}
        regions={parseRegions(region)}
        {...parseJobRoleSelection(jobField, jobRole)}
      />
    </>
  );
}
