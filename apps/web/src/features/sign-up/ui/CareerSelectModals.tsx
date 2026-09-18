'use client';

import { type ReactNode, useState } from 'react';
import type { ReplaceMyProfileRequestGrade } from '@ogonggo/api';
import { Button, Checkbox, Modal, cn } from '@ogonggo/ui';
import {
  ALL_ROLES_SUFFIX,
  ANY_INDUSTRY,
  ANY_JOB_FIELD,
  ANY_JOB_ROLE,
  DESIRED_INDUSTRIES,
  GRADE_ENUM_TO_KOREAN,
  JOB_FIELD_ROLES,
} from '../lib/careerOptions';
import type { CareerModalControls, CareerModalStep } from '../lib/useCareerModals';

/** 직무·산업은 셋까지 고른다. */
const MAX_SELECTIONS = 3;

const TITLES: Record<Exclude<CareerModalStep, null>, string> = {
  grade: '학년',
  field: '직군',
  position: '직무 선택 (최대 3개)',
  industry: '산업 선택 (최대 3개)',
};

const GRADES = Object.entries(GRADE_ENUM_TO_KOREAN) as [ReplaceMyProfileRequestGrade, string][];

export interface CareerSelectModalsProps {
  controls: CareerModalControls;
  grade: ReplaceMyProfileRequestGrade | null;
  onGradeComplete: (grade: ReplaceMyProfileRequestGrade) => void;
}

/**
 * 커리어 정보의 선택형 칸(학년, 희망 직군·직무·산업) 이 여는 모달.
 *
 * 렛츠커리어 `apps/web/src/domain/mypage/career/CareerModal.tsx`(origin/main `cd59fa5`) 와 같은 동작이다.
 * - 학년·직군은 하나를 누르면 곧바로 정해진다. 직군을 정하면 직무 모달로 넘어간다(`직군 무관` 이면 닫는다)
 * - 직무·산업은 셋까지. 셋을 고르면 나머지가 꺼진다. `<직군> 직무 전체` 와 `산업 무관` 은 혼자만 고를 수 있다
 * - 직무 모달의 "이전으로" 는 고르던 직무를 버리고 직군 모달로 돌아간다
 * - 고른 값은 "선택 완료" 를 눌러야 칸에 들어간다. 닫으면 버린다
 *
 * 모달 하나를 단계마다 제목과 내용만 바꿔 쓴다. 직군에서 직무로 넘어갈 때 닫혔다 다시 열리지 않게.
 * 단계가 바뀌면 `key` 로 내용을 새로 만들어, 고르던 값이 칸의 값에서 다시 시작한다(원본의 `useEffect` 초기화).
 */
export function CareerSelectModals({ controls, grade, onGradeComplete }: CareerSelectModalsProps) {
  const { modalStep, closeModal } = controls;

  return (
    <Modal
      open={modalStep !== null}
      title={modalStep ? TITLES[modalStep] : ''}
      onClose={closeModal}
      className="w-[min(22rem,calc(100vw-2rem))]"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={closeModal}
        className="absolute top-6 right-6 text-gray-500 hover:text-gray-900"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
          <path
            d="M15 5 5 15M5 5l10 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {modalStep === 'grade' ? (
        <OptionList
          options={GRADES.map(([value, label]) => ({ value, label }))}
          selected={grade}
          onSelect={onGradeComplete}
        />
      ) : null}
      {modalStep === 'field' ? (
        <OptionList
          options={JOB_FIELD_ROLES.map(({ jobField }) => ({ value: jobField, label: jobField }))}
          selected={controls.selectedField}
          onSelect={(field) =>
            controls.handleFieldComplete(field, field === ANY_JOB_FIELD ? [ANY_JOB_ROLE] : [])
          }
        />
      ) : null}
      {modalStep === 'position' ? <PositionStep key="position" controls={controls} /> : null}
      {modalStep === 'industry' ? <IndustryStep key="industry" controls={controls} /> : null}
    </Modal>
  );
}

