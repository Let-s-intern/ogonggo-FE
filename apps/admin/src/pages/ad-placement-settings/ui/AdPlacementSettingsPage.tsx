import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  DataTable,
  Field,
  Input,
  type DataTableColumn,
} from '@ogonggo/ui';
import { enumLabel } from '@ogonggo/api/src/admin';
import {
  AD_PLACEMENT_UNIT_LABELS,
  useAdPlacementSettings,
  useReorderAdPlacement,
  useUpdateAdPlacement,
  type AdminAdPlacementAssignment,
  type AdminAdPlacementSetting,
} from '@/entities/advertisement/api/useAdvertisements';
import { PageHeader } from '@/widgets/page-header';
import { formatCount, formatDate } from '@/shared/lib/format';

/**
 * 광고 구좌 설정(PRD `어드민 > 구좌 세팅`). 구좌 목록과 고른 구좌의 수정 폼을 한 화면에 둔다. 구좌는 열두 개라 쪽을
 * 나누지 않고, 공지 화면(`pages/notice-list`)처럼 폼을 목록 위에 연다.
 *
 * 코드와 단위는 고치지 않는다. 코드는 사용자 화면이 자리를 찾는 키이고, 단위는 잔여 계산과 신청 기간이 따라 바뀌어
 * 수정 API(`PATCH`)가 받지 않는다.
 */
export function AdPlacementSettingsPage() {
  const { data, isPending, isError } = useAdPlacementSettings();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const settings = data ?? [];
  const selected = settings.find((setting) => setting.placement.key === selectedKey) ?? null;

  const columns: DataTableColumn<AdminAdPlacementSetting>[] = [
    {
      key: 'key',
      header: '코드',
      width: 'w-64',
      render: (row) => <span className="font-mono text-xs">{row.placement.key}</span>,
    },
    { key: 'name', header: '이름', render: (row) => row.placement.name },
    {
      key: 'slotCount',
      header: '슬롯 수',
      width: 'w-36',
      render: (row) => (
        <span className="whitespace-nowrap">
          {row.placement.slotCount}
          {row.placement.perJobField ? ' · 직무별' : ''}
          {row.placement.rolling ? ' · 롤링' : ''}
        </span>
      ),
    },
    {
      key: 'unit',
      header: '단위',
      width: 'w-24',
      render: (row) => AD_PLACEMENT_UNIT_LABELS[row.placement.unit],
    },
    {
      key: 'price',
      header: '정가',
      width: 'w-32',
      align: 'right',
      render: (row) => `${formatCount(row.placement.price)}원`,
    },
    {
      key: 'visible',
      header: '노출',
      width: 'w-20',
      render: (row) =>
        row.placement.visible ? (
          <Badge tone="success">노출</Badge>
        ) : (
          <Badge tone="neutral">비노출</Badge>
        ),
    },
    {
      key: 'assignments',
      header: '배치 광고',
      width: 'w-24',
      align: 'right',
      render: (row) => `${row.assignments.length}건`,
    },
  ];

  return (
    <>
      <PageHeader title="구좌 설정" />

      {isError ? <Callout tone="error">구좌 설정을 불러오지 못했습니다.</Callout> : null}

      {selected ? (
        <div className="flex flex-col gap-4">
          <AdPlacementForm
            key={selected.placement.key}
            setting={selected}
            onClose={() => setSelectedKey(null)}
          />
          <AdPlacementOrder key={`order-${selected.placement.key}`} setting={selected} />
        </div>
      ) : null}

      <DataTable
        className={selected ? 'mt-4' : undefined}
        columns={columns}
        rows={settings}
        rowKey={(row) => row.placement.key}
        onRowClick={(row) => setSelectedKey(row.placement.key)}
        isLoading={isPending}
        emptyMessage="등록된 구좌가 없습니다."
      />
    </>
  );
}

interface AdPlacementFormProps {
  setting: AdminAdPlacementSetting;
  onClose: () => void;
}

