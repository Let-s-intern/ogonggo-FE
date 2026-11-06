import { useState } from 'react';
import { Button, Callout, Field, Input, Textarea, cn } from '@ogonggo/ui';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';
import {
  useAdvertiserList,
  useCreateAdvertiser,
  type Advertiser,
} from '@/entities/advertiser/api/useAdvertisers';
import { AdvertiserName } from '@/entities/advertiser/ui/AdvertiserName';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

/** 검색 결과로 한 번에 보이는 수. 더 찾으려면 검색어를 좁힌다. */
const VISIBLE_COUNT = 8;
const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 500;

interface AdvertiserFieldProps {
  id: string;
  value: AdvertiserSummary | null;
  onChange: (advertiser: AdvertiserSummary | null) => void;
  required?: boolean;
  error?: string;
  hint?: string;
}

const toSummary = ({ id, name, type }: Advertiser): AdvertiserSummary => ({ id, name, type });

/**
 * 광고주 고르기(이슈 #573). 배너 모달과 광고 공고 모달이 같이 쓴다.
 *
 * 검색 칸에 쓰면 비즈니스 회원·광고 문의로 들어온 기업·직접 더한 기업을 합친 목록(`GET /api/v1/admin/advertisers`)에서
 * 찾아 아래에 보인다. 눌러서 고른다. 목록에 없으면 `새 광고주 추가` 로 이 자리에서 비회원 광고주를 만들고 바로 고른다 —
 * 모달을 닫고 다른 화면에 다녀오지 않게 한다.
 *
 * 네이티브 `select` 를 쓰지 않은 이유는 회원 수만큼 늘어나는 목록을 한 번에 다 받아 펼칠 수 없어서다.
 */
export function AdvertiserField({
  id,
  value,
  onChange,
  required = false,
  error,
  hint,
}: AdvertiserFieldProps) {
  const [picking, setPicking] = useState(value === null);
  const [keyword, setKeyword] = useState('');
  const [adding, setAdding] = useState(false);

  const select = (advertiser: AdvertiserSummary | null) => {
    onChange(advertiser);
    setPicking(advertiser === null);
    setAdding(false);
    setKeyword('');
  };

  return (
    <Field label="광고주" htmlFor={id} required={required} error={error} hint={hint}>
      {!picking && value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
          <AdvertiserName advertiser={value} />
          <span className="flex gap-1">
            <Button size="sm" variant="secondary" onClick={() => setPicking(true)}>
              바꾸기
            </Button>
            {required ? null : (
              <Button size="sm" variant="secondary" onClick={() => select(null)}>
                빼기
              </Button>
            )}
          </span>
        </div>
      ) : adding ? (
        <NewAdvertiserForm
          initialName={keyword}
          onCreated={(advertiser) => select(toSummary(advertiser))}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <AdvertiserSearch
          id={id}
          keyword={keyword}
          onKeywordChange={setKeyword}
          selectedId={value?.id ?? null}
          onPick={(advertiser) => select(toSummary(advertiser))}
          onAdd={() => setAdding(true)}
          onCancel={value ? () => setPicking(false) : undefined}
        />
      )}
    </Field>
  );
}

function AdvertiserSearch({
  id,
  keyword,
  onKeywordChange,
  selectedId,
  onPick,
  onAdd,
  onCancel,
}: {
  id: string;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  selectedId: number | null;
  onPick: (advertiser: Advertiser) => void;
  onAdd: () => void;
  /** 이미 고른 광고주가 있으면 바꾸기를 그만두고 돌아간다. */
  onCancel?: () => void;
}) {
  const { data, isPending, isError } = useAdvertiserList(keyword.trim());
  const results = (data ?? []).slice(0, VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        value={keyword}
        placeholder="기업 이름·담당자·메일로 찾기"
        autoComplete="off"
        onChange={(event) => onKeywordChange(event.target.value)}
      />
      <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200">
        {isError ? (
          <p className="px-3 py-2 text-sm text-error">광고주 목록을 불러오지 못했습니다.</p>
        ) : isPending ? (
          <p className="px-3 py-2 text-sm text-gray-500">불러오는 중입니다.</p>
        ) : results.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-500">맞는 광고주가 없습니다.</p>
        ) : (
          <ul role="listbox" aria-label="광고주 검색 결과" className="divide-y divide-gray-100">
            {results.map((advertiser) => (
              <li key={advertiser.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={advertiser.id === selectedId}
                  onClick={() => onPick(advertiser)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50',
                    advertiser.id === selectedId && 'bg-blue-50',
                  )}
                >
                  <AdvertiserName advertiser={advertiser} />
                  <span className="truncate text-xs text-gray-500">
                    {[
                      advertiser.contactName,
                      advertiser.contactEmail,
                      advertiser.source === 'AD_INQUIRY' ? '광고 문의' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">찾는 기업이 없으면 새로 더합니다.</span>
        <span className="flex gap-1">
          {onCancel ? (
            <Button size="sm" variant="secondary" onClick={onCancel}>
              그대로 두기
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onClick={onAdd}>
            새 광고주 추가
          </Button>
        </span>
      </div>
    </div>
  );
}

/**
 * 비회원 광고주 추가. 이름만 필수다. 서버가 거절하면(같은 이름 등) 그 문구를 그대로 보인다. 광고주별 광고 목록의
 * `새 광고주 추가` 도 이 폼을 쓴다(`submitLabel` 로 버튼 글자만 바꾼다).
 */
export function NewAdvertiserForm({
  initialName,
  onCreated,
  onCancel,
  submitLabel = '더하고 고르기',
}: {
  initialName: string;
  onCreated: (advertiser: Advertiser) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const create = useCreateAdvertiser();
  const [name, setName] = useState(initialName.trim());
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && !name.trim() ? '광고주 이름을 입력해 주세요.' : undefined;

  const submit = () => {
    setSubmitted(true);
    if (!name.trim()) {
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        memo: memo.trim() || undefined,
      },
      {
        onSuccess: (advertiser) => {
          if (advertiser) {
            onCreated(advertiser);
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-1 rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="pb-2 text-sm font-medium text-gray-900">새 광고주(비회원)</p>
      {create.isError ? (
        <Callout tone="error" className="mb-2">
          {serverErrorMessage(create.error) ?? '광고주를 더하지 못했습니다.'}
        </Callout>
      ) : null}
      <Field label="기업 이름" htmlFor="advertiser-new-name" required error={nameError}>
        <Input
          id="advertiser-new-name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="담당자" htmlFor="advertiser-new-contact">
          <Input
            id="advertiser-new-contact"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
          />
        </Field>
        <Field label="메일" htmlFor="advertiser-new-email">
          <Input
            id="advertiser-new-email"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </Field>
        <Field label="전화" htmlFor="advertiser-new-phone">
          <Input
            id="advertiser-new-phone"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </Field>
      </div>
      <Field label="메모" htmlFor="advertiser-new-memo">
        <Textarea
          id="advertiser-new-memo"
          rows={2}
          value={memo}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(event) => setMemo(event.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button size="sm" onClick={submit} disabled={create.isPending}>
          {create.isPending ? '더하는 중' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
