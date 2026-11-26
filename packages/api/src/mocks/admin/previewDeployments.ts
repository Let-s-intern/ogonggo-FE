import { http, HttpResponse, type HttpHandler } from 'msw';

/**
 * 프리뷰 배포 목록 핸들러(`GET /preview-api/deployments`).
 *
 * 어드민 프리뷰 배포는 목으로 뜨고 그때의 어드민 로그인은 가짜다. 서버리스 함수(`apps/admin/api/preview-deployments.ts`)
 * 는 어드민 토큰을 확인해 401 을 주므로, 요청이 함수까지 가지 않고 여기서 예시를 받게 한다. 그러지 않으면 프리뷰에서
 * 화면이 오류로 열린다.
 *
 * 이 패키지는 앱 코드를 가져오지 못해 응답 타입을 여기 옮겨 둔다. 모양의 기준은 함수 파일이다.
 *
 * 빌드 중인 배포는 `BUILD_MS` 가 지나면 준비됨으로 바뀐다. 화면의 10초 갱신이 상태 변화를 반영하는지 목으로 볼 수
 * 있게 한 것이다. 값은 모듈 안에 있어 목을 다시 띄우면 처음으로 돌아간다.
 */

type PreviewApp = 'web' | 'admin' | 'business';
type PreviewState = 'READY' | 'BUILDING' | 'QUEUED' | 'INITIALIZING' | 'ERROR' | 'CANCELED';

export interface MockPreviewDeployment {
  app: PreviewApp;
  id: string;
  url: string;
  branchAliasUrl: string | null;
  branch: string | null;
  commitTitle: string | null;
  state: PreviewState;
  createdAt: string;
}

const BUILD_MS = 25_000;
const MINUTE = 60_000;

const startedAt = Date.now();

/** 목을 띄운 시각에서 `agoMs` 만큼 앞선 시각. 상대 시각이 목을 띄운 직후에도 자연스럽게 읽힌다. */
function at(agoMs: number): string {
  return new Date(startedAt - agoMs).toISOString();
}

const deployments: MockPreviewDeployment[] = [
  {
    app: 'admin',
    id: 'dpl_mock_admin_1',
    url: 'https://ogonggo-fe-admin-aaaa1111-lets-interns-projects.vercel.app',
    branchAliasUrl: null,
    branch: '740-어드민에서-프리뷰-배포-주소를-실시간으로-확인한다',
    commitTitle: 'feat(ui): 프리뷰 배포 화면 추가',
    state: 'BUILDING',
    createdAt: at(10_000),
  },
  {
    app: 'web',
    id: 'dpl_mock_web_1',
    url: 'https://ogonggo-fe-web-bbbb2222-lets-interns-projects.vercel.app',
    branchAliasUrl: null,
    branch: '732-조회-중복-제한-1분',
    commitTitle: 'fix(api): 조회 중복 제한을 1분으로 맞춤',
    state: 'READY',
    createdAt: at(8 * MINUTE),
  },
  {
    app: 'business',
    id: 'dpl_mock_business_1',
    url: 'https://ogonggo-fe-business-cccc3333-lets-interns-projects.vercel.app',
    branchAliasUrl: null,
    branch: '537-기업-공고-등록-개선',
    commitTitle: 'feat(ui): 공고 등록 폼 단계 나누기',
    state: 'READY',
    createdAt: at(35 * MINUTE),
  },
  {
    app: 'web',
    id: 'dpl_mock_web_2',
    url: 'https://ogonggo-fe-web-dddd4444-lets-interns-projects.vercel.app',
    branchAliasUrl: null,
    branch: '732-조회-중복-제한-1분',
    commitTitle: 'fix(api): 조회 중복 제한 시간 상수 분리',
    state: 'CANCELED',
    createdAt: at(41 * MINUTE),
  },
  {
    app: 'admin',
    id: 'dpl_mock_admin_2',
    url: 'https://ogonggo-fe-admin-eeee5555-lets-interns-projects.vercel.app',
    branchAliasUrl: null,
    branch: '721-통계-화면-정리',
    commitTitle: 'refactor(ui): 통계 카드 묶음 정리',
    state: 'ERROR',
    createdAt: at(3 * 60 * MINUTE),
  },
  {
    app: 'business',
    id: 'dpl_mock_business_2',
    url: 'https://ogonggo-fe-business-ffff6666-lets-interns-projects.vercel.app',
    branchAliasUrl: null,
    branch: '537-기업-공고-등록-개선',
    commitTitle: 'feat(ui): 공고 등록 폼 초안',
    state: 'CANCELED',
    createdAt: at(26 * 60 * MINUTE),
  },
];

/** 빌드 중인 배포가 `BUILD_MS` 를 넘겼으면 준비됨으로 옮긴다. */
function settle() {
  const now = Date.now();
  for (const item of deployments) {
    if (item.state === 'BUILDING' && now - startedAt >= BUILD_MS) {
      item.state = 'READY';
    }
  }
}

export const previewDeploymentHandlers: HttpHandler[] = [
  http.get('*/preview-api/deployments', () => {
    settle();
    return HttpResponse.json({
      deployments: deployments.map((item) => ({ ...item })),
      failedApps: [],
    });
  }),
];
