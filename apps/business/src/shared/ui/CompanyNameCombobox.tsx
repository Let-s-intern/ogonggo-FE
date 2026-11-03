'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { type SuccessResponseListString, listPublicCompanyNames } from '@ogonggo/api';
import { Input, cn } from '@ogonggo/ui';

const DEBOUNCE_MS = 250;
const MAX_CANDIDATES = 10;

/** 후보에서 골랐으면 `SEARCH`, 직접 쳤으면 `MANUAL`. 광고 문의의 `companyNameSource` 와 같은 값이다. */
export type CompanyNameComboboxSource = 'SEARCH' | 'MANUAL';

export interface CompanyNameComboboxProps {
  /** 입력칸 id. 감싸는 칸(`Field`·`SignUpField`)의 라벨이 이것을 가리킨다. */
  id: string;
  value: string;
  onChange: (value: string, source: CompanyNameComboboxSource) => void;
  maxLength: number;
  placeholder?: string;
  className?: string;
  /** 감싸는 칸의 오류 상태와 문구 id. */
  invalid?: boolean;
  describedBy?: string;
}

/**
 * 회사명 검색 콤보박스. 오공고에 이미 있는 회사명(채용공고·부트캠프·기업 회원, 마감 포함)을 검색해 고르게 권한다.
 * 같은 회사가 `(주)고위드`·`고위드`·`Gowid` 로 흩어지지 않게 하려는 것이고, 강제하지는 않는다.
 * `/biz` 신청서와 기업 회원가입이 함께 쓴다. 라벨·안내·오류 문구는 감싸는 칸이 그린다 — 두 화면의 칸 모양이 다르다.
 *
 * - 입력하면 250ms 뒤 `GET /api/v1/company-names` 로 후보를 최대 10개 띄운다. 1글자부터다.
 * - 목록 맨 아래에는 늘 `"<입력값>" 직접 입력하기` 가 있다. 결과가 0건이면 이 줄만 보인다.
 * - 후보를 고르면 입력 방식이 `SEARCH`, 글자를 고치면 `MANUAL` 이다. 고르지 않고 넘어가도 막지 않는다.
 * - 검색이 실패하면 목록 없이 일반 입력칸처럼 동작한다. 신청을 막지 않는다.
 *
 * 키보드: 아래·위 화살표로 옮기고 엔터로 고른다. Esc 는 목록을 닫는다. WAI-ARIA 콤보박스(목록 팝업) 모양이다 —
 * 초점은 입력칸에 두고 `aria-activedescendant` 로 고른 줄을 알린다.
 */
export function CompanyNameCombobox({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  className,
  invalid,
  describedBy,
}: CompanyNameComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  /** 강조된 줄. 후보 다음 마지막 줄(`length`)이 `직접 입력하기` 다. -1 은 아무 줄도 아님. */
  const [activeIndex, setActiveIndex] = useState(-1);
  /** 늦게 온 응답이 새 검색 결과를 덮지 않게 마지막 요청 번호를 둔다. */
  const requestSeq = useRef(0);

  const keyword = value.trim();

  useEffect(() => {
    if (!open || keyword === '') {
      return;
    }
    const seq = ++requestSeq.current;
    const timer = window.setTimeout(() => {
      (listPublicCompanyNames({ keyword }) as unknown as Promise<SuccessResponseListString>)
        .then((body) => {
          if (seq !== requestSeq.current) return;
          setCandidates((body.data ?? []).slice(0, MAX_CANDIDATES));
          setFailed(false);
        })
        .catch(() => {
          if (seq !== requestSeq.current) return;
          setCandidates([]);
          setFailed(true);
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [keyword, open]);

  const showList = open && keyword !== '' && !failed;
  const rowCount = candidates.length + 1;

  const choose = (index: number) => {
    const name = candidates[index];
    if (name !== undefined) {
      onChange(name, 'SEARCH');
    } else {
      onChange(value, 'MANUAL');
    }
    setOpen(false);
    setActiveIndex(-1);
  };

  const optionId = (index: number) => `${listId}-option-${index}`;

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value, 'MANUAL');
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (keyword !== '') setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => (current + 1) % rowCount);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => (current <= 0 ? rowCount - 1 : current - 1));
          } else if (event.key === 'Enter' && showList && activeIndex >= 0) {
            // 목록에서 고르는 엔터는 폼 제출이 아니다.
            event.preventDefault();
            choose(activeIndex);
          } else if (event.key === 'Escape' && showList) {
            event.preventDefault();
            setOpen(false);
          }
        }}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="회사명 후보"
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {candidates.map((name, index) => (
            <li
              key={name}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              // 입력칸의 `blur` 가 목록을 닫기 전에 고르도록 누르는 순간 초점이 옮겨 가지 않게 한다.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              className={cn(
                'cursor-pointer px-4 py-2.5 text-[15px] text-gray-900',
                index === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50',
              )}
            >
              {name}
            </li>
          ))}
          <li
            id={optionId(candidates.length)}
            role="option"
            aria-selected={activeIndex === candidates.length}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(candidates.length)}
            className={cn(
              'cursor-pointer px-4 py-2.5 text-sm text-gray-500',
              candidates.length > 0 && 'border-t border-gray-100',
              activeIndex === candidates.length ? 'bg-blue-50' : 'hover:bg-gray-50',
            )}
          >
            &ldquo;{value.trim()}&rdquo; 직접 입력하기
          </li>
        </ul>
      ) : null}
    </div>
  );
}
