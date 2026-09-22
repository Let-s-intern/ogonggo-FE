import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { JobCalendarPage } from '@/views/job-calendar';
import { JOB_MAJOR_COOKIE_NAME } from '@/widgets/job-calendar/lib/major-cookie';
import {
  buildJobCalendarHref,
  parseJobCalendarQuery,
  parseJobMajors,
  type JobCalendarSearchParams,
} from '@/widgets/job-calendar/lib/query';

/**
 * 공고 달력 라우트. 이 Next 버전에서 `searchParams`는 Promise로 온다 — 다른 화면들과 같다.
 * 이걸 받으면서 이 화면도 자동으로 동적 렌더가 되어, Push 1 이 프리렌더 실패를 막으려고 걸어
 * 둔 `export const dynamic = 'force-dynamic'` 이 필요 없어졌다.
 *
 * 값 검증은 `parseJobCalendarQuery` 가 한 곳에서 맡는다(`widgets/job-calendar/lib/query.ts`).
 *
 * `?majors=` 없이 들어오면 **마지막으로 고른 직무를 쿠키에서 꺼내 그 주소로 보낸다.** 헤더의
 * `공고 달력`이 언제나 `/calendar`로 오기 때문이다. 서버가 여기서 주소를 바꿔 버리므로 선택
 * 화면이 잠깐 보였다가 사라지지 않는다(`widgets/job-calendar/lib/major-cookie.ts`).
 *
 * 쿠키 값도 주소와 **똑같이** `parseJobMajors`로 거른다. 손으로 고쳐 넣은 값이 그대로 달력
 * 파라미터가 되면 안 된다. 거른 결과가 비면 보내지 않고 선택 화면을 그린다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<JobCalendarSearchParams>;
}) {
  const query = parseJobCalendarQuery(await searchParams);

  if (query.majors.length === 0) {
    const remembered = parseJobMajors((await cookies()).get(JOB_MAJOR_COOKIE_NAME)?.value);
    if (remembered.length > 0) {
      redirect(buildJobCalendarHref(query, { majors: remembered }));
    }
  }

  return <JobCalendarPage {...query} />;
}
