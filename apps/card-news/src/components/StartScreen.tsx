'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@ogonggo/ui';
import type { BundleDraftResult } from '@/lib/ai/draft';
import {
  MAX_BUNDLE_JOBS,
  MIN_BUNDLE_JOBS,
  blankDocument,
  bundleDocument,
  newDocumentId,
} from '@/lib/card/document';
import { contentFromDraft } from '@/lib/card/fromJob';
import { CARD_SIZE_IDS, CARD_SIZES, type CardSizeId, type VariantId } from '@/lib/card/types';
import {
  type DocumentEntry,
  listDocuments,
  rememberNotice,
  saveDocument,
} from '@/lib/client/storage';
import type { JobListItem } from '@/lib/server/ogonggo';
import { FALLBACK_COLOR, defaultSettings } from '@/lib/client/theme';
import { fetchCardJob, useCardEditor } from '@/lib/client/useCardEditor';
import { JobPicker } from './JobPicker';
import { EMPTY_REQUEST, RequestPanel, type StartRequest, requestText } from './RequestPanel';
import { VariantPicker } from './VariantPicker';

type StartTab = 'single' | 'bundle' | 'blank';

const TABS: { id: StartTab; label: string }[] = [
  { id: 'single', label: '공고 하나' },
  { id: 'bundle', label: '여러 공고 묶기' },
  { id: 'blank', label: '빈 캔버스' },
];

/**
 * 묶음 종류. 여러 회사 주제 모음은 공고 장을 회사 블록 배치(한 장에 회사 2곳까지)로 시작한다. 한 회사 여러
 * 직무는 공고마다 한 장이다. 편집 화면 템플릿 서랍에서 바꿀 수 있다.
 */
const BUNDLE_KINDS = [
  { id: 'company', label: '한 회사 여러 직무', description: '표지 직무 표 + 직무별 한 장 + 안내' },
  {
    id: 'topic',
    label: '여러 회사 주제 모음',
    description: '표지 직무 표 + 회사마다 블록(한 장에 2곳까지) + 안내',
  },
] as const;

type BundleKind = (typeof BUNDLE_KINDS)[number]['id'];

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
 * 공고 하나 탭. 공고를 고르면 오른쪽에 고른 공고와 `이 공고로 초안 쓰기` 가 나온다(아래 요청사항 바에도
 * 같은 버튼). 누르면 초안을 쓰고(남은 편집본이 있으면 그것을 열고) 시안 열 개를 보인다. 시안을 고르면 그
 * 시안으로 편집 화면을 연다.
 */
