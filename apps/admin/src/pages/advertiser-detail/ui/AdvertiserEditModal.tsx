import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import { useUpdateAdvertiser, type Advertiser } from '@/entities/advertiser/api/useAdvertisers';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 500;

/**
 * 비회원 광고주 정보 수정(`PATCH /api/v1/admin/advertisers/{id}`). 칸은 추가 폼(`features/advertiser-picker`)과 같다.
 * 비운 칸은 지운다. 서버가 거절하면(같은 이름, 메일 형식) 그 문구를 그대로 보인다.
 */
export function AdvertiserEditModal({
  advertiser,
  onClose,
}: {
  advertiser: Advertiser;
  onClose: () => void;
}) {
  const update = useUpdateAdvertiser(advertiser.id);
  const [name, setName] = useState(advertiser.name);
  const [contactName, setContactName] = useState(advertiser.contactName ?? '');
  const [contactEmail, setContactEmail] = useState(advertiser.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(advertiser.contactPhone ?? '');
  const [memo, setMemo] = useState(advertiser.memo ?? '');
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && !name.trim() ? '광고주 이름을 입력해 주세요.' : undefined;

  const save = () => {
    setSubmitted(true);
    if (!name.trim()) {
      return;
    }
    update.mutate(
      {
        name: name.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        memo: memo.trim(),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal open title="광고주 정보 수정" onClose={onClose}>
      {update.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(update.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}
      <Field label="기업 이름" htmlFor="advertiser-edit-name" required error={nameError}>
        <Input
          id="advertiser-edit-name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="담당자" htmlFor="advertiser-edit-contact">
          <Input
            id="advertiser-edit-contact"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
          />
        </Field>
        <Field label="메일" htmlFor="advertiser-edit-email">
          <Input
            id="advertiser-edit-email"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </Field>
        <Field label="전화" htmlFor="advertiser-edit-phone">
          <Input
            id="advertiser-edit-phone"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </Field>
      </div>
      <Field label="메모" htmlFor="advertiser-edit-memo">
        <Textarea
          id="advertiser-edit-memo"
          rows={3}
          value={memo}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(event) => setMemo(event.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </Modal>
  );
}
