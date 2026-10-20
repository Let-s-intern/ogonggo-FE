import type { Metadata } from 'next';
import { ListPublicJobsSort } from '@ogonggo/api';
import { HomePage } from '@/views/home';
import { buildSiteJsonLd } from '@/shared/lib/siteJsonLd';
import { serializeJsonLd } from '@/widgets/job-detail';
import {
  buildJobListHref,
  parseEmploymentTypes,
  parseExperienceTypes,
  parseJobRoleSelection,
  parseKeywordParam,
  parseRegions,
  parseSort,
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
 * 주소에 필터 쿼리가 없을 때 쿠키에 기억한 필터로 보내는 일은 `src/proxy.ts` 가 렌더 전에 한다.
 * 여기서 `redirect()` 하면 이동하는 동안 스켈레톤 대신 빈 본문이 보인다(이유는 그 파일 주석).
 */
export default async function Page({ searchParams }: { searchParams: Promise<HomeSearchParams> }) {
  const { page, sort, q, employmentType, experienceType, region, jobField, jobRole } =
    await searchParams;

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
