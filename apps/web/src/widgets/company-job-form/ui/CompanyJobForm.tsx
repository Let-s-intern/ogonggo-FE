'use client';

import { useEffect, useState } from 'react';
import { fetchMyJob } from '../lib/api';
import {
  EMPTY_COMPANY_JOB_VALUES,
  toCompanyJobValues,
  type CompanyJobFormValues,
} from '../model/values';
import { JobBasicInfoSection } from './JobBasicInfoSection';
import { JobContentSection } from './JobContentSection';
import { JobFormSection } from './JobFormSection';

export interface CompanyJobFormProps {
  /** 있으면 수정, 없으면 새 공고. 작성한 공고 표에서 넘어올 때만 있다. */
  jobId?: number;
}

/**
 * 채용공고 작성·수정 폼(v5 PRD 3 절, 목업 `docs/asset/v5 기업회원 마이페이지/채용공고
 * 등록.png`).
 *
 * 3 단 아코디언이고 세 단이 한 벌의 값을 나눠 그린다. 값은 여기 한 곳에 있다 — 단마다 상태를
 * 두면 저장할 때 세 곳에서 모아야 하고, 접힌 단의 값이 어디 있는지가 화면 구조에 딸리게 된다.
 *
 * 세 단이 처음부터 모두 펼쳐져 있다. 목업이 그렇고, 무엇을 더 채워야 하는지가 한눈에 보여야
 * 등록이 왜 막혔는지 알 수 있다.
 *
 * `jobId` 가 있으면 수정이다. `getMyJob` 으로 값을 채운다. **수정은 `PUT` 전체 교체라**
 * 보내지 않은 칸이 비워진다 — 그래서 목업에 칸이 없는 값들까지 읽어 두었다가 그대로 다시
 * 싣는다(`model/values.ts` 의 `CompanyJobPassthrough`).
 *
 * 값을 읽어 오는 동안은 폼을 그리지 않는다. 빈 폼을 먼저 보이면 그 사이에 저장한 사람이
 * 자기 공고를 빈 값으로 덮어쓴다.
 */
export function CompanyJobForm({ jobId }: CompanyJobFormProps) {
  const [values, setValues] = useState<CompanyJobFormValues>(EMPTY_COMPANY_JOB_VALUES);
  const [loading, setLoading] = useState(jobId !== undefined);
  const [openSteps, setOpenSteps] = useState<readonly number[]>([1, 2, 3]);
  /** 모자란 칸의 이름, 또는 저장이 실패한 이유. 버튼 바로 위에 한 줄로 띄운다. */
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId === undefined) {
      return;
    }
    let active = true;
    setLoading(true);
    fetchMyJob(jobId)
      .then((job) => {
        if (!active) {
          return;
        }
        if (job) {
          setValues(toCompanyJobValues(job));
        } else {
          setFormError('채용공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      })
      .catch(() => {
        if (active) {
          setFormError('채용공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
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
  }, [jobId]);

  const change = (patch: Partial<CompanyJobFormValues>) =>
    setValues((previous) => ({ ...previous, ...patch }));

  const toggle = (step: number) =>
    setOpenSteps((previous) =>
      previous.includes(step) ? previous.filter((item) => item !== step) : [...previous, step],
    );

  if (loading) {
    return <p className="py-16 text-center text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-col gap-4">
        <JobFormSection
          step={1}
          title="기본 정보"
          description="공고를 소개하는 기본 정보를 입력해 주세요"
          open={openSteps.includes(1)}
          onToggle={() => toggle(1)}
        >
          <JobBasicInfoSection values={values} onChange={change} />
        </JobFormSection>

        <JobFormSection
          step={2}
          title="상세 내용"
          description="커리큘럼과 지원 자격을 입력해 주세요"
          open={openSteps.includes(2)}
          onToggle={() => toggle(2)}
        >
          <JobContentSection values={values} onChange={change} />
        </JobFormSection>
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-error">
          {formError}
        </p>
      ) : null}
    </form>
  );
}
