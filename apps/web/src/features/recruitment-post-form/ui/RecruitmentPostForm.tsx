'use client';

import { useState } from 'react';
import { EMPTY_FORM_VALUES, type RecruitmentPostFormValues } from '../model/values';
import { BasicInfoSection } from './BasicInfoSection';
import { ContentSection } from './ContentSection';
import { FormSection } from './FormSection';

/**
 * 모집글 작성·수정 폼(PRD 5 절, 목업 `docs/asset/v4 마이페이지/작성한 모집글/사이드 프로젝트
 * 스터디 모집글 작성.png`).
 *
 * 3 단 아코디언이고 세 단이 한 벌의 값을 나눠 그린다. 값은 여기 한 곳에 있다 — 단마다 상태를
 * 두면 저장할 때 세 곳에서 모아야 하고, 접힌 단의 값이 어디 있는지가 화면 구조에 딸리게 된다.
 *
 * 세 단이 처음부터 모두 펼쳐져 있다. 목업이 그렇고, 무엇을 더 채워야 하는지가 한눈에 보여야
 * `모집글 등록` 이 왜 막혀 있는지 알 수 있다.
 */
export function RecruitmentPostForm() {
  const [values, setValues] = useState<RecruitmentPostFormValues>(EMPTY_FORM_VALUES);
  const [openSteps, setOpenSteps] = useState<readonly number[]>([1, 2, 3]);

  const change = (patch: Partial<RecruitmentPostFormValues>) =>
    setValues((previous) => ({ ...previous, ...patch }));

  const toggle = (step: number) =>
    setOpenSteps((previous) =>
      previous.includes(step) ? previous.filter((item) => item !== step) : [...previous, step],
    );

  return (
    <form className="flex flex-col gap-4">
      <FormSection
        step={1}
        title="기본 정보"
        description="프로젝트의 기본적인 정보를 입력해 주세요"
        open={openSteps.includes(1)}
        onToggle={() => toggle(1)}
      >
        <BasicInfoSection values={values} onChange={change} />
      </FormSection>

      <FormSection
        step={2}
        title="모집 내용"
        description="프로젝트의 모집 공고를 소개해 주세요"
        open={openSteps.includes(2)}
        onToggle={() => toggle(2)}
      >
        <ContentSection values={values} onChange={change} />
      </FormSection>
    </form>
  );
}
