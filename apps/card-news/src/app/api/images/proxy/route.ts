import { fetchCandidateImage } from '@/lib/server/images';
import { fetchJob } from '@/lib/server/ogonggo';

/**
 * 공고의 썸네일 후보를 이 앱 출처로 다시 내보낸다. 편집 화면이 캔버스로 줄이는 데 쓴다. 주소 대신
 * 공고 번호와 후보 순번만 받는다 — 서버가 아무 주소로나 요청을 보내지 않게.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const jobId = Number(params.get('jobId'));
  const index = Number(params.get('index'));
  if (!Number.isInteger(jobId) || jobId <= 0 || !Number.isInteger(index) || index < 0) {
    return Response.json({ message: '공고 번호나 후보 순번이 잘못됐습니다.' }, { status: 400 });
  }
  const job = await fetchJob(jobId);
  const image = job ? await fetchCandidateImage(job.sourceUrl, index) : null;
  if (!image) {
    return Response.json({ message: '이미지를 받지 못했습니다.' }, { status: 502 });
  }
  return new Response(image.bytes, {
    headers: {
      'Content-Type': image.type,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
