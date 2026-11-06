import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button, Input } from '@ogonggo/ui';
import type { AdContractSummary } from '@ogonggo/api/src/ad-contracts';
import { AdContractNote } from '@/entities/ad-contract/ui/AdContractNote';
import { formatPeriod, isLinkUrl } from '@/entities/banner/lib/banner';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

type Period = { startAt: string | null; endAt: string | null };

const toInputValue = (value: string | null) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => (value ? `${value}:00` : null);

/**
 * 표 칸 바로 고치기(이슈 #573, 2026-11-06 사용자). 칸을 누르면 입력이 열리고 Enter 나 `저장` 으로 보내고 Esc 나 `취소` 로
 * 닫는다. 오류는 칸 아래에 보인다. 행을 누르면 열리는 전체 수정 모달과 겹치지 않게 칸 안의 클릭은 행으로 올리지 않는다.
 */
function InlineEditor({
  label,
  display,
  editor,
  validate,
  onSave,
  onStart,
}: {
  label: string;
  display: ReactNode;
  /** 편집 중 입력. Enter·Esc 처리는 감싸는 쪽이 한다. */
  editor: ReactNode;
  validate: () => string | null;
  onSave: () => Promise<unknown>;
  onStart: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    try {
      await onSave();
      setEditing(false);
      setError(null);
    } catch (caught) {
      setError(serverErrorMessage(caught) ?? '저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setEditing(false);
      setError(null);
    }
  };

  if (!editing) {
    return (
      <span onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          aria-label={`${label} 바로 고치기`}
          title="눌러서 바로 고치기"
          className="w-full rounded px-1 py-0.5 text-left hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
          onClick={() => {
            onStart();
            setEditing(true);
          }}
        >
          {display}
        </button>
      </span>
    );
  }

  return (
    <span
      className="flex flex-col gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={onKeyDown}
    >
      {editor}
      {error ? (
        <span role="alert" className="text-xs text-error">
          {error}
        </span>
      ) : null}
      <span className="flex gap-1">
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? '저장 중' : '저장'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
        >
          취소
        </Button>
      </span>
    </span>
  );
}

/** 노출 기간 칸. 이어 둔 계약과 기간 밖 여부를 아래에 적는다. */
export function InlinePeriodCell({
  name,
  value,
  contract,
  onSave,
}: {
  name: string;
  value: Period;
  contract: AdContractSummary | null;
  onSave: (period: Period) => Promise<unknown>;
}) {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  return (
    <InlineEditor
      label={`${name} 노출 기간`}
      onStart={() => {
        setStartAt(toInputValue(value.startAt));
        setEndAt(toInputValue(value.endAt));
      }}
      display={
        <span className="flex flex-col gap-0.5 text-sm">
          {formatPeriod(value)}
          <AdContractNote contract={contract} period={value} />
        </span>
      }
      editor={
        <>
          <Input
            type="datetime-local"
            aria-label="노출 시작(KST)"
            value={startAt}
            autoFocus
            onChange={(event) => setStartAt(event.target.value)}
          />
          <Input
            type="datetime-local"
            aria-label="노출 끝(KST)"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
          <span className="text-xs text-gray-500">비우면 시작은 켜는 즉시, 끝은 끌 때까지</span>
        </>
      }
      validate={() =>
        startAt && endAt && startAt >= endAt ? '노출 끝은 시작보다 뒤여야 해요.' : null
      }
      onSave={() => onSave({ startAt: toServerValue(startAt), endAt: toServerValue(endAt) })}
    />
  );
}

/** 배너 링크 칸. */
export function InlineLinkCell({
  name,
  value,
  onSave,
}: {
  name: string;
  value: string;
  onSave: (linkUrl: string) => Promise<unknown>;
}) {
  const [linkUrl, setLinkUrl] = useState('');
  return (
    <InlineEditor
      label={`${name} 링크`}
      onStart={() => setLinkUrl(value)}
      display={<span className="block truncate text-sm text-gray-700">{value}</span>}
      editor={
        <Input
          aria-label="링크"
          value={linkUrl}
          autoFocus
          placeholder="https://"
          onChange={(event) => setLinkUrl(event.target.value)}
        />
      }
      validate={() =>
        isLinkUrl(linkUrl.trim())
          ? null
          : 'http:// 또는 https:// 로 시작하는 주소나 / 로 시작하는 경로를 입력해 주세요.'
      }
      onSave={() => onSave(linkUrl.trim())}
    />
  );
}

/** 채널 광고의 게시 예정일·노출 끝 날 칸. 날짜만 고친다. 끝 날을 비우면 하루짜리 게시다. */
export function InlineChannelAdDateCell({
  name,
  value,
  display,
  onSave,
}: {
  name: string;
  value: { postDate: string; endDate: string | null };
  display: ReactNode;
  onSave: (dates: { postDate: string; endDate: string | null }) => Promise<unknown>;
}) {
  const [postDate, setPostDate] = useState('');
  const [endDate, setEndDate] = useState('');
  return (
    <InlineEditor
      label={`${name} 게시 예정일`}
      onStart={() => {
        setPostDate(value.postDate);
        setEndDate(value.endDate ?? '');
      }}
      display={display}
      editor={
        <>
          <Input
            type="date"
            aria-label="게시 예정일(KST)"
            value={postDate}
            autoFocus
            onChange={(event) => setPostDate(event.target.value)}
          />
          <Input
            type="date"
            aria-label="노출 끝 날"
            value={endDate}
            min={postDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <span className="text-xs text-gray-500">끝 날은 기간이 있을 때만</span>
        </>
      }
      validate={() =>
        !postDate
          ? '게시 예정일을 입력해 주세요.'
          : endDate && endDate < postDate
            ? '노출 끝 날은 게시 예정일과 같거나 뒤여야 해요.'
            : null
      }
      onSave={() => onSave({ postDate, endDate: endDate || null })}
    />
  );
}

/** 채널 광고의 게시 확인 주소 칸(인스타그램 게시물 주소, 오픈채팅 확인 링크). 비우면 지운다. */
export function InlinePostUrlCell({
  name,
  label,
  placeholder,
  value,
  onSave,
}: {
  name: string;
  /** 칸 이름(`게시물 주소`, `확인 링크`). */
  label: string;
  placeholder: string;
  value: string | null;
  onSave: (postUrl: string | null) => Promise<unknown>;
}) {
  const [postUrl, setPostUrl] = useState('');
  return (
    <InlineEditor
      label={`${name} ${label}`}
      onStart={() => setPostUrl(value ?? '')}
      display={
        <span className="block max-w-36 truncate text-sm text-gray-700" title={value ?? undefined}>
          {value ?? <span className="text-gray-400">없음</span>}
        </span>
      }
      editor={
        <Input
          aria-label={label}
          value={postUrl}
          autoFocus
          placeholder={placeholder}
          onChange={(event) => setPostUrl(event.target.value)}
        />
      }
      validate={() =>
        !postUrl.trim() || /^https?:\/\/\S+$/.test(postUrl.trim())
          ? null
          : 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.'
      }
      onSave={() => onSave(postUrl.trim() || null)}
    />
  );
}
