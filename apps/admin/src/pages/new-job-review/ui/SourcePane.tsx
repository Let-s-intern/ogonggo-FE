import { forwardRef, type ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import type { NewJobDetail } from '@/entities/new-job/api/useNewJobQueue';

/**
 * 오른쪽 칸. 크롤러가 저장한 공고 원문(`sourceHtml`)이다.
 *
 * 사용자 웹 `공고 원문` 탭(`apps/web/src/widgets/job-detail/ui/OriginalTab.tsx`)과 같은 규칙으로 그린다. 다시
 * 거르지 않는다 — 백엔드가 저장할 때 안전한 태그만 남긴다(BE `JobSourceHtmlSanitizer.kt`). 클래스 묶음은 그 탭에서
 * 옮겼다(앱 사이 공유 패키지로 빼는 것은 PRD 비목표). 웹과 달리 깨진 이미지를 숨기지 않는다. 검수에서는 깨진
 * 것도 확인 대상이다.
 */
export const SourcePane = forwardRef<
  HTMLDivElement,
  { job: NewJobDetail; action?: ReactNode; className?: string }
>(function SourcePane({ job, action, className }, ref) {
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
        {sourceHtml ? (
          <div
            className={cn(
              'break-words text-sm leading-relaxed text-gray-700',
              '[&_:is(p,ul,ol,table,h1,h2,h3,h4,h5,h6)]:my-3 [&>:first-child]:mt-0',
              '[&_:is(h1,h2,h3,h4,h5,h6)]:font-bold [&_:is(h1,h2,h3,h4,h5,h6)]:text-gray-900',
              '[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ul,ol)]:pl-5',
              '[&_img]:h-auto [&_img]:max-w-full',
              '[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:break-keep',
              '[&_:is(td,th)]:border [&_:is(td,th)]:border-gray-200 [&_:is(td,th)]:px-2 [&_:is(td,th)]:py-1',
              '[&_a]:text-blue-500 [&_a]:underline',
            )}
            dangerouslySetInnerHTML={{ __html: sourceHtml }}
          />
        ) : (
          <p className="text-sm text-gray-500">
            저장된 원문이 없습니다.{sourceUrl ? ' 원문 사이트에서 확인해 주세요.' : ''}
          </p>
        )}
      </div>
    </div>
  );
});
