import { getAccessToken } from './accessToken';

/**
 * 웹·어드민·비즈니스 세 앱의 프리뷰 배포 목록을 받는 작은 클라이언트. `프리뷰 배포` 화면이 쓴다.
 *
 * `@ogonggo/api` 의 `httpClient` 를 쓰지 않는다. 그쪽은 401 을 받으면 어드민 로그인이 끝난 것으로 보고
 * 로그인 화면으로 돌려보내는데, 이 호출의 실패는 Vercel 쪽 사정일 수 있다(`./redash.ts` 와 같은 이유).
 *
 * `/preview-api/deployments` 는 배포본에서 `vercel.json` 의 rewrite 가 부르는 서버리스 함수
 * (`api/preview-deployments.ts`) 가 받는다. Vercel API 토큰은 그쪽만 갖는다. 로컬 `pnpm dev`(목 끔)에는 이 주소를
 * 받는 곳이 없다. 화면은 `pnpm mock:admin` 으로 본다.
 *
 * 아래 타입은 함수 파일의 응답 모양을 옮긴 것이다. 서버리스 함수 파일을 화면 코드에서 가져오면 그 파일이 끌고 오는
 * 서버 쪽 코드(`redash-query.ts`)가 브라우저 번들 경계를 넘는다.
 */

const DEPLOYMENTS_PATH = '/preview-api/deployments';

export type PreviewApp = 'web' | 'admin' | 'business';

export type PreviewState =
  | 'READY'
  | 'BUILDING'
  | 'QUEUED'
  | 'INITIALIZING'
  | 'ERROR'
  | 'CANCELED';

export interface PreviewDeployment {
  app: PreviewApp;
  id: string;
  /** `https://` 를 붙인 배포 고유 주소. */
  url: string;
  /** 브랜치 별칭 주소. 값이 있을 때만 화면에 보인다. 지금 함수는 항상 `null` 을 준다. */
  branchAliasUrl: string | null;
  branch: string | null;
  /** 커밋 메시지의 첫 줄. */
  commitTitle: string | null;
  state: PreviewState;
  /** ISO 8601. */
  createdAt: string;
}

export interface PreviewDeploymentsResult {
  deployments: PreviewDeployment[];
  /** 불러오지 못한 앱. 나머지 앱의 배포는 그대로 들어 있다. */
  failedApps: PreviewApp[];
}

/** 함수가 주는 오류 봉투(`status`·`code`·`message`). 화면은 `code` 로 분기하고 `message` 를 그대로 보인다. */
export class PreviewDeploymentsError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'PreviewDeploymentsError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchPreviewDeployments(): Promise<PreviewDeploymentsResult> {
  const token = getAccessToken();
  const response = await fetch(DEPLOYMENTS_PATH, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  const text = await response.text().catch(() => '');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    // JSON 이 아닌 본문(게이트웨이 오류 등). 아래에서 상태 코드로 알린다.
  }

  if (!response.ok) {
    const error = body as { code?: string; message?: string } | undefined;
    throw new PreviewDeploymentsError(
      response.status,
      error?.code ?? '',
      error?.message ?? `프리뷰 배포 목록을 불러오지 못했습니다(${response.status}).`,
    );
  }
  return body as PreviewDeploymentsResult;
}
