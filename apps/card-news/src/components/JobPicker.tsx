'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Button, Input } from '@ogonggo/ui';
import { deadlineText } from '@/lib/card/fromJob';
import type { JobListItem } from '@/lib/server/ogonggo';

interface JobPickerProps {
  selectedId?: number;
  onSelect: (jobId: number) => void;
}

type Source = { kind: 'today' } | { kind: 'search'; keyword: string };

/** 공고 고르기. 처음에는 오늘의 공고를 보이고, 검색하면 공개 공고에서 찾는다. 번호로도 연다. */
export function JobPicker({ selectedId, onSelect }: JobPickerProps) {
  const [source, setSource] = useState<Source>({ kind: 'today' });
  const [keyword, setKeyword] = useState('');
  const [jobIdInput, setJobIdInput] = useState('');
  const [items, setItems] = useState<JobListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const query =
      source.kind === 'today' ? 'today=1' : `keyword=${encodeURIComponent(source.keyword)}`;
    setItems(null);
    setError(null);
    fetch(`/api/jobs?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as { items?: JobListItem[]; message?: string };
        if (!response.ok) {
          throw new Error(body.message ?? '공고를 불러오지 못했습니다.');
        }
        setItems(body.items ?? []);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : '공고를 불러오지 못했습니다.');
        }
      });
    return () => controller.abort();
  }, [source]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setSource(keyword.trim() ? { kind: 'search', keyword: keyword.trim() } : { kind: 'today' });
  };

  const openById = (event: FormEvent) => {
    event.preventDefault();
    const jobId = Number(jobIdInput);
    if (Number.isInteger(jobId) && jobId > 0) {
      onSelect(jobId);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold">공고 고르기</h2>
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
        <form onSubmit={openById} className="flex items-center gap-1">
          <Input
            aria-label="공고 번호"
            placeholder="공고 번호"
            inputMode="numeric"
            className="h-9 w-28 text-sm"
            value={jobIdInput}
            onChange={(event) => setJobIdInput(event.target.value.replace(/\D/g, ''))}
          />
          <Button type="submit" size="sm" variant="secondary">
            열기
          </Button>
        </form>
      </div>
      <ul className="flex max-h-80 flex-col overflow-y-auto">
        {error ? <li className="py-3 text-sm text-error">{error}</li> : null}
        {!error && items === null ? (
          <li className="py-3 text-sm text-gray-500">불러오는 중</li>
        ) : null}
        {items?.length === 0 ? (
          <li className="py-3 text-sm text-gray-500">
            {source.kind === 'today'
              ? '오늘의 공고가 아직 없어요. 검색해서 골라 주세요.'
              : '찾은 공고가 없어요.'}
          </li>
        ) : null}
        {items?.map((job) => (
          <li key={job.id}>
            <button
              type="button"
              onClick={() => onSelect(job.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 ${
                selectedId === job.id ? 'bg-blue-50' : ''
              }`}
            >
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
        ))}
      </ul>
    </section>
  );
}
