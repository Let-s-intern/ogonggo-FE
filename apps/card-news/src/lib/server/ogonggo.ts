import {
  type SuccessResponsePageResponseUserJobSummaryResponse,
  type SuccessResponseListUserJobSummaryResponse,
  type SuccessResponseUserJobDetailResponse,
  type UserJobDetailResponse,
  type UserJobSummaryResponse,
  getPublicJob,
  listPublicJobs,
  listPublicTodayJobs,
} from '@ogonggo/api';

/**
 * 오공고 공개 API. 로그인 없이 읽는 공고만 쓴다 — 이 앱에는 로그인이 없다. 서버에서 부르므로
 * `httpClient` 가 `OGONGGO_USER_API_ORIGIN` 앞에 붙여 보낸다.
 *
 * 생성 타입은 `{ data, status }` 를 한 겹 더 감싼 모양이지만 `httpClient` 는 본문을 그대로
 * 돌려준다(apps/web 과 같은 캐스팅).
 */

export interface JobListItem {
  id: number;
  companyName: string;
  title: string;
  logoUrl?: string;
  recruitmentEndAt?: string;
  recruitmentType: UserJobSummaryResponse['recruitmentType'];
}

function toListItem(job: UserJobSummaryResponse): JobListItem {
  return {
    id: job.id,
    companyName: job.companyName,
    title: job.title,
    logoUrl: job.logoUrl,
    recruitmentEndAt: job.recruitmentEndAt,
    recruitmentType: job.recruitmentType,
  };
}

export async function searchJobs(keyword: string): Promise<JobListItem[]> {
  const body = (await listPublicJobs({
    page: 1,
    size: 20,
    keyword: keyword || undefined,
  })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;
  return (body.data?.items ?? []).map(toListItem);
}

export async function todayJobs(): Promise<JobListItem[]> {
  const body =
    (await listPublicTodayJobs()) as unknown as SuccessResponseListUserJobSummaryResponse;
  return (body.data ?? []).map(toListItem);
}

export async function fetchJob(jobId: number): Promise<UserJobDetailResponse | null> {
  try {
    const body = (await getPublicJob(jobId)) as unknown as SuccessResponseUserJobDetailResponse;
    return body.data ?? null;
  } catch {
    return null;
  }
}

/** 기업 로고를 data URL 로. 이미지가 아니거나 못 받으면 `undefined`. */
export async function fetchLogo(url: string | undefined): Promise<string | undefined> {
  if (!url) {
    return undefined;
  }
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || !/^image\/(png|jpe?g|gif|webp|svg\+xml)/.test(type)) {
      return undefined;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return undefined;
  }
}
