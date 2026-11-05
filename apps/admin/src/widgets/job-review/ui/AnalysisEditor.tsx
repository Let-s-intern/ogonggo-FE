import { useLayoutEffect, useState, type ReactNode } from 'react';
import type { Analysis } from '@ogonggo/api/src/mocks/admin/inspection';
import { Badge, Button, Callout, Input, Textarea } from '@ogonggo/ui';
import { useSaveJobAnalysis, type NewJobDetail } from '@/entities/new-job/api/useNewJobQueue';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { formatDateTime } from '@/shared/lib/format';

/** 백엔드 `AiJobAnalysisRequest.Analysis` 의 개수·길이 상한. */
const MAX_TASKS = 3;
const MAX_CONDITIONS = 8;
const MAX_COMPETENCIES = 3;
const MAX_EXPERIENCES = 3;
const TEXT_MAX = 1000;

interface FactForm {
  value: string;
  note: string;
}

interface CompetencyForm {
  name: string;
  quote: string;
  description: string;
  experiences: string[];
}

/** 고치는 동안의 분석. `Fact` 의 빈 칸(null)은 빈 글로 둔다. */
interface AnalysisForm {
  tasks: { tag: string; text: string }[];
  required: string[];
  preferred: string[];
  employment: Record<'type' | 'conversion' | 'salary' | 'affiliation', FactForm>;
  submission: Record<'documents' | 'essay' | 'process' | 'deadline', FactForm>;
  competencies: CompetencyForm[];
}

const EMPLOYMENT_LABELS = [
  ['type', '고용 형태'],
  ['conversion', '전환'],
  ['salary', '급여'],
  ['affiliation', '소속'],
] as const;

const SUBMISSION_LABELS = [
  ['documents', '서류'],
  ['essay', '자기소개서'],
  ['process', '절차'],
  ['deadline', '마감'],
] as const;

/** 백엔드는 빈 칸을 null 로 준다. 생성 모델은 선택 칸이라 둘 다 받는다. */
const factForm = (fact: { value?: string | null; note?: string | null } | undefined): FactForm => ({
  value: fact?.value ?? '',
  note: fact?.note ?? '',
});

function toForm(analysis: Analysis | null): AnalysisForm {
  return {
    tasks: (analysis?.tasks ?? []).map((task) => ({ tag: task.tag, text: task.text })),
    required: [...(analysis?.required ?? [])],
    preferred: [...(analysis?.preferred ?? [])],
    employment: {
      type: factForm(analysis?.employment.type),
      conversion: factForm(analysis?.employment.conversion),
      salary: factForm(analysis?.employment.salary),
      affiliation: factForm(analysis?.employment.affiliation),
    },
    submission: {
      documents: factForm(analysis?.submission.documents),
      essay: factForm(analysis?.submission.essay),
      process: factForm(analysis?.submission.process),
      deadline: factForm(analysis?.submission.deadline),
    },
    competencies: (analysis?.competencies ?? []).map((competency) => ({
      name: competency.name,
      quote: competency.quote,
      description: competency.description,
      experiences: [...competency.experiences],
    })),
  };
}

/** 빈 칸은 보내지 않는다 — 백엔드가 null 로 저장한다(`Fact.toFact`). */
const toFact = ({ value, note }: FactForm) => ({
  ...(value.trim() ? { value: value.trim() } : {}),
  ...(note.trim() ? { note: note.trim() } : {}),
});

/** 저장 본문. 빈 줄(조건·경험)은 지운다. 백엔드는 목록의 빈 글을 받지 않는다. */
function toAnalysis(form: AnalysisForm): Analysis {
  const lines = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
  return {
    tasks: form.tasks.map((task) => ({ tag: task.tag.trim(), text: task.text.trim() })),
    required: lines(form.required),
    preferred: lines(form.preferred),
    employment: {
      type: toFact(form.employment.type),
      conversion: toFact(form.employment.conversion),
      salary: toFact(form.employment.salary),
      affiliation: toFact(form.employment.affiliation),
    },
    submission: {
      documents: toFact(form.submission.documents),
      essay: toFact(form.submission.essay),
      process: toFact(form.submission.process),
      deadline: toFact(form.submission.deadline),
    },
    competencies: form.competencies.map((competency) => ({
      name: competency.name.trim(),
      quote: competency.quote.trim(),
      description: competency.description.trim(),
      experiences: lines(competency.experiences),
    })),
  };
}

