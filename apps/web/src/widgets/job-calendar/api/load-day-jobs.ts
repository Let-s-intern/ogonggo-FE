'use server';

import { getPublicJob } from '@ogonggo/api';
import type { SuccessResponseUserJobDetailResponse } from '@ogonggo/api';
import { getJobMajor } from '@/entities/job/model/job-major';
import type { JobDetail } from '@/entities/job/model/types';
import { DAY_JOBS_PAGE_SIZE } from '../lib/day-jobs';

/** 오른쪽 목록 카드 한 장이 그리는 값. 상세 응답에서 카드에 쓰는 것만 추렸다. */
export interface DayJob {
  id: number;
  companyName: string;
  title: string;
  employmentType: JobDetail['employmentType'];
  experienceType: JobDetail['experienceType'];
  recruitmentType: JobDetail['recruitmentType'];
  recruitmentEndAt?: string;
  bookmarked: boolean;
  /** 직무. 백엔드에 필드가 없어 목데이터 매핑에서만 온다(`entities/job/model/job-major.ts`). */
  jobMajor?: string;
}

/**
 * 월간 오른쪽 목록(`docs/asset/v6 공고달력/월간 보기.png`)의 카드 값을 불러온다.
 *
 * 달력 응답은 `id`·회사명·모집 시작일·마감일 넷뿐이라 카드의 제목·고용형태·경력·북마크가 없다.
 * 그래서 그 날 공고의 상세를 다섯 건씩 불러 채운다(2026-09-21 결정, 백엔드는 바꾸지 않는다).
 *
 * **서버 함수다.** 브라우저에는 목 서버(MSW)가 없어 브라우저에서 부르면 목 모드에서도 실제
 * 백엔드로 나간다 — 달력은 목데이터인데 카드만 실데이터가 되어 id 가 서로 맞지 않는다. 서버에서
 * 부르면 달력과 같은 쪽을 본다.
 *
 * 누구나 부를 수 있는 끝점이 되므로 받은 값을 믿지 않는다. 타입은 `number[]` 지만 실제로는
 * 브라우저가 무엇이든 보낼 수 있다 — `"1/../admin"` 같은 문자열이 그대로 주소에 들어가지 않도록
 * 먼저 숫자로 바꾸고 양의 정수만 남긴다. 한 번에 다섯 건까지만 부른다. 그 사이 내려간
 * 공고(404)는 목록에서 빠질 뿐 전체를 실패시키지 않는다.
 */
export async function loadDayJobs(ids: number[]): Promise<DayJob[]> {
  const safeIds = ids
    .map((id) => Number(id))
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, DAY_JOBS_PAGE_SIZE);

  const results = await Promise.allSettled(
    safeIds.map(
      async (id) =>
        // 선언 타입과 실제 반환값이 다른 이유는 `widgets/job-detail/ui/JobDetailView.tsx` 주석과 같다.
        (await getPublicJob(id)) as unknown as SuccessResponseUserJobDetailResponse,
    ),
  );

  return results.flatMap((result) => {
    const job = result.status === 'fulfilled' ? result.value.data : undefined;
    if (!job) {
      return [];
    }
    return [
      {
        id: job.id,
        companyName: job.companyName,
        title: job.title,
        employmentType: job.employmentType,
        experienceType: job.experienceType,
        recruitmentType: job.recruitmentType,
        recruitmentEndAt: job.recruitmentEndAt,
        bookmarked: job.bookmarked,
        jobMajor: getJobMajor(job.id),
      },
    ];
  });
}
