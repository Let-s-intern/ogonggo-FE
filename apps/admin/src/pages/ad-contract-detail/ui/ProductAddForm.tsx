import { useState } from 'react';
import { Button, Callout, Input, Select, cn } from '@ogonggo/ui';
import type { AdminAdvertisementContractDetailResponse } from '@ogonggo/api/src/admin';
import {
  AD_POSTING_FIXED_TARGET,
  isAdPostingPosition,
} from '@/entities/advertisement-exposure/lib/adPosting';
import { useAdvertisementProducts } from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { positionLabel, productLabel } from '@/entities/advertisement-product/lib/product';
import { ContentTargetPicker, type ContentTarget } from '@/widgets/content-target-picker';
import {
  STEP_LABELS,
  useAttachProduct,
  type StepKey,
  type StepState,
} from '../model/useAttachProduct';

const STATUS_TEXT: Record<StepState['status'], string> = {
  waiting: '대기',
  running: '진행 중',
  done: '완료',
  skipped: '건너뜀',
  failed: '실패',
};

const STATUS_CLASS: Record<StepState['status'], string> = {
  waiting: 'text-gray-400',
  running: 'text-blue-600',
  done: 'text-success',
  skipped: 'text-gray-500',
  failed: 'text-error',
};

/**
 * 계약에 상품 넣기(6.7). 광고 공고 자리 상품을 고르면 띄울 공고와 체크박스 둘이 더 나와, 저장 한 번에 계약 상품 추가 →
 * 그 자리에 광고 공고 노출(상품 기간, 상단 고정 선택) → 광고할 공고 연결까지 한다. 단계별 결과를 보이고, 실패하면 남은 단계만
 * 다시 시도한다.
 */
export function ProductAddForm({
  contract,
}: {
  contract: AdminAdvertisementContractDetailResponse;
}) {
  const products = useAdvertisementProducts();
  const attach = useAttachProduct(contract.id);
  const [productId, setProductId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [target, setTarget] = useState<ContentTarget | null>(null);
  const [expose, setExpose] = useState(true);
  const [order, setOrder] = useState<'first' | 'last'>('first');
  const [registerTarget, setRegisterTarget] = useState(true);

  const product = products.data?.find((candidate) => String(candidate.id) === productId);
  const position = product?.category === 'JOB_POSTING' ? String(product.position ?? '') : '';
  const posting = isAdPostingPosition(position) ? position : null;
  const periodInvalid = Boolean(startDate && endDate && startDate > endDate);
  const needsTarget = posting !== null && (expose || registerTarget);
  const canSave =
    Boolean(productId && startDate && endDate) &&
    !periodInvalid &&
    (!needsTarget || target !== null) &&
    !attach.running &&
    attach.steps === null;

  const clear = () => {
    setProductId('');
    setStartDate('');
    setEndDate('');
    setTarget(null);
    setExpose(true);
    setOrder('first');
    setRegisterTarget(true);
    attach.reset();
  };

  const save = () =>
    void attach.start({
      productId: Number(productId),
      startDate,
      endDate,
      posting:
        posting && target
          ? {
              targetType: target.targetType,
              targetId: target.targetId,
              expose,
              order,
              registerTarget,
            }
          : null,
    });

  // 진행 중이거나 결과가 남아 있으면 입력을 잠근다. 다른 상품을 넣으려면 `새로 넣기` 로 비운다.
  const locked = attach.steps !== null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="넣을 상품"
          disabled={locked}
          options={[
            { value: '', label: '넣을 상품 고르기' },
            ...(products.data ?? []).map((candidate) => ({
              value: String(candidate.id),
              label: productLabel(candidate),
            })),
          ]}
          value={productId}
          onChange={(event) => {
            setProductId(event.target.value);
            setTarget(null);
          }}
        />
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="게시 시작일"
            disabled={locked}
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-9 w-36 px-2 text-sm"
          />
          <span className="text-sm text-gray-400">~</span>
          <Input
            type="date"
            aria-label="게시 종료일"
            disabled={locked}
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-9 w-36 px-2 text-sm"
          />
        </div>
        <Button size="sm" disabled={!canSave} onClick={save}>
          {posting ? '넣고 세팅하기' : '넣기'}
        </Button>
      </div>
      {periodInvalid ? (
        <Callout tone="error">게시 시작일은 종료일과 같거나 앞서야 해요.</Callout>
      ) : null}

      {posting && !locked ? (
        <div className="flex flex-col gap-3 border-t border-gray-200 pt-3">
          <p className="text-sm font-medium text-gray-900">
            {positionLabel(posting)} 광고 공고 한 번에 세팅
          </p>
          <div className="flex flex-col gap-2 text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={expose}
                  onChange={(event) => setExpose(event.target.checked)}
                />
                광고 공고 자리에 바로 노출
              </label>
              <span className="text-xs text-gray-500">
                (게시 기간 그대로, 시작일 00:00 ~ 종료일 다음 날 00:00 KST)
              </span>
              {expose ? (
                <Select
                  aria-label="노출 순서"
                  className="h-8 text-xs"
                  options={[
                    { value: 'first', label: '맨 앞(상단 고정)' },
                    { value: 'last', label: '맨 뒤' },
                  ]}
                  value={order}
                  onChange={(event) => setOrder(event.target.value as 'first' | 'last')}
                />
              ) : null}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={registerTarget}
                onChange={(event) => setRegisterTarget(event.target.checked)}
              />
              광고할 공고로 등록
            </label>
            <p className="pl-6 text-xs text-gray-500">
              켜면 위 계약 정보의 광고할 공고에 자동으로 들어가, 리포트에 그 공고의 전체 조회·지원
              클릭이 함께 나와요.
            </p>
          </div>
          {needsTarget ? (
            target ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-900">
                    {target.title}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {target.targetType === 'BOOTCAMP' ? '부트캠프' : '채용공고'} ·{' '}
                    {target.companyName} · {target.targetId}번
                  </span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => setTarget(null)}>
                  바꾸기
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 bg-white p-3">
                <p className="pb-2 text-xs text-gray-500">띄울 공고를 고르세요.</p>
                <ContentTargetPicker
                  takenKeys={new Set()}
                  fixedType={AD_POSTING_FIXED_TARGET[posting]}
                  onPick={setTarget}
                />
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {attach.steps ? (
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
          <ol className="flex flex-col gap-1 text-sm">
            {(Object.keys(STEP_LABELS) as StepKey[]).map((key, index) => {
              const step = attach.steps?.[key];
              if (!step) return null;
              return (
                <li key={key} className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-500">{index + 1}.</span>
                  <span className="text-gray-900">{STEP_LABELS[key]}</span>
                  <span className={cn('font-medium', STATUS_CLASS[step.status])}>
                    {STATUS_TEXT[step.status]}
                  </span>
                  {step.message ? (
                    <span className="text-xs text-gray-500">{step.message}</span>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <div className="flex gap-2">
            {attach.failed && !attach.running ? (
              <Button size="sm" onClick={attach.retry}>
                남은 단계 다시 시도
              </Button>
            ) : null}
            {attach.canSkip ? (
              <Button size="sm" variant="secondary" onClick={attach.skipFailed}>
                실패한 단계 건너뛰고 계속
              </Button>
            ) : null}
            {!attach.running ? (
              <Button size="sm" variant="secondary" onClick={clear}>
                {attach.finished ? '새로 넣기' : '그만두고 비우기'}
              </Button>
            ) : null}
          </div>
          {attach.failed && !attach.running ? (
            <p className="text-xs text-gray-500">
              완료한 단계는 다시 하지 않습니다. 실패한 단계부터 이어서 합니다.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
