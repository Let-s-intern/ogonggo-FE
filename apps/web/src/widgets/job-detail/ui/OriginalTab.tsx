import { cn } from '@ogonggo/ui';
import type { JobDetail } from '@/entities/job/model/types';

/**
 * `상세 채용공고.png`가 실제로 쓰는 6개 라벨(띄어쓰기 포함) 그대로다. 어드민에서 수정한
 * 회사/팀소개가 화면에 전혀 반영되지 않는다는 제보로 `companyAndTeamIntroduction`을 다시
 * 추가한다(#123) — 본문 맨 앞에 둔다.
 */
function buildSections(job: JobDetail): { label: string; value?: string }[] {
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
 * `공고 원문` 탭. 탭이 생기기 전 상세 본문 그대로 값이 있는 섹션만 글 덩어리로 보여 주고, 맨 아래에
 * 원문 사이트 링크(`sourceUrl`)를 둔다. 원문 HTML 은 없어서(API 가 글만 준다) 이 글 덩어리가 원문의
 * 유일한 대용이다.
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
  const sections = buildSections(job).filter((section) => Boolean(section.value));
  const sourceUrl = job.sourceUrl && /^https?:\/\//.test(job.sourceUrl) ? job.sourceUrl : undefined;

  return (
    <div className={cn('flex flex-col gap-10', layout === 'modal' && 'px-[17px]')}>
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
