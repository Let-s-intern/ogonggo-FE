import { createShortUrl, ShortUrlError, type ShortUrlRequest } from '@/shared/api/shlink';
import { templateLabel, type UtmLink } from './utmLinks';

/**
 * 어드민에서 만든 단축링크에 붙는 태그. Shlink 에서 어드민이 만든 링크만 이 태그로 걸러 본다.
 */
export const SHORT_LINK_ORIGIN_TAG = 'ogonggo-admin';

/**
 * 링크 하나를 Shlink 요청으로 바꾼다.
 *
 * - 태그: 어드민 표시, 캠페인(공고 종류), UTM 템플릿(채널과 구분) 셋이다. Shlink 가 소문자로 바꾸고 공백을
 *   `-` 로 바꿔 저장한다(`오공고 인스타그램 리틀리` 는 `오공고-인스타그램-리틀리`).
 * - 제목: 공고 제목에 채널을 덧붙인다. 같은 공고가 채널마다 한 줄씩 생기므로 공고 제목만 쓰면 Shlink 목록에서
 *   구분되지 않는다.
 */
export function shortLinkRequest(link: UtmLink): ShortUrlRequest {
  const tags = [
    SHORT_LINK_ORIGIN_TAG,
    link.campaign,
    `${link.template.channel} ${link.template.placement}`,
  ].filter((tag) => tag !== '');
  return {
    longUrl: link.url,
    title: `${link.posting.title} (${templateLabel(link.template)})`,
    tags,
  };
}

/** 동시에 보내는 요청 수. Shlink 가 과하게 몰리지 않도록 작게 둔다. */
const CONCURRENCY = 4;

export interface ShortLinkBatchResult {
  /** UTM 이 붙은 긴 주소 → 단축 주소. 만든 것만 있다. */
  shortUrls: Record<string, string>;
  failed: number;
  /** 처음 만난 실패의 문구. 화면에 한 줄로 보인다. */
  firstError?: string;
}

/**
 * 링크들의 단축링크를 만든다. 일부가 실패해도 나머지는 계속하고 결과를 모아 돌려준다.
 *
 * 로그인 만료(401)나 서버 설정 없음(503)은 남은 요청도 모두 같은 이유로 실패하므로 거기서 멈춘다.
 */
export async function createShortLinks(
  links: UtmLink[],
  onProgress?: (done: number) => void,
): Promise<ShortLinkBatchResult> {
  const result: ShortLinkBatchResult = { shortUrls: {}, failed: 0 };
  let next = 0;
  let done = 0;
  let halted = false;

  const worker = async () => {
    while (!halted) {
      const link = links[next];
      if (!link) {
        return;
      }
      next += 1;
      try {
        result.shortUrls[link.url] = await createShortUrl(shortLinkRequest(link));
      } catch (error) {
        result.failed += 1;
        result.firstError ??= error instanceof Error ? error.message : '단축링크를 만들지 못했습니다.';
        if (error instanceof ShortUrlError && (error.status === 401 || error.status === 503)) {
          halted = true;
        }
      }
      done += 1;
      onProgress?.(done);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, links.length) }, worker));
  // 멈춘 경우 시도하지 못한 나머지도 실패로 센다.
  result.failed += links.length - done;
  return result;
}
