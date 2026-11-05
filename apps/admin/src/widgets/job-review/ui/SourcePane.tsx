import { forwardRef, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Button, Callout, Chip, Field, Input, Textarea, cn } from '@ogonggo/ui';
import {
  type NewJobDetail,
  SourceHtmlNotSavedError,
  supportsSourceHtmlEdit,
  useSetJobSourceHtml,
} from '@/entities/new-job/api/useNewJobQueue';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import type { InlineJobEdit } from '../model/useInlineJobEdit';
import { SectionActions } from './AnalysisPane';

/** 원문 그림의 클래스. 사용자 웹 `OriginalTab` 에서 옮겼다. */
const SOURCE_HTML_CLASS = cn(
  'break-words text-sm leading-relaxed text-gray-700',
  '[&_:is(p,ul,ol,table,h1,h2,h3,h4,h5,h6)]:my-3 [&>:first-child]:mt-0',
  '[&_:is(h1,h2,h3,h4,h5,h6)]:font-bold [&_:is(h1,h2,h3,h4,h5,h6)]:text-gray-900',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ul,ol)]:pl-5',
  '[&_img]:h-auto [&_img]:max-w-full',
  '[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:break-keep',
  '[&_:is(td,th)]:border [&_:is(td,th)]:border-gray-200 [&_:is(td,th)]:px-2 [&_:is(td,th)]:py-1',
  '[&_a]:text-blue-500 [&_a]:underline',
);

/**
 * 오른쪽 칸. 크롤러가 저장한 공고 원문(`sourceHtml`)이다.
 *
 * 사용자 웹 `공고 원문` 탭(`apps/web/src/widgets/job-detail/ui/OriginalTab.tsx`)과 같은 규칙으로 그린다. 다시
 * 거르지 않는다 — 백엔드가 저장할 때 안전한 태그만 남긴다(BE `JobSourceHtmlSanitizer.kt`). 클래스 묶음은 그 탭에서
 * 옮겼다(앱 사이 공유 패키지로 빼는 것은 PRD 비목표). 웹과 달리 깨진 이미지를 숨기지 않는다. 검수에서는 깨진
 * 것도 확인 대상이다.
 *
 * 머리의 제목·회사명·원문 주소와 원문 HTML 은 그 자리에서 고친다(2026-11-04 사용자). 앞의 셋은 왼쪽 칸과 같은
 * `useInlineJobEdit` 로, 원문 HTML 은 `useSetJobSourceHtml`(`PATCH` 의 `sourceHtml`, 배포 전)로 저장한다.
 */
export const SourcePane = forwardRef<
  HTMLDivElement,
  {
    job: NewJobDetail;
    edit?: InlineJobEdit;
    action?: ReactNode;
    className?: string;
    /** 저장하지 않은 원문 HTML 이 생기거나 없어질 때. 목록 창이 닫기 전에 묻는 데 쓴다. */
    onDraftChange?: (dirty: boolean) => void;
  }
>(function SourcePane({ job, edit, action, className, onDraftChange }, ref) {
  const sourceHtml = job.sourceHtml?.trim();
  const sourceUrl = job.sourceUrl && /^https?:\/\//.test(job.sourceUrl) ? job.sourceUrl : undefined;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
        <h3 className="text-sm font-bold text-gray-900">공고 원문</h3>
        <div className="flex items-center gap-3">
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 underline"
            >
              원문 사이트
            </a>
          ) : null}
          {action}
        </div>
      </div>
      <div ref={ref} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto pt-3 outline-none">
        {edit ? <SourceInfoFields edit={edit} /> : null}
        <SourceHtml
          key={job.id}
          job={job}
          sourceHtml={sourceHtml}
          sourceUrl={sourceUrl}
          onDraftChange={onDraftChange}
        />
      </div>
    </div>
  );
});

/** 머리 칸: 공고 제목, 회사명, 원문 사이트 주소. `PATCH` 가 받는 칸이다. */
function SourceInfoFields({ edit }: { edit: InlineJobEdit }) {
  const { values, errors, onChange } = edit;
  const fields = [
    ['title', '공고 제목', 'text'],
    ['companyName', '회사명', 'text'],
    ['sourceUrl', '원문 사이트 주소', 'url'],
  ] as const;
  return (
    <section className="border-b border-gray-200 pb-3">
      {fields.map(([key, label, type]) => (
        <Field
          key={key}
          label={label}
          htmlFor={`review-${key}`}
          required={key !== 'sourceUrl'}
          error={errors[key]}
          className="pb-2"
        >
          <Input
            id={`review-${key}`}
            type={type}
            value={values[key]}
            onChange={(event) => onChange(key, event.target.value)}
          />
        </Field>
      ))}
      <SectionActions section="source" edit={edit} />
    </section>
  );
}

