import { useState, type ReactNode } from 'react';
import { contentFieldLabel } from '@ogonggo/api/src/admin';
import type { AdminJobAnalysis } from '@ogonggo/api/src/mocks/admin/inspection';
import { Badge, Button, Callout, Field, Input, Textarea, cn } from '@ogonggo/ui';
import type { NewJobDetail } from '@/entities/new-job/api/useNewJobQueue';
import { WEB_HOME } from '@/shared/api/webHandoff';
import {
  ConditionSection,
  JOB_BODY_FIELDS,
  LogoSuggest,
  RecruitmentSection,
} from '@/widgets/job-editor';
import { INLINE_SECTIONS, type InlineJobEdit, type InlineSection } from '../model/useInlineJobEdit';

/** 이 칸 입력란의 `id` 앞머리. 같은 화면의 `내용 수정` 모달(`job-`)과 겹치지 않게 한다. */
const ID_PREFIX = 'review';

/**
 * 왼쪽 칸. 우리가 만든 값이다 — 썸네일, 분류, 본문 칸, 공고 분석. 오른쪽 원문과 대조한다.
 *
 * 썸네일·분류·본문은 그 자리에서 고친다(2026-11-04 사용자). 칸 부품과 검사는 `내용 수정` 모달의 것을 쓰고, 구역마다
 * `저장` 으로 바뀐 칸만 보낸다(`useInlineJobEdit`). 분석 결과는 백엔드가 본문으로 만드는 값이라 고치지 않는다.
 *
 * 상세 화면과 달리 빈 칸을 숨기지 않는다. 검수에서는 무엇이 안 뽑혔는지가 확인 대상이라 비었다고 적는다.
 */
export function AnalysisPane({ job, edit }: { job: NewJobDetail; edit: InlineJobEdit }) {
  return (
    <div className="space-y-6">
      <Thumbnails job={job} edit={edit} />
      <Classification edit={edit} />
      <BodyFields edit={edit} />
      {/* 백엔드가 분석을 싣기 전(칸 자체가 없을 때)에는 이 구역을 그리지 않는다(PRD 백엔드 요청 2). */}
      {'analysis' in job ? (
        <Analysis
          analysis={job.analysis ?? null}
          isCurrent={job.analysisCurrent !== false}
          bodySaved={edit.bodySaved}
        />
      ) : null}
    </div>
  );
}

function Section({
  title,
  section,
  edit,
  children,
}: {
  title: string;
  /** 주면 구역 아래에 `저장`·`취소` 와 오류, 되돌리기를 단다. */
  section?: InlineSection;
  edit?: InlineJobEdit;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="pb-2 text-sm font-bold text-gray-900">{title}</h3>
      {children}
      {section && edit ? <SectionActions section={section} edit={edit} /> : null}
    </section>
  );
}

/**
 * 구역의 `저장`·`취소`. 고친 것이 있을 때만 보인다. 저장 오류(서버 400 의 `[칸] 사유`)와 방금 저장한 것의
 * 되돌리기도 여기 둔다. 오른쪽 칸 머리도 같은 부품을 쓴다.
 */
