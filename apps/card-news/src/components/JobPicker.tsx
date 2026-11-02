'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Button, Input } from '@ogonggo/ui';
import { deadlineText } from '@/lib/card/fromJob';
import type { JobListItem } from '@/lib/server/ogonggo';

interface JobPickerProps {
  selectedId?: number;
  /** 목록에서 고르면 `job` 도 준다. 링크로 열면 번호만 안다. */
  onSelect?: (jobId: number, job?: JobListItem) => void;
  /**
   * 여러 개 고르기. 주면 누를 때마다 고르고 빼며, 고른 순서대로 번호를 단다. `max` 개를 고르면 더
   * 고르지 못한다. 필터 알약과 `같은 회사 공고 모두` 를 같이 그린다.
   */
  multiple?: { picked: JobListItem[]; onChange: (jobs: JobListItem[]) => void; max: number };
}

type Source = { kind: 'today' } | { kind: 'search'; keyword: string };

/** 목록을 좁히는 알약. `신입` 은 공개 공고 API 의 경력 구분으로, `이번 주 마감` 은 받은 목록에서 거른다. */
interface Filters {
  newcomer: boolean;
  thisWeek: boolean;
}

/**
 * 이번 주 안에 마감하는가. 지금부터 이번 주 일요일 23:59 까지 마감 일시가 있는 공고다. 상시 채용은
 * 아니다.
 */
export function endsThisWeek(
  job: Pick<JobListItem, 'recruitmentType' | 'recruitmentEndAt'>,
  now = new Date(),
): boolean {
  if (job.recruitmentType === 'ALWAYS_OPEN' || !job.recruitmentEndAt) {
    return false;
  }
  const end = new Date(job.recruitmentEndAt);
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  sunday.setHours(23, 59, 59, 999);
  return end >= now && end <= sunday;
}

/**
 * 목록 주소. 필터 없는 처음 목록만 오늘의 공고이고, `신입` 을 고르면 오늘의 공고 대신 공개 공고에서
 * 신입 공고를 받는다. `이번 주 마감` 은 받은 뒤 거르므로 한 번에 100개를 받는다.
 */
function listUrl(source: Source, filters: Filters): string {
  const params = new URLSearchParams();
  if (source.kind === 'today' && !filters.newcomer) {
    params.set('today', '1');
  } else {
    if (source.kind === 'search') {
      params.set('keyword', source.keyword);
    }
    if (filters.newcomer) {
      params.set('experienceType', 'NEWCOMER');
    }
    if (filters.thisWeek) {
      params.set('size', '100');
    }
  }
  return `/api/jobs?${params}`;
}

async function fetchList(url: string, signal?: AbortSignal): Promise<JobListItem[]> {
  const response = await fetch(url, { signal });
  const body = (await response.json()) as { items?: JobListItem[]; message?: string };
  if (!response.ok) {
    throw new Error(body.message ?? '공고를 불러오지 못했습니다.');
  }
  return body.items ?? [];
}

/**
 * 오공고 공고 링크(`https://ogonggo.co.kr/jobs/5364`, 미리보기 `preview.ogonggo.co.kr`)에서 공고
 * 번호를 꺼낸다. 오공고 링크가 아니면 `null`.
 */
export function jobIdFromLink(link: string): number | null {
  let url: URL;
  try {
    url = new URL(link.trim().replace(/^(?!https?:\/\/)/, 'https://'));
  } catch {
    return null;
  }
  if (!/(^|\.)ogonggo\.co\.kr$/.test(url.hostname)) {
    return null;
  }
  const match = /\/jobs\/(\d+)(?:\/|$)/.exec(url.pathname);
  return match ? Number(match[1]) : null;
}

/**
 * 공고 고르기. 처음에는 오늘의 공고를 보이고, 검색하면 공개 공고에서 찾는다. 하나 고르기는 오공고
 * 링크로도 연다. 여러 개 고르기(`multiple`)는 고른 순서가 묶음의 장 순서다.
 */
