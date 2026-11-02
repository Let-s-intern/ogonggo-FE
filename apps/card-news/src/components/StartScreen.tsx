'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@ogonggo/ui';
import { type DocumentEntry, listDocuments } from '@/lib/client/storage';
import { JobPicker } from './JobPicker';

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
 * 시작 화면(`/`). 공고를 먼저 고르고 편집 화면으로 들어간다. 남은 문서는 `최근 작업 이어하기` 에서
 * 다시 연다.
 */
export function StartScreen() {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">오공고 카드뉴스</h1>
          <p className="text-sm text-gray-500">공고를 고르면 AI가 초안을 쓰고 편집 화면을 엽니다.</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => void logout()}>
          로그아웃
        </Button>
      </header>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <JobPicker onSelect={(jobId) => router.push(`/edit/job-${jobId}`)} />
        <RecentDocuments />
      </div>
    </main>
  );
}
