'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@ogonggo/ui';
import { useScrollLock } from '@/shared/lib/useScrollLock';
import {
  addChip,
  chipLabel,
  chipToToken,
  chipsToFilters,
  companyStartsWith,
  parentOf,
  completionsFor,
  filtersToChips,
  parseQuery,
  startsWithToken,
  type SearchChip,
  type SearchField,
  type SearchFilters,
} from '../model/parse';
import { clearRecent, pushRecent, readRecent } from '../model/recent';
import { fetchSuggestions, type SearchScope, type SearchSuggestions } from '../model/suggest';

const DEBOUNCE_MS = 250;
const MAX_LENGTH = 100;
/** 목록 검색어는 2글자부터다. 한 글자로 검색하면 목록이 검색어 없이 열린다(`widgets/job-list/lib/query.ts`). */
const SEARCH_MIN_LENGTH = 2;
const MAX_COMPLETIONS = 5;

/**
 * 회사 칩. 백엔드에 회사 필터가 따로 없어서 검색어 자리에 들어간다(`keyword` 는 제목이나 회사명에 든 것을 찾는다).
 * 그래서 다른 검색어와 함께 쓰지 못한다 — 회사 칩을 넣으면 친 검색어가 빠지고, 두 글자 이상 검색어를 새로 치면
 * 그 검색어가 회사 칩을 대신한다.
 */
const COMPANY_FIELD: SearchField = {
  key: 'company',
  label: '회사',
  options: [],
  single: true,
  freeform: true,
};

const PLACEHOLDER: Record<SearchScope, string> = {
  jobs: '공고 검색',
  bootcamps: '부트캠프 검색',
};

const DIALOG_PLACEHOLDER: Record<SearchScope, string> = {
  jobs: '검색어를 치고 Tab 으로 필터·회사를 넣어요',
  bootcamps: '부트캠프 검색',
};

const ITEM_HEADING: Record<SearchScope, string> = {
  jobs: '공고',
  bootcamps: '부트캠프',
};

/** 모달이 고른 결과. 칩이 없는 목록(부트캠프)은 `filters` 가 빈 객체다. */
export interface SearchRequest {
  q: string | undefined;
  filters: SearchFilters;
}

export interface SearchCommandProps {
  scope: SearchScope;
  /** 지금 걸려 있는 검색어. 검색칸에 보이고, 모달을 열면 입력칸의 첫 값이다. */
  value: string | undefined;
  /** 칩으로 바꿀 수 있는 필터 항목. 없으면 칩 없이 검색어만 다룬다. */
  fields?: readonly SearchField[];
  /** 지금 걸려 있는 필터. 모달을 열면 칩으로 보인다 — 칩을 지우고 검색하면 그 필터가 풀린다. */
  filters?: SearchFilters;
  /**
   * 검색을 고른 뒤. 이걸 주지 않으면 `action` 주소에 `params` 와 `q` 를 붙여 이동한다 — 서버 컴포넌트는 함수를
   * 넘길 수 없어서 주소 재료를 넘긴다.
   */
  onSearch?: (request: SearchRequest) => void;
  /** 엔터를 치면 몇 건이 나오는지. 없으면 건수를 보이지 않는다. */
  countOf?: (request: SearchRequest) => Promise<number | undefined>;
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
 * 단축키가 없어 지금처럼 `공고 검색` 이다.
 *
 * 모달에서 친 낱말 중 필터 선택지와 같은 것은 칩이 된다(`model/parse.ts`). 칩과 남은 검색어를 합쳐 한 번에
 * 검색하고, 엔터 전에 몇 건인지 보인다(`countOf`). 치는 중인 낱말에 맞는 선택지, 연관 회사명, 일치하는
 * 공고(부트캠프), 최근 검색을 함께 띄운다. 쓰는 법은 입력칸 옆 `?` 의 툴팁과 빈 모달에 있다.
 *
 * 한 화면에 검색칸이 둘일 수 있다 — 채용공고 목록은 lg 이상의 왼쪽 필터와 그 아래 크기의 검색 줄이 둘 다
 * 그려지고 CSS 로 하나만 보인다. 단축키는 보이는 쪽만 받는다(`offsetParent`). 둘 다 받으면 모달이 두 개 뜬다.
 *
 * 모달은 네이티브 `<dialog>` 의 `showModal()` 이다. 초점 가둠을 브라우저가 한다(`@ogonggo/ui` 의 `Modal` 과
 * 같은 이유). 그 `Modal` 을 쓰지 않는 것은 제목 줄과 안쪽 여백이 고정이라 검색 모달 모양이 안 나와서다.
 */
export function SearchCommand({
  scope,
  value,
  fields = [],
  filters,
  onSearch,
  countOf,
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

  const search = (request: SearchRequest) => {
    setOpen(false);
    if (onSearch) {
      onSearch(request);
      return;
    }
    const next = new URLSearchParams(params.filter(([name]) => name !== 'page' && name !== 'q'));
    if (request.q) next.set('q', request.q);
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
          fields={fields}
          initialText={value ?? ''}
          initialChips={filtersToChips(fields, filters)}
          countOf={countOf}
          onClose={() => setOpen(false)}
          onSearch={search}
          onGo={go}
        />
      ) : null}
    </>
  );
}

