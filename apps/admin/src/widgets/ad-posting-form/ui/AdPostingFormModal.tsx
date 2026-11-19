import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Select } from '@ogonggo/ui';
import {
  useAdvertisementExposures,
  useCreateExposure,
  useMoveExposure,
  useReplaceExposure,
  useToggleExposure,
} from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import {
  AD_POSTING_FIXED_TARGET,
  type AdPostingExposure,
  type AdPostingPosition,
} from '@/entities/advertisement-exposure/lib/adPosting';
import type { AdvertisementProduct } from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { positionLabel } from '@/entities/advertisement-product/lib/product';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { ContractField } from '@/widgets/banner-form';
import {
  ContentTargetPicker,
  targetKey,
  type ContentTarget,
} from '@/widgets/content-target-picker';

interface AdPostingFormModalProps {
  /** 노출을 거는 광고 공고 상품(자리). 열 때의 탭으로 정해지고 바꾸지 않는다. */
  product: AdvertisementProduct;
  /** 자리가 없는 광고 공고 상품(`비즈니스 공고 등록`)이면 `null`. 노출은 걸리지만 웹 목록에 나오지 않는다. */
  position: AdPostingPosition | null;
  /** `null` 이면 새 광고 공고다. */
  exposure: AdPostingExposure | null;
  /** 이 자리에 이미 건 대상(`targetKey`). 같은 자리에 같은 공고를 두 번 걸 수 없다(BE 409). */
  takenKeys: Set<string>;
  onClose: () => void;
  /** 새 광고 공고의 연결 계약을 미리 채운다(계약 상세에서 열 때). */
  initialContract?: { id: number; companyName: string };
  /** 새 광고 공고의 대상을 미리 채운다(계약의 광고할 공고). 바꿀 수 있다. */
  initialTarget?: ContentTarget | null;
  /** 새 광고 공고의 노출 기간(`datetime-local` 값). 계약 상품 기간이다. */
  initialPeriod?: { startAt: string; endAt: string };
  /**
   * 넘기면 새 광고 공고에 `광고할 공고로 등록` 체크(기본 켬)가 나오고, 저장한 뒤 그 대상을 계약의 광고할 공고로 연결한다.
   * 계약 상세에서 열 때만 넘긴다.
   */
  onRegisterTarget?: (target: ContentTarget) => Promise<void>;
  /** 같은 계약·상품의 노출이 여럿일 때 수정 모달 안에서 고른다. */
  siblings?: AdPostingExposure[];
  onSwitch?: (exposure: AdPostingExposure) => void;
}

/** `datetime-local` 값과 서버 값(KST, 초까지)을 오간다. 배너 모달과 같다. */
const toInputValue = (value: string | null | undefined) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => (value ? `${value}:00` : null);

function targetOf(exposure: AdPostingExposure | null): ContentTarget | null {
  if (!exposure?.targetType || exposure.targetId == null) return null;
  return {
    targetType: exposure.targetType,
    targetId: exposure.targetId,
    title: exposure.targetTitle ?? `${exposure.targetId}번`,
    companyName: exposure.targetCompanyName ?? '',
    jobField: exposure.jobField ?? null,
  };
}

/**
 * 광고 공고 등록·수정 모달(PRD 6.8). 배너 모달(`widgets/banner-form`)과 같은 모양이고, 이미지·링크 대신 띄울 공고·부트캠프를
 * 검색해 고른다. 카드는 웹이 대상 요약으로 그린다.
 *
 * 수정은 `PUT` 전체 교체라 모든 칸을 다시 보낸다. 켜기는 교체 본문에 칸이 없어 바뀌었을 때만 따로 보낸다. 순서는 수정할 때
 * 한 칸씩 바로 옮긴다(배너 세팅의 위로·아래로와 같다).
 */
