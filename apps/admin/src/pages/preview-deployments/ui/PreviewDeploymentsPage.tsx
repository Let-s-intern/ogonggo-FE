import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Callout, DataTable, Select } from '@ogonggo/ui';
import type { DataTableColumn } from '@ogonggo/ui';
import {
  usePreviewDeployments,
  type PreviewApp,
  type PreviewDeployment,
  type PreviewState,
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

type AppFilter = PreviewApp | 'all';

const APP_OPTIONS: { value: AppFilter; label: string }[] = [
  { value: 'all', label: '앱 전체' },
  { value: 'web', label: APP_LABEL.web },
  { value: 'admin', label: APP_LABEL.admin },
  { value: 'business', label: APP_LABEL.business },
];

const STATE_LABEL: Record<PreviewState, string> = {
  READY: '준비됨',
  BUILDING: '빌드 중',
  QUEUED: '대기 중',
  INITIALIZING: '시작 중',
  ERROR: '실패',
  CANCELED: '취소됨',
};

const STATE_TONE: Record<PreviewState, 'main' | 'success' | 'danger' | 'neutral'> = {
  READY: 'success',
  BUILDING: 'main',
  QUEUED: 'main',
  INITIALIZING: 'main',
  ERROR: 'danger',
  CANCELED: 'neutral',
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

/**
 * 웹·어드민·비즈니스 세 앱의 프리뷰 배포를 한 화면에서 본다. 읽기 전용이다.
 *
 * 열려 있는 동안 10초마다 목록이 다시 불린다(`usePreviewDeployments`). 준비됨·빌드 중·실패는 위에, 취소된 배포는
 * 아래에 접어 둔다. 같은 브랜치에 푸시가 이어지면 앞 빌드가 취소되어 목록이 그 건들로 채워지기 때문이다. 앱 필터와
 * 브랜치 검색은 받은 목록을 화면에서 거르므로 요청이 나가지 않는다.
 */
export function PreviewDeploymentsPage() {
  // 탭과 페이징은 2.1 에서 붙인다. 지금은 훅의 새 시그니처에 맞춰 첫 페이지 프리뷰만 부른다.
  const deployments = usePreviewDeployments({ target: 'preview', app: 'all', cursor: null });
  const now = useNow(CLOCK_MS);
  const [app, setApp] = useState<AppFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [showCanceled, setShowCanceled] = useState(false);

  const { active, canceled } = useMemo(() => {
    const needle = keyword.toLowerCase();
    const matched = (deployments.data?.deployments ?? []).filter(
      (item) =>
        (app === 'all' || item.app === app) &&
        (needle === '' || (item.branch ?? '').toLowerCase().includes(needle)),
    );
    return {
      active: matched.filter((item) => item.state !== 'CANCELED'),
      canceled: matched.filter((item) => item.state === 'CANCELED'),
    };
  }, [deployments.data, app, keyword]);

  const columns: DataTableColumn<PreviewDeployment>[] = [
    {
      key: 'app',
      header: '앱',
      width: 'w-24',
      render: (row) => <span className="text-sm font-medium">{APP_LABEL[row.app]}</span>,
    },
    {
      key: 'branch',
      header: '브랜치와 커밋',
      render: (row) => (
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
  const filtered = app !== 'all' || keyword !== '';

  return (
    <>
      <PageHeader title="프리뷰 배포" />

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
        {deployments.isError && !deployments.data ? null : (
          <>
            <ListToolbar>
              <SearchBox value={keyword} onSubmit={setKeyword} placeholder="브랜치 검색" />
              <Select
                options={APP_OPTIONS}
                value={app}
                onChange={(event) => setApp(event.target.value as AppFilter)}
                aria-label="앱"
              />
            </ListToolbar>

            <DataTable
              columns={columns}
              rows={active}
              rowKey={(row) => `${row.app}:${row.id}`}
              isLoading={deployments.isPending}
              emptyMessage={
                filtered ? '조건에 맞는 프리뷰 배포가 없습니다.' : '프리뷰 배포가 없습니다.'
              }
            />

            {canceled.length > 0 ? (
              <div>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-expanded={showCanceled}
                  onClick={() => setShowCanceled((open) => !open)}
                >
                  {showCanceled ? '취소된 배포 접기' : `취소된 배포 ${canceled.length}건 펼치기`}
                </Button>
                {showCanceled ? (
                  <DataTable
                    className="mt-3"
                    columns={columns}
                    rows={canceled}
                    rowKey={(row) => `${row.app}:${row.id}`}
                  />
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
