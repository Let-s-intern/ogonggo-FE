'use client';

import { Field, Input, Select } from '@ogonggo/ui';
import {
  CAPACITY_OPTIONS,
  DURATION_OPTIONS,
  PROGRESS_METHOD_OPTIONS,
  RECRUITMENT_TYPE_OPTIONS,
} from '../model/options';
import type { RecruitmentPostFormValues } from '../model/values';
import { TechnologyStackInput } from './TechnologyStackInput';

/** `CreateRecruitmentPostRequest.title` 의 `@maxLength`. */
const MAX_TITLE_LENGTH = 255;

export interface BasicInfoSectionProps {
  values: RecruitmentPostFormValues;
  onChange: (patch: Partial<RecruitmentPostFormValues>) => void;
}

/**
 * 1 단 기본 정보(PRD 5 절). 이름 · 모집 구분 · 모집 인원 · 진행 방식 · 진행 기간 · 기술 스택.
 *
 * **목업과 다르게 그리는 것 하나가 이 단에 있다.** 진행 기간이 시작·종료 날짜 쌍이 아니라
 * `activityDurationMonths` 개월 정수 하나다 — 백엔드가 받는 것이 그것뿐이다.
 *
 * 드롭다운 폭을 `w-full` 로 준다. `Select` 의 기본 폭은 필터 줄에 맞춘 내용 폭이라, 두 칸씩
 * 나란한 이 폼에서는 왼쪽 칸과 오른쪽 칸의 너비가 달라 보인다.
 */
export function BasicInfoSection({ values, onChange }: BasicInfoSectionProps) {
  return (
    <div>
      <Field label="사이드 프로젝트 · 스터디명" htmlFor="post-title" required>
        <Input
          id="post-title"
          value={values.title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="사이드 프로젝트 · 스터디 이름을 입력해 주세요."
        />
      </Field>

      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field label="모집 구분" htmlFor="post-recruitment-type" required>
          <Select
            id="post-recruitment-type"
            className="h-11 w-full px-4 text-base"
            options={RECRUITMENT_TYPE_OPTIONS}
            value={values.recruitmentType}
            onChange={(event) =>
              onChange({
                recruitmentType: event.target.value as RecruitmentPostFormValues['recruitmentType'],
              })
            }
          />
        </Field>

        <Field label="모집 인원" htmlFor="post-capacity" required>
          <Select
            id="post-capacity"
            className="h-11 w-full px-4 text-base"
            options={CAPACITY_OPTIONS}
            value={values.capacity}
            onChange={(event) => onChange({ capacity: event.target.value })}
          />
        </Field>

        <Field label="진행 방식" htmlFor="post-progress-method" required>
          <Select
            id="post-progress-method"
            className="h-11 w-full px-4 text-base"
            options={PROGRESS_METHOD_OPTIONS}
            value={values.progressMethod}
            onChange={(event) =>
              onChange({
                progressMethod: event.target.value as RecruitmentPostFormValues['progressMethod'],
              })
            }
          />
        </Field>

        {/* 목업은 시작·종료 날짜 쌍인데 백엔드는 개월 정수 하나다(PRD 5 절). */}
        <Field label="진행 기간" htmlFor="post-duration" required>
          <Select
            id="post-duration"
            className="h-11 w-full px-4 text-base"
            options={DURATION_OPTIONS}
            value={values.activityDurationMonths}
            onChange={(event) => onChange({ activityDurationMonths: event.target.value })}
          />
        </Field>
      </div>

      <Field label="기술 스택" htmlFor="post-technology-stacks" className="pb-0">
        <TechnologyStackInput
          id="post-technology-stacks"
          value={values.technologyStacks}
          onChange={(technologyStacks) => onChange({ technologyStacks })}
        />
      </Field>
    </div>
  );
}
