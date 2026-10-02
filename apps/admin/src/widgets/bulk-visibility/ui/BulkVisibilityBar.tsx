import { useState } from 'react';
import { ActionAlert, Button, Callout, Checkbox, type DataTableColumn } from '@ogonggo/ui';
import { useChangeVisibilities } from '@/entities/content/api/useContent';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

/**
 * 목록에서 고른 행의 id, 또는 검색 결과 전체.
 *
 * 행은 지금 페이지에 보이는 것만 고를 수 있고, 페이지나 필터가 바뀌면 비운다. 남겨 두면 화면에
 * 없는 행까지 함께 바뀌는데, 운영자는 무엇이 바뀌는지 볼 수 없다. 보이는 행 id 를 이어 붙인 값이
 * 바뀌는 것으로 그때를 안다.
 *
 * 검색 결과 전체는 필터(`scopeKey`, 페이지 번호는 빼고)에 묶는다. 페이지를 넘겨도 남고 필터가
 * 바뀌면 풀린다 — 건수가 표 위에 보이므로 무엇이 바뀌는지 운영자가 안다.
 */
export function useRowSelection(rowIds: number[], scopeKey: string) {
  const rowsKey = rowIds.join(',');
  const [state, setState] = useState<{
    rowsKey: string;
    ids: Set<number>;
    allScope: string | null;
  }>({ rowsKey, ids: new Set(), allScope: null });
  const allMatching = state.allScope === scopeKey;
  const selected = state.rowsKey === rowsKey ? state.ids : new Set<number>();

  const update = (next: Set<number>) => setState({ rowsKey, ids: next, allScope: null });

  return {
    selected,
    rowCount: rowIds.length,
    allMatching,
    isSelected: (id: number) => allMatching || selected.has(id),
    allSelected: allMatching || (rowIds.length > 0 && rowIds.every((id) => selected.has(id))),
    toggle: (id: number, checked: boolean) => {
      // 전체를 고른 채 한 행을 빼면 이 페이지의 나머지 행만 남긴다.
      const next = new Set(allMatching ? rowIds : selected);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      update(next);
    },
    toggleAll: (checked: boolean) => update(checked ? new Set(rowIds) : new Set()),
    selectAllMatching: () => setState({ rowsKey, ids: new Set(), allScope: scopeKey }),
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
          checked={selection.isSelected(row.id)}
          onChange={(checked) => selection.toggle(row.id, checked)}
          label={<span className="sr-only">{row.title} 선택</span>}
        />
      </span>
    ),
  };
}

/** 노출 일괄 변경 API 가 한 번에 받는 id 수 상한이다. */
const MAX_IDS = 1000;

export interface BulkVisibilityBarProps {
  kind: 'jobs' | 'bootcamps';
  selection: RowSelection;
  /** 지금 필터에 맞는 전체 건수. */
  total: number;
  /** 지금 필터·정렬 순서로 앞에서부터 `limit` 건의 id 를 받는다. 검색 결과를 고르고 바꿀 때 부른다. */
  loadAllIds: (limit: number) => Promise<number[]>;
}

/**
 * 표 위 한 줄. 이 페이지 전체 선택, 검색 결과 선택, 고른 건수, 노출·비노출 버튼이다.
 *
 * 고르는 방법은 둘이다. 이 페이지 전체, 또는 검색 결과를 지금 정렬 순서로 앞에서부터 상한(1000건)
 * 까지. 결과가 상한 이하면 검색 결과 전체가 된다. 바꾸는 순간 그 id 를 받아 한 요청으로 보낸다.
 * 요청을 나누면 백엔드가 지키는 "전부 아니면 아무것도"가 깨지므로 상한을 넘겨 나눠 보내지 않는다.
 *
 * 백엔드는 하나라도 바꿀 수 없으면 아무것도 바꾸지 않는다(404 없는 id, 409 승인 전 기업회원
 * 공고의 노출). 그 문구에 어느 id 인지가 들어 있어 그대로 보여 준다. 실패해도 고른 것은 남겨 둔다 —
 * 문제인 행만 빼고 다시 누르면 된다.
 */
export function BulkVisibilityBar({ kind, selection, total, loadAllIds }: BulkVisibilityBarProps) {
  const mutation = useChangeVisibilities(kind);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);
  const matchingCount = Math.min(total, MAX_IDS);
  const count = selection.allMatching ? matchingCount : selection.selected.size;

  const change = (visibility: 'VISIBLE' | 'HIDDEN') => {
    mutation.mutate(
      {
        ids: selection.allMatching ? () => loadAllIds(MAX_IDS) : [...selection.selected],
        visibility,
      },
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
        <span className="text-sm text-gray-500">
          {selection.allMatching
            ? total > MAX_IDS
              ? `검색 결과 ${total}건 중 앞에서 ${count}건 선택`
              : `검색 결과 전체 ${count}건 선택`
            : `${count}건 선택`}
        </span>
        {!selection.allMatching && total > selection.rowCount ? (
          // 이 페이지만 고른 것과 검색 결과 전체를 고르는 것은 결과가 크게 다르다. 눈에 띄게 둔다.
          <Button
            size="sm"
            variant="secondary"
            className="border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
            onClick={selection.selectAllMatching}
          >
            {total > MAX_IDS ? `최대 ${MAX_IDS}건 선택` : `검색 결과 전체 ${total}건 선택`}
          </Button>
        ) : null}
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
