import { cn } from '@ogonggo/ui';
import type { JobDetail } from '@/entities/job/model/types';

/**
 * `상세 채용공고.png`가 실제로 쓰는 6개 라벨(띄어쓰기 포함) 그대로다. 어드민에서 수정한
 * 회사/팀소개가 화면에 전혀 반영되지 않는다는 제보로 `companyAndTeamIntroduction`을 다시
 * 추가한다(#123) — 본문 맨 앞에 둔다.
 */
export function buildSections(job: JobDetail): { label: string; value?: string }[] {
  return [
    { label: '회사 및 팀 소개', value: job.companyAndTeamIntroduction },
    { label: '주요 업무', value: job.responsibilities },
    { label: '자격 요건', value: job.qualifications },
    { label: '우대 사항', value: job.preferredQualifications },
    { label: '급여 및 처우', value: job.compensation },
    { label: '혜택 및 복지', value: job.benefits },
    { label: '채용 절차', value: job.hiringProcess },
  ];
}

/**
 * `공고 원문` 탭. 원문 HTML(`sourceHtml`)이 있으면 그 HTML 을 그대로 그린다. 원문이 없는 공고와
 * 기업회원 공고는 값이 없어, 그때는 탭이 생기기 전 상세 본문 그대로 값이 있는 섹션만 글 덩어리로
 * 보여 준다. 맨 아래에는 원문 사이트 링크(`sourceUrl`)를 둔다.
 *
 * `sourceHtml` 은 프런트에서 다시 거르지 않는다. 백엔드가 저장할 때 jsoup `Safelist.relaxed()` 로
 * 안전한 태그만 남기고(BE `JobSourceHtmlSanitizer.kt`) 스타일 속성도 없앤 값이라, 여기서 한 번 더
 * 거르면 같은 일을 두 번 하면서 라이브러리만 늘어난다. 스타일은 화면 폭을 넘지 않을 만큼만 준다 —
 * 이미지는 폭에 맞추고, 표는 가로로 스크롤하고, 목록·문단에 간격을 둔다.
 *
 * 링크는 `http(s)` 주소일 때만 건다. 값이 없거나 다른 형식이면 링크만 빼고 그린다.
 *
 * `layout="modal"` 이면 전처럼 본문이 17px 안쪽에서 시작한다(`AnalysisTab` 과 같다).
 */
export function OriginalTab({
  job,
  layout = 'page',
}: {
  job: JobDetail;
  layout?: 'page' | 'modal';
}) {
  const sourceHtml = job.sourceHtml?.trim();
  const sections = sourceHtml ? [] : buildSections(job).filter((section) => Boolean(section.value));
  const sourceUrl = job.sourceUrl && /^https?:\/\//.test(job.sourceUrl) ? job.sourceUrl : undefined;

  return (
    <div className={cn('flex flex-col gap-10', layout === 'modal' && 'px-[17px]')}>
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
      ) : null}
      {sections.map((section) => (
        <div key={section.label}>
          <h2 className="text-lg font-bold text-gray-900">{section.label}</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{section.value}</p>
        </div>
      ))}
      {sourceUrl ? (
        <div>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-500 underline-offset-2 hover:underline"
          >
            공고 원문 보러 가기
          </a>
        </div>
      ) : null}
    </div>
  );
}