function SingleTab({
  request,
  onRequestChange,
}: {
  request: StartRequest;
  onRequestChange: (request: StartRequest) => void;
}) {
  const router = useRouter();
  const editor = useCardEditor();
  const { loaded, status, notice, specs } = editor;
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [pickedJob, setPickedJob] = useState<JobListItem | null>(null);
  const loading = status.kind === 'loading';
  // 초안을 쓴 공고와 지금 고른 공고가 같을 때만 시안을 보인다. 다른 공고를 고르면 다시 초안부터.
  const drafted = loaded?.job && specs && (pickedId === null || pickedId === loaded.job.id);

  const write = () => {
    if (pickedId === null) {
      return;
    }
    void editor.selectJob(pickedId, {
      request: requestText(request),
      uploads: request.images.map((image) => image.id),
    });
  };

  const pick = (variant: VariantId) => {
    if (!loaded) {
      return;
    }
    // 고른 시안을 편집 화면이 읽도록 바로 남긴다. 상태도 같이 바꿔 늦게 오는 썸네일 저장이 덮지 않게.
    editor.setVariant(variant);
    saveDocument({ ...loaded.doc, variant });
    router.push(`/edit/${encodeURIComponent(loaded.doc.id)}`);
  };

  const writeButton = (className?: string) => (
    <Button className={className} disabled={pickedId === null || loading} onClick={write}>
      {loading ? 'AI가 초안을 쓰는 중' : '이 공고로 초안 쓰기'}
    </Button>
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
      <JobPicker
        selectedId={pickedId ?? loaded?.job?.id}
        onSelect={(jobId, job) => {
          setPickedId(jobId);
          setPickedJob(job ?? null);
        }}
      />
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
        {drafted && loaded?.job && specs ? (
          <>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{loaded.job.companyName}</span>{' '}
              {loaded.job.title}
            </p>
            <VariantPicker specs={specs} current={null} onPick={pick} />
          </>
        ) : pickedId !== null ? (
          <div className="flex h-80 flex-col items-center justify-center gap-4 rounded-2xl border border-blue-200 bg-white px-6 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-blue-600">고른 공고</span>
              {pickedJob ? (
                <>
                  <span className="text-lg font-bold">{pickedJob.companyName}</span>
                  <span className="text-sm text-gray-600">{pickedJob.title}</span>
                </>
              ) : (
                <span className="text-lg font-bold">공고 {pickedId}번</span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              필요하면 아래 요청사항을 적고 초안을 쓰세요. 시안 열 개가 여기에 그려집니다.
            </p>
            {writeButton('px-8')}
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">
            왼쪽 목록에서 공고를 누르세요.
          </div>
        )}
      </div>
      <RequestPanel value={request} onChange={onRequestChange} action={writeButton()} />
    </div>
  );
}

/**
 * 묶음으로 만들어질 장. 표지, 고른 순서대로 공고마다 한 장, 프로필 안내. 여러 회사 주제 모음은 회사 둘씩 한
 * 장이다 — 둘이 장에 들어가지 않으면 편집 화면에서 한 곳씩 나눈다.
 */
function bundleSlides(jobs: JobListItem[], kind: BundleKind): string[] {
  if (kind === 'topic') {
    const companies = [...new Set(jobs.map((job) => job.companyName))];
    const pairs = Array.from({ length: Math.ceil(companies.length / 2) }, (_, index) =>
      companies.slice(index * 2, index * 2 + 2),
    );
    return ['표지', ...pairs.map((pair) => `회사 블록 · ${pair.join(' · ')}`), '프로필 안내'];
  }
  return ['표지', ...jobs.map((job) => `${job.companyName} · ${job.title}`), '프로필 안내'];
}

/** 묶음 초안을 받는다(`/api/draft/bundle`). */
async function requestBundleDraft(jobIds: number[], request: string): Promise<BundleDraftResult> {
  const response = await fetch('/api/draft/bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobIds, request }),
  });
  const result = (await response.json()) as BundleDraftResult & { message?: string };
  if (!response.ok) {
    throw new Error(result.message ?? '묶음 초안을 받지 못했습니다.');
  }
  return result;
}

/**
 * 여러 공고 묶기 탭. 왼쪽에서 공고를 고른 순서가 장 순서다. 오른쪽에서 순서를 바꾸고 만들어질 장을
 * 보고, 묶음 초안으로 문서를 만들어 편집 화면을 연다.
 */
function BundleTab({
  request,
  onRequestChange,
}: {
  request: StartRequest;
  onRequestChange: (request: StartRequest) => void;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<JobListItem[]>([]);
  const [kind, setKind] = useState<BundleKind>('company');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slides = bundleSlides(picked, kind);

  /** 묶음 초안을 쓰고, 첫 공고 로고로 브랜드색을 잡아 문서를 남긴 뒤 편집 화면으로 간다. */
  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const text = requestText(request);
      const [result, first] = await Promise.all([
        requestBundleDraft(
          picked.map((job) => job.id),
          text,
        ),
        fetchCardJob(picked[0]!.id),
      ]);
      const doc = bundleDocument(
        newDocumentId('bundle'),
        picked.map((job, index) => ({
          jobId: job.id,
          companyName: job.companyName,
          content: contentFromDraft(job, result.draft.jobs[index]!),
        })),
        result.draft,
        defaultSettings(first.brandColor ?? FALLBACK_COLOR),
        { request: text, uploads: request.images.map((image) => image.id) },
        kind === 'topic'
          ? { kind: 'companies', perSlide: 2, manual: true }
          : { kind: 'labels', perSlide: 1 },
      );
      saveDocument(doc);
      // 모델 없이 원문으로 만든 초안이면 편집 화면에서 한 번 알린다.
      if (result.source === 'fallback') {
        rememberNotice(
          doc.id,
          result.message ?? 'AI 초안을 받지 못해 공고 원문을 잘라 묶음 초안을 만들었어요.',
        );
      }
      router.push(`/edit/${encodeURIComponent(doc.id)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '묶음 초안을 받지 못했습니다.');
      setBusy(false);
    }
  };

  const move = (index: number, step: number) => {
    const target = index + step;
    if (target < 0 || target >= picked.length) {
      return;
    }
    const next = [...picked];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setPicked(next);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
      <JobPicker multiple={{ picked, onChange: setPicked, max: MAX_BUNDLE_JOBS }} />
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold">묶음 종류</h2>
          <div className="flex flex-wrap gap-2">
            {BUNDLE_KINDS.map((option) => (
              <label
                key={option.id}
                className={`flex flex-1 cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 ${
                  option.id === kind ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="bundle-kind"
                  className="mt-1"
                  checked={option.id === kind}
                  onChange={() => setKind(option.id)}
                />
                <span className="flex flex-col">
                  <span className="text-sm font-bold">{option.label}</span>
                  <span className="text-xs text-gray-500">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold">고른 공고</h2>
          {picked.length === 0 ? (
            <p className="text-sm text-gray-500">
              왼쪽에서 공고를 {MIN_BUNDLE_JOBS}~{MAX_BUNDLE_JOBS}개 고르세요. 고른 순서가 장
              순서입니다.
            </p>
          ) : (
            <ol className="flex flex-col gap-1">
              {picked.map((job, index) => (
                <li
                  key={job.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-semibold">{job.companyName}</span> {job.title}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`${index + 1}번 위로`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    위로
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`${index + 1}번 아래로`}
                    disabled={index === picked.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    아래로
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`${index + 1}번 빼기`}
                    onClick={() => setPicked(picked.filter((item) => item.id !== job.id))}
                  >
                    빼기
                  </Button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">만들어질 장</h2>
            <span className="text-sm text-gray-600" data-testid="slide-count">
              {kind === 'topic'
                ? `표지 1 + 회사 블록 ${slides.length - 2} + 안내 1 = ${slides.length}장`
                : `표지 1 + 공고 ${picked.length} + 안내 1 = ${slides.length}장`}
            </span>
          </div>
          <ol className="flex flex-wrap gap-2" aria-label="만들어질 장">
            {slides.map((label, index) => (
              <li
                key={`${index}-${label}`}
                className="flex max-w-[220px] items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 text-xs"
              >
                <span className="font-bold">{index + 1}</span>
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ol>
          {error ? <p className="text-sm text-error">{error}</p> : null}
        </section>
      </div>
      <RequestPanel
        value={request}
        onChange={onRequestChange}
        action={
          <Button disabled={picked.length < MIN_BUNDLE_JOBS || busy} onClick={() => void create()}>
            {busy
              ? 'AI가 묶음 초안을 쓰는 중'
              : picked.length < MIN_BUNDLE_JOBS
                ? `공고를 ${MIN_BUNDLE_JOBS}개 이상 고르세요`
                : `공고 ${picked.length}개로 ${slides.length}장 만들고 편집하기`}
          </Button>
        }
      />
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
 * 시작 화면(`/`). 공고 하나, 여러 공고 묶기, 빈 캔버스 중 하나로 시작해 편집 화면으로 들어간다. 남은 문서는
 * `최근 작업 이어하기` 에서 다시 연다.
 */
export function StartScreen() {
  const [tab, setTab] = useState<StartTab>('single');
  const [request, setRequest] = useState<StartRequest>(EMPTY_REQUEST);

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
            공고를 고르고 요청사항을 적으면 AI가 초안을 쓰고 시안 열 개를 보여 줍니다. 하나를 골라
            편집 화면에서 고친 뒤 원하는 장만 받습니다.
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
      {tab === 'single' ? <SingleTab request={request} onRequestChange={setRequest} /> : null}
      {tab === 'bundle' ? <BundleTab request={request} onRequestChange={setRequest} /> : null}
      {tab === 'blank' ? <BlankTab /> : null}
    </main>
  );
}