export function SectionActions({ section, edit }: { section: InlineSection; edit: InlineJobEdit }) {
  const dirty = edit.isDirty(section);
  const invalid = edit.sectionErrors(section).length > 0;
  const error = edit.errorOf[section];
  const justSaved = edit.lastSave?.section === section;
  if (!dirty && !error && !justSaved) {
    return null;
  }
  return (
    <div className="space-y-2 pt-2">
      {error ? <Callout tone="error">{error}</Callout> : null}
      <div className="flex flex-wrap items-center gap-2">
        {dirty ? (
          <>
            <Button
              size="sm"
              disabled={invalid || edit.saving !== null}
              onClick={() => edit.save(section)}
            >
              {edit.saving === section ? '저장 중' : `${INLINE_SECTIONS[section].label} 저장`}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => edit.discard(section)}>
              취소
            </Button>
          </>
        ) : null}
        {justSaved && !dirty ? (
          <button
            type="button"
            className="text-sm text-blue-600 underline"
            disabled={edit.saving !== null}
            onClick={edit.undo}
          >
            방금 저장한 {INLINE_SECTIONS[section].label} 되돌리기
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 썸네일. 미리보기와 주소 칸이다. 주소를 비우면 지운다. 로고는 원문 사이트에서 후보를 찾는 `LogoSuggest` 를
 * 모달처럼 쓴다. 사용자 카드가 사진·로고를 가르는 규칙(웹 `JobThumbnail`)은 웹 앱 안에 있어 가져오지 않는다.
 * 실제 카드 모양은 사용자 화면에서 본다.
 */
function Thumbnails({ job, edit }: { job: NewJobDetail; edit: InlineJobEdit }) {
  const { values, errors, onChange } = edit;
  const shown = (key: 'coverImageUrl' | 'logoUrl') =>
    values[key].trim() && !errors[key] ? values[key].trim() : undefined;
  const source = values.sourceUrl.trim() && !errors.sourceUrl ? values.sourceUrl.trim() : null;
  return (
    <Section title="썸네일" section="thumbnails" edit={edit}>
      <div className="flex items-start gap-4">
        <ImageBox
          url={shown('coverImageUrl')}
          label="커버 이미지"
          className="aspect-[8/5] w-60 shrink-0"
        />
        <ImageBox url={shown('logoUrl')} label="로고" className="h-20 w-20 shrink-0" />
        <a
          href={`${WEB_HOME}/jobs/${job.id}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto shrink-0 text-sm text-blue-600 underline"
        >
          사용자 화면에서 보기
        </a>
      </div>
      <div className="pt-3">
        {(
          [
            ['coverImageUrl', '커버 이미지 주소'],
            ['logoUrl', '로고 주소'],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label} htmlFor={`${ID_PREFIX}-${key}`} error={errors[key]}>
            <div className="flex gap-2">
              <Input
                id={`${ID_PREFIX}-${key}`}
                type="url"
                value={values[key]}
                onChange={(event) => onChange(key, event.target.value)}
              />
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0 whitespace-nowrap"
                disabled={values[key] === ''}
                onClick={() => onChange(key, '')}
              >
                지우기
              </Button>
            </div>
            {key === 'logoUrl' ? (
              <LogoSuggest
                key={source ?? ''}
                sourceUrl={source}
                logoUrl={values.logoUrl}
                onPick={(url) => onChange('logoUrl', url)}
              />
            ) : null}
          </Field>
        ))}
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

/**
 * 분류. `내용 수정` 모달의 `직무·조건`·`모집` 구역을 그대로 쓴다 — 직군을 바꾸면 직무를 비우고, 상시 채용이면
 * 마감일을 잠그는 규칙이 그 안에 있다. 선택지와 라벨은 enum 카탈로그에서 온다.
 */
function Classification({ edit }: { edit: InlineJobEdit }) {
  const props = {
    values: edit.values,
    before: edit.before,
    errors: edit.errors,
    onChange: edit.onChange,
    idPrefix: ID_PREFIX,
  };
  return (
    <Section title="분류" section="classification" edit={edit}>
      {edit.values.jobField === '' || edit.values.jobRole === '' || edit.values.region === '' ? (
        <p className="pb-2 text-sm text-error">
          비어 있음:{' '}
          {[
            edit.values.jobField === '' && '직군',
            edit.values.jobRole === '' && '직무',
            edit.values.region === '' && '근무 지역',
          ]
            .filter(Boolean)
            .join(', ')}
        </p>
      ) : null}
      <ConditionSection {...props} />
      <RecruitmentSection {...props} />
    </Section>
  );
}

function BodyFields({ edit }: { edit: InlineJobEdit }) {
  const { values, before, onChange } = edit;
  return (
    <Section title="본문 칸" section="body" edit={edit}>
      {JOB_BODY_FIELDS.map((field) => (
        <Field
          key={field}
          label={contentFieldLabel('JobContentField', field)}
          htmlFor={`${ID_PREFIX}-${field}`}
          hint={before.fields[field] === '' ? '수집되지 않은 칸입니다.' : undefined}
        >
          <Textarea
            id={`${ID_PREFIX}-${field}`}
            rows={4}
            value={values.fields[field]}
            onChange={(event) => onChange('fields', { ...values.fields, [field]: event.target.value })}
          />
        </Field>
      ))}
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

/**
 * 분석 결과. 백엔드가 본문 칸으로 만드는 값이라 읽기만 한다. 본문을 저장하면 다시 만들어진다는 것을 알린다 —
 * 다시 만들어지기 전까지 보이는 분석은 고치기 전 본문 기준이다.
 */
function Analysis({
  analysis,
  isCurrent,
  bodySaved,
}: {
  analysis: AdminJobAnalysis | null;
  isCurrent: boolean;
  bodySaved: boolean;
}) {
  const notice = bodySaved ? (
    <Callout tone="info" className="mb-3">
      본문을 고쳐 분석 결과를 다시 만듭니다. 다시 만들어지기 전까지 아래 분석은 고치기 전 본문 기준입니다.
    </Callout>
  ) : null;
  if (!analysis) {
    return (
      <Section title="분석 결과">
        {notice}
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
        <span className="text-xs text-gray-400">본문으로 만든 값이라 고치지 않습니다</span>
      </div>
      {notice}
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
