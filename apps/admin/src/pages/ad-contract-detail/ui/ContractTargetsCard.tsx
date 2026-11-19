import { useState } from 'react';
import { Link } from 'react-router';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  DataTable,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { AdminAdvertisementContractDetailResponse } from '@ogonggo/api/src/admin';
import {
  isFixedTarget,
  targetsOf,
  useAddContractTarget,
  useRemoveContractTarget,
  type ContractTarget,
} from '@/entities/advertisement-contract/api/useContractTargets';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { ContentTargetPicker, targetKey } from '@/widgets/content-target-picker';

const contentHref = (target: ContractTarget) =>
  target.targetType === 'BOOTCAMP'
    ? `/business/bootcamps/${target.targetId}`
    : `/content/jobs/${target.targetId}`;

/**
 * 리포트 대상 공고 연결(PRD 6.3, D2). 리포트의 `대상 공고 전체 숫자` 가 여기 연결한 공고·부트캠프를 센다. 계약당 여럿이다.
 *
 * 공고 등록 계약은 계약의 공고가 자동으로 들어가 있고 뺄 수 없다. 신청서 계약은 비어 있어 운영자가 연결한다.
 */
export function ContractTargetsCard({
  contract,
}: {
  contract: AdminAdvertisementContractDetailResponse;
}) {
  const targets = targetsOf(contract);
  const add = useAddContractTarget(contract.id);
  const remove = useRemoveContractTarget(contract.id);
  const [picking, setPicking] = useState(false);
  const takenKeys = new Set(targets.map(targetKey));

  const columns: DataTableColumn<ContractTarget>[] = [
    {
      key: 'type',
      header: '종류',
      width: 'w-24',
      render: (row) => (row.targetType === 'BOOTCAMP' ? '부트캠프' : '채용공고'),
    },
    {
      key: 'title',
      header: '제목',
      render: (row) => (
        <span className="flex items-center gap-2">
          <Link to={contentHref(row)} className="text-blue-500 hover:underline">
            {row.title}
          </Link>
          {isFixedTarget(contract, row) ? <Badge tone="neutral">공고 등록 계약</Badge> : null}
        </span>
      ),
    },
    { key: 'company', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'actions',
      header: '관리',
      width: 'w-24',
      render: (row) =>
        isFixedTarget(contract, row) ? null : (
          <Button
            size="sm"
            variant="secondary"
            aria-label={`${row.title} 연결 해제`}
            disabled={remove.isPending}
            onClick={() => remove.mutate({ targetType: row.targetType, targetId: row.targetId })}
          >
            해제
          </Button>
        ),
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>리포트 대상 공고</CardTitle>
        <Button
          size="sm"
          variant={picking ? 'secondary' : 'primary'}
          onClick={() => setPicking((open) => !open)}
        >
          {picking ? '검색 닫기' : '공고 연결'}
        </Button>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-sm text-gray-500">
          리포트의 대상 공고 숫자는 여기 연결한 공고·부트캠프를 유입 경로와 상관없이 셉니다.
        </p>
        {add.isError || remove.isError ? (
          <Callout tone="error">
            {advertisementErrorMessage(add.error ?? remove.error, '대상 공고를 바꾸지 못했습니다.')}
          </Callout>
        ) : null}
        <DataTable
          columns={columns}
          rows={targets}
          rowKey={targetKey}
          emptyMessage="연결한 공고가 없습니다. 공고 연결을 눌러 찾아 고르세요."
        />
        {picking ? (
          <div className="rounded-lg border border-gray-200 p-3">
            <ContentTargetPicker
              takenKeys={takenKeys}
              disabled={add.isPending}
              initialType={contract.promotionTarget === 'BOOTCAMP' ? 'BOOTCAMP' : 'JOB'}
              onPick={(target) =>
                add.mutate({ targetType: target.targetType, targetId: target.targetId })
              }
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
