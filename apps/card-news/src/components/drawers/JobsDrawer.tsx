'use client';

import { useState } from 'react';
import { Button, Input, Modal, Textarea } from '@ogonggo/ui';
import {
  type CardDocument,
  MAX_BUNDLE_JOBS,
  MAX_SLIDES,
  companyNames,
  coverRows,
  jobName,
  slideJobIndices,
} from '@/lib/card/document';
import type { CardContent } from '@/lib/card/types';
import type { JobListItem } from '@/lib/server/ogonggo';
import { CaptionPanel } from '../CaptionPanel';
import { ContentPanel } from '../ContentPanel';
import { JobPicker } from '../JobPicker';
import { Drawer } from '../LeftRail';

/**
 * 공고 서랍. 묶은 공고 목록(끌어서 순서, 빼기, `공고 더 묶기`)과 공고마다의 문구, 묶음 표지의 뱃지·제목,
 * 인스타 본문. 공고 순서를 바꾸면 표지 표와 공고 장 순서가 같이 바뀐다(`moveJob()`).
 *
 * 펼친 공고 하나만 문구 칸을 그린다 — 칸 id(`content-<칸>`)가 겹치지 않게.
 */
export function JobsDrawer({
  doc,
  onJobContent,
  onCaption,
  onCover,
  onRow,
  onMove,
  onRemove,
  onAddJobs,
}: {
  doc: CardDocument;
  onJobContent: (jobIndex: number, content: CardContent) => void;
  onCaption: (caption: string) => void;
  /** 묶음 표지의 뱃지·제목. */
  onCover: (
    patch: Partial<
      Pick<
        NonNullable<CardDocument['cover']>,
        'badge' | 'headline' | 'columns' | 'companyColumns' | 'schedule'
      >
    >,
  ) => void;
  /** 묶음 표지 표에서 공고 하나의 줄(직무, 모집 분야). */
  onRow: (jobIndex: number, row: [string, string]) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (jobIndex: number) => void;
  /** 공고를 더 묶는다. 실패하면 오류 글. */
  onAddJobs: (jobIds: number[]) => Promise<string | null>;
}) {
  const bundle = doc.kind === 'bundle';
  const [open, setOpen] = useState<number | null>(bundle ? null : 0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<JobListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const room = Math.min(MAX_SLIDES - doc.slides.length, MAX_BUNDLE_JOBS - doc.jobs.length);
  const multiCompany = companyNames(doc).length > 1;
  const coverColumns = coverRows(doc).columns;

  /** 공고가 그려지는 장 번호(`2장`, `2·5장`). */
  const slidesOf = (jobIndex: number) => {
    const numbers = doc.slides.flatMap((slide, index) =>
      slideJobIndices(slide).includes(jobIndex) ? [index + 1] : [],
    );
    return numbers.length > 0 ? `${numbers.join('·')}장` : '장 없음';
  };

  const add = async () => {
    setBusy(true);
    setError(null);
    const failed = await onAddJobs(picked.map((job) => job.id));
    setBusy(false);
    if (failed) {
      setError(failed);
      return;
    }
    setPicked([]);
    setAdding(false);
  };

  return (
    <Drawer title={bundle ? '공고 · 묶음 순서' : '공고'}>
      {doc.jobs.length === 0 ? (
        <p className="text-sm text-gray-500">묶은 공고가 없습니다.</p>
      ) : null}

      {bundle ? (
        <>
          <Button
            size="sm"
            variant="secondary"
            disabled={room <= 0}
            onClick={() => {
              setError(null);
              setAdding(true);
            }}
          >
            공고 더 묶기
          </Button>
          <p className="text-xs text-gray-500">
            끌어서 순서를 바꾸면 표지의 표와 상세 장 순서가 같이 바뀝니다.
          </p>
          {doc.cover ? (
            <details className="rounded-xl border border-gray-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold">표지</summary>
              <div className="mt-3 flex flex-col gap-2">
                <Input
                  aria-label="표지 뱃지"
                  className="h-9 text-sm"
                  value={doc.cover.badge}
                  onChange={(event) => onCover({ badge: event.target.value })}
                />
                <Textarea
                  aria-label="표지 제목"
                  rows={2}
                  className="text-sm font-semibold"
                  value={doc.cover.headline}
                  onChange={(event) => onCover({ headline: event.target.value })}
                />
                <p className="text-xs text-gray-500">
                  줄바꿈으로 줄을 나눕니다. *단어* 는 강조 상자입니다.
                </p>
                <div className="flex gap-2">
                  {coverColumns.map((label, column) => (
                    <Input
                      key={column}
                      aria-label={`표 머리 ${column + 1}`}
                      className="h-9 text-sm"
                      value={label}
                      onChange={(event) => {
                        const columns = [...coverColumns] as [string, string];
                        columns[column] = event.target.value;
                        onCover(multiCompany ? { companyColumns: columns } : { columns });
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {multiCompany
                    ? '표 머리 칩입니다. 여러 회사 묶음의 표는 회사마다 한 줄이고, 직무는 아래 공고마다 고칩니다.'
                    : '표 머리 칩입니다(예: 채용 형태, 채용 직무).'}
                </p>
                <Textarea
                  aria-label="표지 일정"
                  rows={2}
                  className="text-sm"
                  placeholder="서류 합격 발표 : 10월 20일 화요일 오후 6시"
                  value={(doc.cover.schedule ?? []).join('\n')}
                  onChange={(event) =>
                    onCover({
                      schedule: event.target.value ? event.target.value.split('\n') : [],
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  일정은 직무 표 밑 상자에 한 줄씩 들어갑니다. 비우면 상자를 그리지 않습니다.
                </p>
              </div>
            </details>
          ) : null}
        </>
      ) : null}

      <ul className="flex flex-col gap-2">
        {doc.jobs.map((job, index) => {
          const row = doc.cover?.rows[index];
          const expanded = open === index;
          return (
            <li
              key={job.jobId}
              onDragOver={(event) => {
                if (dragging !== null) {
                  event.preventDefault();
                  setOver(index);
                }
              }}
              onDragLeave={() => setOver((value) => (value === index ? null : value))}
              onDrop={(event) => {
                event.preventDefault();
                if (dragging !== null) {
                  onMove(dragging, index);
                }
                setDragging(null);
                setOver(null);
              }}
              aria-label={`${index + 1}. ${jobName(doc, index)}`}
              className={`flex flex-col gap-2 rounded-xl border p-3 ${
                over === index && dragging !== index
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white'
              } ${dragging === index ? 'opacity-40' : ''}`}
            >
              {/* 머리만 끈다. 문구 칸까지 끌리면 칸 안 글자를 고를 수 없다. */}
              <div
                draggable={bundle}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(index));
                  setDragging(index);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
                className={`flex items-start gap-2 ${bundle ? 'cursor-grab' : ''}`}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-bold">
                    {jobName(doc, index)}
                    {row?.[1] ? (
                      <span className="pl-1.5 font-normal text-gray-500">{row[1]}</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-gray-500">
                    {job.companyName} · {slidesOf(index)}
                  </span>
                </div>
                {bundle ? (
                  <button
                    type="button"
                    disabled={doc.jobs.length <= 1}
                    onClick={() => onRemove(index)}
                    aria-label={`${jobName(doc, index)} 묶음에서 빼기`}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:text-gray-300"
                  >
                    빼기
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : index)}
                className="self-start text-xs font-semibold text-blue-600"
              >
                {expanded ? '문구 접기' : '문구 고치기'}
              </button>
              {expanded ? (
                <div className="flex flex-col gap-3">
                  {row ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        aria-label="표지 표 채용 직무"
                        className="h-9 text-sm"
                        value={row[0]}
                        onChange={(event) => onRow(index, [event.target.value, row[1]])}
                      />
                      <Input
                        aria-label="표지 표 모집 분야"
                        className="h-9 text-sm"
                        value={row[1]}
                        onChange={(event) => onRow(index, [row[0], event.target.value])}
                      />
                    </div>
                  ) : null}
                  <ContentPanel
                    content={{ ...job.content, caption: doc.caption }}
                    onChange={(content) => onJobContent(index, content)}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {bundle && doc.cover ? (
        <p className="text-xs text-gray-500">
          표지 표 열: {coverColumns.join(' · ')} ({multiCompany ? '회사마다' : '공고마다'} 한 줄)
        </p>
      ) : null}

      <CaptionPanel caption={doc.caption} onChange={onCaption} />

      <Modal
        open={adding}
        title="공고 더 묶기"
        description={`최대 ${Math.max(0, room)}개까지 더 묶습니다. 공고마다 AI 초안을 씁니다.`}
        onClose={() => setAdding(false)}
        className="w-[min(48rem,calc(100vw-2rem))]"
      >
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          <JobPicker
            multiple={{
              picked,
              onChange: (jobs) =>
                setPicked(jobs.filter((job) => !doc.jobs.some((item) => item.jobId === job.id))),
              max: Math.max(0, room),
            }}
          />
        </div>
        {error ? <p className="pt-2 text-sm text-error">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-4">
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            닫기
          </Button>
          <Button size="sm" disabled={picked.length === 0 || busy} onClick={() => void add()}>
            {busy ? '초안 쓰는 중' : `${picked.length}개 더 묶기`}
          </Button>
        </div>
      </Modal>
    </Drawer>
  );
}
