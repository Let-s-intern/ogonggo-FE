import { useState } from 'react';
import { Button, Callout, Field, Input, Modal } from '@ogonggo/ui';
import type { AdminAdvertisementContractProductResponse } from '@ogonggo/api/src/admin';
import type { AdvertisementExposure } from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import { formatPeriod } from '@/entities/advertisement-exposure/lib/exposure';
import { endsAfterDay, useChangeProductEndDate } from '../model/useChangeProductEndDate';

/** 노출 하나를 알아볼 이름. 광고 공고는 이름이 없어 띄운 공고 제목을 쓴다. */
const exposureName = (exposure: AdvertisementExposure) =>
  exposure.name ?? exposure.targetTitle ?? `노출 #${exposure.id}`;

/**
 * 계약 상품의 게시 종료일 바꾸기(계약 연장·단축, 계약 12절). 시작일은 그대로다. `노출 기간도 같이` 를 켜 두면(기본) 이 상품에
 * 걸린 노출 중 끝이 옛 종료일 다음 날 00:00 인 것만 새 종료일 다음 날 00:00 으로 옮긴다. 끝을 따로 정한 노출은 건드리지 않는다.
 *
 * `row` 는 연 때의 값이다. 저장 뒤 계약을 다시 받아도 결과 문구는 바꾸기 전 종료일을 기준으로 남는다.
 */
export function ProductEndDateModal({
  contractId,
  row,
  exposures,
  onClose,
}: {
  contractId: number;
  row: AdminAdvertisementContractProductResponse & { startDate: string; endDate: string };
  /** 이 계약·상품에 걸린 노출 전부. */
  exposures: AdvertisementExposure[];
  onClose: () => void;
}) {
  const change = useChangeProductEndDate(contractId);
  const [endDate, setEndDate] = useState(row.endDate);
  const [withExposures, setWithExposures] = useState(true);
  const invalid = Boolean(endDate) && endDate < row.startDate;
  const following = exposures.filter((exposure) => endsAfterDay(exposure, row.endDate));
  const shortening = Boolean(endDate) && endDate < row.endDate;
  const done = change.result !== null;
  const canSave = Boolean(endDate) && !invalid && endDate !== row.endDate && !change.running;

  const save = () =>
    void change.run({
      contractProductId: row.contractProductId,
      newEndDate: endDate,
      exposures: withExposures ? following : [],
    });

  return (
    <Modal
      open
      title="게시 종료일 변경"
      description={`${row.productName} · 시작일 ${row.startDate}은 바뀌지 않아요.`}
      onClose={onClose}
    >
      <Field
        label="게시 종료일"
        htmlFor="product-end-date"
        hint="게시 기간은 데이터 집계 기간이에요. 리포트는 이 기간의 데이터만 보여 줘요."
        error={invalid ? '게시 종료일은 시작일과 같거나 뒤여야 해요.' : undefined}
      >
        <Input
          id="product-end-date"
          type="date"
          value={endDate}
          min={row.startDate}
          disabled={change.running || done}
          onChange={(event) => setEndDate(event.target.value)}
          className="w-44"
        />
      </Field>

      <div className="flex flex-col gap-1 pb-4 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={withExposures}
            disabled={change.running || done}
            onChange={(event) => setWithExposures(event.target.checked)}
          />
          노출 기간도 같이 {shortening ? '줄이기' : '늘리기'}
        </label>
        <p className="pl-6 text-xs text-gray-500">
          노출 기간은 광고가 실제로 화면에 보이는 기간이에요.
          {/* 저장 뒤에는 노출을 다시 받아 끝이 바뀌므로 개수 안내를 내린다. */}
          {done
            ? null
            : ` 이 상품의 노출 ${exposures.length}개 중 끝이 ${row.endDate} 다음 날 00:00인 ${following.length}개의 끝을 새 종료일 다음 날 00:00으로 옮겨요.`}
        </p>
      </div>

      {change.error ? (
        <Callout tone="error" className="mb-4">
          {change.error}
        </Callout>
      ) : null}
      {change.result ? (
        <div className="mb-4 flex flex-col gap-2">
          <Callout tone={change.result.failures.length > 0 ? 'warning' : 'success'}>
            게시 종료일을 {endDate}로 바꿨어요.
            {withExposures ? ` 노출 ${change.result.moved}개의 끝을 옮겼어요.` : ''}
            {change.result.failures.length > 0
              ? ` ${change.result.failures.length}개는 옮기지 못했어요.`
              : ''}
          </Callout>
          {change.result.failures.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm text-gray-700">
              {change.result.failures.map(({ exposure, reason }) => (
                <li key={exposure.id}>
                  {exposureName(exposure)} ({formatPeriod(exposure)}): {reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onClose} disabled={change.running}>
          {done ? '닫기' : '취소'}
        </Button>
        {done ? null : (
          <Button size="sm" disabled={!canSave} onClick={save}>
            {change.running ? '바꾸는 중' : '바꾸기'}
          </Button>
        )}
      </div>
    </Modal>
  );
}
