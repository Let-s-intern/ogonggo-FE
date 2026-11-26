import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Callout, DataTable, Select, Tabs } from '@ogonggo/ui';
import type { DataTableColumn } from '@ogonggo/ui';
import {
  usePreviewDeployments,
  type PreviewApp,
  type PreviewAppFilter,
  type PreviewDeployment,
  type PreviewState,
  type PreviewTarget,
} from '@/entities/preview-deployment/api/usePreviewDeployments';
import { PreviewDeploymentsError } from '@/shared/api/previewDeployments';
import { formatDateTime } from '@/shared/lib/format';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import { PageHeader } from '@/widgets/page-header';
import { formatRelativeTime } from '../lib/relativeTime';
import { DeploymentAddress } from './DeploymentAddress';

const APP_LABEL: Record<PreviewApp, string> = {
  web: '웹',
  admin: '어드민',
  business: '비즈니스',
};

const APP_OPTIONS: { value: PreviewAppFilter; label: string }[] = [
  { value: 'all', label: '앱 전체' },
  { value: 'web', label: APP_LABEL.web },
  { value: 'admin', label: APP_LABEL.admin },
  { value: 'business', label: APP_LABEL.business },
];

const TARGET_TABS: { value: PreviewTarget; label: string }[] = [
  { value: 'preview', label: '프리뷰' },
  { value: 'production', label: '운영' },
];

const STATE_LABEL: Record<PreviewState, string> = {
  READY: '준비됨',
  BUILDING: '빌드 중',
  QUEUED: '대기 중',
  INITIALIZING: '시작 중',
  ERROR: '실패',
};

const STATE_TONE: Record<PreviewState, 'main' | 'success' | 'danger' | 'neutral'> = {
  READY: 'success',
  BUILDING: 'main',
  QUEUED: 'main',
  INITIALIZING: 'main',
  ERROR: 'danger',
};

/** 토큰 환경변수가 서버에 없을 때 함수가 주는 코드(`api/preview-deployments.ts`). 설정 문제라 오류가 아니라 주의로 보인다. */
const TOKEN_MISSING_CODE = 'VERCEL_TOKEN_MISSING';

const CLOCK_MS = 10_000;

/**
 * 상대 시각(`5분 전`)을 다시 그리게 하는 시계. 목록이 그대로여도 시간은 흐른다. 갱신 응답이 같으면 React Query 가
 * 이전 데이터를 그대로 두어 화면이 다시 그려지지 않아서, 시계를 따로 둔다.
 */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** 가장 최근 배포 줄의 배경. 어드민의 다른 화면이 선택·강조에 쓰는 색(`bg-blue-50`)이다. */
const LATEST_ROW = 'bg-blue-50';

/**
 * 웹·어드민·비즈니스 세 앱의 프리뷰와 운영 배포를 한 화면에서 본다. 읽기 전용이다.
 *
 * 탭마다, 앱 필터마다 따로 요청해 10건씩 받는다(`usePreviewDeployments`). 페이지 번호로 건너뛰지 못한다. 상류가 시각
 * 기준 커서만 주기 때문에, 지나온 커서를 쌓아 두고 `이전` 에서 하나씩 꺼낸다. 탭이나 앱 필터를 바꾸면 쌓은 커서를
 * 비워 첫 페이지로 간다. 첫 페이지만 10초마다 다시 불러, 첫 페이지에서만 앱별 가장 최근 줄에 색과 `최신` 을 붙인다.
 *
 * 브랜치 검색은 받은 한 페이지 안에서만 거른다. 요청이 나가지 않는다.
 */
