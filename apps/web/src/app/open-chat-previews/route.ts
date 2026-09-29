import { OPEN_CHAT_ROOMS, type OpenChatPreview } from '@/widgets/my-profile/model/openChatRooms';

/**
 * 마이페이지 `오공고 채팅방 입장하기` 모달의 링크 미리보기. 오픈채팅 주소 넷의 `og:title`·`og:image` 를
 * 모아 돌려준다(`widgets/my-profile/ui/KakaoChannelBanner.tsx`).
 *
 * 브라우저가 카카오 페이지를 직접 읽으면 CORS 에 막혀서 서버가 대신 읽는다. 방 이름과 대표 이미지는
 * 방장이 바꿀 때만 바뀌므로 하루 캐시한다.
 *
 * `/api/**` 는 백엔드로 넘어가는 rewrite 가 있어(`next.config.ts`) 이 경로는 그 밖에 둔다.
 */
export const revalidate = 86400;

function readMeta(html: string, property: string): string | undefined {
  const match = html.match(new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]*)"`));
  const value = match?.[1]?.trim();
  return value ? value : undefined;
}

async function readPreview(url: string): Promise<OpenChatPreview> {
  try {
    const response = await fetch(url, { next: { revalidate } });
    if (!response.ok) {
      return { url };
    }
    const html = await response.text();
    const image = readMeta(html, 'og:image');
    return {
      url,
      title: readMeta(html, 'og:title'),
      // 카카오 이미지 서버의 https 주소만 쓴다. 다른 값이 오면 그리지 않는다.
      image: image?.startsWith('https://') ? image : undefined,
    };
  } catch {
    return { url };
  }
}

export async function GET() {
  const previews = await Promise.all(OPEN_CHAT_ROOMS.map((room) => readPreview(room.url)));
  return Response.json(previews);
}
