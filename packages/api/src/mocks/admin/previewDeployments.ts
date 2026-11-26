import { http, HttpResponse, type HttpHandler } from 'msw';

/**
 * 배포 목록 핸들러(`GET /preview-api/deployments`).
 *
 * 어드민 프리뷰 배포는 목으로 뜨고 그때의 어드민 로그인은 가짜다. 서버리스 함수(`apps/admin/api/preview-deployments.ts`)
 * 는 어드민 토큰을 확인해 401 을 주므로, 요청이 함수까지 가지 않고 여기서 예시를 받게 한다. 그러지 않으면 프리뷰에서
 * 화면이 오류로 열린다.
 *
 * 이 패키지는 앱 코드를 가져오지 못해 응답 타입과 쿼리 규칙을 여기 옮겨 둔다. 모양의 기준은 함수 파일이다. 함수와
 * 같게 앱마다 `cursor` 이전 10건씩을 가져와 합친 앞 10건을 주고, 합친 건수가 10을 넘거나 한 앱이 10건을 채웠으면
 * `nextCursor` 를 준다. 그래서 웹 프리뷰만 보면 10건이 꽉 차 다음 페이지가 빈 페이지로 열린다(함수도 그렇다). 함수가
 * `CANCELED` 를 상류에서 빼므로 취소된 배포는 두지 않는다.
 *
 * 프리뷰 쪽 가장 최근 배포 하나는 빌드 중이었다가 `BUILD_MS` 가 지나면 준비됨으로 바뀐다. 첫 페이지의 10초 갱신이
 * 상태 변화를 반영하는지 목으로 볼 수 있게 한 것이다. 값은 모듈 안에 있어 목을 다시 띄우면 처음으로 돌아간다.
 */

type PreviewApp = 'web' | 'admin' | 'business';
type PreviewState = 'READY' | 'BUILDING' | 'QUEUED' | 'INITIALIZING' | 'ERROR';
type PreviewTarget = 'preview' | 'production';

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

const PAGE_SIZE = 10;
const BUILD_MS = 25_000;
const MINUTE = 60_000;

const startedAt = Date.now();

const APP_BY_CODE: Record<string, PreviewApp> = { W: 'web', A: 'admin', B: 'business' };

/**
 * 최신순으로 앱을 늘어놓은 것. 프리뷰는 웹 10, 어드민 8, 비즈니스 7건이고 운영은 웹 9, 어드민 8, 비즈니스 8건이다.
 * 세 앱이 모두 첫 페이지 안에 나와 `최신` 줄이 앱마다 보인다.
 */
const SEQUENCE: Record<PreviewTarget, string> = {
  preview: 'AWABWBAWAWBWBAWBWAWABWABW',
  production: 'WWABBAWWABBAWWABBAWWABBAW',
};

const PREVIEW_WORK: Record<PreviewApp, { branch: string; commitTitle: string }[]> = {
  web: [
    { branch: '732-조회-중복-제한-1분', commitTitle: 'fix(api): 조회 중복 제한을 1분으로 맞춤' },
    { branch: '732-조회-중복-제한-1분', commitTitle: 'fix(api): 조회 중복 제한 시간 상수 분리' },
    { branch: '729-공고-카드-정리', commitTitle: 'refactor(ui): 공고 카드 간격 정리' },
  ],
  admin: [
    {
      branch: '744-프리뷰-배포-패널을-프리뷰와-운영으로-나누고-10개씩-페이징한다',
      commitTitle: 'feat(ui): 배포 현황에 탭과 페이징 추가',
    },
    { branch: '721-통계-화면-정리', commitTitle: 'refactor(ui): 통계 카드 묶음 정리' },
  ],
  business: [
    { branch: '537-기업-공고-등록-개선', commitTitle: 'feat(ui): 공고 등록 폼 단계 나누기' },
    { branch: '537-기업-공고-등록-개선', commitTitle: 'feat(ui): 공고 등록 폼 초안' },
  ],
};

const PRODUCTION_TITLES = [
  'feat(ui): 공고 상세 하단 추천 영역 추가 (#731)',
  'fix(api): 조회 중복 제한을 1분으로 맞춤 (#733)',
  'chore(infra): 의존성 갱신 (#728)',
  'refactor(ui): 공고 카드 간격 정리 (#729)',
];

