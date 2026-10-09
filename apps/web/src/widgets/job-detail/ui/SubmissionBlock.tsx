import type { Fact, Submission } from '@ogonggo/api';
import { Condition, FactText, factNote, factValue, hasFact, NO_VALUE_TEXT } from './ConditionRow';

/** `submission.process.value` 가 단계를 잇는 글자. 예: `서류전형 → 면접전형 → 인성검사 → 입사`. */
const STEP_SEPARATOR = '→';

/**
 * 지원 서류 및 전형 절차(`docs/asset/v12 채용공고 상세/상세 기본.webp`): 서류, 전형, 마감 세 줄.
 *
 * - 서류: 제출 서류(`documents`) 아래에 자기소개서 문항(`essay`)이 있으면 한 줄 더 붙는다. 문항에는 시안에
 *   자리가 없어 라벨 없이 서류 줄 안에 둔다. 시안의 `필수`·`선택` 배지는 응답에 구분이 없어 그리지 않는다.
 * - 전형: `→` 로 나눈 단계를 화살표로 잇고, 보충 설명은 옆에 작은 파란 글로 붙인다.
 * - 마감: 값이 없으면 회색 `공고에 명시 없음`, 보충 설명은 작은 파란 글이다.
 *
 * 부르는 쪽이 네 값 중 하나라도 값이나 `note` 가 있을 때만 이 컴포넌트를 쓴다.
 */
export function SubmissionBlock({ submission }: { submission: Submission }) {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      <Condition label="서류">
        <div className="flex flex-col gap-2">
          <FactText fact={submission.documents} />
          {hasFact(submission.essay) ? <FactText fact={submission.essay} /> : null}
        </div>
      </Condition>
      <Condition label="전형">
        <ProcessSteps process={submission.process} />
      </Condition>
      <Condition label="마감">
        <FactText fact={submission.deadline} noteClassName="text-blue-500" />
      </Condition>
    </dl>
  );
}

function ProcessSteps({ process }: { process: Fact }) {
  const steps = (factValue(process) ?? '')
    .split(STEP_SEPARATOR)
    .map((step) => step.trim())
    .filter(Boolean);
  const note = factNote(process);

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {steps.length > 0 ? (
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {steps.map((step, index) => (
            <li key={`${index}-${step}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="icon-[lucide--arrow-right] block size-3.5 shrink-0 text-gray-400"
                />
              ) : null}
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : (
        <span className="text-gray-400">{NO_VALUE_TEXT}</span>
      )}
      {note ? <span className="text-xs text-blue-500">{note}</span> : null}
    </div>
  );
}
