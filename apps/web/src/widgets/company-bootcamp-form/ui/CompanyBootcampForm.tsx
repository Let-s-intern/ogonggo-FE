'use client';

import { useEffect, useState } from 'react';
import { FormSection } from '@/shared/ui/FormSection';
import { fetchMyBootcamp } from '../lib/api';
import {
  EMPTY_COMPANY_BOOTCAMP_VALUES,
  toCompanyBootcampValues,
  type CompanyBootcampFormValues,
} from '../model/values';
import { BootcampBasicInfoSection } from './BootcampBasicInfoSection';
import { BootcampContentSection } from './BootcampContentSection';

export interface CompanyBootcampFormProps {
  /** 있으면 수정, 없으면 새 공고. 작성한 공고 표에서 넘어올 때만 있다. */
  bootcampId?: number;
}

/**
 * 교육·부트캠프 작성·수정 폼(v5 PRD 4 절, 목업 `docs/asset/v5 기업회원 마이페이지/교육
 * 부트캠프 공고 등록.png`).
 *
 * 채용공고 폼과 같은 3 단 아코디언이고(`shared/ui/FormSection.tsx`) 세 단이 한 벌의 값을
 * 나눠 그린다. 값은 여기 한 곳에 있다 — 단마다 상태를 두면 저장할 때 세 곳에서 모아야 하고,
 * 접힌 단의 값이 어디 있는지가 화면 구조에 딸리게 된다.
 *
 * 세 단이 처음부터 모두 펼쳐져 있다. 목업이 그렇고, 무엇을 더 채워야 하는지가 한눈에 보여야
 * 등록이 왜 막혔는지 알 수 있다.
 *
 * `bootcampId` 가 있으면 수정이다. `getMyBootcamp` 으로 값을 채운다.
 *
 * 값을 읽어 오는 동안은 폼을 그리지 않는다. 빈 폼을 먼저 보이면 그 사이에 저장한 사람이
 * 자기 공고를 빈 값으로 덮어쓴다.
 */
export function CompanyBootcampForm({ bootcampId }: CompanyBootcampFormProps) {
  const [values, setValues] = useState<CompanyBootcampFormValues>(EMPTY_COMPANY_BOOTCAMP_VALUES);
  const [loading, setLoading] = useState(bootcampId !== undefined);
  const [openSteps, setOpenSteps] = useState<readonly number[]>([1, 2, 3]);
  /** 모자란 칸의 이름, 또는 저장이 실패한 이유. 버튼 바로 위에 한 줄로 띄운다. */
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (bootcampId === undefined) {
      return;
    }
    let active = true;
    setLoading(true);
    fetchMyBootcamp(bootcampId)
      .then((bootcamp) => {
        if (!active) {
          return;
        }
        if (bootcamp) {
          setValues(toCompanyBootcampValues(bootcamp));
        } else {
          setFormError('부트캠프 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      })
      .catch(() => {
        if (active) {
          setFormError('부트캠프 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [bootcampId]);

  const change = (patch: Partial<CompanyBootcampFormValues>) =>
    setValues((previous) => ({ ...previous, ...patch }));

  const toggle = (step: number) =>
    setOpenSteps((previous) =>
      previous.includes(step) ? previous.filter((item) => item !== step) : [...previous, step],
    );

  if (loading) {
    return <p className="py-16 text-center text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  return (
    <form className="flex flex-col gap-4">
      <FormSection
        name="company-bootcamp-form"
        step={1}
        title="기본 정보"
        description="공고를 소개하는 기본 정보를 입력해 주세요"
        open={openSteps.includes(1)}
        onToggle={() => toggle(1)}
      >
        <BootcampBasicInfoSection values={values} onChange={change} />
      </FormSection>

      <FormSection
        name="company-bootcamp-form"
        step={2}
        title="교육 상세"
        description="프로그램의 특징과 커리큘럼을 입력해 주세요"
        open={openSteps.includes(2)}
        onToggle={() => toggle(2)}
      >
        <BootcampContentSection values={values} onChange={change} />
      </FormSection>

      {formError ? (
        <p role="alert" className="text-sm text-error">
          {formError}
        </p>
      ) : null}
    </form>
  );
}