/** 비울 수 없는 칸이 비었는지. 할 일의 태그·내용, 역량의 이름·문장·설명이다. */
function missingOf(form: AnalysisForm): string[] {
  const missing: string[] = [];
  form.tasks.forEach((task, index) => {
    if (!task.tag.trim() || !task.text.trim()) {
      missing.push(`할 일 ${index + 1}`);
    }
  });
  form.competencies.forEach((competency, index) => {
    if (!competency.name.trim() || !competency.quote.trim() || !competency.description.trim()) {
      missing.push(`역량 ${index + 1}`);
    }
  });
  return missing;
}

/**
 * 분석 결과를 그 자리에서 고친다(2026-11-04 사용자). 칸마다가 아니라 분석 전체를 한 번에 저장한다 —
 * `PUT /api/v1/admin/jobs/{jobId}/analysis` 가 통째로 바꾸기 때문이다. 개수 상한에 닿으면 추가 버튼을 잠근다.
 *
 * 저장하면 지금 본문 기준이 되어 바로 사용자에게 보이고, 본문이 바뀌기 전까지 AI 가 덮어쓰지 않는다. 본문을 고치면
 * AI 가 다시 분석하고, 그 분석이 저장되면 운영자 수정 표시가 사라진다.
 *
 * 부르는 쪽이 `key` 에 공고 id 와 서버 값(`analysisEditedAt`·`analysisCurrent`)을 넣는다. 서버 값이 바뀌면 고치던
 * 값을 버리고 새로 연다.
 */
