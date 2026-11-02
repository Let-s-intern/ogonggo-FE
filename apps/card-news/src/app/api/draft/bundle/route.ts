import { type BundleDraftResult, generateBundleDraft } from '@/lib/ai/draft';
import { MAX_BUNDLE_JOBS, MIN_BUNDLE_JOBS } from '@/lib/card/document';
import { RATE_LIMIT_MESSAGE, allowDraft, clientIp } from '@/lib/server/draftLimit';
import { fetchJob } from '@/lib/server/ogonggo';

/**
 * 여러 공고 묶음 초안. 공고 하나 초안(`../route.ts`)과 같은 보호 장치를 둔다.
 *
 * - 공고 번호가 모두 실제 공고일 때만 모델을 부른다. 하나라도 없으면 400 이다.
 * - 요청사항 없는 첫 초안은 같은 공고 묶음(순서까지)이면 하루 동안 다시 쓴다.
 * - IP 마다 10분에 20번까지 부른다(공고 하나 초안과 합쳐서).
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, { at: number; result: BundleDraftResult }>();

interface BundleDraftRequest {
  jobIds: number[];
  request?: string;
}

export async function POST(request: Request) {
  let body: BundleDraftRequest;
  try {
    body = (await request.json()) as BundleDraftRequest;
  } catch {
    return Response.json({ message: '요청 본문을 읽을 수 없습니다.' }, { status: 400 });
  }
  const jobIds = Array.isArray(body.jobIds) ? body.jobIds.map(Number) : [];
  if (
    jobIds.length < MIN_BUNDLE_JOBS ||
    jobIds.length > MAX_BUNDLE_JOBS ||
    !jobIds.every((jobId) => Number.isInteger(jobId) && jobId > 0) ||
    new Set(jobIds).size !== jobIds.length
  ) {
    return Response.json(
      {
        message: `서로 다른 공고 번호를 ${MIN_BUNDLE_JOBS}~${MAX_BUNDLE_JOBS}개 보내 주세요.`,
      },
      { status: 400 },
    );
  }

  const instruction = typeof body.request === 'string' ? body.request.trim() : '';
  const key = jobIds.join(',');
  const cached = cache.get(key);
  if (!instruction && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Response.json(cached.result);
  }

  if (!allowDraft(clientIp(request))) {
    return Response.json({ message: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const jobs = await Promise.all(jobIds.map((jobId) => fetchJob(jobId)));
  const missing = jobIds.filter((_jobId, index) => !jobs[index]);
  if (missing.length > 0) {
    return Response.json(
      { message: `공고를 찾지 못했습니다: ${missing.join(', ')}` },
      { status: 400 },
    );
  }
  const result = await generateBundleDraft(
    jobs.flatMap((job) => (job ? [job] : [])),
    instruction,
  );
  if (!instruction && result.source === 'ai') {
    cache.set(key, { at: Date.now(), result });
  }
  return Response.json(result);
}
