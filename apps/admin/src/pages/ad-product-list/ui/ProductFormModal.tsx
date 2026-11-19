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
import { positionLabel } from '@/entities/advertisement-product/lib/product';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';

const NAME_MAX_LENGTH = 100;
const CATEGORY_OPTIONS = enumOptions('AdvertisementProductCategory');

/**
 * 판매 중인 광고 공고 상품의 자리, 판매 상품 차례(계약 8절). 공고 상세 옆과 부트캠프 목록 상단 고정은 2026-11-19 사용자
 * 결정으로 남긴다.
 */
const SOLD_AD_POSTING_POSITIONS: readonly string[] = [
  'JOB_PICK',
  'JOB_LIST',
  'JOB_DETAIL_SIDE',
  'CALENDAR_DAY',
  'MYPAGE_SCRAP',
  'BOOTCAMP_LIST',
];

/**
 * 카테고리마다 고를 수 있는 자리. 카탈로그 하나에 배너·광고 공고 자리가 함께 있어 광고 공고 자리 목록으로 가른다.
 * 같은 값이 두 번 들어가면 `select` 가 앞의 것을 골라 보여 주므로(배너로 바뀌어 보이던 버그) 값마다 한 번만 둔다.
 */
function positionOptions(category: CreateAdminAdvertisementProductRequestCategory) {
  const all = enumOptions('AdvertisementProductPosition');
  const none = { value: '', label: '자리 없음' };
  if (category === 'BANNER') {
    // 카탈로그에는 판매하지 않는 광고 공고 자리(`BOOTCAMP_LIST`)도 남아 있어 배너 자리 이름(`_BANNER`)으로 가른다.
    return [none, ...all.filter((option) => option.value.endsWith('_BANNER'))];
  }
  if (category === 'JOB_POSTING') {
    return [
      none,
      ...SOLD_AD_POSTING_POSITIONS.map((value) => ({ value, label: positionLabel(value) })),
    ];
  }
  return null;
}

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
 * 카테고리를 먼저 고르고, 그 카테고리의 자리만 고른다 — 배너는 배너 자리, 광고 공고는 광고 공고 자리. 인스타그램·카카오톡처럼
 * 오공고 밖에 싣는 상품은 자리가 없다. 카테고리를 바꾸면 자리를 비운다. 둘이 다르면 BE 가 400
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
  const positions = positionOptions(form.category);

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

      <Field label="카테고리" htmlFor="product-category" required>
        <Select
          id="product-category"
          options={CATEGORY_OPTIONS}
          value={form.category}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              category: event.target.value as CreateAdminAdvertisementProductRequestCategory,
              position: '',
            }))
          }
        />
      </Field>

      {positions ? (
        <Field
          label="노출 자리"
          htmlFor="product-position"
          hint="이 카테고리의 오공고 화면 자리입니다. 자리가 없으면 웹에 나오지 않습니다."
        >
          <Select
            id="product-position"
            options={positions}
            value={form.position}
            onChange={(event) =>
              setForm((current) => ({ ...current, position: event.target.value }))
            }
          />
        </Field>
      ) : null}

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