export function AnalysisEditor({
  job,
  onDraftChange,
}: {
  job: NewJobDetail;
  /** 저장하지 않은 고침이 생기거나 없어질 때. 목록 창이 닫기 전에 묻는 데 쓴다. */
  onDraftChange?: (dirty: boolean) => void;
}) {
  const analysis = job.analysis ?? null;
  const isCurrent = job.analysisCurrent !== false;
  const [base] = useState(() => toForm(analysis));
  const [form, setForm] = useState(base);
  // 분석이 없으면 빈 칸을 바로 펼치지 않는다. `직접 쓰기` 를 누르면 연다.
  const [writing, setWriting] = useState(analysis !== null);
  const mutation = useSaveJobAnalysis();

  const dirty = JSON.stringify(form) !== JSON.stringify(base);
  const missing = missingOf(form);

  // 그린 직후 바로 알린다. 고치자마자 Esc 를 눌러도 닫기 전 확인이 이 고침을 안다.
  useLayoutEffect(() => {
    onDraftChange?.(dirty);
    return () => onDraftChange?.(false);
  }, [dirty, onDraftChange]);

  const update = (patch: Partial<AnalysisForm>) =>
    setForm((previous) => ({ ...previous, ...patch }));

  const header = (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      <h3 className="text-sm font-bold text-gray-900">분석 결과</h3>
      {analysis && !isCurrent ? <Badge tone="urgent">다시 분석 대기</Badge> : null}
      {job.analysisEditedAt ? (
        <Badge tone="main">운영자 수정 {formatDateTime(job.analysisEditedAt)}</Badge>
      ) : null}
    </div>
  );

  // 분석이 기대는 글(제목·본문·모집 안내)이 바뀌어 낡은 분석. 지금 고쳐 저장하면 바뀐 글 기준이 된다.
  const notice =
    analysis && !isCurrent ? (
      <Callout tone="info" className="mb-3">
        {job.analysisEditedAt
          ? '제목·본문·모집 안내가 바뀌어 AI 가 분석을 다시 만듭니다. 새 분석이 저장되면 운영자 수정은 사라집니다.'
          : '제목·본문·모집 안내가 바뀌어 AI 가 분석을 다시 만듭니다.'}{' '}
        그 전까지 아래 분석은 바뀌기 전 글 기준입니다. 지금 고쳐 저장하면 바뀐 글 기준으로
        저장되고 AI 가 덮어쓰지 않습니다.
      </Callout>
    ) : null;

  if (!writing) {
    return (
      <section>
        {header}
        <div className="flex items-center gap-3">
          <p className="text-sm text-error">분석 없음</p>
          <Button size="sm" variant="secondary" onClick={() => setWriting(true)}>
            직접 쓰기
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section>
      {header}
      <p className="pb-2 text-xs text-gray-500">
        제목·본문 칸·모집 안내를 바꾸면 분석이 다시 만들어집니다. 그 칸을 먼저 고치고 분석은 마지막에
        고쳐 주세요.
      </p>
      {notice}
      <div className="space-y-5">
        <Group title="할 일" count={form.tasks.length} max={MAX_TASKS}>
          {form.tasks.map((task, index) => (
            <Row
              key={index}
              onRemove={() => update({ tasks: form.tasks.filter((_, i) => i !== index) })}
              removeLabel={`할 일 ${index + 1} 지우기`}
            >
              <Input
                aria-label={`할 일 ${index + 1} 태그`}
                placeholder="태그"
                maxLength={TEXT_MAX}
                className="w-28 shrink-0"
                value={task.tag}
                onChange={(event) =>
                  update({
                    tasks: form.tasks.map((t, i) =>
                      i === index ? { ...t, tag: event.target.value } : t,
                    ),
                  })
                }
              />
              <Input
                aria-label={`할 일 ${index + 1} 내용`}
                placeholder="하는 일"
                maxLength={TEXT_MAX}
                value={task.text}
                onChange={(event) =>
                  update({
                    tasks: form.tasks.map((t, i) =>
                      i === index ? { ...t, text: event.target.value } : t,
                    ),
                  })
                }
              />
            </Row>
          ))}
          <AddButton
            label="할 일 추가"
            disabled={form.tasks.length >= MAX_TASKS}
            onClick={() => update({ tasks: [...form.tasks, { tag: '', text: '' }] })}
          />
        </Group>

        {(
          [
            ['required', '필수 조건'],
            ['preferred', '우대 조건'],
          ] as const
        ).map(([key, title]) => (
          <Group key={key} title={title} count={form[key].length} max={MAX_CONDITIONS}>
            <LineList
              label={title}
              items={form[key]}
              max={MAX_CONDITIONS}
              onChange={(items) => update({ [key]: items })}
            />
          </Group>
        ))}

        {(
          [
            ['employment', '근무 조건', EMPLOYMENT_LABELS],
            ['submission', '제출', SUBMISSION_LABELS],
          ] as const
        ).map(([group, title, labels]) => (
          <Group key={group} title={title}>
            {labels.map(([key, label]) => {
              const facts = form[group] as Record<string, FactForm>;
              const fact = facts[key]!;
              const set = (patch: Partial<FactForm>) =>
                update({ [group]: { ...facts, [key]: { ...fact, ...patch } } });
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-sm text-gray-600">{label}</span>
                  <Input
                    aria-label={`${label} 값`}
                    placeholder="값 (공고에 없으면 비움)"
                    maxLength={TEXT_MAX}
                    value={fact.value}
                    onChange={(event) => set({ value: event.target.value })}
                  />
                  <Input
                    aria-label={`${label} 보충`}
                    placeholder="보충 설명"
                    maxLength={TEXT_MAX}
                    value={fact.note}
                    onChange={(event) => set({ note: event.target.value })}
                  />
                </div>
              );
            })}
          </Group>
        ))}

        <Group title="역량" count={form.competencies.length} max={MAX_COMPETENCIES}>
          {form.competencies.map((competency, index) => {
            const set = (patch: Partial<CompetencyForm>) =>
              update({
                competencies: form.competencies.map((c, i) =>
                  i === index ? { ...c, ...patch } : c,
                ),
              });
            return (
              <div key={index} className="space-y-2 rounded-md border border-gray-200 p-3">
                <Row
                  onRemove={() =>
                    update({ competencies: form.competencies.filter((_, i) => i !== index) })
                  }
                  removeLabel={`역량 ${index + 1} 지우기`}
                >
                  <Input
                    aria-label={`역량 ${index + 1} 이름`}
                    placeholder="역량 이름"
                    maxLength={TEXT_MAX}
                    value={competency.name}
                    onChange={(event) => set({ name: event.target.value })}
                  />
                </Row>
                {/* 원문 문장 그대로다. 오른쪽 원문에서 같은 문장을 찾아 대조한다. */}
                <Textarea
                  aria-label={`역량 ${index + 1} 공고 문장`}
                  placeholder="그 역량을 요구하는 공고 문장 그대로"
                  rows={2}
                  maxLength={TEXT_MAX}
                  value={competency.quote}
                  onChange={(event) => set({ quote: event.target.value })}
                />
                <Textarea
                  aria-label={`역량 ${index + 1} 설명`}
                  placeholder="설명"
                  rows={2}
                  maxLength={TEXT_MAX}
                  value={competency.description}
                  onChange={(event) => set({ description: event.target.value })}
                />
                <p className="text-xs text-gray-500">
                  연결하기 좋은 경험 {competency.experiences.length}/{MAX_EXPERIENCES}
                </p>
                <LineList
                  label={`역량 ${index + 1} 경험`}
                  items={competency.experiences}
                  max={MAX_EXPERIENCES}
                  onChange={(experiences) => set({ experiences })}
                />
              </div>
            );
          })}
          <AddButton
            label="역량 추가"
            disabled={form.competencies.length >= MAX_COMPETENCIES}
            onClick={() =>
              update({
                competencies: [
                  ...form.competencies,
                  { name: '', quote: '', description: '', experiences: [] },
                ],
              })
            }
          />
        </Group>
      </div>

      <div className="space-y-2 pt-3">
        {missing.length > 0 ? (
          <p className="text-sm text-error">채워야 저장할 수 있습니다: {missing.join(', ')}</p>
        ) : null}
        {mutation.isError ? (
          <Callout tone="error">
            {serverErrorMessage(mutation.error) ??
              '분석을 저장하지 못했습니다. 다시 시도해 주세요.'}
          </Callout>
        ) : null}
        {dirty || !analysis ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!dirty || missing.length > 0 || mutation.isPending}
              onClick={() => mutation.mutate({ jobId: job.id, analysis: toAnalysis(form) })}
            >
              {mutation.isPending ? '저장 중' : '분석 결과 저장'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setForm(base);
                setWriting(analysis !== null);
                mutation.reset();
              }}
            >
              취소
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Group({
  title,
  count,
  max,
  children,
}: {
  title: string;
  count?: number;
  max?: number;
  children: ReactNode;
}) {
  return (
    <div>
      <h4 className="pb-1 text-sm font-medium text-gray-500">
        {title}
        {max !== undefined ? (
          <span className="pl-1 text-xs font-normal text-gray-400">
            {count}/{max}
          </span>
        ) : null}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  children,
  onRemove,
  removeLabel,
}: {
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0"
        aria-label={removeLabel}
        onClick={onRemove}
      >
        지우기
      </Button>
    </div>
  );
}

function AddButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button size="sm" variant="secondary" disabled={disabled} onClick={onClick}>
      {disabled ? `${label} (최대)` : label}
    </Button>
  );
}

/** 글 한 줄씩의 목록(필수·우대 조건, 경험). 상한에 닿으면 추가를 잠근다. */
function LineList({
  label,
  items,
  max,
  onChange,
}: {
  label: string;
  items: string[];
  max: number;
  onChange: (items: string[]) => void;
}) {
  return (
    <>
      {items.length === 0 ? <p className="text-sm text-gray-300">없음</p> : null}
      {items.map((item, index) => (
        <Row
          key={index}
          onRemove={() => onChange(items.filter((_, i) => i !== index))}
          removeLabel={`${label} ${index + 1} 지우기`}
        >
          <Input
            aria-label={`${label} ${index + 1}`}
            maxLength={TEXT_MAX}
            value={item}
            onChange={(event) =>
              onChange(items.map((v, i) => (i === index ? event.target.value : v)))
            }
          />
        </Row>
      ))}
      <AddButton
        label={`${label} 추가`}
        disabled={items.length >= max}
        onClick={() => onChange([...items, ''])}
      />
    </>
  );
}
