import type { Metadata } from 'next';
import { ApplyPage } from '@/views/apply';

export const metadata: Metadata = { title: '광고 신청' };

type ApplySearchParams = Record<
  'jobId' | 'placement' | 'start' | 'jobField' | 'from',
  string | string[] | undefined
>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * 광고 신청 라우트. 미리 채울 값을 쿼리로 받는다 — `?jobId=`(채용공고 카드의 `광고로 더 알리기`),
 * `?placement=&start=&jobField=`(신청 가능 일정의 `이 일정으로 신청하기`), `?from=`(성과 리포트의 `같은 조건으로 다시 신청`). 주소는 `entities/advertisement` 의 `adApplyHref`.
 */
export default async function Page({ searchParams }: { searchParams: Promise<ApplySearchParams> }) {
  const params = await searchParams;
  const jobId = Number(first(params.jobId));
  const from = Number(first(params.from));
  return (
    <ApplyPage
      prefill={{
        jobId: Number.isInteger(jobId) && jobId > 0 ? jobId : undefined,
        placementKey: first(params.placement),
        startDate: first(params.start),
        jobField: first(params.jobField),
        fromApplicationId: Number.isInteger(from) && from > 0 ? from : undefined,
      }}
    />
  );
}
