import { findImages } from '@/lib/server/images';
import { fetchJob } from '@/lib/server/ogonggo';

/** 고른 공고의 배경 이미지 후보(사진 시안·건물 시안). */
export async function GET(request: Request) {
  const jobId = Number(new URL(request.url).searchParams.get('jobId'));
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return Response.json({ message: '공고 번호가 잘못됐습니다.' }, { status: 400 });
  }
  const job = await fetchJob(jobId);
  if (!job) {
    return Response.json({ message: '공고를 찾지 못했습니다.' }, { status: 404 });
  }
  return Response.json(await findImages(job.companyName, job.sourceUrl));
}
