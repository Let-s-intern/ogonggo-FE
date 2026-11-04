import { useState } from 'react';
import { contentFieldLabel, enumLabel } from '@ogonggo/api/src/admin';
import type { AdminJobAnalysis } from '@ogonggo/api/src/mocks/admin/inspection';
import { Badge, cn } from '@ogonggo/ui';
import type { NewJobDetail } from '@/entities/new-job/api/useNewJobQueue';
import { WEB_HOME } from '@/shared/api/webHandoff';
import { formatDate } from '@/shared/lib/format';
import { JOB_BODY_FIELDS } from '@/widgets/job-editor';

/**
 * 왼쪽 칸. 우리가 만든 값이다 — 썸네일, 분류, 본문 칸, 공고 분석. 오른쪽 원문과 대조한다.
 *
 * 상세 화면과 달리 빈 칸을 숨기지 않는다. 검수에서는 무엇이 안 뽑혔는지가 확인 대상이라 이름을 회색으로 남긴다.
 */
export function AnalysisPane({ job }: { job: NewJobDetail }) {
  return (
    <div className="space-y-6">
      <Thumbnails job={job} />
      <Classification job={job} />
      <BodyFields job={job} />
      {/* 백엔드가 분석을 싣기 전(칸 자체가 없을 때)에는 이 구역을 그리지 않는다(PRD 백엔드 요청 2). */}
      {'analysis' in job ? (
        <Analysis analysis={job.analysis ?? null} isCurrent={job.analysisCurrent !== false} />
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="pb-2 text-sm font-bold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

/**
 * 썸네일. 사용자 카드가 사진·로고를 가르는 규칙(웹 `JobThumbnail`)은 웹 앱 안에 있어 가져오지 않는다. 값이
 * 없거나 이미지가 안 뜨면 그 사실을 글로 적고, 실제 카드 모양은 사용자 화면에서 본다.
 */
function Thumbnails({ job }: { job: NewJobDetail }) {
  return (
    <Section title="썸네일">
      <div className="flex items-start gap-4">
        <ImageBox
          url={job.coverImageUrl}
          label="커버 이미지"
          className="aspect-[8/5] w-60 shrink-0"
        />
        <ImageBox url={job.logoUrl} label="로고" className="h-20 w-20 shrink-0" />
        <a
          href={`${WEB_HOME}/jobs/${job.id}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto shrink-0 text-sm text-blue-600 underline"
        >
          사용자 화면에서 보기
        </a>
      </div>
    </Section>
  );
}

function ImageBox({
  url,
  label,
  className,
}: {
  url: string | undefined;
  label: string;
  className: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = url !== undefined && failedUrl === url;
  return (
    <figure className="min-w-0">
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50',
          className,
        )}
      >
        {url && !failed ? (
          <img
            src={url}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setFailedUrl(url)}
          />
        ) : (
          <span className="px-2 text-center text-xs text-error">
            {url ? '이미지를 불러오지 못했습니다' : `${label} 없음`}
          </span>
        )}
      </div>
      <figcaption className="pt-1 text-xs text-gray-500">{label}</figcaption>
    </figure>
  );
}

function Classification({ job }: { job: NewJobDetail }) {
  const missing = <span className="text-error">비어 있음</span>;
  const rows: [string, React.ReactNode][] = [
    ['직군', job.jobField ? enumLabel('JobField', job.jobField) : missing],
    ['직무', job.jobRole ? enumLabel('JobRole', job.jobRole) : missing],
    ['고용 형태', enumLabel('JobEmploymentType', job.employmentType)],
    [
      '경력',
      `${enumLabel('JobExperienceType', job.experienceType)}${
        job.experienceMinYears == null ? '' : ` · 최소 ${job.experienceMinYears}년`
      }`,
    ],
    ['학력', enumLabel('JobEducationLevel', job.educationLevel)],
    [
      '지역',
      job.region
        ? [
            enumLabel('Region', job.region),
            job.subRegion ? enumLabel('SubRegion', job.subRegion) : '',
          ]
            .filter(Boolean)
            .join(' ')
        : missing,
    ],
    [
      '모집',
      `${enumLabel('JobRecruitmentType', job.recruitmentType)}${
        job.recruitmentType === 'ALWAYS_OPEN'
          ? ''
          : ` · ${formatDate(job.recruitmentStartAt)} ~ ${formatDate(job.recruitmentEndAt)}`
      }`,
    ],
  ];
  return (
    <Section title="분류">
      <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function BodyFields({ job }: { job: NewJobDetail }) {
  return (
    <Section title="본문 칸">
      <div className="space-y-3">
        {JOB_BODY_FIELDS.map((field) => {
          const label = contentFieldLabel('JobContentField', field);
          const value = job[field]?.trim();
          return value ? (
            <div key={field}>
              <h4 className="pb-0.5 text-sm font-medium text-gray-500">{label}</h4>
              <p className="whitespace-pre-wrap text-sm text-gray-900">{value}</p>
            </div>
          ) : (
            <p key={field} className="text-sm text-gray-300">
              {label} 비어 있음
            </p>
          );
        })}
      </div>
    </Section>
  );
}

/** `Fact` 한 줄. 값이 없으면 보충 설명만, 둘 다 없으면 `-`. */
function fact(value?: string, note?: string): string {
  return [value, note && `(${note})`].filter(Boolean).join(' ') || '-';
}

function List({ items }: { items: string[] }) {
  return items.length === 0 ? (
    <p className="text-sm text-gray-300">없음</p>
  ) : (
    <ul className="list-disc space-y-0.5 pl-5 text-sm text-gray-900">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function Analysis({
  analysis,
  isCurrent,
}: {
  analysis: AdminJobAnalysis | null;
  isCurrent: boolean;
}) {
  if (!analysis) {
    return (
      <Section title="분석 결과">
        <p className="text-sm text-error">분석 없음</p>
      </Section>
    );
  }
  const { employment, submission } = analysis;
  return (
    <section>
      <div className="flex items-center gap-2 pb-2">
        <h3 className="text-sm font-bold text-gray-900">분석 결과</h3>
        {isCurrent ? null : <Badge tone="urgent">다시 분석 대기</Badge>}
      </div>
      <div className="space-y-4">
        <div>
          <h4 className="pb-1 text-sm font-medium text-gray-500">할 일</h4>
          <List items={analysis.tasks.map((task) => `[${task.tag}] ${task.text}`)} />
        </div>
        <div>
          <h4 className="pb-1 text-sm font-medium text-gray-500">필수 조건</h4>
          <List items={analysis.required} />
        </div>
        <div>
          <h4 className="pb-1 text-sm font-medium text-gray-500">우대 조건</h4>
          <List items={analysis.preferred} />
        </div>
        <div>
          <h4 className="pb-1 text-sm font-medium text-gray-500">근무 조건</h4>
          <List
            items={[
              `고용 형태: ${fact(employment.type.value, employment.type.note)}`,
              `전환: ${fact(employment.conversion.value, employment.conversion.note)}`,
              `급여: ${fact(employment.salary.value, employment.salary.note)}`,
              `소속: ${fact(employment.affiliation.value, employment.affiliation.note)}`,
            ]}
          />
        </div>
        <div>
          <h4 className="pb-1 text-sm font-medium text-gray-500">제출</h4>
          <List
            items={[
              `서류: ${fact(submission.documents.value, submission.documents.note)}`,
              `자기소개서: ${fact(submission.essay.value, submission.essay.note)}`,
              `절차: ${fact(submission.process.value, submission.process.note)}`,
              `마감: ${fact(submission.deadline.value, submission.deadline.note)}`,
            ]}
          />
        </div>
        <div>
          <h4 className="pb-1 text-sm font-medium text-gray-500">역량</h4>
          {analysis.competencies.length === 0 ? (
            <p className="text-sm text-gray-300">없음</p>
          ) : (
            <ul className="space-y-2">
              {analysis.competencies.map((competency) => (
                <li key={competency.name} className="text-sm">
                  <p className="font-medium text-gray-900">{competency.name}</p>
                  {/* 원문 문장 그대로다. 오른쪽 원문에서 같은 문장을 찾아 대조한다. */}
                  <blockquote className="mt-0.5 border-l-2 border-gray-300 pl-2 text-gray-600">
                    {competency.quote}
                  </blockquote>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