export function PreviewDeploymentsPage() {
  const now = useNow(CLOCK_MS);
  const [target, setTarget] = useState<PreviewTarget>('preview');
  const [app, setApp] = useState<PreviewAppFilter>('all');
  const [keyword, setKeyword] = useState('');
  // 지나온 페이지의 커서. 첫 항목은 첫 페이지(`null`)이고 마지막 항목이 지금 페이지다.
  const [cursors, setCursors] = useState<(number | null)[]>([null]);
  const cursor = cursors[cursors.length - 1] ?? null;
  const isFirstPage = cursors.length === 1;

  const deployments = usePreviewDeployments({ target, app, cursor });
  // 페이지를 넘기는 중에는 이전 페이지가 남아 있다. 그 데이터로 `최신` 을 정하거나 `다음` 커서를 쌓으면 어긋난다.
  const switching = deployments.isPlaceholderData;
  const isProduction = target === 'production';

  const rows = useMemo(() => {
    const needle = keyword.toLowerCase();
    return (deployments.data?.deployments ?? []).filter(
      (item) => needle === '' || (item.branch ?? '').toLowerCase().includes(needle),
    );
  }, [deployments.data, keyword]);

  // 앱마다 목록에서 가장 먼저 나오는 줄이 그 앱의 가장 최근 배포다(최신순). 검색으로 가려진 줄은 계산에서 빼지 않는다.
  const latestKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!isFirstPage || switching) {
      return keys;
    }
    const seen = new Set<PreviewApp>();
    for (const item of deployments.data?.deployments ?? []) {
      if (!seen.has(item.app)) {
        seen.add(item.app);
        keys.add(`${item.app}:${item.id}`);
      }
    }
    return keys;
  }, [deployments.data, isFirstPage, switching]);

  const changeTarget = (next: PreviewTarget) => {
    setTarget(next);
    setCursors([null]);
  };
  const changeApp = (next: PreviewAppFilter) => {
    setApp(next);
    setCursors([null]);
  };
  const nextCursor = deployments.data?.nextCursor ?? null;
  const goNext = () => {
    if (nextCursor !== null) {
      setCursors((stack) => [...stack, nextCursor]);
    }
  };
  const goPrevious = () => setCursors((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));

  const columns: DataTableColumn<PreviewDeployment>[] = [
    {
      key: 'app',
      header: '앱',
      width: 'w-24',
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm font-medium">{APP_LABEL[row.app]}</span>
          {latestKeys.has(`${row.app}:${row.id}`) ? (
            <Badge tone="main" className="bg-white">
              최신
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: 'branch',
      header: isProduction ? '커밋' : '브랜치와 커밋',
      // 운영은 브랜치가 늘 `main` 이라 구분이 되는 커밋 제목을 앞에 둔다.
      render: (row) =>
        isProduction ? (
          <div className="min-w-0">
            <p className="break-words text-sm font-medium">{row.commitTitle ?? '-'}</p>
            <p className="break-all text-sm text-gray-500">{row.branch ?? '-'}</p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="break-all text-sm font-medium">{row.branch ?? '-'}</p>
            {row.commitTitle ? (
              <p className="break-words text-sm text-gray-500">{row.commitTitle}</p>
            ) : null}
          </div>
        ),
    },
    {
      key: 'state',
      header: '상태',
      width: 'w-28',
      render: (row) => <Badge tone={STATE_TONE[row.state]}>{STATE_LABEL[row.state]}</Badge>,
    },
    {
      key: 'createdAt',
      header: '만든 시각',
      width: 'w-28',
      render: (row) => (
        <span className="text-sm text-gray-600" title={formatDateTime(row.createdAt)}>
          {formatRelativeTime(row.createdAt, now)}
        </span>
      ),
    },
    {
      key: 'address',
      header: '주소',
      render: (row) => (
        <div className="flex flex-col gap-1.5">
          {row.branchAliasUrl ? (
            <DeploymentAddress label="브랜치 주소" url={row.branchAliasUrl} />
          ) : null}
          <DeploymentAddress label={row.branchAliasUrl ? '배포 주소' : undefined} url={row.url} />
        </div>
      ),
    },
  ];

  const error = deployments.error;
  const tokenMissing =
    error instanceof PreviewDeploymentsError && error.code === TOKEN_MISSING_CODE;
  const failedApps = deployments.data?.failedApps ?? [];
  const noData = deployments.isError && !deployments.data;
  const loaded = deployments.data?.deployments ?? [];

  let emptyMessage = '배포가 없습니다.';
  if (loaded.length > 0) {
    emptyMessage = '이 페이지에 조건에 맞는 배포가 없습니다.';
  } else if (!isFirstPage) {
    // 전체 건수가 10의 배수이면 마지막에 빈 페이지가 하나 더 온다. `이전` 으로 돌아갈 수 있게 표 아래에 버튼을 둔다.
    emptyMessage = '이 페이지에 배포가 없습니다.';
  }

  return (
    <>
      <PageHeader title="배포 현황" />

      <Tabs
        items={TARGET_TABS}
        value={target}
        onValueChange={changeTarget}
        aria-label="배포 종류"
        className="mb-4"
      />

      <div className="flex flex-col gap-3">
        {error ? (
          <Callout tone={tokenMissing ? 'warning' : 'error'}>{error.message}</Callout>
        ) : null}
        {failedApps.length > 0 ? (
          <Callout tone="warning">
            {failedApps.map((failed) => APP_LABEL[failed]).join(', ')} 앱의 배포를 불러오지
            못했어요. 나머지 앱만 보여요.
          </Callout>
        ) : null}

        {/* 오류로 받은 목록이 한 번도 없으면 표를 그리지 않는다. 빈 표는 배포가 없다는 말처럼 읽힌다. */}
        {noData ? null : (
          <>
            <ListToolbar>
              <SearchBox
                value={keyword}
                onSubmit={setKeyword}
                placeholder="이 페이지에서 브랜치 검색"
              />
              <Select
                options={APP_OPTIONS}
                value={app}
                onChange={(event) => changeApp(event.target.value as PreviewAppFilter)}
                aria-label="앱"
              />
            </ListToolbar>

            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(row) => `${row.app}:${row.id}`}
              rowClassName={(row) =>
                latestKeys.has(`${row.app}:${row.id}`) ? LATEST_ROW : undefined
              }
              isLoading={deployments.isPending}
              emptyMessage={emptyMessage}
            />
          </>
        )}

        {/* 오류로 둘 다 막혀도 2페이지 이후라면 `이전` 은 눌러야 첫 페이지로 돌아간다. */}
        {noData && isFirstPage ? null : (
          <nav className="flex items-center justify-center gap-3 py-2" aria-label="페이지">
            <Button
              size="sm"
              variant="secondary"
              onClick={goPrevious}
              disabled={isFirstPage || switching}
            >
              이전
            </Button>
            <span className="min-w-16 text-center text-sm text-gray-600">
              {cursors.length}페이지
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={goNext}
              disabled={nextCursor === null || switching}
            >
              다음
            </Button>
          </nav>
        )}
      </div>
    </>
  );
}
