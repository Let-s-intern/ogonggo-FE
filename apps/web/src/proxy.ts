import { type NextRequest, NextResponse } from 'next/server';
import { JOB_MAJOR_COOKIE_NAME } from '@/widgets/job-calendar/lib/major-cookie';
import {
  buildJobCalendarHref,
  parseJobCalendarQuery,
  parseJobMajors,
  type JobCalendarSearchParams,
} from '@/widgets/job-calendar/lib/query';
import {
  JOB_FILTER_COOKIE_NAME,
  parseRememberedJobFilters,
} from '@/widgets/job-list/lib/filterCookie';
import { buildJobListHref, parseKeywordParam, parseSort } from '@/widgets/job-list/lib/query';

/** 이 중 하나라도 주소에 있으면 사용자가 적은 필터 주소다. 값이 틀려도 쿠키로 덮지 않는다. */
const JOB_FILTER_PARAM_NAMES = [
  'employmentType',
  'experienceType',
  'region',
  'jobField',
  'jobRole',
] as const;

/**
 * 세 가지를 한다.
 *
 * `/letscareer-api/**` 요청에서 `Origin` 헤더를 뺀다. 그 뒤 `next.config.ts` 의 rewrite 가 렛츠커리어로 넘긴다.
 *
 * 브라우저는 같은 오리진 POST 에도 `Origin: http://localhost:4000`(배포에서는 `https://ogonggo.co.kr`) 을
 * 붙이고, rewrite 는 그 헤더를 그대로 넘긴다. 렛츠커리어 서버의 CORS 허용 목록(`WebSecurityConfig.java` 의
 * `getDefaultCorsConfiguration`) 에 두 주소가 없어, 스프링이 본문을 보기도 전에 403 `Invalid CORS request` 로
 * 끊는다(2026-09-18 확인: 같은 요청이 `Origin` 을 빼면 400 검증 오류까지 간다).
 *
 * 렛츠커리어를 부르는 것은 이 Next 서버다. 브라우저는 같은 오리진만 부르므로 CORS 가 지킬 경계가 없다.
 * 백엔드를 고치지 않는다는 PRD 원칙에 따라 허용 목록을 늘려 달라고 하지 않고 여기서 뺀다.
 *
 * `/` 와 `/calendar` 는 쿠키에 기억한 필터·직무를 주소에 붙여 보낸다(`jobListRedirect`, `calendarRedirect`).
 * 이 일을 `page.tsx` 의 `redirect()` 가 하던 때는 이동하는 동안 스켈레톤이 뜨지 않았다. 렌더 중에 던진
 * 리다이렉트는 Next 의 `RedirectErrorBoundary` 가 받아 `null` 을 그린 채 새 주소를 `startTransition` 으로
 * 불러오고(`next/dist/client/components/redirect-boundary.js`), 쿼리만 다른 같은 라우트라 `loading.tsx`
 * 도 다시 뜨지 않아서, 공고가 올 때까지 본문이 비었다. 여기서 렌더 전에 보내면 브라우저는 처음부터 최종
 * 주소를 불러오고 그동안 `loading.tsx` 가 뜬다.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname === '/calendar') {
    const target = pathname === '/' ? jobListRedirect(request) : calendarRedirect(request);
    return target ? NextResponse.redirect(new URL(target, request.url)) : NextResponse.next();
  }

  const headers = new Headers(request.headers);
  headers.delete('origin');
  return NextResponse.next({ request: { headers } });
}

/**
 * 주소에 필터 쿼리가 하나도 없으면 마지막으로 건 필터(`widgets/job-list/lib/filterCookie.ts`)의 주소.
 * 검색어·정렬은 주소의 것을 그대로 두고 쪽만 1쪽으로 돌아간다. 쿠키의 필터는 거른 결과가 비면 보내지 않는다.
 */
function jobListRedirect(request: NextRequest): string | undefined {
  const { searchParams } = request.nextUrl;
  if (JOB_FILTER_PARAM_NAMES.some((name) => searchParams.has(name))) {
    return undefined;
  }
  const remembered = parseRememberedJobFilters(request.cookies.get(JOB_FILTER_COOKIE_NAME)?.value);
  if (!remembered) {
    return undefined;
  }
  return buildJobListHref(
    {
      page: 1,
      sort: parseSort(searchParams.get('sort') ?? undefined),
      q: parseKeywordParam(searchParams.get('q') ?? undefined),
    },
    remembered,
  );
}

/**
 * `?majors=` 없이 들어오면 마지막으로 고른 직무(`widgets/job-calendar/lib/major-cookie.ts`)의 주소.
 * 쿠키 값도 주소와 똑같이 `parseJobMajors` 로 거르고, 거른 결과가 비면 보내지 않고 선택 화면을 그린다.
 */
function calendarRedirect(request: NextRequest): string | undefined {
  const searchParams: JobCalendarSearchParams = {};
  request.nextUrl.searchParams.forEach((value, name) => {
    // 같은 이름이 되풀이되면 첫 값을 쓴다.
    searchParams[name as keyof JobCalendarSearchParams] ??= value;
  });
  const query = parseJobCalendarQuery(searchParams);
  if (query.majors.length > 0) {
    return undefined;
  }
  const remembered = parseJobMajors(request.cookies.get(JOB_MAJOR_COOKIE_NAME)?.value);
  return remembered.length > 0 ? buildJobCalendarHref(query, { majors: remembered }) : undefined;
}

export const config = {
  matcher: ['/letscareer-api/:path*', '/', '/calendar'],
};