/** 이름·슬롯 수·정가·노출 여부를 고친다. 폼이 네 칸을 다 들고 있으므로 모두 보낸다. */
function AdPlacementForm({ setting, onClose }: AdPlacementFormProps) {
  const { placement } = setting;
  const updateMutation = useUpdateAdPlacement(placement.key);
  const [name, setName] = useState(placement.name);
  const [slotCount, setSlotCount] = useState(String(placement.slotCount));
  const [price, setPrice] = useState(String(placement.price));
  const [visible, setVisible] = useState(placement.visible);

  const slotCountValue = Number(slotCount);
  const priceValue = Number(price);
  const canSave =
    name.trim().length > 0 &&
    Number.isInteger(slotCountValue) &&
    slotCountValue >= 1 &&
    price.trim() !== '' &&
    Number.isInteger(priceValue) &&
    priceValue >= 0;

  return (
    <Card>
      <CardTitle>구좌 수정</CardTitle>
      <p className="pt-1 text-sm text-gray-500">
        <span className="font-mono text-xs">{placement.key}</span> ·{' '}
        {AD_PLACEMENT_UNIT_LABELS[placement.unit]} 단위 · {placement.spec}
      </p>

      {updateMutation.isSuccess ? (
        <Callout tone="success" className="mt-4">
          저장했습니다.
        </Callout>
      ) : null}
      {updateMutation.isError ? (
        <Callout tone="error" className="mt-4">
          저장하지 못했습니다. 입력값을 확인해 주세요.
        </Callout>
      ) : null}

      <div className="pt-4">
        <Field label="이름" htmlFor="placement-name" required>
          <Input
            id="placement-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="슬롯 수"
            htmlFor="placement-slot-count"
            hint={placement.perJobField ? '직무 하나당 수입니다.' : undefined}
            required
          >
            <Input
              id="placement-slot-count"
              type="number"
              min={1}
              step={1}
              value={slotCount}
              onChange={(event) => setSlotCount(event.target.value)}
            />
          </Field>
          <Field label="정가(원, VAT 별도)" htmlFor="placement-price" required>
            <Input
              id="placement-price"
              type="number"
              min={0}
              step={1000}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 pb-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={visible}
            onChange={(event) => setVisible(event.target.checked)}
          />
          판매·노출
        </label>

        <div className="flex gap-2">
          <Button
            onClick={() =>
              updateMutation.mutate({
                name: name.trim(),
                slotCount: slotCountValue,
                price: priceValue,
                visible,
              })
            }
            disabled={!canSave || updateMutation.isPending}
          >
            {updateMutation.isPending ? '저장 중' : '저장'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * 구좌 안 노출 순서. 확정·집행 중인 광고를 위·아래 버튼으로 옮기고 한 번에 저장한다.
 *
 * 끌어 옮기기가 아니라 버튼이다. 어드민에는 `@dnd-kit` 이 없고, 버튼은 키보드로도 된다
 * (memos `결정-광고시스템-admin-노출순서-2026-11-03.md`).
 */
function AdPlacementOrder({ setting }: { setting: AdminAdPlacementSetting }) {
  const reorderMutation = useReorderAdPlacement(setting.placement.key);
  const [order, setOrder] = useState<AdminAdPlacementAssignment[]>(setting.assignments);
  const changed = order.some((entry, index) => entry.itemId !== setting.assignments[index]?.itemId);

  const move = (index: number, offset: -1 | 1) => {
    setOrder((current) => {
      const moving = current[index];
      if (!moving) {
        return current;
      }
      const rest = current.filter((_, position) => position !== index);
      return [...rest.slice(0, index + offset), moving, ...rest.slice(index + offset)];
    });
  };

  return (
    <Card>
      <CardTitle>노출 순서</CardTitle>
      <p className="pt-1 text-sm text-gray-500">
        확정·집행 중인 광고입니다. 위에 있을수록 먼저 보입니다. 슬롯 {setting.placement.slotCount}
        {setting.placement.perJobField ? '(직무당)' : ''}개
        {setting.placement.rolling ? ', 슬롯 여럿이 번갈아 보입니다.' : '.'}
      </p>

      {reorderMutation.isSuccess && !changed ? (
        <Callout tone="success" className="mt-4">
          저장했습니다.
        </Callout>
      ) : null}
      {reorderMutation.isError ? (
        <Callout tone="error" className="mt-4">
          저장하지 못했습니다. 목록을 새로 불러온 뒤 다시 시도해 주세요.
        </Callout>
      ) : null}

      {order.length === 0 ? (
        <p className="pt-4 text-sm text-gray-500">이 구좌에 배치된 광고가 없습니다.</p>
      ) : (
        <ol className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-200">
          {order.map((entry, index) => (
            <li key={entry.itemId} className="flex items-center gap-4 px-4 py-3 text-sm">
              <span className="w-6 shrink-0 text-right font-bold text-gray-900">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  {entry.companyName} · {entry.postTitle}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {entry.applicationNo}
                  {entry.jobField ? ` · ${enumLabel('JobField', entry.jobField)}` : ''} ·{' '}
                  {formatDate(entry.startDate)} ~ {formatDate(entry.endDate)} ·{' '}
                  {entry.status === 'RUNNING' ? '집행' : '확정'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`${index + 1}번 위로`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  위로
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`${index + 1}번 아래로`}
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                >
                  아래로
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {order.length > 1 ? (
        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => reorderMutation.mutate({ itemIds: order.map((entry) => entry.itemId) })}
            disabled={!changed || reorderMutation.isPending}
          >
            {reorderMutation.isPending ? '저장 중' : '순서 저장'}
          </Button>
          <Button
            variant="secondary"
            disabled={!changed}
            onClick={() => setOrder(setting.assignments)}
          >
            되돌리기
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