function buildDeployments(target: PreviewTarget): MockPreviewDeployment[] {
  const used: Record<PreviewApp, number> = { web: 0, admin: 0, business: 0 };
  return [...SEQUENCE[target]].map((code, index) => {
    const app = APP_BY_CODE[code]!;
    const nth = used[app]++;
    // 최신 건은 방금 만든 것으로, 나머지는 뒤로 갈수록 간격이 벌어진다. 시각이 겹치지 않아 커서로 자를 때 빠지는
    // 건이 없다.
    const agoMs = index === 0 ? 10_000 : (index + 1) * (index + 1) * 90_000;
    const work =
      target === 'preview'
        ? PREVIEW_WORK[app][nth % PREVIEW_WORK[app].length]!
        : {
            branch: 'main',
            commitTitle: PRODUCTION_TITLES[(index + nth) % PRODUCTION_TITLES.length]!,
          };
    let state: PreviewState = 'READY';
    if (target === 'preview' && index === 0) {
      state = 'BUILDING';
    } else if (index === 6 || index === 17) {
      state = 'ERROR';
    }
    return {
      app,
      id: `dpl_mock_${target}_${app}_${nth + 1}`,
      url: `https://ogonggo-fe-${app}-${target === 'preview' ? 'p' : 'm'}${String(index).padStart(2, '0')}x-lets-interns-projects.vercel.app`,
      branchAliasUrl: null,
      branch: work.branch,
      commitTitle: work.commitTitle,
      state,
      createdAt: new Date(
        startedAt - agoMs - (target === 'production' ? 7 * MINUTE : 0),
      ).toISOString(),
    };
  });
}

const deploymentsByTarget: Record<PreviewTarget, MockPreviewDeployment[]> = {
  preview: buildDeployments('preview'),
  production: buildDeployments('production'),
};

/** 빌드 중인 배포가 `BUILD_MS` 를 넘겼으면 준비됨으로 옮긴다. */
function settle() {
  const now = Date.now();
  for (const item of deploymentsByTarget.preview) {
    if (item.state === 'BUILDING' && now - startedAt >= BUILD_MS) {
      item.state = 'READY';
    }
  }
}

function invalidQuery() {
  return HttpResponse.json(
    {
      status: 400,
      code: 'INVALID_QUERY',
      message:
        'target 은 preview 나 production, app 은 all·web·admin·business, cursor 는 양의 정수여야 합니다.',
    },
    { status: 400 },
  );
}

export const previewDeploymentHandlers: HttpHandler[] = [
  http.get('*/preview-api/deployments', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const target = params.get('target') ?? 'preview';
    const app = params.get('app') ?? 'all';
    const rawCursor = params.get('cursor');
    if (target !== 'preview' && target !== 'production') {
      return invalidQuery();
    }
    if (app !== 'all' && app !== 'web' && app !== 'admin' && app !== 'business') {
      return invalidQuery();
    }
    if (rawCursor !== null && !/^[1-9]\d*$/.test(rawCursor)) {
      return invalidQuery();
    }
    const cursor = rawCursor === null ? null : Number(rawCursor);

    settle();
    const apps: PreviewApp[] = app === 'all' ? ['admin', 'web', 'business'] : [app];
    const merged: MockPreviewDeployment[] = [];
    let anyFull = false;
    for (const name of apps) {
      // `until` 은 그 시각 이전만 준다(배타).
      const own = deploymentsByTarget[target]
        .filter((item) => item.app === name)
        .filter((item) => cursor === null || Date.parse(item.createdAt) < cursor)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      merged.push(...own.slice(0, PAGE_SIZE));
      anyFull ||= own.length >= PAGE_SIZE;
    }
    merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const page = merged.slice(0, PAGE_SIZE);
    const last = page[page.length - 1];
    const hasMore = merged.length > PAGE_SIZE || anyFull;

    return HttpResponse.json({
      deployments: page.map((item) => ({ ...item })),
      nextCursor: hasMore && last ? Date.parse(last.createdAt) : null,
      failedApps: [],
    });
  }),
];
