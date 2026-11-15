import { HttpError } from '@ogonggo/api';
import { Badge, Button, Callout, Card, CardDescription, DataTable } from '@ogonggo/ui';
import type { DataTableColumn } from '@ogonggo/ui';
import {
  TRANSITIONING_STATES,
  useEc2Instances,
  useToggleEc2Instance,
  type Ec2Instance,
  type Ec2InstanceName,
  type Ec2InstanceState,
} from '@/entities/ec2-instance/api/useEc2Instances';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { PageHeader } from '@/widgets/page-header';

/**
 * 이름은 BE `/enums` 의 `Ec2Instance` 에 있지만 그 카탈로그는 사용자 API 에서 받아 어드민 전용 enum 이 없다. 두 개뿐이라
 * 여기 둔다. 자동으로 끄는 시각은 BE 스케줄이다(켜기 API 설명, 크롤러 14:00·리대시 22:00).
 */
const INSTANCES: Record<Ec2InstanceName, { label: string; autoStop: string }> = {
  REDASH: { label: '리대시', autoStop: '매일 22:00' },
  CRAWLER: { label: '크롤러', autoStop: '매일 14:00' },
};

const STATE_LABEL: Record<Ec2InstanceState, string> = {
  PENDING: '켜는 중',
  RUNNING: '켜짐',
  STOPPING: '끄는 중',
  STOPPED: '꺼짐',
  SHUTTING_DOWN: '종료하는 중',
  TERMINATED: '종료됨',
  UNKNOWN: '알 수 없음',
};

const STATE_TONE: Record<Ec2InstanceState, 'main' | 'success' | 'urgent' | 'danger' | 'neutral'> = {
  PENDING: 'main',
  RUNNING: 'success',
  STOPPING: 'main',
  STOPPED: 'neutral',
  SHUTTING_DOWN: 'urgent',
  TERMINATED: 'danger',
  UNKNOWN: 'neutral',
};

/** BE `Ec2InstanceErrorCode`. 서버 문구 대신 운영자가 할 일을 적는다. */
const ERROR_MESSAGES: Record<string, string> = {
  EC2_INSTANCE_STATE_CONFLICT: '상태를 바꾸는 중이에요. 바뀐 뒤 다시 눌러 주세요.',
  EC2_INSTANCE_NOT_CONFIGURED:
    '서버 설정에 이 인스턴스 ID가 없어요. 백엔드 담당자에게 알려 주세요.',
  EC2_UNAVAILABLE: 'AWS 에 요청하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    try {
      const parsed: unknown = JSON.parse(error.body);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'code' in parsed &&
        typeof parsed.code === 'string'
      ) {
        const message = ERROR_MESSAGES[parsed.code];
        if (message) return message;
      }
    } catch {
      // JSON 이 아닌 본문이다.
    }
  }
  return serverErrorMessage(error) ?? fallback;
}

/**
 * 리대시·크롤러 서버(EC2) 켜고 끄기(BE LC-3616). 비용 때문에 평소에는 꺼 두고 쓸 때만 켠다. 켜기·끄기는 AWS 에 요청만
 * 하고 바로 돌아오므로, 바뀌는 중에는 목록이 알아서 다시 불려 끝 상태를 보인다. 켜 둬도 정해진 시각에 다시 꺼진다.
 */
export function ServerInstancesPage() {
  const instances = useEc2Instances();
  const toggle = useToggleEc2Instance();

  const columns: DataTableColumn<Ec2Instance>[] = [
    {
      key: 'instance',
      header: '서버',
      render: (row) => INSTANCES[row.instance]?.label ?? row.instance,
    },
    {
      key: 'state',
      header: '상태',
      width: 'w-32',
      render: (row) => <Badge tone={STATE_TONE[row.state]}>{STATE_LABEL[row.state]}</Badge>,
    },
    {
      key: 'autoStop',
      header: '자동으로 끄는 시각',
      width: 'w-40',
      render: (row) => <span className="text-sm">{INSTANCES[row.instance]?.autoStop ?? '-'}</span>,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-40',
      render: (row) => {
        const label = INSTANCES[row.instance]?.label ?? row.instance;
        const busy =
          TRANSITIONING_STATES.includes(row.state) ||
          (toggle.isPending && toggle.variables?.instance === row.instance);
        if (row.state === 'RUNNING' || row.state === 'PENDING') {
          return (
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${label} 끄기`}
              disabled={busy}
              onClick={() => toggle.mutate({ instance: row.instance, action: 'stop' })}
            >
              끄기
            </Button>
          );
        }
        if (row.state === 'STOPPED' || row.state === 'STOPPING') {
          return (
            <Button
              size="sm"
              aria-label={`${label} 켜기`}
              disabled={busy}
              onClick={() => toggle.mutate({ instance: row.instance, action: 'start' })}
            >
              켜기
            </Button>
          );
        }
        return <span className="text-sm text-gray-400">-</span>;
      },
    },
  ];

  return (
    <>
      <PageHeader title="리대시·크롤러 서버" />
      <Card>
        <CardDescription>
          켜는 데 수십 초가 걸려요. 상태가 바뀌는 동안에는 목록이 알아서 새로 고쳐져요.
        </CardDescription>
        <div className="mt-3 flex flex-col gap-3">
          {instances.isError ? (
            <Callout tone="error">
              {errorMessage(instances.error, '서버 상태를 불러오지 못했습니다.')}
            </Callout>
          ) : null}
          {toggle.isError ? (
            <Callout tone="error">
              {errorMessage(toggle.error, '서버를 켜거나 끄지 못했습니다.')}
            </Callout>
          ) : null}
          <DataTable
            columns={columns}
            rows={instances.data ?? []}
            rowKey={(row) => row.instance}
            isLoading={instances.isPending}
            emptyMessage="켜고 끌 수 있는 서버가 없습니다."
          />
        </div>
      </Card>
    </>
  );
}