export function AdPostingFormModal({
  product,
  position,
  exposure,
  takenKeys,
  onClose,
  initialContract,
  initialTarget,
  initialPeriod,
  onRegisterTarget,
  siblings = [],
  onSwitch,
}: AdPostingFormModalProps) {
  const createMutation = useCreateExposure();
  const replaceMutation = useReplaceExposure(exposure?.id ?? 0);
  const saveMutation = exposure ? replaceMutation : createMutation;
  const toggle = useToggleExposure(exposure?.id ?? 0);
  const move = useMoveExposure();
  // 순서는 자리 전체에서 정해진다. 수정할 때 몇 번째인지 보이고 한 칸씩 옮긴다.
  const allInProduct = useAdvertisementExposures(exposure ? product.id : null);
  const orderIndex = exposure
    ? (allInProduct.data ?? []).findIndex((row) => row.id === exposure.id)
    : -1;
  const orderTotal = allInProduct.data?.length ?? 0;
  const [target, setTarget] = useState<ContentTarget | null>(() =>
    exposure ? targetOf(exposure) : (initialTarget ?? null),
  );
  const [contractId, setContractId] = useState<number | null>(
    exposure ? (exposure.contractId ?? null) : (initialContract?.id ?? null),
  );
  const [startAt, setStartAt] = useState(
    exposure ? toInputValue(exposure.startAt) : (initialPeriod?.startAt ?? ''),
  );
  const [endAt, setEndAt] = useState(
    exposure ? toInputValue(exposure.endAt) : (initialPeriod?.endAt ?? ''),
  );
  const [registerTarget, setRegisterTarget] = useState(true);
  const [registerError, setRegisterError] = useState<string | null>(null);
  // 광고 공고는 돈을 받고 싣는 자리라 광고 표시를 켠 채로 시작한다.
  const [adLabel, setAdLabel] = useState(exposure?.adLabel ?? true);
  const [exposed, setExposed] = useState(exposure?.exposed ?? true);
  const [submitted, setSubmitted] = useState(false);

  // 수정 중인 노출 자신의 대상은 다시 골라도 된다.
  const ownKey = exposure ? targetOf(exposure) : null;
  const blocked = new Set([...takenKeys].filter((key) => !ownKey || key !== targetKey(ownKey)));

  const errors = submitted
    ? {
        target: target ? undefined : '띄울 공고를 골라 주세요.',
        jobField:
          position === 'JOB_LIST' && !target?.jobField
            ? '채용공고 목록 광고는 직군 정보가 있는 공고를 골라야 합니다.'
            : undefined,
        endAt:
          Boolean(startAt) !== Boolean(endAt)
            ? '노출 시작과 끝을 함께 넣거나 둘 다 비워 주세요. 둘 다 비우면 상시예요.'
            : startAt && startAt >= endAt
              ? '노출 끝은 시작보다 뒤여야 해요.'
              : undefined,
      }
    : {};

  const save = () => {
    setSubmitted(true);
    if (
      !target ||
      (position === 'JOB_LIST' && !target.jobField) ||
      Boolean(startAt) !== Boolean(endAt) ||
      (startAt && startAt >= endAt)
    ) return;
    const body = {
      contractId,
      name: null,
      imageUrl: null,
      mobileImageUrl: null,
      linkUrl: null,
      targetType: target.targetType,
      targetId: target.targetId,
      jobField: position === 'JOB_LIST' ? (target.jobField ?? null) : null,
      adLabel,
      startAt: toServerValue(startAt),
      endAt: toServerValue(endAt),
    };
    if (exposure) {
      replaceMutation.mutate(body, {
        onSuccess: async () => {
          // 켜기는 교체 본문에 칸이 없어 바뀌었을 때만 따로 보낸다.
          if (exposed !== exposure.exposed) await toggle.mutateAsync(exposed);
          onClose();
        },
      });
    } else {
      createMutation.mutate(
        { ...body, productId: product.id, exposed },
        {
          onSuccess: async () => {
            if (onRegisterTarget && registerTarget) {
              try {
                await onRegisterTarget(target);
              } catch (failure) {
                // 노출은 저장됐다. 연결만 실패했다고 알리고 모달은 닫지 않는다.
                setRegisterError(
                  advertisementErrorMessage(failure, '광고할 공고로 연결하지 못했어요.'),
                );
                return;
              }
            }
            onClose();
          },
        },
      );
    }
  };

  return (
    <Modal
      open
      title={exposure ? '광고 공고 수정' : '새 광고 공고'}
      description={position ? `${product.name} · ${positionLabel(position)}` : product.name}
      onClose={onClose}
      className="w-[min(56rem,calc(100vw-2rem))]"
    >
      {saveMutation.isError ? (
        <Callout tone="error" className="mb-4">
          {advertisementErrorMessage(
            saveMutation.error,
            '저장하지 못했습니다. 입력값을 확인해 주세요.',
          )}
        </Callout>
      ) : null}
      {position === null ? (
        <Callout tone="info" className="mb-4">
          이 상품에는 노출 자리가 없어 웹 목록에는 나오지 않아요. 광고 상품에서 자리를 정하면 그
          자리에 나와요.
        </Callout>
      ) : null}
      {registerError ? (
        <Callout tone="error" className="mb-4">
          광고 공고는 저장했지만 {registerError} 계약 정보의 광고할 공고에서 다시 연결해 주세요.
        </Callout>
      ) : null}

      {exposure && siblings.length > 1 && onSwitch ? (
        <Field
          label="수정할 노출"
          htmlFor="ad-posting-sibling"
          hint={`이 계약·상품의 노출이 ${siblings.length}개예요.`}
        >
          <Select
            id="ad-posting-sibling"
            options={siblings.map((sibling, index) => ({
              value: String(sibling.id),
              label: `${index + 1}. ${sibling.targetTitle ?? `${sibling.targetId}번`}`,
            }))}
            value={String(exposure.id)}
            onChange={(event) => {
              const next = siblings.find((sibling) => String(sibling.id) === event.target.value);
              if (next) onSwitch(next);
            }}
          />
        </Field>
      ) : null}

      <Field label="띄울 공고" required error={errors.target}>
        {target ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-gray-900">
                {target.title}
              </span>
              <span className="block text-xs text-gray-500">
                {target.targetType === 'BOOTCAMP' ? '부트캠프' : '채용공고'}
                {target.companyName ? ` · ${target.companyName}` : ''} · {target.targetId}번
              </span>
            </span>
            <Button size="sm" variant="secondary" onClick={() => setTarget(null)}>
              바꾸기
            </Button>
          </div>
        ) : (
          <ContentTargetPicker
            takenKeys={blocked}
            fixedType={position ? AD_POSTING_FIXED_TARGET[position] : undefined}
            onPick={setTarget}
          />
        )}
      </Field>
      {errors.jobField ? <p role="alert" className="-mt-3 text-sm text-red-600">{errors.jobField}</p> : null}

      <ContractField
        id="ad-posting-contract"
        value={contractId}
        currentCompanyName={
          exposure
            ? (exposure.advertiserCompanyName ?? null)
            : (initialContract?.companyName ?? null)
        }
        onChange={setContractId}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="노출 시작(KST)" htmlFor="ad-posting-start" hint="시작·끝을 모두 비우면 상시">
          <Input
            id="ad-posting-start"
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
          />
        </Field>
        <Field label="노출 끝(KST)" htmlFor="ad-posting-end" error={errors.endAt}>
          <Input
            id="ad-posting-end"
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </Field>
      </div>

      {exposure && orderIndex >= 0 ? (
        <div className="flex items-center gap-2 pb-4 text-sm text-gray-700">
          <span>
            순서 {orderIndex + 1} / {orderTotal}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={move.isPending || orderIndex === 0}
            onClick={() => move.mutate({ exposureId: exposure.id, direction: 'UP' })}
          >
            위로
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={move.isPending || orderIndex === orderTotal - 1}
            onClick={() => move.mutate({ exposureId: exposure.id, direction: 'DOWN' })}
          >
            아래로
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-6 gap-y-2 pb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={exposed}
            onChange={(event) => setExposed(event.target.checked)}
          />
          켜기
        </label>
        {!exposure && onRegisterTarget ? (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={registerTarget}
              onChange={(event) => setRegisterTarget(event.target.checked)}
            />
            광고할 공고로 등록(계약 정보의 광고할 공고에 들어가요)
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={adLabel}
            onChange={(event) => setAdLabel(event.target.checked)}
          />
          광고 표시(AD 딱지를 붙인다)
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={save} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </Modal>
  );
}