type Row =
  | { kind: 'search' }
  | { kind: 'filter'; chip: SearchChip }
  | { kind: 'recent'; entry: string }
  | { kind: 'company'; name: string }
  | { kind: 'item'; title: string; companyName: string; href: string };

const HEADINGS: Partial<Record<Row['kind'], string>> = {
  filter: '필터',
  recent: '최근 검색',
  company: '회사',
};

function SearchDialog({
  scope,
  fields: filterFields,
  initialText,
  initialChips,
  countOf,
  onClose,
  onSearch,
  onGo,
}: {
  scope: SearchScope;
  fields: readonly SearchField[];
  initialText: string;
  initialChips: SearchChip[];
  countOf: SearchCommandProps['countOf'];
  onClose: () => void;
  onSearch: (request: SearchRequest) => void;
  onGo: (href: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  /** 칩으로 다루는 모든 항목. 회사는 필터가 아니라 `chipsToFilters` 에는 `filterFields` 만 쓴다. */
  const fields = [...filterFields, COMPANY_FIELD];
  const [text, setText] = useState(initialText);
  const [chips, setChips] = useState<SearchChip[]>(initialChips);
  /** `keyword` 는 이 추천을 받아 온 검색어다. 치는 동안 앞 글자의 추천이 남아 있어도 Tab 이 그것을 쓰지 않게 한다. */
  const [suggestions, setSuggestions] = useState<SearchSuggestions & { keyword: string }>({
    companies: [],
    items: [],
    keyword: '',
  });
  const [count, setCount] = useState<number | undefined>();
  const [recent, setRecent] = useState<string[]>([]);
  /** 강조된 줄. -1 은 아무 줄도 아니다 — 엔터가 친 글로 검색한다. */
  const [active, setActive] = useState(-1);
  /** 늦게 온 응답이 새 결과를 덮지 않게 마지막 요청 번호를 둔다. */
  const requestSeq = useRef(0);
  const countSeq = useRef(0);
  const composingRef = useRef(false);
  /** 한글 조합 중에 누른 Tab 이 넣을 칩. 조합이 끝나면 넣는다. */
  const pendingTabRef = useRef<SearchChip | null>(null);
  useScrollLock(true);

  useEffect(() => {
    dialogRef.current?.showModal();
    // `showModal()` 은 모달 안의 첫 버튼에 초점을 둔다. 필터가 걸린 채 열면 그게 첫 칩의 빼기 버튼이라 Backspace 가
    // 입력칸에 닿지 않는다. 열자마자 입력칸으로 옮긴다.
    inputRef.current?.focus();
    setRecent(readRecent(scope));
  }, [scope]);

  // 치는 중인 마지막 낱말은 아직 칩으로 바꾸지 않는다. 엔터를 치면 그것까지 읽는다.
  const tokens = text.split(/\s+/);
  const lastToken = tokens.at(-1) ?? '';
  const parsed = parseQuery(fields, text, chips);
  const keyword = parsed.words.join(' ').trim();
  const { request, shownChips } = resolve(parsed.chips, parsed.words);
  const requestKey = JSON.stringify(request);

  // 연관 회사·공고는 칩을 뺀 검색어로 찾는다. "서울 인턴 삼성" 이면 "삼성" 이다.
  useEffect(() => {
    const seq = ++requestSeq.current;
    if (keyword === '') {
      setSuggestions({ companies: [], items: [], keyword: '' });
      return;
    }
    const timer = window.setTimeout(() => {
      fetchSuggestions(scope, keyword).then((next) => {
        if (seq === requestSeq.current) setSuggestions({ ...next, keyword });
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [scope, keyword]);

  // 부르는 쪽이 렌더마다 새 함수를 넘겨도 다시 세지 않게 ref 로 든다. 다시 세는 것은 검색 내용이 바뀔 때뿐이다.
  const countOfRef = useRef(countOf);
  useEffect(() => {
    countOfRef.current = countOf;
  });
  useEffect(() => {
    const seq = ++countSeq.current;
    setCount(undefined);
    const countNow = countOfRef.current;
    if (!countNow) return;
    const timer = window.setTimeout(() => {
      countNow(JSON.parse(requestKey) as SearchRequest)
        .then((next) => {
          if (seq === countSeq.current) setCount(next);
        })
        .catch(() => undefined);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [requestKey]);

  /**
   * 칩과 남은 낱말을 검색으로. 두 글자 이상 검색어가 있으면 그것이, 없으면 회사 칩이 검색어다. `shownChips` 는
   * 실제로 쓰이는 칩이다(검색어에 밀린 회사 칩은 빠진다).
   */
  function resolve(allChips: readonly SearchChip[], words: readonly string[]) {
    const typed = words.join(' ').trim();
    const company = allChips.find((chip) => chip.field === COMPANY_FIELD.key);
    const filterChips = allChips.filter((chip) => chip.field !== COMPANY_FIELD.key);
    const useCompany = company !== undefined && typed.length < SEARCH_MIN_LENGTH;
    return {
      request: {
        q: typed.length >= SEARCH_MIN_LENGTH ? typed : useCompany ? company.value : undefined,
        filters: chipsToFilters(filterFields, filterChips),
      },
      shownChips: useCompany ? [...filterChips, company] : filterChips,
    };
  }

  // 이미 고른 칩, 이미 통째로 고른 직군의 직무는 후보에서 뺀다. 치는 중인 낱말이 맞힌 칩(`parsed.chips` 의 끝)은
  // 아직 고른 것이 아니다 — 그것까지 빼면 `마케팅` 을 다 쳤을 때 그 직군과 직무가 후보에서 사라진다.
  const picked = (chip: SearchChip | undefined) =>
    chip !== undefined &&
    chips.some((item) => item.field === chip.field && item.value === chip.value);
  const completions = completionsFor(fields, lastToken, MAX_COMPLETIONS).filter(
    (chip) => !picked(chip) && !picked(parentOf(fields, chip)),
  );
  const empty = text.trim() === '' && chips.length === 0;
  const canSearch = shownChips.length > 0 || request.q !== undefined;

  const rows: Row[] = [
    ...(canSearch ? [{ kind: 'search' } as Row] : []),
    ...completions.map((chip): Row => ({ kind: 'filter', chip })),
    ...(text.trim() === '' ? recent.map((entry): Row => ({ kind: 'recent', entry })) : []),
    ...(keyword === ''
      ? []
      : suggestions.companies.map((name): Row => ({ kind: 'company', name }))),
    ...(keyword === ''
      ? []
      : suggestions.items.map((item): Row => ({
          kind: 'item',
          title: item.title,
          companyName: item.companyName,
          href: item.href,
        }))),
  ];

  const finish = (next: SearchRequest, entryChips: readonly SearchChip[]) => {
    const fromCompany = entryChips.some((chip) => chip.field === COMPANY_FIELD.key);
    const entry = [
      ...entryChips.map((chip) => chipToToken(fields, chip)),
      ...(next.q && !fromCompany ? [next.q] : []),
    ].join(' ');
    pushRecent(scope, entry);
    onSearch(next);
  };

  /** 치는 중인 낱말을 그 칩으로 바꾼다. */
  const applyCompletion = (chip: SearchChip) => {
    // 앞의 낱말은 그대로 두고 치는 중인 낱말만 칩으로 바꾼다. 앞에 남은 낱말은 다음 띄어쓰기 때처럼 엔터에서 읽힌다.
    setChips(addChip(fields, chips, chip));
    setText(text.slice(0, text.length - lastToken.length));
    setActive(-1);
    inputRef.current?.focus();
  };

  /** 회사를 칩으로. 회사가 검색어 자리를 쓰므로 친 낱말은 비운다. */
  const applyCompany = (name: string) => {
    setChips(addChip(fields, parsed.chips, { field: COMPANY_FIELD.key, value: name }));
    setText('');
    setActive(-1);
    inputRef.current?.focus();
  };

  const choose = (row: Row) => {
    if (row.kind === 'search') finish(request, shownChips);
    else if (row.kind === 'filter') applyCompletion(row.chip);
    else if (row.kind === 'recent') {
      const again = parseQuery(fields, row.entry);
      const resolved = resolve(again.chips, again.words);
      finish(resolved.request, resolved.shownChips);
    } else if (row.kind === 'company') {
      finish(
        { q: row.name, filters: request.filters },
        shownChips.filter((chip) => chip.field !== COMPANY_FIELD.key),
      );
    } else onGo(row.href);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const row = rows[active];
    if (row) choose(row);
    // 다 비우고 엔터면 검색과 필터를 푼다. 한 글자는 검색이 안 되므로 모달을 그대로 둔다.
    else if (canSearch || empty) finish(request, shownChips);
  };

  // 띄어쓰기는 그냥 띄어쓰기다. 칩은 Tab 으로만 넣는다.
  const onChange = (next: string) => {
    setText(next);
    setActive(-1);
  };

  /**
   * Tab 이 넣을 칩. 아래 추천에서 필터나 회사 줄을 골랐으면 그것이다. 아무 줄도 안 골랐으면 이름이 치는 중인 낱말로
   * **시작하는** 첫 필터, 그것도 없으면 이름이 검색어로 시작하는 회사다(지금 검색어로 받아 온 추천일 때만). 글자가
   * 가운데 들어 있기만 한 후보는 스스로 넣지 않는다 — `내일` 에 `미래내일 일경험` 이 들어가면 안 된다. 입력칸 바로
   * 아래 줄이 이것을 미리 보인다.
   */
  const freshCompany =
    suggestions.keyword === keyword
      ? suggestions.companies.find((name) => companyStartsWith(name, keyword))
      : undefined;
  const autoCompany: SearchChip | undefined = freshCompany
    ? { field: COMPANY_FIELD.key, value: freshCompany }
    : undefined;
  const activeRow = rows[active];
  const tabTarget: SearchChip | undefined =
    activeRow?.kind === 'filter'
      ? activeRow.chip
      : activeRow?.kind === 'company'
        ? { field: COMPANY_FIELD.key, value: activeRow.name }
        : activeRow
          ? undefined
          : (completions.find((chip) => startsWithToken(fields, chip, lastToken)) ?? autoCompany);
  const applyTab = (chip: SearchChip) => {
    if (chip.field === COMPANY_FIELD.key) applyCompany(chip.value);
    else applyCompletion(chip);
  };
  // 조합이 끝난 뒤(`compositionend`) 미뤄 둔 Tab 을 넣을 때, 확정된 글자로 다시 그린 최신 `applyTab` 을 쓴다.
  const applyTabRef = useRef(applyTab);
  useEffect(() => {
    applyTabRef.current = applyTab;
  });

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // `type="search"` 칸은 글자가 있으면 Esc 를 글자 지우기로 먼저 써서, 두 번 눌러야 모달이 닫힌다. 한 번에 닫는다.
    if (event.key === 'Escape') {
      event.preventDefault();
      dialogRef.current?.close();
      return;
    }
    if (event.key === 'Backspace' && text === '' && chips.length > 0) {
      event.preventDefault();
      setChips(chips.slice(0, -1));
      return;
    }
    // Tab 은 자동완성만 한다. 완성할 것이 없어도, Shift 를 눌러도 다른 버튼으로 초점을 옮기지 않는다.
    if (event.key === 'Tab') {
      event.preventDefault();
      if (!tabTarget || event.shiftKey) return;
      // 한글은 마지막 글자가 조합 중으로 남는다(치고 몇 초가 지나도 그렇다). 그대로 칸을 비우면 입력기가 그 글자를
      // 나중에 확정하면서 칸에 다시 써 넣는다(`딥` + Tab → 칩 뒤에 `딥` 이 남는다). 조합을 먼저 끝내고, 확정된 뒤에 넣는다.
      if (event.nativeEvent.isComposing || composingRef.current) {
        pendingTabRef.current = tabTarget;
        inputRef.current?.blur();
        inputRef.current?.focus();
        return;
      }
      applyTab(tabTarget);
      return;
    }
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
  const searchSummary = [
    ...shownChips
      .filter((chip) => chip.field !== COMPANY_FIELD.key)
      .map((chip) => chipLabel(fields, chip)),
    ...(request.q ? [`"${request.q}"`] : []),
  ].join(' · ');

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
      // 칩 빼기·도움말 버튼 등을 눌러 초점이 입력칸 밖에 있을 때도 Tab 은 버튼 사이를 돌지 않고 입력칸으로 돌아온다.
      onKeyDown={(event) => {
        if (event.key === 'Tab' && event.target !== inputRef.current) {
          event.preventDefault();
          inputRef.current?.focus();
        }
      }}
      className="mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] overflow-visible rounded-2xl border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-gray-950/40"
    >
      <form
        onSubmit={submit}
        className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-gray-100 px-5 py-3"
      >
        <span
          aria-hidden="true"
          className="icon-[lucide--search] block h-5 w-5 shrink-0 text-gray-400"
        />
        {chips.map((chip, index) => (
          <ChipTag
            key={`${chip.field}:${chip.value}`}
            fields={fields}
            chip={chip}
            // 두 글자 이상 검색어를 치면 회사 칩은 검색어에 밀려 쓰이지 않는다. 지우지 않고 흐리게 둔다.
            muted={
              !shownChips.some((item) => item.field === chip.field && item.value === chip.value)
            }
            onRemove={() => {
              setChips(chips.filter((_, at) => at !== index));
              inputRef.current?.focus();
            }}
          />
        ))}
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label={PLACEHOLDER[scope]}
          aria-expanded={rows.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && rows[active] ? optionId(active) : undefined}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder={chips.length > 0 ? '' : DIALOG_PLACEHOLDER[scope]}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
            const chip = pendingTabRef.current;
            if (!chip) return;
            pendingTabRef.current = null;
            // 확정된 글자가 `onChange` 로 들어와 다시 그려진 뒤에 넣는다.
            window.setTimeout(() => applyTabRef.current(chip), 0);
          }}
          className="h-8 min-w-[8rem] flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {filterFields.length > 0 ? <HelpTooltip /> : null}
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="shrink-0 rounded border border-gray-200 px-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          esc
        </button>
      </form>
      {tabTarget ? (
        // 자동완성. Tab 을 누르면 무엇이 들어가는지 입력칸 바로 아래에 보인다. 눌러도 같다.
        <button
          type="button"
          onClick={() => applyTab(tabTarget)}
          className="flex w-full items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
        >
          <kbd className="shrink-0 rounded border border-gray-300 bg-white px-1.5 font-sans text-xs text-gray-600">
            Tab
          </kbd>
          <span className="shrink-0">을 누르면</span>
          <ChipTag fields={fields} chip={tabTarget} />
          <span className="shrink-0">로 완성</span>
        </button>
      ) : null}
      <div className="max-h-[60vh] overflow-y-auto rounded-b-2xl">
        {rows.length > 0 ? (
          <ul id={listId} role="listbox" className="py-2">
            {rows.map((row, index) => (
              <li key={optionId(index)} role="presentation">
                {HEADINGS[row.kind] && rows[index - 1]?.kind !== row.kind ? (
                  <SectionHeading
                    action={
                      row.kind === 'recent' ? (
                        <button
                          type="button"
                          onClick={() => {
                            clearRecent(scope);
                            setRecent([]);
                            inputRef.current?.focus();
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          지우기
                        </button>
                      ) : null
                    }
                  >
                    {HEADINGS[row.kind] ?? ''}
                  </SectionHeading>
                ) : null}
                {row.kind === 'item' && rows[index - 1]?.kind !== 'item' ? (
                  <SectionHeading>{ITEM_HEADING[scope]}</SectionHeading>
                ) : null}
                <div
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  // 마우스는 고르지 않는다. 줄 색만 바뀌고 누르면 실행한다. 고르는 것(`active`)은 ↑↓ 뿐이다 — 마우스가
                  // 고르면 커서가 가만히 짚은 줄로 Tab·엔터가 완성돼서, 입력칸 아래 자동완성 줄과 어긋난다.
                  onClick={() => choose(row)}
                  className={cn(
                    'mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                    index === active ? 'bg-gray-100' : 'hover:bg-gray-50',
                  )}
                >
                  <RowContent row={row} fields={fields} summary={searchSummary} count={count} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {empty && filterFields.length > 0 ? (
          <HelpBody className="border-t border-gray-100 px-5 py-4" />
        ) : null}
      </div>
    </dialog>
  );
}

/** 칩 검색 쓰는 법. 빈 모달 아래와 `?` 툴팁에 같은 글을 쓴다. */
function HelpBody({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 text-xs leading-5 text-gray-500', className)}>
      <p className="font-semibold text-gray-700">이렇게 검색해 보세요</p>
      <p>
        낱말을 치다가 <span className="text-gray-800">Tab</span> 을 누르면 지역·채용
        형태·경력·직군·직무·회사로 완성돼요. 무엇으로 완성될지는 입력칸 바로 아래에 보여요.
      </p>
      <p>
        <span className="text-gray-800">↑↓</span> 로 아래 추천을 고르면 Tab 이 그것으로 완성해요.
        직군을 치면 그 직군의 직무도 함께 나와요.
      </p>
      <p>
        <span className="text-gray-800">지역: 형태: 경력: 직군: 직무: 회사:</span> 를 앞에 붙이면 그
        항목에서만 찾아요.
      </p>
      <p>
        회사는 검색어 자리에 들어가요. 두 글자 넘게 다른 검색어를 치면 회사 대신 그 검색어로 찾아요.
      </p>
      <p>Tab 완성 · Enter 검색 · Backspace 필터 빼기 · Esc 닫기</p>
    </div>
  );
}

/** 입력칸 옆 `?`. 올리거나 초점을 주면 쓰는 법이 뜬다. */
function HelpTooltip() {
  const tipId = useId();
  return (
    <span className="group relative shrink-0">
      <button
        type="button"
        aria-label="검색 도움말"
        aria-describedby={tipId}
        className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
      >
        <span aria-hidden="true" className="icon-[lucide--circle-help] block h-4.5 w-4.5" />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="invisible absolute top-full right-0 z-10 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        <HelpBody />
      </span>
    </span>
  );
}

/**
 * 필터 칩. 항목 이름(`직무`)을 작게 앞에 두고, 직무는 그 직군도 함께 보인다(`IT·개발 › 백엔드`). 입력칸의 칩은
 * 빼기 버튼이 있고, 최근 검색의 칩은 작게 보이기만 한다.
 */
function ChipTag({
  fields,
  chip,
  muted,
  onRemove,
}: {
  fields: readonly SearchField[];
  chip: SearchChip;
  muted?: boolean;
  onRemove?: () => void;
}) {
  const parent = parentOf(fields, chip);
  const label = chipLabel(fields, chip);
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full bg-blue-50 text-blue-700',
        muted && 'line-through opacity-40',
        onRemove ? 'h-7 pr-1 pl-2.5 text-sm' : 'h-6 px-2 text-xs',
      )}
    >
      <span className={cn('text-blue-400', onRemove ? 'text-xs' : 'text-[11px]')}>
        {fields.find((field) => field.key === chip.field)?.label}
      </span>
      {parent ? <span className="text-blue-500">{chipLabel(fields, parent)} ›</span> : null}
      {label}
      {onRemove ? (
        <button
          type="button"
          aria-label={`${label} 필터 빼기`}
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-full text-blue-400 hover:bg-blue-100"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

/** 최근 검색 한 줄. 무엇으로 걸었는지 보이게 칩은 태그로, 남은 낱말은 글로 그린다. */
function RecentEntry({ fields, entry }: { fields: readonly SearchField[]; entry: string }) {
  const { chips, words } = parseQuery(fields, entry);
  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <ChipTag key={`${chip.field}:${chip.value}`} fields={fields} chip={chip} />
      ))}
      {words.length > 0 ? <span className="truncate text-gray-900">{words.join(' ')}</span> : null}
    </span>
  );
}

function SectionHeading({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1">
      <p className="text-xs font-semibold text-gray-400">{children}</p>
      {action}
    </div>
  );
}

function RowContent({
  row,
  fields,
  summary,
  count,
}: {
  row: Row;
  fields: readonly SearchField[];
  summary: string;
  count: number | undefined;
}) {
  if (row.kind === 'search') {
    return (
      <>
        <span
          aria-hidden="true"
          className="icon-[lucide--search] block h-4 w-4 shrink-0 text-gray-400"
        />
        <span className="min-w-0 flex-1 truncate text-gray-900">
          <span className="font-semibold">{summary}</span> 검색
        </span>
        {count !== undefined ? (
          <span className="shrink-0 text-xs text-gray-500">{count.toLocaleString()}건</span>
        ) : null}
      </>
    );
  }
  if (row.kind === 'filter') {
    const parent = parentOf(fields, row.chip);
    return (
      <>
        <span
          aria-hidden="true"
          className={cn(
            'block h-4 w-4 shrink-0 text-gray-400',
            parent ? 'icon-[lucide--corner-down-right]' : 'icon-[lucide--sliders-horizontal]',
          )}
        />
        <span className="min-w-0 flex-1 truncate text-gray-900">
          <span className="text-gray-500">
            {fields.find((field) => field.key === row.chip.field)?.label}
          </span>{' '}
          {parent ? <span className="text-gray-500">{chipLabel(fields, parent)} › </span> : null}
          {chipLabel(fields, row.chip)}
        </span>
      </>
    );
  }
  if (row.kind === 'recent') {
    return (
      <>
        <span
          aria-hidden="true"
          className="icon-[lucide--history] block h-4 w-4 shrink-0 text-gray-400"
        />
        <RecentEntry fields={fields} entry={row.entry} />
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
        <span className="min-w-0 flex-1 truncate text-gray-900">{row.name}</span>
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
