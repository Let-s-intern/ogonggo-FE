import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ActionAlert,
  Button,
  Callout,
  ConfirmDelete,
  DataTable,
  Tabs,
  Toggle,
  type DataTableColumn,
} from '@ogonggo/ui';
import { formatWon } from '@/entities/ad-contract/lib/adContract';
import {
  useDeleteInstagramAccount,
  useDeleteInstagramFormat,
  useInstagramAccounts,
  useInstagramFormats,
  useReorderInstagramFormats,
  useSaveInstagramAccount,
  useSaveInstagramFormat,
  type InstagramAccount,
  type InstagramFormat,
} from '@/entities/instagram/api/useInstagram';
import { instagramHandle } from '@/entities/instagram/lib/instagram';
import { InstagramAccountName } from '@/entities/instagram/ui/InstagramAccountName';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { PageHeader } from '@/widgets/page-header';
import { InstagramAccountFormModal } from './InstagramAccountFormModal';
import { InstagramFormatFormModal } from './InstagramFormatFormModal';

type Tab = 'accounts' | 'formats';

const TABS = [
  { value: 'accounts' as const, label: '계정' },
  { value: 'formats' as const, label: '게재 유형' },
];

type Notify = (message: string) => void;

/**
 * 인스타 등록(`비즈니스 > 광고 > 인스타 등록`, 이슈 #573, 2026-11-06 사용자). 인스타 광고에서 고르는 우리 계정과 게재 유형
 * (피드 게시물, 릴스, 스토리 등)을 등록한다. 탭은 주소(`?tab=formats`)에 남는다.
 *
 * 광고가 잡힌 계정·유형은 지울 수 없다. 더 쓰지 않으려면 `사용` 을 끈다 — 이미 잡힌 광고의 계정·유형 이름이 남아야 한다.
 */
export function InstagramSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'formats' ? 'formats' : 'accounts';
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);
  const notify: Notify = (message) => setAlert({ message, nonce: Date.now() });
  const [editingAccount, setEditingAccount] = useState<{ account: InstagramAccount | null } | null>(
    null,
  );
  const [editingFormat, setEditingFormat] = useState<{ format: InstagramFormat | null } | null>(
    null,
  );
  const accounts = useInstagramAccounts();

  return (
    <>
      <PageHeader
        title="인스타 등록"
        action={
          tab === 'accounts' ? (
            <Button size="sm" onClick={() => setEditingAccount({ account: null })}>
              계정 추가
            </Button>
          ) : (
            <Button size="sm" onClick={() => setEditingFormat({ format: null })}>
              게재 유형 추가
            </Button>
          )
        }
      />
      <Tabs
        items={TABS}
        value={tab}
        onValueChange={(next) =>
          setSearchParams(next === 'formats' ? { tab: 'formats' } : {}, { replace: true })
        }
        aria-label="인스타 등록"
        className="mb-4"
      />

      {tab === 'accounts' ? (
        <AccountTable
          query={accounts}
          onEdit={(account) => setEditingAccount({ account })}
          notify={notify}
        />
      ) : (
        <FormatTable
          accounts={accounts.data ?? []}
          onEdit={(format) => setEditingFormat({ format })}
          notify={notify}
        />
      )}

      {editingAccount ? (
        <InstagramAccountFormModal
          key={editingAccount.account?.id ?? 'new'}
          account={editingAccount.account}
          onClose={() => setEditingAccount(null)}
          onSaved={notify}
        />
      ) : null}
      {editingFormat ? (
        <InstagramFormatFormModal
          key={editingFormat.format?.id ?? 'new'}
          format={editingFormat.format}
          accounts={accounts.data ?? []}
          onClose={() => setEditingFormat(null)}
          onSaved={notify}
        />
      ) : null}
      {alert ? (
        <ActionAlert message={alert.message} nonce={alert.nonce} onDismiss={() => setAlert(null)} />
      ) : null}
    </>
  );
}

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label={`${label} 삭제`}
      className="border-red-200 whitespace-nowrap text-error hover:bg-red-50"
      onClick={onClick}
    >
      삭제
    </Button>
  );
}

function AccountTable({
  query,
  onEdit,
  notify,
}: {
  query: ReturnType<typeof useInstagramAccounts>;
  onEdit: (account: InstagramAccount) => void;
  notify: Notify;
}) {
  const [deleting, setDeleting] = useState<InstagramAccount | null>(null);
  const deleteMutation = useDeleteInstagramAccount();
  const rows = query.data ?? [];

  const columns: DataTableColumn<InstagramAccount>[] = [
    {
      key: 'account',
      header: '계정',
      width: 'min-w-56',
      render: (row) => <InstagramAccountName account={row} imageUrl={row.profileImageUrl} />,
    },
    {
      key: 'url',
      header: '주소',
      width: 'w-64 max-w-64',
      render: (row) => (
        <a
          href={row.profileUrl}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm text-blue-600 underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.profileUrl}
        </a>
      ),
    },
    {
      key: 'memo',
      header: '메모',
      render: (row) => (
        <span className="line-clamp-2 text-sm text-gray-700">{row.memo ?? '-'}</span>
      ),
    },
    {
      key: 'ads',
      header: '인스타 광고',
      width: 'w-24',
      align: 'right',
      render: (row) => <span className="text-sm">{row.adCount}건</span>,
    },
    {
      key: 'enabled',
      header: '사용',
      width: 'w-28',
      render: (row) => <AccountToggle account={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-20',
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <DeleteButton
            label={instagramHandle(row.handle)}
            onClick={() => {
              deleteMutation.reset();
              setDeleting(row);
            }}
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <p className="pb-3 text-sm text-gray-500">
        인스타 광고를 올리는 우리 계정입니다. 행을 눌러 고칩니다. 광고가 잡힌 계정은 지울 수 없어
        사용을 끕니다.
      </p>
      {query.isError ? <Callout tone="error">계정을 불러오지 못했습니다.</Callout> : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={onEdit}
        isLoading={query.isPending}
        emptyMessage="등록된 계정이 없습니다. 계정 추가로 더합니다."
      />
      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting ? instagramHandle(deleting.handle) : ''}
        description={
          deleting && deleting.adCount > 0
            ? `이 계정에 잡힌 인스타 광고 ${deleting.adCount}건이 있어 지울 수 없습니다. 사용을 꺼 주세요.`
            : undefined
        }
        isDeleting={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? (serverErrorMessage(deleteMutation.error) ?? '삭제하지 못했습니다.')
            : undefined
        }
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify(`${instagramHandle(deleting.handle)} 계정을 지웠습니다.`);
                setDeleting(null);
              },
            });
          }
        }}
      />
    </>
  );
}