/**
 * 원문 HTML. 평소에는 그린 원문이고, `원문 고치기` 를 누르면 HTML 을 그대로 고치는 글 칸과 미리보기다.
 *
 * 편집기 대신 글 칸을 쓴다. 원문은 크롤러가 긁은 HTML 이라 서식 편집기가 열면서 구조를 바꿔 버린다. 미리보기는
 * 저장 전 값이라 백엔드가 거르기 전이다 — 스크립트가 돌지 않게 `sandbox` 를 건 `iframe` 에 그린다. 저장한 원문은
 * 백엔드가 거른 값이라 위의 규칙대로 그린다.
 */
function SourceHtml({
  job,
  sourceHtml,
  sourceUrl,
  onDraftChange,
}: {
  job: NewJobDetail;
  sourceHtml: string | undefined;
  sourceUrl: string | undefined;
  onDraftChange?: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const mutation = useSetJobSourceHtml();
  const { reset } = mutation;

  // 다른 공고로 넘어가면 `key` 로 새로 그린다. 같은 공고의 원문이 바뀌면(저장 뒤 다시 받기) 지난 오류를 지운다.
  useEffect(() => reset(), [sourceHtml, reset]);

  const dirty = draft !== null && draft !== (job.sourceHtml ?? '');
  // 그린 직후 바로 알린다. 고치자마자 Esc 를 눌러도 닫기 전 확인이 이 고침을 안다.
  useLayoutEffect(() => {
    onDraftChange?.(dirty);
    return () => onDraftChange?.(false);
  }, [dirty, onDraftChange]);

  if (draft === null) {
    return (
      <div className="pt-3">
        {/* 원문 저장을 모르는 백엔드(상세에 검수 칸이 없다)에서는 고쳐도 저장되지 않아 버튼을 두지 않는다. */}
        {supportsSourceHtmlEdit(job) ? (
          <div className="flex justify-end pb-2">
            <Button size="sm" variant="ghost" onClick={() => setDraft(job.sourceHtml ?? '')}>
              원문 고치기
            </Button>
          </div>
        ) : null}
        {sourceHtml ? (
          <div className={SOURCE_HTML_CLASS} dangerouslySetInnerHTML={{ __html: sourceHtml }} />
        ) : (
          <p className="text-sm text-gray-500">
            저장된 원문이 없습니다.{sourceUrl ? ' 원문 사이트에서 확인해 주세요.' : ''}
          </p>
        )}
      </div>
    );
  }

  // 백엔드는 원문을 비울 수 없다(공백이면 400 `[sourceHtml]`). 보내기 전에 막는다.
  const empty = draft.trim() === '';
  return (
    <div className="pt-3">
      <div className="flex items-center gap-2 pb-2">
        <Chip tone={preview ? 'gray' : 'blue'} aria-pressed={!preview} onClick={() => setPreview(false)}>
          HTML
        </Chip>
        <Chip tone={preview ? 'blue' : 'gray'} aria-pressed={preview} onClick={() => setPreview(true)}>
          미리보기
        </Chip>
      </div>
      {mutation.isError ? (
        <Callout tone="error" className="mb-2">
          {mutation.error instanceof SourceHtmlNotSavedError
            ? mutation.error.message
            : (serverErrorMessage(mutation.error) ?? '원문을 저장하지 못했습니다.')}
        </Callout>
      ) : null}
      {preview ? (
        <iframe
          title="원문 미리보기"
          sandbox=""
          srcDoc={draft}
          className="h-[50vh] w-full rounded-md border border-gray-200 bg-white"
        />
      ) : (
        <Textarea
          aria-label="원문 HTML"
          rows={18}
          className="font-mono text-xs"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      )}
      {empty ? (
        <p className="pt-1 text-sm text-error">원문을 비울 수 없습니다. 고칠 원문을 입력해 주세요.</p>
      ) : null}
      <p className="pt-1 text-xs text-gray-500">
        저장할 때 스크립트 같은 위험한 태그는 지워집니다. 거른 뒤 남는 내용이 없으면 저장되지 않습니다.
      </p>
      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          disabled={!dirty || empty || mutation.isPending}
          onClick={() =>
            mutation.mutate(
              { jobId: job.id, sourceHtml: draft, previous: job.sourceHtml ?? '' },
              {
                onSuccess: () => {
                  setDraft(null);
                  setPreview(false);
                },
              },
            )
          }
        >
          {mutation.isPending ? '저장 중' : '원문 저장'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(null);
            setPreview(false);
            reset();
          }}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
