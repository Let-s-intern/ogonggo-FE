import type { ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import { EMPLOYMENT_TYPE_LABELS, formatRegion } from '@/entities/job/model/labels';
import type { JobDetail } from '@/entities/job/model/types';
import { splitLines } from '../lib/splitLines';
import { CompetencySection } from './CompetencySection';
import { Condition, hasFact, NO_VALUE_TEXT } from './ConditionRow';
import { EmploymentRows } from './EmploymentRows';
import { JobInfoGrid } from './JobInfoGrid';
import { QualificationChecklist } from './QualificationChecklist';
import { SubmissionBlock } from './SubmissionBlock';
import { TaskList } from './TaskList';

/**
 * `공고 분석` 탭(`docs/asset/v12 채용공고 상세/상세 기본.webp`). 요약 박스 아래에 담당 업무, 자격 요건
 * 체크리스트, 근무 조건, 지원 서류 및 전형 절차 순으로 쌓는다.
 *
 * 응답의 본문 필드는 전부 글 덩어리라(`splitLines` 주석) 줄 단위로 나눠 항목으로 보여 준다. 일부 공고에는
 * 응답에 `analysis`(분석 결과)가 함께 오는데, 있는 섹션은 그 값으로 그리고 없는 섹션과 없는 공고는 글 덩어리를
 * 나눠 그린다. 값이 없는 섹션은 그리지 않고, 비어 있다는 안내 문구도 두지 않는다.
 *
 * `layout="modal"` 이면 요약 박스가 v12 이전 2x2 모양이고(`JobInfoGrid`), 본문 섹션은 전처럼 요약 박스 안 글자
 * 자리(17px 안쪽)에서 시작한다. 페이지는 시안대로 섹션 제목이 요약 박스의 바깥 가장자리에서 시작한다.
 *
 * 맨 아래 안내 문구(`원문에 없는 내용은 추측하지 않고…`)는 `analysis` 가 있는 공고에만 둔다. 분석이 만든 값이
 * 아닌 공고에는 그 말이 맞지 않는다.
 *
 * 시안에 있는 지원 서류의 필수·선택 배지는 응답에 구분이 없어 그리지 않는다. 혜택·회사 소개는 `공고 원문`
 * 탭에 있다.
 */
export function AnalysisTab({
  job,
  layout = 'page',
}: {
  job: JobDetail;
  layout?: 'page' | 'modal';
}) {
  const tasks = job.analysis?.tasks ?? [];
  const analyzedRequired = job.analysis?.required ?? [];
  const analyzedPreferred = job.analysis?.preferred ?? [];
  // 분석에 필수·우대가 하나라도 있으면 두 묶음을 모두 분석에서 가져온다. 한쪽만 글 덩어리에서 가져오면
  // 같은 공고 안에서 항목을 나눈 방식이 섞인다. 둘 다 비면 글 덩어리를 나눈다.
  const itemized = analyzedRequired.length + analyzedPreferred.length > 0;
  const responsibilities = splitLines(job.responsibilities);
  const required = itemized ? analyzedRequired : splitLines(job.qualifications);
  const preferred = itemized ? analyzedPreferred : splitLines(job.preferredQualifications);
  // 네 줄 모두 값도 설명도 없으면 분석이 알려 주는 것이 없으므로 응답의 형태·급여로 그린다.
  const employment = job.analysis?.employment;
  const analyzedEmployment =
    employment && Object.values(employment).some((fact) => hasFact(fact)) ? employment : null;
  const compensation = splitLines(job.compensation);
  // 네 값 모두 값도 설명도 없으면 분석이 알려 주는 것이 없으므로 응답의 전형 절차 글로 그린다.
  const submission = job.analysis?.submission;
  const analyzedSubmission =
    submission && Object.values(submission).some((fact) => hasFact(fact)) ? submission : null;
  const hiringProcess = splitLines(job.hiringProcess);
  const competencies = job.analysis?.competencies ?? [];

  return (
    <div className="flex flex-col gap-10">
      <JobInfoGrid
        experienceType={job.experienceType}
        employmentType={job.employmentType}
        educationLevel={job.educationLevel}
        region={formatRegion(job.region)}
        layout={layout}
      />
      <div className={cn('flex flex-col gap-10', layout === 'modal' && 'px-[17px]')}>
        {tasks.length > 0 || responsibilities.length > 0 ? (
          <Section title="담당 업무">
            {tasks.length > 0 ? <TaskList tasks={tasks} /> : <LineList lines={responsibilities} />}
          </Section>
        ) : null}
        {required.length > 0 || preferred.length > 0 ? (
          <QualificationChecklist
            jobId={job.id}
            required={required}
            preferred={preferred}
            itemized={itemized}
          />
        ) : null}
        <Section title="근무 조건">
          {analyzedEmployment ? (
            <EmploymentRows employment={analyzedEmployment} />
          ) : (
            <dl className="flex flex-col gap-3 text-sm">
              <Condition label="형태">
                <p>{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</p>
              </Condition>
              {compensation.length > 0 ? (
                <Condition label="급여">
                  {compensation.map((line, index) => (
                    <p key={`${index}-${line}`}>{line}</p>
                  ))}
                </Condition>
              ) : null}
            </dl>
          )}
        </Section>
        {analyzedSubmission || hiringProcess.length > 0 ? (
          <Section title="지원 서류 및 전형 절차">
            {analyzedSubmission ? (
              <SubmissionBlock submission={analyzedSubmission} />
            ) : (
              <LineList lines={hiringProcess} />
            )}
          </Section>
        ) : null}
        {competencies.length > 0 ? (
          <CompetencySection key={job.id} competencies={competencies} />
        ) : null}
        {job.analysis ? (
          <p className="text-xs text-gray-400">
            {`* 원문에 없는 내용은 추측하지 않고 "${NO_VALUE_TEXT}"으로 표시해요. 지원 전 공고 원문과 기업 채용 페이지를 함께 확인하세요.`}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** 항목이 둘 이상이면 점 목록, 하나뿐이면 글이다. */
function LineList({ lines }: { lines: string[] }) {
  if (lines.length === 1) {
    return <p className="text-sm text-gray-700">{lines[0]}</p>;
  }

  return (
    <ul className="flex flex-col gap-2 text-sm text-gray-700">
      {lines.map((line, index) => (
        <li key={`${index}-${line}`} className="flex gap-2">
          <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-gray-300" />
          <span className="min-w-0">{line}</span>
        </li>
      ))}
    </ul>
  );
}
