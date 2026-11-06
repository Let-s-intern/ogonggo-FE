import { useState } from 'react';
import { Button, Callout, Checkbox, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import { AD_CONTRACT_PRODUCTS, type AdContractProduct } from '@ogonggo/api/src/ad-contracts';
import {
  useSaveAdContract,
  type AdContract,
  type AdContractInput,
} from '@/entities/ad-contract/api/useAdContracts';
import { adContractProductLabel } from '@/features/ad-contract-picker/lib/adContractProduct';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 500;
/** 열 자리(100억 원 미만)까지 받는다. 서버 상한과 같다. */
const AMOUNT_MAX_DIGITS = 10;

/** `datetime-local` 값과 서버 값(KST, 초까지)을 오간다. 배너 모달과 같다. */
const toInputValue = (value: string | null | undefined) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => `${value}:00`;

/** `1500000` → `1,500,000`. 입력 칸에 쉼표를 넣어 보인다. */
const withCommas = (digits: string) => (digits ? Number(digits).toLocaleString('ko-KR') : '');

interface FormState {
  name: string;
  startAt: string;
  endAt: string;
  /** 숫자만 들고 있는다. 보일 때 쉼표를 넣는다. */
  amount: string;
  /** 금액이 부가세를 포함하는가. 새 계약은 포함으로 시작한다. */
  vatIncluded: boolean;
  paid: boolean;
  paidDate: string;
  products: AdContractProduct[];
  memo: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim().length > NAME_MAX_LENGTH)
    errors.name = `계약명은 ${NAME_MAX_LENGTH}자까지 쓸 수 있어요.`;
  if (!form.startAt) errors.startAt = '광고 시작을 입력해 주세요.';
  if (!form.endAt) errors.endAt = '광고 끝을 입력해 주세요.';
  else if (form.startAt && form.startAt >= form.endAt)
    errors.endAt = '광고 끝은 시작보다 뒤여야 해요.';
  if (!form.amount) errors.amount = '금액을 입력해 주세요. 무료면 0 을 넣어 주세요.';
  return errors;
}

/**
 * 광고 계약 등록·수정 모달(이슈 #573). 언제부터 언제까지, 얼마를 냈는지, 결제했는지, 어느 자리를 샀는지 적는다. 배너·광고
 * 공고를 더할 때 이 계약을 고르면 노출 기간이 계약 기간으로 채워진다.
 */
export function AdContractFormModal({
  advertiserId,
  contract,
  onClose,
  onSaved,
}: {
  advertiserId: number;
  /** `null` 이면 새 계약이다. */
  contract: AdContract | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const save = useSaveAdContract(advertiserId, contract?.id ?? null);
  const [form, setForm] = useState<FormState>(() => ({
    name: contract?.name ?? '',
    startAt: toInputValue(contract?.startAt),
    endAt: toInputValue(contract?.endAt),
    amount: contract ? String(contract.amount) : '',
    vatIncluded: contract?.vatIncluded ?? true,
    paid: contract?.paid ?? false,
    paidDate: contract?.paidDate ?? '',
    products: contract?.products ?? [],
    memo: contract?.memo ?? '',
  }));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(form) : {};

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleProduct = (product: AdContractProduct, checked: boolean) =>
    setForm((current) => ({
      ...current,
      products: checked
        ? AD_CONTRACT_PRODUCTS.filter((item) => item === product || current.products.includes(item))
        : current.products.filter((item) => item !== product),
    }));

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(validate(form)).length > 0) {
      return;
    }
    const input: AdContractInput = {
      name: form.name.trim() || null,
      startAt: toServerValue(form.startAt),
      endAt: toServerValue(form.endAt),
      amount: Number(form.amount),
      vatIncluded: form.vatIncluded,
      paid: form.paid,
      paidDate: form.paid && form.paidDate ? form.paidDate : null,
      products: form.products,
      memo: form.memo.trim() || null,
    };
    save.mutate(input, {
      onSuccess: () => {
        onSaved?.();
        onClose();
      },
    });
  };

  const productGroup = (title: string, prefix: string) => (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-gray-500">{title}</span>
      {AD_CONTRACT_PRODUCTS.filter((product) => product.startsWith(prefix)).map((product) => (
        <Checkbox
          key={product}
          checked={form.products.includes(product)}
          onChange={(checked) => toggleProduct(product, checked)}
          label={adContractProductLabel(product).replace(/^(배너|광고 공고) /, '')}
          labelClassName="text-sm text-gray-700"
        />
      ))}
    </div>
  );

  return (
    <Modal
      open
      title={contract ? '광고 계약 수정' : '광고 계약 추가'}
      onClose={onClose}
      className="w-[min(40rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}

      <Field label="계약명" htmlFor="contract-name" error={errors.name} hint="비워도 됩니다.">
        <Input
          id="contract-name"
          value={form.name}
          maxLength={NAME_MAX_LENGTH}
          placeholder="예: 11월 홈 배너"
          onChange={(event) => set('name', event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="광고 시작(KST)" htmlFor="contract-start" required error={errors.startAt}>
          <Input
            id="contract-start"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => set('startAt', event.target.value)}
          />
        </Field>
        <Field
          label="광고 끝(KST)"
          htmlFor="contract-end"
          required
          error={errors.endAt}
          hint="이 시각 전까지 광고합니다."
        >
          <Input
            id="contract-end"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => set('endAt', event.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="금액(원)" htmlFor="contract-amount" required error={errors.amount}>
          <Input
            id="contract-amount"
            inputMode="numeric"
            autoComplete="off"
            value={withCommas(form.amount)}
            placeholder="0"
            onChange={(event) =>
              set(
                'amount',
                event.target.value
                  .replace(/\D/g, '')
                  .replace(/^0+(?=\d)/, '')
                  .slice(0, AMOUNT_MAX_DIGITS),
              )
            }
          />
          <Checkbox
            checked={form.vatIncluded}
            onChange={(checked) => set('vatIncluded', checked)}
            label="부가가치세 포함"
            className="pt-2"
            labelClassName="text-sm text-gray-700"
          />
        </Field>
        <Field
          label="결제"
          htmlFor="contract-paid-date"
          hint="결제일은 몰라도 비워 둘 수 있습니다."
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={form.paid}
              onChange={(checked) => set('paid', checked)}
              label="결제 완료"
              labelClassName="text-sm text-gray-700 whitespace-nowrap"
            />
            <Input
              id="contract-paid-date"
              type="date"
              aria-label="결제일"
              disabled={!form.paid}
              value={form.paid ? form.paidDate : ''}
              onChange={(event) => set('paidDate', event.target.value)}
            />
          </div>
        </Field>
      </div>

      <Field
        label="상품(자리)"
        hint="고른 자리는 배너·광고 공고를 더할 때 먼저 골라집니다. 비워도 됩니다."
      >
        <div className="grid grid-cols-2 gap-4 rounded-md border border-gray-200 p-3">
          {productGroup('배너', 'BANNER_')}
          {productGroup('광고 공고', 'AD_POSTING_')}
        </div>
      </Field>

      <Field label="메모" htmlFor="contract-memo">
        <Textarea
          id="contract-memo"
          rows={3}
          value={form.memo}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(event) => set('memo', event.target.value)}
        />
      </Field>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </Modal>
  );
}
