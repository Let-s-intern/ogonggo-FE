import { useState, type ReactNode } from 'react';
import { contentFieldLabel } from '@ogonggo/api/src/admin';
import { Button, Callout, Field, Input, Textarea, cn } from '@ogonggo/ui';
import type { NewJobDetail } from '@/entities/new-job/api/useNewJobQueue';
import { WEB_HOME } from '@/shared/api/webHandoff';
import {
  ConditionSection,
  JOB_BODY_FIELDS,
  LogoSuggest,
  RecruitmentSection,
} from '@/widgets/job-editor';
import { INLINE_SECTIONS, type InlineJobEdit, type InlineSection } from '../model/useInlineJobEdit';
import { AnalysisEditor } from './AnalysisEditor';

/** 이 칸 입력란의 `id` 앞머리. 같은 화면의 `내용 수정` 모달(`job-`)과 겹치지 않게 한다. */
const ID_PREFIX = 'review';

/**
 * 왼쪽 칸. 우리가 만든 값이다 — 썸네일, 분류, 본문 칸, 공고 분석. 오른쪽 원문과 대조한다.
 *
 * 썸네일·분류·본문은 그 자리에서 고친다(2026-11-04 사용자). 칸 부품과 검사는 `내용 수정` 모달의 것을 쓰고, 구역마다
 * `저장` 으로 바뀐 칸만 보낸다(`useInlineJobEdit`). 분석 결과도 그 자리에서 고쳐 통째로 저장한다(`AnalysisEditor`).
 *
 * 상세 화면과 달리 빈 칸을 숨기지 않는다. 검수에서는 무엇이 안 뽑혔는지가 확인 대상이라 비었다고 적는다.
 */
export function AnalysisPane({ job, edit }: { job: NewJobDetail; edit: InlineJobEdit }) {
  return (
    <div className="space-y-6">
      <Thumbnails job={job} edit={edit} />
      <Classification edit={edit} />
      <BodyFields edit={edit} />
      {/* 분석 칸이 배포되기 전(칸 자체가 없을 때)에는 이 구역을 그리지 않는다. 서버 값이 바뀌면 새로 연다. */}
      {'analysis' in job ? (
        <AnalysisEditor
          key={`${job.id}:${job.analysisEditedAt ?? ''}:${String(job.analysisCurrent)}:${JSON.stringify(job.analysis)}`}
          job={job}
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
