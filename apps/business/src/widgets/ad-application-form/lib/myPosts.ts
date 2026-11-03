import {
  type SuccessResponsePageResponseCompanyBootcampSummaryResponse,
  type SuccessResponsePageResponseCompanyJobSummaryResponse,
  enumLabel,
  listMyBootcamps,
  listMyJobs,
} from '@ogonggo/api';
import { isRecruitmentClosed } from '@/shared/lib/dday';
import type { ExistingPost } from '../model/form';

export interface SelectablePost extends ExistingPost {
  meta: string;
}

/** 한 번에 고를 수 있게 넉넉히 받는다. 기업 한 곳의 게시 중 공고는 많지 않다. */
const SIZE = 100;

/**
 * 신청서 1단계에서 고를 수 있는 내 공고. 게시 중(`PUBLISHED`)이고 모집이 끝나지 않은 채용공고·부트캠프만이다
 * (시안 B-07: 게시된 공고만 광고할 수 있다). 채용공고가 먼저다.
 */
export async function fetchSelectablePosts(): Promise<SelectablePost[]> {
  // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다. 다른 화면과 같다.
  const [jobs, bootcamps] = await Promise.all([
    listMyJobs({
      page: 1,
      size: SIZE,
    }) as unknown as Promise<SuccessResponsePageResponseCompanyJobSummaryResponse>,
    listMyBootcamps({
      page: 1,
      size: SIZE,
    }) as unknown as Promise<SuccessResponsePageResponseCompanyBootcampSummaryResponse>,
  ]);
  const live = (post: {
    publicationStatus?: string;
    recruitmentType: string;
    recruitmentEndAt?: string;
    closedAt?: string;
  }) =>
    post.publicationStatus === 'PUBLISHED' &&
    !isRecruitmentClosed(
      post.recruitmentType === 'ALWAYS_OPEN' ? 'ALWAYS_OPEN' : 'PERIOD',
      post.recruitmentEndAt,
      post.closedAt,
    );
  return [
    ...(jobs.data?.items ?? []).filter(live).map((job) => ({
      target: 'JOB' as const,
      id: job.id,
      title: job.title,
      meta: [
        '채용공고',
        enumLabel('JobEmploymentType', job.employmentType),
        enumLabel('JobExperienceType', job.experienceType),
      ]
        .filter(Boolean)
        .join(' · '),
    })),
    ...(bootcamps.data?.items ?? []).filter(live).map((bootcamp) => ({
      target: 'BOOTCAMP' as const,
      id: bootcamp.id,
      title: bootcamp.title,
      meta: ['부트캠프', bootcamp.programType].filter(Boolean).join(' · '),
    })),
  ];
}
