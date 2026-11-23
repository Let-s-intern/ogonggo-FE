import { enumLabel } from '@ogonggo/api/src/admin';
import { Callout, Card, CardDescription, CardTitle, DataTable, Toggle } from '@ogonggo/ui';
import {
  useReplaceWork24JobField,
  useWork24JobFields,
  type Work24JobField,
} from '@/entities/work24-job-field/api/useWork24JobFields';
import { PageHeader } from '@/widgets/page-header';

/**
 * 고용24 채용정보 수집 직군 설정. 직군마다 스위치를 누르면 바로 저장한다(별도 저장 버튼 없음).
 *
 * 일학습병행 훈련과정과 부트캠프 수집에는 쓰지 않는다.
 */
export function Work24JobFieldsPage() {
  const { data, isPending, isError } = useWork24JobFields();
  const replaceMutation = useReplaceWork24JobField();

  return (
    <>
      <PageHeader title="고용24 수집 직군" />
      <Card>
        <CardTitle>직군별 수집</CardTitle>
        <CardDescription className="pt-1">
          고용24 채용정보를 매일 받을 때 켜 둔 직군의 공고만 받아요. 바꾼 값은 다음 수집 회차부터
          적용돼요. 끄면 그 직군의 공고를 더 받지 않고, 이미 등록한 공고는 그대로 둬요.
        </CardDescription>

        {replaceMutation.isError ? (
          <Callout tone="error" className="mt-4">
            저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.
          </Callout>
        ) : null}

        <div className="pt-4">
          {isPending ? (
            <p className="text-sm text-gray-500">불러오는 중입니다.</p>
          ) : isError || !data ? (
            <Callout tone="error">수집 직군을 불러오지 못했습니다.</Callout>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'jobField',
                  header: '직군',
                  render: (row: Work24JobField) => enumLabel('JobField', row.jobField),
                },
                {
                  key: 'enabled',
                  header: '수집',
                  render: (row: Work24JobField) => {
                    const pending =
                      replaceMutation.isPending &&
                      replaceMutation.variables?.jobField === row.jobField;
                    return (
                      <Toggle
                        checked={row.enabled}
                        disabled={pending}
                        label={row.enabled ? '받는 중' : '받지 않음'}
                        onChange={(enabled) =>
                          replaceMutation.mutate({ jobField: row.jobField, enabled })
                        }
                      />
                    );
                  },
                },
              ]}
              rows={data}
              rowKey={(row: Work24JobField) => row.jobField}
            />
          )}
        </div>
      </Card>
    </>
  );
}
