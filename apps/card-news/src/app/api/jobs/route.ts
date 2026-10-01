import { searchJobs, todayJobs } from '@/lib/server/ogonggo';

/** 공고 고르기. `?today=1` 이면 오늘의 공고, 아니면 `keyword` 로 검색한다. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const items =
      params.get('today') === '1'
        ? await todayJobs()
        : await searchJobs((params.get('keyword') ?? '').trim().slice(0, 100));
    return Response.json({ items });
  } catch (error) {
    console.error('[card-news] 공고 목록 실패', error);
    return Response.json({ message: '공고를 불러오지 못했습니다.' }, { status: 502 });
  }
}
