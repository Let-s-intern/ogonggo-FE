import type { CardJob } from '@/lib/card/fromJob';
import { fetchJob, fetchLogo } from '@/lib/server/ogonggo';

/** 고른 공고의 카드용 값과 로고(data URL). 로고는 서버가 받아야 색을 뽑을 때 CORS 에 막히지 않는다. */
export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const jobId = Number((await params).jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return Response.json({ message: '공고 번호가 잘못됐습니다.' }, { status: 400 });
  }
  const job = await fetchJob(jobId);
  if (!job) {
    return Response.json({ message: '공고를 찾지 못했습니다.' }, { status: 404 });
  }
  const cardJob: CardJob = {
    id: job.id,
    companyName: job.companyName,
    title: job.title,
    recruitmentType: job.recruitmentType,
    recruitmentEndAt: job.recruitmentEndAt,
    sourceUrl: job.sourceUrl,
  };
  return Response.json({ job: cardJob, logoDataUrl: (await fetchLogo(job.logoUrl)) ?? null });
}
