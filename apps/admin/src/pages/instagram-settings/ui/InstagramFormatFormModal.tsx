import { useState } from 'react';
import { Button, Callout, Checkbox, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import {
  useSaveInstagramFormat,
  type InstagramAccount,
  type InstagramFormat,
} from '@/entities/instagram/api/useInstagram';
import { instagramHandle } from '@/entities/instagram/lib/instagram';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;
const PRICE_MAX_DIGITS = 10;

const withCommas = (digits: string) => (digits ? Number(digits).toLocaleString('ko-KR') : '');

/**
 * 게재 유형 등록·수정 모달(이슈 #573). 이름, 설명, 기본 단가(선택), 사용 여부, 올릴 수 있는 계정.
 *
 * 계정은 `모든 계정` 이 기본이고, 끄면 계정을 골라 좁힌다. 계정마다 유형을 고르는 표(계정 × 유형)보다 유형 하나에 계정을
 * 체크하는 쪽이 칸이 적고, 새 계정이 생겨도 `모든 계정` 유형은 따로 손대지 않아도 된다.
 */
export function InstagramFormatFormModal({
  format,
  accounts,
  onClose,
  onSaved,
}: {
  format: InstagramFormat | null;
  accounts: InstagramAccount[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const save = useSaveInstagramFormat(format?.id ?? null);
  const [name, setName] = useState(format?.name ?? '');
  const [description, setDescription] = useState(format?.description ?? '');
  const [price, setPrice] = useState(
    format?.defaultPrice == null ? '' : String(format.defaultPrice),
  );
  const [enabled, setEnabled] = useState(format?.enabled ?? true);
  const [allAccounts, setAllAccounts] = useState((format?.accountIds.length ?? 0) === 0);
  const [accountIds, setAccountIds] = useState<number[]>(format?.accountIds ?? []);
  const [submitted, setSubmitted] = useState(false);

  const errors = submitted
    ? {
        name: name.trim() ? undefined : '이름을 입력해 주세요.',
        accounts:
          !allAccounts && accountIds.length === 0
            ? '올릴 계정을 하나 이상 고르거나 모든 계정을 켜 주세요.'
            : undefined,
      }
    : {};

  const submit = () => {
    setSubmitted(true);
    if (!name.trim() || (!allAccounts && accountIds.length === 0)) {
      return;
    }
    save.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        enabled,
        defaultPrice: price ? Number(price) : null,
        accountIds: allAccounts ? [] : accountIds,
      },
      {
        onSuccess: () => {
          onSaved(format ? '게재 유형을 고쳤습니다.' : '게재 유형을 더했습니다.');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title={format ? '게재 유형 수정' : '게재 유형 추가'}
      onClose={onClose}
      className="w-[min(36rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}

      <Field label="이름" htmlFor="format-name" required error={errors.name}>
        <Input
          id="format-name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          placeholder="예: 릴스(숏츠)"
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="설명" htmlFor="format-description">
        <Textarea
          id="format-description"
          rows={2}
          value={description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          placeholder="예: 24시간 노출, 링크 스티커 가능"
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field
        label="기본 단가(원)"
        htmlFor="format-price"
        hint="안내용입니다. 비워도 되고 계약 금액은 따로 적습니다."
      >
        <Input
          id="format-price"
          inputMode="numeric"
          autoComplete="off"
          value={withCommas(price)}
          placeholder="0"
          onChange={(event) =>
            setPrice(
              event.target.value
                .replace(/\D/g, '')
                .replace(/^0+(?=\d)/, '')
                .slice(0, PRICE_MAX_DIGITS),
            )
          }
        />
      </Field>
      <Field label="올릴 수 있는 계정" error={errors.accounts}>
        <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
          <Checkbox
            checked={allAccounts}
            onChange={setAllAccounts}
            label="모든 계정(새로 더한 계정 포함)"
            labelClassName="text-sm text-gray-700"
          />
          {allAccounts ? null : (
            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2">
              {accounts.map((account) => (
                <Checkbox
                  key={account.id}
                  checked={accountIds.includes(account.id)}
                  onChange={(checked) =>
                    setAccountIds((current) =>
                      checked
                        ? [...current, account.id]
                        : current.filter((id) => id !== account.id),
                    )
                  }
                  label={`${instagramHandle(account.handle)}${account.enabled ? '' : ' (사용 안 함)'}`}
                  labelClassName="text-sm text-gray-700"
                />
              ))}
            </div>
          )}
        </div>
      </Field>
      <label className="flex items-center gap-2 pb-4 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        사용(끄면 새 인스타 광고와 계약 상품에서 고를 수 없습니다)
      </label>

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