/** 하나를 누르면 곧바로 정해지는 목록(학년, 직군). 고른 줄은 파란 글자와 체크 표시. */
function OptionList<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <ul className="-mx-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto">
      {options.map(({ value, label }) => {
        const isSelected = selected === value;
        return (
          <li key={value}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(value)}
              className={cn(
                'flex w-full items-center justify-between rounded-xs px-3 py-1.5 text-left leading-6.5',
                isSelected ? 'text-blue-500' : 'text-gray-800 hover:bg-gray-50',
              )}
            >
              <span>{label}</span>
              {isSelected ? (
                <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
                  <path
                    d="M16.67 5 7.5 14.17 3.33 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 셋까지 고르는 체크 목록. `exclusive` 인 항목은 혼자만 고를 수 있다 — 그것이 골라져 있으면 나머지가 꺼지고,
 * 다른 것이 골라져 있을 때 누르면 그것 하나로 바뀐다(원본 `handlePositionSelect`·`handleIndustrySelect`).
 */
function MultiSelectList({
  options,
  selected,
  onChange,
  isExclusive,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  isExclusive: (option: string) => boolean;
}) {
  const hasExclusive = selected.some(isExclusive);

  const toggle = (option: string) => {
    if (isExclusive(option)) {
      onChange(selected.includes(option) ? [] : [option]);
      return;
    }
    if (hasExclusive) {
      return;
    }
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, option]);
    }
  };

  return (
    <ul className="-mx-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const isDisabled =
          (!isSelected && selected.length >= MAX_SELECTIONS) ||
          (!isSelected && !isExclusive(option) && hasExclusive);
        return (
          <li key={option} className="rounded-xs px-3 py-1.5 hover:bg-gray-50">
            <Checkbox
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => toggle(option)}
              label={option}
              labelClassName="text-base"
            />
          </li>
        );
      })}
    </ul>
  );
}

function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="-mx-6 mt-4 flex gap-2 border-t border-gray-200 px-6 pt-4">{children}</div>;
}

function PositionStep({ controls }: { controls: CareerModalControls }) {
  const [draft, setDraft] = useState<string[]>(controls.selectedPositions);
  const roles = JOB_FIELD_ROLES.find(({ jobField }) => jobField === controls.selectedField);
  if (!roles) {
    return null;
  }

  // 원본처럼 고르던 직무만 버리고 직군 모달로 간다. 칸의 값은 새 직군을 고를 때 바뀐다.
  const backToField = () => controls.setModalStep('field');

  return (
    <>
      <MultiSelectList
        options={roles.jobRoles}
        selected={draft}
        onChange={setDraft}
        isExclusive={(role) => role.includes(ALL_ROLES_SUFFIX)}
      />
      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 rounded-xs"
          onClick={backToField}
        >
          이전으로
        </Button>
        <Button
          type="button"
          className="flex-1 rounded-xs disabled:bg-gray-300"
          disabled={draft.length === 0}
          onClick={() => controls.handlePositionsComplete(draft)}
        >
          선택 완료
        </Button>
      </ModalFooter>
    </>
  );
}

function IndustryStep({ controls }: { controls: CareerModalControls }) {
  const [draft, setDraft] = useState<string[]>(controls.selectedIndustries);

  return (
    <>
      <MultiSelectList
        options={DESIRED_INDUSTRIES}
        selected={draft}
        onChange={setDraft}
        isExclusive={(industry) => industry === ANY_INDUSTRY}
      />
      <ModalFooter>
        <Button
          type="button"
          className="flex-1 rounded-xs disabled:bg-gray-300"
          disabled={draft.length === 0}
          onClick={() => controls.handleIndustriesComplete(draft)}
        >
          선택 완료
        </Button>
      </ModalFooter>
    </>
  );
}
