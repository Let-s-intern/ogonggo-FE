import { fetchImage } from '@/lib/server/images';

/** 후보 이미지를 이 앱 출처로 다시 내보낸다. 편집 화면이 캔버스로 줄이고 밝기를 재는 데 쓴다. */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url') ?? '';
  const image = await fetchImage(url);
  if (!image) {
    return Response.json({ message: '이미지를 받지 못했습니다.' }, { status: 502 });
  }
  return new Response(image.bytes, {
    headers: { 'Content-Type': image.type, 'Cache-Control': 'private, max-age=3600' },
  });
}
