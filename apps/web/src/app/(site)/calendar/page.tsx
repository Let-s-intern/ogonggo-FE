import { JobCalendarPage } from '@/views/job-calendar';
import {
  parseJobCalendarQuery,
  type JobCalendarSearchParams,
} from '@/widgets/job-calendar/lib/query';

/**
 * 공고 달력 라우트. 이 Next 버전에서 `searchParams`는 Promise로 온다 — 다른 화면들과 같다.
 * 이걸 받으면서 이 화면도 자동으로 동적 렌더가 되어, Push 1 이 프리렌더 실패를 막으려고 걸어
 * 둔 `export const dynamic = 'force-dynamic'` 이 필요 없어졌다.
 *
 * 값 검증은 `parseJobCalendarQuery` 가 한 곳에서 맡는다(`widgets/job-calendar/lib/query.ts`).
 *
 * `?majors=` 없이 들어오면 쿠키에 기억한 직무로 보내는 일은 `src/proxy.ts` 가 렌더 전에 한다.
 * 여기서 `redirect()` 하면 이동하는 동안 로딩 판 대신 빈 본문이 보인다(이유는 그 파일 주석).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<JobCalendarSearchParams>;
}) {
  const query = parseJobCalendarQuery(await searchParams);

  return <JobCalendarPage {...query} />;
}
