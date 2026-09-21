'use client';

import { Button, Field, Input, Textarea } from '@ogonggo/ui';
import {
  EMPTY_HIRING_PROCESS_STEP,
  joinHiringProcess,
  type HiringProcessStep,
} from '../lib/hiringProcess';

export interface JobHiringProcessFieldProps {
  /** 합쳐져 저장되는 문자열. 요청에 실리는 것은 언제나 이 값이다. */
  value: string;
  steps: HiringProcessStep[];
  /**
   * 저장된 채용 절차를 읽어 온 경우다. 그때는 행이 아니라 한 덩어리 글로 그린다 —
   * 합친 문자열을 행으로 되돌리지 않는다(`lib/hiringProcess.ts`).
   */
  stored: boolean;
  onChange: (patch: { hiringProcess: string; hiringProcessSteps?: HiringProcessStep[] }) => void;
}

/**
 * 채용 절차(v5 PRD 3 절). **입력은 받는다** — 같은 단의 비활성 칸들과 다르다.
 *
 * 새 공고에서는 목업 그대로 날짜 + 내용의 반복 행이고, 저장할 때 한 문자열로 합쳐진다.
 * 저장된 공고를 열면 그 문자열을 한 덩어리로 보여 준다.
 *
 * 목업의 행 왼쪽 드래그 손잡이는 그리지 않는다. 순서를 담는 값이 없어(합쳐진 문자열의 줄
 * 순서가 전부다) 끌어 옮기는 것과 행을 지웠다 다시 적는 것의 결과가 같고, 손잡이만 있고
 * 끌리지 않으면 고장으로 읽힌다.
 */
export function JobHiringProcessField({
  value,
  steps,
  stored,
  onChange,
}: JobHiringProcessFieldProps) {
  const changeSteps = (next: HiringProcessStep[]) =>
    onChange({ hiringProcess: joinHiringProcess(next), hiringProcessSteps: next });

  if (stored) {
    return (
      <Field
        label="채용 절차"
        htmlFor="company-job-hiring-process"
        hint="저장된 채용 절차는 한 덩어리 글로 보관돼요. 날짜와 내용 행으로는 다시 나뉘지 않아요."
        className="pb-0"
      >
        <Textarea
          id="company-job-hiring-process"
          rows={4}
          value={value}
          onChange={(event) => onChange({ hiringProcess: event.target.value })}
          placeholder="채용 절차를 입력해주세요"
        />
      </Field>
    );
  }

  return (
    <Field
      label="채용 절차"
      hint="적은 행은 한 덩어리 글로 저장돼요. 다시 열면 행으로 나뉘지 않아요."
      className="pb-0"
    >
      <div className="flex flex-col gap-2">
        {steps.map((step, index) => (
          // 행에는 지울 때 말고 바뀌지 않는 식별자가 없다. 지우면 그 뒤 행이 한 칸씩
          // 당겨지는데, 값은 모두 부모가 들고 있어 자리만 옮겨 그리면 된다.
          <div key={index} className="flex items-center gap-2">
            <Input
              type="date"
              aria-label={`채용 절차 ${index + 1}단계 날짜`}
              className="w-44 shrink-0"
              value={step.date}
              onChange={(event) =>
                changeSteps(
                  steps.map((item, target) =>
                    target === index ? { ...item, date: event.target.value } : item,
                  ),
                )
              }
            />
            <Input
              aria-label={`채용 절차 ${index + 1}단계 내용`}
              value={step.description}
              onChange={(event) =>
                changeSteps(
                  steps.map((item, target) =>
                    target === index ? { ...item, description: event.target.value } : item,
                  ),
                )
              }
              placeholder="채용 절차를 입력해주세요"
            />
            <button
              type="button"
              aria-label={`채용 절차 ${index + 1}단계 삭제`}
              disabled={steps.length === 1}
              onClick={() => changeSteps(steps.filter((_, target) => target !== index))}
              className="flex size-11 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-400 disabled:cursor-not-allowed disabled:text-gray-200"
            >
              <span aria-hidden="true" className="icon-[lucide--trash-2] block size-4" />
            </button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => changeSteps([...steps, EMPTY_HIRING_PROCESS_STEP])}
        className="mt-2"
      >
        + 채용 절차 추가
      </Button>
    </Field>
  );
}
