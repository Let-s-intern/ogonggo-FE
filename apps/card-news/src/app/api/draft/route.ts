import { type AiDraft, type DraftResult, generateDraft } from '@/lib/ai/draft';
import { fetchJob } from '@/lib/server/ogonggo';

/**
 * AI 초안. 이 앱에는 로그인이 없어서 주소만 알면 누구나 부를 수 있다. 비용을 막는 장치 셋을 둔다.
 *
 * - 실제 공고 번호일 때만 모델을 부른다.
 * - 추가 지시 없는 첫 초안은 공고별로 하루 동안 다시 쓴다.
 * - IP 마다 10분에 20번까지 부른다.
 *
 * 둘 다 서버 인스턴스의 메모리라 인스턴스가 바뀌면 비워진다. 로그인을 붙이기 전까지의 최소한이다.
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 20;

const cache = new Map<number, { at: number; result: DraftResult }>();
const calls = new Map<string, number[]>();

function allow(ip: string): boolean {
  const now = Date.now();
  const recent = (calls.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    calls.set(ip, recent);
    return false;
  }
  recent.push(now);
  calls.set(ip, recent);
  return true;
}

interface DraftRequest {
  jobId: number;
  instruction?: string;
  current?: AiDraft;
}

export async function POST(request: Request) {
  let body: DraftRequest;
  try {
    body = (await request.json()) as DraftRequest;
  } catch {
    return Response.json({ message: '요청 본문을 읽을 수 없습니다.' }, { status: 400 });
  }
  const jobId = Number(body.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return Response.json({ message: '공고 번호가 잘못됐습니다.' }, { status: 400 });
  }

  const instruction = body.instruction?.trim() ?? '';
  const cached = cache.get(jobId);
  if (!instruction && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Response.json(cached.result);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allow(ip)) {
    return Response.json(
      { message: '잠시 뒤에 다시 시도해 주세요. 10분에 20번까지 만들 수 있습니다.' },
      { status: 429 },
    );
  }

  const job = await fetchJob(jobId);
  if (!job) {
    return Response.json({ message: '공고를 찾지 못했습니다.' }, { status: 404 });
  }
  const result = await generateDraft(job, {
    instruction,
    current: instruction ? body.current : undefined,
  });
  if (!instruction && result.source === 'ai') {
    cache.set(jobId, { at: Date.now(), result });
  }
  return Response.json(result);
}