export function JobPicker({ selectedId, onSelect, multiple }: JobPickerProps) {
  const [source, setSource] = useState<Source>({ kind: 'today' });
  const [keyword, setKeyword] = useState('');
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [items, setItems] = useState<JobListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newcomer, setNewcomer] = useState(false);
  const [thisWeek, setThisWeek] = useState(false);
  const url = listUrl(source, { newcomer, thisWeek });

  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setError(null);
    fetchList(url, controller.signal)
      .then(setItems)
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : '공고를 불러오지 못했습니다.');
        }
      });
    return () => controller.abort();
  }, [url]);

  const visible = thisWeek ? items?.filter((job) => endsThisWeek(job)) : items;
  const full = multiple ? multiple.picked.length >= multiple.max : false;

  const toggle = (job: JobListItem) => {
    if (!multiple) {
      onSelect?.(job.id, job);
      return;
    }
    const { picked, onChange } = multiple;
    if (picked.some((item) => item.id === job.id)) {
      onChange(picked.filter((item) => item.id !== job.id));
    } else if (!full) {
      onChange([...picked, job]);
    }
  };

  /**
   * 마지막으로 고른 공고의 회사명으로 검색해, 회사명이 같은 공고를 목록 순서대로 더 고른다. 켜 둔
   * 필터를 같이 적용하고 상한에서 멈춘다.
   */
  const pickSameCompany = async () => {
    const last = multiple?.picked.at(-1);
    if (!multiple || !last) {
      return;
    }
    const next: Source = { kind: 'search', keyword: last.companyName };
    setKeyword(last.companyName);
    setSource(next);
    try {
      const found = await fetchList(listUrl(next, { newcomer, thisWeek }));
      const more = found.filter(
        (job) =>
          job.companyName === last.companyName &&
          (!thisWeek || endsThisWeek(job)) &&
          !multiple.picked.some((item) => item.id === job.id),
      );
      multiple.onChange([...multiple.picked, ...more].slice(0, multiple.max));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '공고를 불러오지 못했습니다.');
    }
  };

  const search = (event: FormEvent) => {
    event.preventDefault();
    setSource(keyword.trim() ? { kind: 'search', keyword: keyword.trim() } : { kind: 'today' });
  };

  const openByLink = (event: FormEvent) => {
    event.preventDefault();
    const jobId = jobIdFromLink(link);
    if (jobId) {
      setLinkError(null);
      onSelect?.(jobId);
    } else {
      setLinkError('오공고 공고 링크(ogonggo.co.kr/jobs/번호)를 넣어 주세요.');
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">{multiple ? '공고 여러 개 고르기' : '공고 고르기'}</h2>
        {multiple ? (
          <span className="text-xs text-gray-500">
            {multiple.picked.length}/{multiple.max}개
          </span>
        ) : null}
      </div>
      <form onSubmit={search} className="flex gap-2">
        <Input
          aria-label="공고 검색"
          placeholder="회사명·공고 제목으로 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Button type="submit" size="sm" className="h-11 shrink-0">
          검색
        </Button>
      </form>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className={`text-sm font-semibold ${source.kind === 'today' ? 'text-blue-500' : 'text-gray-500'}`}
          onClick={() => {
            setKeyword('');
            setSource({ kind: 'today' });
          }}
        >
          오늘의 공고 보기
        </button>
      </div>
      {multiple ? (
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['신입', newcomer, setNewcomer],
              ['이번 주 마감', thisWeek, setThisWeek],
            ] as const
          ).map(([label, on, set]) => (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => set(!on)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                on ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
            disabled={multiple.picked.length === 0 || full}
            onClick={() => void pickSameCompany()}
          >
            같은 회사 공고 모두
          </Button>
        </div>
      ) : (
        <form onSubmit={openByLink} className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Input
              aria-label="오공고 링크"
              placeholder="오공고 공고 링크 붙여넣기"
              inputMode="url"
              className="h-9 text-sm"
              value={link}
              onChange={(event) => {
                setLink(event.target.value);
                setLinkError(null);
              }}
            />
            <Button type="submit" size="sm" variant="secondary" className="shrink-0">
              링크로 열기
            </Button>
          </div>
          {linkError ? <p className="text-xs text-error">{linkError}</p> : null}
        </form>
      )}
      <ul className="flex max-h-80 flex-col overflow-y-auto">
        {error ? <li className="py-3 text-sm text-error">{error}</li> : null}
        {!error && items === null ? (
          <li className="py-3 text-sm text-gray-500">불러오는 중</li>
        ) : null}
        {visible?.length === 0 ? (
          <li className="py-3 text-sm text-gray-500">
            {source.kind === 'today' && !newcomer && !thisWeek
              ? '오늘의 공고가 아직 없어요. 검색해서 골라 주세요.'
              : '찾은 공고가 없어요.'}
          </li>
        ) : null}
        {visible?.map((job) => {
          const order = multiple?.picked.findIndex((item) => item.id === job.id) ?? -1;
          const on = multiple ? order >= 0 : selectedId === job.id;
          return (
            <li key={job.id}>
              <button
                type="button"
                onClick={() => toggle(job)}
                aria-pressed={multiple ? on : undefined}
                disabled={multiple ? !on && full : false}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 ${
                  on ? 'bg-blue-50 ring-1 ring-blue-400' : ''
                }`}
              >
                {multiple ? (
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      on ? 'bg-blue-500 text-white' : 'border border-gray-300'
                    }`}
                  >
                    {on ? order + 1 : ''}
                  </span>
                ) : null}
                {job.logoUrl ? (
                  <img
                    src={job.logoUrl}
                    alt=""
                    className="size-9 shrink-0 rounded-md object-contain"
                  />
                ) : (
                  <span className="size-9 shrink-0 rounded-md bg-gray-100" />
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{job.companyName}</span>
                  <span className="truncate text-xs text-gray-600">{job.title}</span>
                  <span className="text-xs text-gray-400">{deadlineText(job)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
