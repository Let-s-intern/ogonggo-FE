'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@ogonggo/ui';
import { useScrollLock } from '@/shared/lib/useScrollLock';
import { fetchSuggestions, type SearchScope, type SearchSuggestions } from '../model/suggest';

const DEBOUNCE_MS = 250;
const MAX_LENGTH = 100;
/** 목록 검색어는 2글자부터다. 한 글자로 검색하면 목록이 검색어 없이 열린다(`widgets/job-list/lib/query.ts`). */
const SEARCH_MIN_LENGTH = 2;

const PLACEHOLDER: Record<SearchScope, string> = {
  jobs: '공고 검색',
  bootcamps: '부트캠프 검색',
};

const ITEM_HEADING: Record<SearchScope, string> = {
  jobs: '공고',
  bootcamps: '부트캠프',
};

export interface SearchCommandProps {
  scope: SearchScope;
  /** 지금 걸려 있는 검색어. 검색칸에 보이고, 모달을 열면 입력칸의 첫 값이다. */
  value: string | undefined;
  /**
   * 검색어를 고른 뒤. 값이 비면 `undefined` 다. 이걸 주지 않으면 `action` 주소에 `params` 와 `q` 를 붙여
   * 이동한다 — 서버 컴포넌트는 함수를 넘길 수 없어서 주소 재료를 넘긴다.
   */
  onSearch?: (q: string | undefined) => void;
  action?: string;
  /** 검색어와 함께 들고 갈 나머지 주소 쿼리(필터·정렬·탭). `page` 는 버린다 — 새 검색은 1쪽이다. */
  params?: [string, string][];
  /** 검색칸 상자의 폭. */
  className?: string;
}

/**
 * 목록의 검색칸과 ⌘K(윈도우는 Ctrl K) 검색 모달.
 *
 * 검색칸은 입력이 아니라 모달을 여는 버튼이다. PC(md 이상)는 칸 안에 단축키를 알리고, 휴대폰은 키보드
 * 단축키가 없어 지금처럼 `공고 검색` 이다. 모달에서 글자를 치면 250ms 뒤 연관 회사명과 일치하는
 * 공고(부트캠프)를 띄운다(`model/suggest.ts`). 엔터는 고른 줄을, 고른 줄이 없으면 친 글자로 목록을 검색한다.
 *
 * 한 화면에 검색칸이 둘일 수 있다 — 채용공고 목록은 lg 이상의 왼쪽 필터와 그 아래 크기의 검색 줄이 둘 다
 * 그려지고 CSS 로 하나만 보인다. 단축키는 보이는 쪽만 받는다(`offsetParent`). 둘 다 받으면 모달이 두 개 뜬다.
 *
 * 모달은 네이티브 `<dialog>` 의 `showModal()` 이다. 초점 가둠과 Esc 닫기를 브라우저가 한다(`@ogonggo/ui` 의
 * `Modal` 과 같은 이유). 그 `Modal` 을 쓰지 않는 것은 제목 줄과 안쪽 여백이 고정이라 검색 모달 모양이 안 나와서다.
 */
export function SearchCommand({
  scope,
  value,
  onSearch,
  action = '/',
  params = [],
  className,
}: SearchCommandProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  // 서버 렌더는 맥 기준이다. 맥이 아니면 마운트 뒤 바꾼다 — 렌더 중에 `navigator` 를 읽으면 하이드레이션이 어긋난다.
  const [shortcut, setShortcut] = useState('⌘K');
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.userAgent)) {
      setShortcut('Ctrl K');
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      if (triggerRef.current?.offsetParent === null) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const search = (text: string) => {
    const q = text.trim() || undefined;
    setOpen(false);
    if (onSearch) {
      onSearch(q);
      return;
    }
    const next = new URLSearchParams(params.filter(([name]) => name !== 'page' && name !== 'q'));
    if (q) next.set('q', q);
    const query = next.toString();
    router.push(query ? `${action}?${query}` : action);
  };

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-full border border-gray-200 bg-white pr-3 pl-4 text-left text-sm transition-colors hover:border-gray-400',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="icon-[lucide--search] block h-5 w-5 shrink-0 text-gray-400"
        />
        {value ? (
          <span className="min-w-0 flex-1 truncate text-gray-800">{value}</span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-gray-400">
            <span className="md:hidden">{PLACEHOLDER[scope]}</span>
            <span className="hidden md:inline">{shortcut}로 검색</span>
          </span>
        )}
        {value ? (
          <kbd className="hidden shrink-0 rounded border border-gray-200 px-1.5 font-sans text-xs text-gray-400 md:block">
            {shortcut}
          </kbd>
        ) : null}
      </button>
      {open ? (
        <SearchDialog
          scope={scope}
          initial={value ?? ''}
          onClose={() => setOpen(false)}
          onSearch={search}
          onGo={go}
        />
      ) : null}
    </>
  );
}

type Row =
  | { kind: 'search'; text: string }
  | { kind: 'company'; name: string }
  | { kind: 'item'; title: string; companyName: string; href: string };

