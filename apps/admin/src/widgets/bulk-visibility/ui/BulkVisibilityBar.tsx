import { useState } from 'react';
import { ActionAlert, Button, Callout, Checkbox, type DataTableColumn } from '@ogonggo/ui';
import { useChangeVisibilities } from '@/entities/content/api/useContent';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

/**
 * 목록에서 고른 행의 id. 지금 페이지에 보이는 행만 고를 수 있다.
 *
 * 페이지나 필터가 바뀌면 고른 것을 비운다. 남겨 두면 화면에 없는 행까지 함께 바뀌는데, 운영자는
 * 무엇이 바뀌는지 볼 수 없다. 보이는 행 id 를 이어 붙인 값이 바뀌는 것으로 그때를 안다.
 */
export function useRowSelection(rowIds: number[]) {
  const rowsKey = rowIds.join(',');
  const [state, setState] = useState<{ rowsKey: string; ids: Set<number> }>({
    rowsKey,
    ids: new Set(),
  });
  const selected = state.rowsKey === rowsKey ? state.ids : new Set<number>();

  const update = (next: Set<number>) => setState({ rowsKey, ids: next });

  return {
    selected,
    allSelected: rowIds.length > 0 && rowIds.every((id) => selected.has(id)),
    toggle: (id: number, checked: boolean) => {
      const next = new Set(selected);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      update(next);
    },
    toggleAll: (checked: boolean) => update(checked ? new Set(rowIds) : new Set()),
    clear: () => update(new Set()),
  };
}

type RowSelection = ReturnType<typeof useRowSelection>;

/**
 * 표 맨 앞의 체크박스 칸.
 *
 * 클릭을 칸에서 멈춘다. 행 전체가 상세로 가는 링크라 멈추지 않으면 고르는 순간 화면이 넘어간다
 * — 목록의 노출 토글과 같은 이유다.
 */
export function selectionColumn<T extends { id: number; title: string }>(
  selection: RowSelection,
): DataTableColumn<T> {
  return {
    key: 'select',
    header: '선택',
    width: 'w-16',
    render: (row) => (
      <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={selection.selected.has(row.id)}
          onChange={(checked) => selection.toggle(row.id, checked)}
          label={<span className="sr-only">{row.title} 선택</span>}
        />
      </span>
    ),
  };
}

export interface BulkVisibilityBarProps {
  kind: 'jobs' | 'bootcamps';
  selection: RowSelection;
}

/**
 * 표 위 한 줄. 이 페이지 전체 선택, 고른 건수, 노출·비노출 버튼이다.
 *
 * 백엔드는 하나라도 바꿀 수 없으면 아무것도 바꾸지 않는다(404 없는 id, 409 승인 전 기업회원
 * 공고의 노출). 그 문구에 어느 id 인지가 들어 있어 그대로 보여 준다. 실패해도 고른 것은 남겨 둔다 —
 * 문제인 행만 빼고 다시 누르면 된다.
 */
export function BulkVisibilityBar({ kind, selection }: BulkVisibilityBarProps) {
  const mutation = useChangeVisibilities(kind);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);
  const count = selection.selected.size;

  const change = (visibility: 'VISIBLE' | 'HIDDEN') => {
    mutation.mutate(
      { ids: [...selection.selected], visibility },
      {
        onSuccess: () => {
          selection.clear();
          setAlert({
            message: `${count}건을 ${visibility === 'VISIBLE' ? '노출' : '비노출'}로 바꿨습니다.`,
            nonce: Date.now(),
          });
        },
      },
    );
  };

  return (
    <>
      {alert ? (
        <ActionAlert message={alert.message} nonce={alert.nonce} onDismiss={() => setAlert(null)} />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pb-3">
        <Checkbox
          checked={selection.allSelected}
          onChange={selection.toggleAll}
          label="이 페이지 전체 선택"
        />
        <span className="text-sm text-gray-500">{count}건 선택</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={count === 0 || mutation.isPending}
            onClick={() => change('VISIBLE')}
          >
            노출로 바꾸기
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={count === 0 || mutation.isPending}
            onClick={() => change('HIDDEN')}
          >
            비노출로 바꾸기
          </Button>
        </div>
      </div>

      {mutation.isError ? (
        <Callout tone="error" className="mb-3">
          {serverErrorMessage(mutation.error) ?? '노출을 바꾸지 못했습니다.'}
        </Callout>
      ) : null}
    </>
  );
}