function AccountToggle({ account }: { account: InstagramAccount }) {
  const save = useSaveInstagramAccount(account.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={account.enabled}
        disabled={save.isPending}
        label={account.enabled ? '사용' : '사용 안 함'}
        onChange={(next) => save.mutate({ enabled: next })}
      />
    </span>
  );
}

function FormatTable({
  accounts,
  onEdit,
  notify,
}: {
  accounts: InstagramAccount[];
  onEdit: (format: InstagramFormat) => void;
  notify: Notify;
}) {
  const query = useInstagramFormats();
  const reorder = useReorderInstagramFormats();
  const [deleting, setDeleting] = useState<InstagramFormat | null>(null);
  const deleteMutation = useDeleteInstagramFormat();
  const rows = query.data ?? [];

  const move = (index: number, delta: -1 | 1) => {
    const ids = rows.map((row) => row.id);
    const [moved] = ids.splice(index, 1);
    if (moved === undefined) {
      return;
    }
    ids.splice(index + delta, 0, moved);
    reorder.mutate(ids);
  };

  const accountLabel = (format: InstagramFormat) =>
    format.accountIds.length === 0
      ? '모든 계정'
      : format.accountIds
          .map((id) => accounts.find((account) => account.id === id))
          .map((account) => (account ? instagramHandle(account.handle) : '지워진 계정'))
          .join(', ');

  const columns: DataTableColumn<InstagramFormat>[] = [
    {
      key: 'order',
      header: '순서',
      width: 'w-14',
      render: (row) => (
        <span className="text-base font-bold text-gray-900">{rows.indexOf(row) + 1}</span>
      ),
    },
    {
      key: 'name',
      header: '이름',
      width: 'min-w-48',
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">{row.name}</span>
          {row.description ? (
            <span className="line-clamp-2 text-xs text-gray-500">{row.description}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'price',
      header: '기본 단가',
      width: 'w-32',
      align: 'right',
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {row.defaultPrice === null ? '-' : formatWon(row.defaultPrice)}
        </span>
      ),
    },
    {
      key: 'accounts',
      header: '올릴 수 있는 계정',
      width: 'w-56',
      render: (row) => <span className="text-xs text-gray-700">{accountLabel(row)}</span>,
    },
    {
      key: 'ads',
      header: '인스타 광고',
      width: 'w-24',
      align: 'right',
      render: (row) => <span className="text-sm">{row.adCount}건</span>,
    },
    {
      key: 'enabled',
      header: '사용',
      width: 'w-28',
      render: (row) => <FormatToggle format={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-48',
      render: (row) => {
        const index = rows.indexOf(row);
        return (
          <span
            className="flex gap-1 whitespace-nowrap"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.name} 위로`}
              disabled={reorder.isPending || index === 0}
              onClick={() => move(index, -1)}
            >
              위로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.name} 아래로`}
              disabled={reorder.isPending || index === rows.length - 1}
              onClick={() => move(index, 1)}
            >
              아래로
            </Button>
            <DeleteButton
              label={row.name}
              onClick={() => {
                deleteMutation.reset();
                setDeleting(row);
              }}
            />
          </span>
        );
      },
    },
  ];

  return (
    <>
      <p className="pb-3 text-sm text-gray-500">
        인스타 광고와 광고 계약의 상품에서 이 순서로 보입니다. 위로·아래로는 바로 저장됩니다. 행을
        눌러 고칩니다.
      </p>
      {query.isError ? <Callout tone="error">게재 유형을 불러오지 못했습니다.</Callout> : null}
      {reorder.isError ? (
        <Callout tone="error" className="mb-4">
          순서를 바꾸지 못했습니다. 목록을 새로 불러온 뒤 다시 시도해 주세요.
        </Callout>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={onEdit}
        isLoading={query.isPending}
        emptyMessage="등록된 게재 유형이 없습니다. 게재 유형 추가로 더합니다."
      />
      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.name ?? ''}
        description={
          deleting && deleting.adCount > 0
            ? `이 유형으로 잡힌 인스타 광고 ${deleting.adCount}건이 있어 지울 수 없습니다. 사용을 꺼 주세요.`
            : '이 유형을 산 계약에서도 빠집니다.'
        }
        isDeleting={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? (serverErrorMessage(deleteMutation.error) ?? '삭제하지 못했습니다.')
            : undefined
        }
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify(`게재 유형 ${deleting.name} 을(를) 지웠습니다.`);
                setDeleting(null);
              },
            });
          }
        }}
      />
    </>
  );
}

function FormatToggle({ format }: { format: InstagramFormat }) {
  const save = useSaveInstagramFormat(format.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={format.enabled}
        disabled={save.isPending}
        label={format.enabled ? '사용' : '사용 안 함'}
        onChange={(next) => save.mutate({ enabled: next })}
      />
    </span>
  );
}