function SearchDialog({
  scope,
  initial,
  onClose,
  onSearch,
  onGo,
}: {
  scope: SearchScope;
  initial: string;
  onClose: () => void;
  onSearch: (text: string) => void;
  onGo: (href: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [text, setText] = useState(initial);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({ companies: [], items: [] });
  /** 강조된 줄. -1 은 아무 줄도 아니다 — 엔터가 친 글자로 검색한다. */
  const [active, setActive] = useState(-1);
  /** 늦게 온 응답이 새 결과를 덮지 않게 마지막 요청 번호를 둔다. */
  const requestSeq = useRef(0);
  useScrollLock(true);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const keyword = text.trim();
  useEffect(() => {
    const seq = ++requestSeq.current;
    if (keyword === '') {
      setSuggestions({ companies: [], items: [] });
      return;
    }
    const timer = window.setTimeout(() => {
      fetchSuggestions(scope, keyword).then((next) => {
        if (seq === requestSeq.current) setSuggestions(next);
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [scope, keyword]);

  const rows: Row[] =
    keyword === ''
      ? []
      : [
          ...(keyword.length >= SEARCH_MIN_LENGTH
            ? [{ kind: 'search', text: keyword } as Row]
            : []),
          ...suggestions.companies.map((name): Row => ({ kind: 'company', name })),
          ...suggestions.items.map((item): Row => ({
            kind: 'item',
            title: item.title,
            companyName: item.companyName,
            href: item.href,
          })),
        ];

  const choose = (row: Row) => {
    if (row.kind === 'search') onSearch(row.text);
    else if (row.kind === 'company') onSearch(row.name);
    else onGo(row.href);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const row = rows[active];
    if (row) choose(row);
    // 비우고 엔터면 검색을 푼다. 한 글자는 검색이 안 되므로 모달을 그대로 둔다.
    else if (keyword === '' || keyword.length >= SEARCH_MIN_LENGTH) onSearch(keyword);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (rows.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % rows.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index <= 0 ? rows.length - 1 : index - 1));
    }
  };

  const optionId = (index: number) => `${listId}-${index}`;
  const firstCompany = keyword.length >= SEARCH_MIN_LENGTH ? 1 : 0;
  const firstItem = firstCompany + suggestions.companies.length;

  return (
    <dialog
      ref={dialogRef}
      aria-label={PLACEHOLDER[scope]}
      onClose={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      // 어두운 막을 누르면 닫는다. 막을 누른 클릭의 대상은 `<dialog>` 자신이다.
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-gray-950/40"
    >
      <form onSubmit={submit} className="flex items-center gap-3 border-b border-gray-100 px-5">
        <span
          aria-hidden="true"
          className="icon-[lucide--search] block h-5 w-5 shrink-0 text-gray-400"
        />
        <input
          // 모달이 열리면 바로 칠 수 있게 한다. `showModal()` 이 첫 초점 대상으로 이 칸을 고른다.
          autoFocus
          type="search"
          role="combobox"
          aria-label={PLACEHOLDER[scope]}
          aria-expanded={rows.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && rows[active] ? optionId(active) : undefined}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder={PLACEHOLDER[scope]}
          autoComplete="off"
          onChange={(event) => {
            setText(event.target.value);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="shrink-0 rounded border border-gray-200 px-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          esc
        </button>
      </form>
      {rows.length > 0 ? (
        <ul id={listId} role="listbox" className="max-h-[60vh] overflow-y-auto py-2">
          {rows.map((row, index) => (
            <li key={optionId(index)} role="presentation">
              {index === firstCompany && suggestions.companies.length > 0 ? (
                <SectionHeading>회사</SectionHeading>
              ) : null}
              {index === firstItem && suggestions.items.length > 0 ? (
                <SectionHeading>{ITEM_HEADING[scope]}</SectionHeading>
              ) : null}
              <div
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(row)}
                className={cn(
                  'mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                  index === active ? 'bg-gray-100' : '',
                )}
              >
                <RowContent row={row} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </dialog>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-400">{children}</p>;
}

function RowContent({ row }: { row: Row }) {
  if (row.kind === 'search') {
    return (
      <>
        <span
          aria-hidden="true"
          className="icon-[lucide--search] block h-4 w-4 shrink-0 text-gray-400"
        />
        <span className="min-w-0 truncate text-gray-900">
          <span className="font-semibold">{row.text}</span> 검색
        </span>
      </>
    );
  }
  if (row.kind === 'company') {
    return (
      <>
        <span
          aria-hidden="true"
          className="icon-[lucide--building-2] block h-4 w-4 shrink-0 text-gray-400"
        />
        <span className="min-w-0 truncate text-gray-900">{row.name}</span>
      </>
    );
  }
  return (
    <>
      <span
        aria-hidden="true"
        className="icon-[lucide--file-text] block h-4 w-4 shrink-0 text-gray-400"
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-gray-900">{row.title}</span>
        <span className="truncate text-xs text-gray-500">{row.companyName}</span>
      </span>
    </>
  );
}
