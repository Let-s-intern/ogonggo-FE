import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Select } from '@ogonggo/ui';
import {
  enumOptions,
  type CreateAdminAdvertisementProductRequestCategory,
  type CreateAdminAdvertisementProductRequestPosition,
} from '@ogonggo/api/src/admin';
import {
  useSaveAdvertisementProduct,
  type AdvertisementProduct,
} from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';

const NAME_MAX_LENGTH = 100;
const CATEGORY_OPTIONS = enumOptions('AdvertisementProductCategory');
const POSITION_OPTIONS = [
  { value: '', label: '자리 없음' },
  ...enumOptions('AdvertisementProductPosition'),
];

interface FormState {
  category: CreateAdminAdvertisementProductRequestCategory;
  /** 빈 문자열이면 자리 없음이다. */
  position: string;
  name: string;
  /** 빈 문자열이면 견적 문의(`null`)다. 0 은 0원이다. */
  price: string;
}

function initialState(product: AdvertisementProduct | null): FormState {
  return {
    category: product?.category ?? 'BANNER',
    position: product?.position ?? '',
    name: product?.name ?? '',
    price: product?.price == null ? '' : String(product.price),
  };
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = '상품 이름을 입력해 주세요.';
  else if (name.length > NAME_MAX_LENGTH)
    errors.name = `상품 이름은 ${NAME_MAX_LENGTH}자까지 쓸 수 있어요.`;
  if (form.price && !/^\d+$/.test(form.price))
    errors.price = '가격은 0 이상의 숫자로 입력해 주세요. 비우면 견적 문의예요.';
  return errors;
}

/**
 * 광고 상품 등록·수정 모달(BE LC-3583). 수정은 `PUT` 전체 교체라 모든 칸을 보낸다.
 *
 * 노출 자리는 지금 모두 배너 자리라, 자리를 고르면 카테고리를 `배너` 로 고정한다. 다르면 BE 가 400
 * (`ADVERTISEMENT_PRODUCT_POSITION_MISMATCH`)으로 거절한다.
 */
export function ProductFormModal({
  product,
  onClose,
}: {
  /** `null` 이면 새 상품이다. */
  product: AdvertisementProduct | null;
  onClose: () => void;
}) {
  const save = useSaveAdvertisementProduct(product?.id ?? null);
  const [form, setForm] = useState<FormState>(() => initialState(product));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(form) : {};

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(validate(form)).length > 0) {
      return;
    }
    save.mutate(
      {
        category: form.category,
        position: (form.position || null) as CreateAdminAdvertisementProductRequestPosition,
        name: form.name.trim(),
        price: form.price ? Number(form.price) : null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal open title={product ? '광고 상품 수정' : '새 광고 상품'} onClose={onClose}>
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {advertisementErrorMessage(save.error, '저장하지 못했습니다. 입력값을 확인해 주세요.')}
        </Callout>
      ) : null}

      <Field
        label="노출 자리"
        htmlFor="product-position"
        hint="오공고 화면의 배너 자리입니다. 인스타그램·카카오톡처럼 오공고 밖에 싣는 상품은 자리 없음입니다."
      >
        <Select
          id="product-position"
          options={POSITION_OPTIONS}
          value={form.position}
          onChange={(event) => {
            const position = event.target.value;
            setForm((current) => ({
              ...current,
              position,
              category: position ? 'BANNER' : current.category,
            }));
          }}
        />
      </Field>

      <Field
        label="카테고리"
        htmlFor="product-category"
        required
        hint={form.position ? '노출 자리가 있는 상품은 배너입니다.' : undefined}
      >
        <Select
          id="product-category"
          options={CATEGORY_OPTIONS}
          value={form.category}
          disabled={Boolean(form.position)}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              category: event.target.value as CreateAdminAdvertisementProductRequestCategory,
            }))
          }
        />
      </Field>

      <Field label="상품 이름" htmlFor="product-name" required error={errors.name}>
        <Input
          id="product-name"
          value={form.name}
          maxLength={NAME_MAX_LENGTH}
          placeholder="예: 채용공고 홈 상단 배너"
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </Field>

      <Field
        label="소개 가격(원)"
        htmlFor="product-price"
        error={errors.price}
        hint="상품 소개용 가격입니다. 비우면 견적 문의, 0 은 0원입니다. 실제 결제 금액은 계약마다 따로 적습니다."
      >
        <Input
          id="product-price"
          inputMode="numeric"
          value={form.price}
          placeholder="견적 문의"
          onChange={(event) =>
            setForm((current) => ({ ...current, price: event.target.value.trim() }))
          }
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
