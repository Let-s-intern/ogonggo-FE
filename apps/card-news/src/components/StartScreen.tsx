'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@ogonggo/ui';
import { blankDocument, newDocumentId } from '@/lib/card/document';
import { CARD_SIZE_IDS, CARD_SIZES, type CardSizeId, type VariantId } from '@/lib/card/types';
import { type DocumentEntry, listDocuments, saveDocument } from '@/lib/client/storage';
import { FALLBACK_COLOR, defaultSettings } from '@/lib/client/theme';
import { useCardEditor } from '@/lib/client/useCardEditor';
import { JobPicker } from './JobPicker';
import { VariantPicker } from './VariantPicker';

type StartTab = 'single' | 'blank';

const TABS: { id: StartTab; label: string }[] = [
  { id: 'single', label: '공고 하나' },
  { id: 'blank', label: '빈 캔버스' },
];

/** 저장 시각을 `11월 2일 14:05` 로. */
function savedLabel(savedAt: string): string {
  const date = new Date(savedAt);
  return Number.isNaN(date.getTime())
    ? ''
    : `${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** 이 브라우저에 남은 문서. 저장 시각이 늦은 것부터. */
function RecentDocuments() {
  // 저장소는 브라우저에만 있다. 서버 렌더와 맞추려고 그린 뒤에 읽는다.
  const [entries, setEntries] = useState<DocumentEntry[] | null>(null);
  useEffect(() => setEntries(listDocuments()), []);

  if (!entries?.length) {
    return null;
  }
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold">최근 작업 이어하기</h2>
      <ul className="flex flex-col">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/edit/${encodeURIComponent(entry.id)}`}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
            >
              <span className="truncate font-semibold">{entry.title}</span>
              <span className="shrink-0 text-xs text-gray-400">{savedLabel(entry.savedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 공고 하나 탭. 공고를 고르면 초안을 쓰고(남은 편집본이 있으면 그것을 열고) 시안 열 개를 보인다.
 * 시안을 고르면 그 시안으로 편집 화면을 연다.
 */
function SingleTab() {
  const router = useRouter();
  const editor = useCardEditor();
  const { loaded, status, notice, specs } = editor;

  const pick = (variant: VariantId) => {
    if (!loaded) {
      return;
    }
    // 고른 시안을 편집 화면이 읽도록 바로 남긴다. 상태도 같이 바꿔 늦게 오는 썸네일 저장이 덮지 않게.
    editor.setVariant(variant);
    saveDocument({ ...loaded.doc, variant });
    router.push(`/edit/${encodeURIComponent(loaded.doc.id)}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
      <JobPicker selectedId={loaded?.job?.id} onSelect={(jobId) => void editor.selectJob(jobId)} />
      <div className="flex flex-col gap-3">
        {status.kind === 'loading' ? (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{status.message}</p>
        ) : null}
        {status.kind === 'error' ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error">{status.message}</p>
        ) : null}
        {notice ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>
        ) : null}
        {loaded?.job && specs ? (
          <>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{loaded.job.companyName}</span>{' '}
              {loaded.job.title}
            </p>
            <VariantPicker specs={specs} current={null} onPick={pick} />
          </>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">
            왼쪽에서 공고를 고르면 시안이 여기에 그려집니다.
          </div>
        )}
      </div>
    </div>
  );
}

/** 빈 캔버스 탭. 크기만 고르고 빈 장 하나로 편집 화면을 연다. */
function BlankTab() {
  const router = useRouter();
  const [size, setSize] = useState<CardSizeId>('post');

  const start = () => {
    const doc = blankDocument(newDocumentId('blank'), defaultSettings(FALLBACK_COLOR), size);
    saveDocument(doc);
    router.push(`/edit/${encodeURIComponent(doc.id)}`);
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold">크기 고르기</h2>
      <div className="flex flex-wrap gap-2">
        {CARD_SIZE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSize(id)}
            aria-pressed={size === id}
            className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left ${
              size === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <span className="text-sm font-bold">{CARD_SIZES[id].label}</span>
            <span className="text-xs text-gray-500">
              {CARD_SIZES[id].width}×{CARD_SIZES[id].height}
            </span>
          </button>
        ))}
      </div>
      <div>
        <Button size="sm" onClick={start}>
          빈 캔버스로 시작하기
        </Button>
      </div>
    </section>
  );
}

/**
 * 시작 화면(`/`). 공고 하나, 빈 캔버스 중 하나로 시작해 편집 화면으로 들어간다. 남은 문서는
 * `최근 작업 이어하기` 에서 다시 연다.
 */
export function StartScreen() {
  const [tab, setTab] = useState<StartTab>('single');

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">오공고 카드뉴스</h1>
          <p className="text-sm text-gray-500">
            공고를 고르면 AI가 초안을 쓰고 시안 열 개를 보여 줍니다. 하나를 골라 편집 화면에서
            고친 뒤 원하는 장만 받습니다.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => void logout()}>
          로그아웃
        </Button>
      </header>
      <RecentDocuments />
      <div className="flex gap-1 self-start rounded-lg bg-gray-100 p-1" role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              tab === id ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'single' ? <SingleTab /> : null}
      {tab === 'blank' ? <BlankTab /> : null}
    </main>
  );
}
