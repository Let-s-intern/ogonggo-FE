'use client';

import { useState } from 'react';
import { ANY_JOB_FIELD, ANY_JOB_ROLE } from './careerOptions';

export type CareerModalStep = 'grade' | 'field' | 'position' | 'industry' | null;

/**
 * 커리어 정보 선택 모달의 상태. 어느 모달이 열렸는지와 고른 직군·직무·산업을 든다.
 *
 * 렛츠커리어 `packages/hooks/src/useCareerModals.ts`(origin/main `cd59fa5`) 와 같은 동작이다. 직군을 고르면 직무
 * 모달로 넘어가고, `직군 무관` 이면 직무를 `직무 무관` 으로 정하고 닫는다. 직군 없이 직무 칸을 누르면 직군 모달이
 * 열린다. 원본의 `document.body.style.overflow` 는 `@ogonggo/ui` 의 `Modal` 이 이미 하므로 두지 않는다.
 */
export function useCareerModals(initial?: {
  field?: string | null;
  positions?: string[];
  industries?: string[];
}) {
  const [modalStep, setModalStep] = useState<CareerModalStep>(null);
  const [selectedField, setSelectedField] = useState<string | null>(initial?.field ?? null);
  const [selectedPositions, setSelectedPositions] = useState<string[]>(initial?.positions ?? []);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(initial?.industries ?? []);

  const closeModal = () => setModalStep(null);

  /** 칸에 보일 글자. `null` 이면 아직 고르지 않았다(칸이 안내 문구를 회색으로 보인다). */
  const fieldText = selectedField || null;
  const positionText =
    selectedField === ANY_JOB_FIELD
      ? ANY_JOB_ROLE
      : selectedField === null || selectedPositions.length === 0
        ? null
        : selectedPositions.join(', ');
  const industryText = selectedIndustries.length === 0 ? null : selectedIndustries.join(', ');

  const openPositionModal = () => {
    setModalStep(!selectedField || selectedField === ANY_JOB_FIELD ? 'field' : 'position');
  };

  const handleFieldComplete = (field: string, positions: string[]) => {
    setSelectedField(field);
    setSelectedPositions(positions);
    setModalStep(field === ANY_JOB_FIELD ? null : 'position');
  };

  const handlePositionsComplete = (positions: string[]) => {
    setSelectedPositions(positions);
    closeModal();
  };

  const handleIndustriesComplete = (industries: string[]) => {
    setSelectedIndustries(industries);
    closeModal();
  };

  return {
    modalStep,
    setModalStep,
    selectedField,
    setSelectedField,
    selectedPositions,
    setSelectedPositions,
    selectedIndustries,
    setSelectedIndustries,
    fieldText,
    positionText,
    industryText,
    closeModal,
    openPositionModal,
    handleFieldComplete,
    handlePositionsComplete,
    handleIndustriesComplete,
  };
}

export type CareerModalControls = ReturnType<typeof useCareerModals>;
