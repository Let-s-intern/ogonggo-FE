'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@ogonggo/ui';
import { createJob, fetchMyJob, publishJob, replaceJob } from '../lib/api';
import { validateForDraft, validateForPublish } from '../model/validate';
import {
  EMPTY_COMPANY_JOB_PASSTHROUGH,
  EMPTY_COMPANY_JOB_VALUES,
  toCompanyJobPassthrough,
  toCompanyJobRequest,
  toCompanyJobValues,
  type CompanyJobFormValues,
  type CompanyJobPassthrough,
} from '../model/values';
import { JobApplySettingsSection } from './JobApplySettingsSection';
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
 *
 * 하단 버튼 둘은 저장까지는 같고 그 뒤가 다르다 — `공고 등록` 만 이어서 게시를 요청한다.
 * 등록은 언제나 초안으로 만들어지고, 게시는 운영자 검수를 통과한 공고만 된다(생성 타입 설명).
 * 그래서 검수 전 게시 실패(409) 는 실패로 보지 않는다(`lib/api.ts` 의 `publishJob`).
 *
 * 저장에 성공하면 작성한 공고 목록으로 간다. 방금 쓴 공고가 어떤 상태로 들어갔는지(검수
 * 대기인지 게시됐는지) 를 그 자리에서 보여 주는 화면이 거기뿐이다.
 */
export function CompanyJobForm({ jobId }: CompanyJobFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CompanyJobFormValues>(EMPTY_COMPANY_JOB_VALUES);
  /** 화면이 그리지 않는 값들. 저장할 때 읽어 온 그대로 다시 싣는다. */
  const [passthrough, setPassthrough] = useState<CompanyJobPassthrough>(
    EMPTY_COMPANY_JOB_PASSTHROUGH,
  );
  /**
   * 읽어 온 공고에 채용 절차가 이미 있었는지. 있으면 그 칸을 행이 아니라 한 덩어리 글로
   * 그린다 — 합친 문자열은 행으로 되돌리지 않는다(`lib/hiringProcess.ts`).
   */
  const [hiringProcessStored, setHiringProcessStored] = useState(false);
  const [loading, setLoading] = useState(jobId !== undefined);
  const [openSteps, setOpenSteps] = useState<readonly number[]>([1, 2, 3]);
  /** 모자란 칸의 이름, 또는 저장이 실패한 이유. 버튼 바로 위에 한 줄로 띄운다. */
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
          setPassthrough(toCompanyJobPassthrough(job));
          setHiringProcessStored(Boolean(job.hiringProcess));
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

  /**
   * 검사하는 것이 누른 버튼에 따라 다르다. 임시저장은 요청이 필수로 받는 넷만 보고, 등록은
   * 목업의 별표 칸 전부를 본다(`model/validate.ts`).
   */
  const save = async (publish: boolean) => {
    if (pending) {
      return;
    }
    const invalid = publish ? validateForPublish(values) : validateForDraft(values);
    if (invalid) {
      setFormError(invalid);
      return;
    }
    setFormError(null);
    setPending(true);
    const request = toCompanyJobRequest(values, passthrough);
    try {
      let savedId = jobId;
      if (savedId === undefined) {
        savedId = await createJob(request);
      } else {
        await replaceJob(savedId, request);
      }
      if (publish && savedId !== undefined) {
        await publishJob(savedId);
      }
      router.push('/mypage/company/posts');
    } catch {
      setFormError(
        publish
          ? '채용공고를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.'
          : '임시저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setPending(false);
    }
  };

  if (loading) {
    return <p className="py-16 text-center text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save(true);
      }}
    >
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
          <JobContentSection
            values={values}
            onChange={change}
            hiringProcessStored={hiringProcessStored}
          />
        </JobFormSection>

        <JobFormSection
          step={3}
          title="모집 · 지원 설정"
          description="마감일과 지원 방법을 설정해 주세요"
          open={openSteps.includes(3)}
          onToggle={() => toggle(3)}
        >
          <JobApplySettingsSection values={values} onChange={change} />
        </JobFormSection>
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-error">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-center gap-4 pt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => void save(false)}
          className="w-full max-w-72"
        >
          임시저장
        </Button>
        <Button type="submit" disabled={pending} className="w-full max-w-80">
          공고 등록
        </Button>
      </div>
    </form>
  );
}
