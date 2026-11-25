/**
 * 렛츠커리어 공개 API 의 가이드북 한 건을 읽는다. 산업 트렌드 리포트 판매 화면이 제목·썸네일·가격을
 * 여기서 가져온다(PRD 5장). 가격을 코드에 박지 않는 것이 이 파일의 이유다.
 *
 * 서버(서버 컴포넌트)에서 부른다. 읽기 전용이고 인증이 없어 토큰을 싣지 않는다. 브라우저용
 * `/letscareer-api/**` rewrite(`shared/api/letscareer.ts`)와 달리 origin 으로 바로 간다.
 *
 * origin 은 `shared/api/letscareer.ts` 가 읽는 `NEXT_PUBLIC_LETSCAREER_API_ORIGIN` 과 같다. 그 값이
 * 가리키는 API Gateway 가 `/api/v1/guidebooks/{id}` 도 받는다(`next.config.ts` 의 rewrite 가
 * `{origin}/api/:path*` 로 보내는 것과 같은 접두).
 */

const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 5000;

export interface LetsCareerGuidebookPrice {
  /** 정가. 0 이면 할인 표시를 할 근거가 없다. */
  originalPrice: number;
  /** 할인율(%). */
  discountRate: number;
  /** 실제 결제 금액. 0 이면 무료다. */
  finalPrice: number;
}

export interface LetsCareerGuidebook {
  title: string;
  thumbnail: string | null;
  desktopThumbnail: string | null;
  /** Lexical 에디터 상태 JSON 문자열. 그대로 그릴 수 없다(`shared/lib/lexicalHtml.ts` 참고). */
  description: string | null;
  priceInfo: LetsCareerGuidebookPrice;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 빈 문자열도 값이 없는 것으로 본다. 렛츠커리어가 데스크톱 썸네일이 없을 때 `''` 를 준다. */
function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function parsePrice(value: unknown): LetsCareerGuidebookPrice | null {
  if (!isRecord(value)) {
    return null;
  }
  const { originalPrice, discountRate, finalPrice } = value;
  if (
    typeof originalPrice !== 'number' ||
    typeof discountRate !== 'number' ||
    typeof finalPrice !== 'number'
  ) {
    return null;
  }
  return { originalPrice, discountRate, finalPrice };
}

/** 응답 봉투(`{ status, message, data }`)에서 쓰는 다섯 값만 꺼낸다. 모양이 다르면 `null`. */
function parseGuidebook(body: unknown): LetsCareerGuidebook | null {
  if (!isRecord(body) || !isRecord(body.data)) {
    return null;
  }
  const { title, thumbnail, desktopThumbnail, description, priceInfo } = body.data;
  const price = parsePrice(priceInfo);
  if (typeof title !== 'string' || title === '' || !price) {
    return null;
  }
  return {
    title,
    thumbnail: textOrNull(thumbnail),
    desktopThumbnail: textOrNull(desktopThumbnail),
    description: textOrNull(description),
    priceInfo: price,
  };
}

/**
 * 가이드북 한 건. 5분 캐시한다. 없는 id, 네트워크 실패, 시간 초과, 모양이 다른 응답은 모두 `null` 이고
 * 예외를 올리지 않는다 — 부르는 화면이 가격 줄 같은 일부만 숨기고 나머지를 그리게 한다.
 */
export async function fetchLetsCareerGuidebook(
  guidebookId: number,
): Promise<LetsCareerGuidebook | null> {
  const origin = process.env.NEXT_PUBLIC_LETSCAREER_API_ORIGIN;
  if (!origin) {
    return null;
  }
  try {
    const response = await fetch(`${origin}/api/v1/guidebooks/${guidebookId}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      return null;
    }
    return parseGuidebook(await response.json());
  } catch {
    return null;
  }
}
