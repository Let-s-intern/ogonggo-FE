import { Badge } from '@ogonggo/ui';
import {
  listPublicTodayJobs,
  type SuccessResponseListUserTodayJobSummaryResponse,
  type UserTodayJobSummaryResponse,
} from '@ogonggo/api';
import { JobCard } from '@/entities/job/ui/JobCard';

const TOP_COUNT = 4;

/** 이 시간 안에 응답이 없으면 섹션을 접는다. 홈 전체가 이 요청 하나를 기다리지 않게 한다. */
const TIMEOUT_MS = 3000;

/**
 * 운영자가 고른 오늘의 공고를 받는다. 응답 언랩은 `widgets/popular-jobs/ui/PopularJobs.tsx` 와
 * 같은 방식이다 — 생성 타입은 `{ data, status }` 로 감싸지만 `httpClient` 는 본문을 그대로 돌려준다.
 *
 * 실패하면 빈 목록이다. 이 구역 하나 때문에 홈 본문 전체가 `(site)/error.tsx` 로 바뀌면 안 된다
 * (`widgets/cross-sell/ui/CrossSellWidget.tsx` 와 같은 이유). 다만 삼킨 오류가 보이지 않으면 백엔드가
 * 계속 500 을 내도 아무도 모르므로 서버 로그에는 남긴다.
 *
 * 서버가 개수를 제한하지 않아 앞의 네 건만 쓴다.
 */
async function fetchTodayJobs(): Promise<UserTodayJobSummaryResponse[]> {
  try {
    const response = (await listPublicTodayJobs({
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })) as unknown as SuccessResponseListUserTodayJobSummaryResponse;
    return (response.data ?? []).slice(0, TOP_COUNT);
  } catch (error) {
    console.error('[today-jobs] 오늘의 추천 공고를 받지 못해 구역을 숨깁니다.', error);
    return [];
  }
}

/**
 * "오늘의 추천 공고" — 인기 공고 바로 뒤에 놓이는 네 장짜리 구역. 카드는 기존 `JobCard` 에 운영자가
 * 공고마다 적은 추천 문구를 붙여 쓴다. 오류이거나 고른 공고가 없으면 아무것도 그리지 않는다.
 *
 * `UserTodayJobSummaryResponse` 는 `JobSummary` 에 추천 문구 둘을 더한 모양이라 변환 없이 `job`
 * 으로 넘어간다. 마감된 공고도 운영자가 뺄 때까지 그대로 나오고, 카드가 회색 `마감` 배지를 그린다.
 *
 * 목록 모양은 `widgets/popular-jobs/ui/PopularJobsTabs.tsx` 를 따른다. 로그인한 사용자의 북마크는
 * 서버 컴포넌트가 토큰을 읽지 못해 늘 `false` 로 오고, `BookmarkButton` 이 브라우저에서 덮어쓴다.
 */
export async function TodayJobs() {
  const jobs = await fetchTodayJobs();

  if (jobs.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">오늘의 추천 공고</h2>
        <Badge tone="success" className="rounded-full px-2 py-0.5 text-xs font-bold">
          오공고 PICK
        </Badge>
      </div>
      {/* 모바일은 가로로 넘긴다. 화면 끝까지 넘기도록 좌우 여백만큼 밖으로 빼고 안에서 다시 들인다. */}
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
        {jobs.map((job, index) => (
          <li
            key={job.id}
            className="w-[72%] max-w-[320px] min-w-[240px] shrink-0 snap-start md:w-auto md:max-w-none md:min-w-0"
          >
            <JobCard
              variant="featured"
              job={job}
              recommendation={{
                // 스펙은 필수 문자열이지만 `null` 이 오면 `JobCard` 의 `trim()` 이 렌더 중에 터져 홈 전체가
                // 오류 화면이 된다. 이 구역의 실패가 홈으로 번지지 않게 응답 경계에서 빈 문자열로 만든다.
                title: job.recommendationTitle ?? '',
                description: job.recommendationDescription ?? '',
              }}
              tracking={{ listSource: 'main', listPosition: index + 1, pageNumber: 1 }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
