import { Callout, Card, CardDescription, CardTitle, DataTable, Toggle } from '@ogonggo/ui';
import {
  useFeatureFlags,
  useUpdateFeatureFlag,
  type FeatureFlag,
} from '@/entities/feature-flag/api/useFeatureFlags';
import { formatDateTime } from '@/shared/lib/format';
import { PageHeader } from '@/widgets/page-header';

/**
 * 기능 플래그. 코드가 key 로 읽어 화면이나 기능을 켜고 끈다. 스위치를 누르면 바로 저장하고(별도 저장 버튼 없음) 목록을
 * 다시 읽는다. 저장에 실패하면 스위치가 원래 값으로 돌아오고 오류를 알린다.
 *
 * 플래그를 새로 만드는 기능은 없다. 새 플래그는 그 플래그를 읽는 기능의 배포 SQL 로 들어온다(PRD D1).
 */
export function FeatureFlagsPage() {
  const { data, isPending, isError } = useFeatureFlags();
  const updateMutation = useUpdateFeatureFlag();

  return (
    <>
      <PageHeader title="Feature Flag" />
      <Card>
        <CardTitle>기능 플래그</CardTitle>
        <CardDescription className="pt-1">
          바꾼 값은 최대 30초 뒤 서비스에 반영됩니다.
        </CardDescription>

        {updateMutation.isError ? (
          <Callout tone="error" className="mt-4">
            {updateMutation.variables?.key ?? '플래그'}를 바꾸지 못했습니다. 잠시 뒤 다시 시도해
            주세요.
          </Callout>
        ) : null}

        <div className="pt-4">
          {isPending ? (
            <p className="text-sm text-gray-500">불러오는 중입니다.</p>
          ) : isError || !data ? (
            <Callout tone="error">기능 플래그를 불러오지 못했습니다.</Callout>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'key',
                  header: '이름',
                  render: (row: FeatureFlag) => (
                    <code className="font-mono text-[13px] text-gray-900">{row.key}</code>
                  ),
                },
                {
                  key: 'description',
                  header: '설명',
                  render: (row: FeatureFlag) => row.description,
                },
                {
                  key: 'enabled',
                  header: '상태',
                  render: (row: FeatureFlag) => {
                    // 요청이 가 있는 동안에는 누른 값을 먼저 보이고, 실패하면 이 값이 사라져 원래 값으로 돌아온다.
                    const pending =
                      updateMutation.isPending && updateMutation.variables?.key === row.key;
                    const checked = pending ? updateMutation.variables.enabled : row.enabled;
                    return (
                      <Toggle
                        checked={checked}
                        disabled={updateMutation.isPending}
                        label={checked ? '켜짐' : '꺼짐'}
                        onChange={(enabled) => updateMutation.mutate({ key: row.key, enabled })}
                      />
                    );
                  },
                },
                {
                  key: 'updatedAt',
                  header: '마지막 변경',
                  render: (row: FeatureFlag) => (
                    <span className="text-sm text-gray-600">
                      {formatDateTime(row.updatedAt)}
                      {row.updatedBy == null ? '' : ` · 회원 ${row.updatedBy}`}
                    </span>
                  ),
                },
              ]}
              rows={data}
              rowKey={(row: FeatureFlag) => row.key}
              emptyMessage="등록된 플래그가 없습니다."
            />
          )}
        </div>
      </Card>
    </>
  );
}
