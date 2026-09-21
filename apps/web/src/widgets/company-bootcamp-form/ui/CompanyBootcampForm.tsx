'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@ogonggo/ui';
import { FormSection } from '@/shared/ui/FormSection';
import {
  createBootcamp,
  fetchMyBootcamp,
  replaceBootcamp,
  startBootcampRecruitment,
} from '../lib/api';
import { validateForDraft, validateForPublish } from '../model/validate';
import {
  EMPTY_COMPANY_BOOTCAMP_PASSTHROUGH,
  EMPTY_COMPANY_BOOTCAMP_VALUES,
  toCompanyBootcampPassthrough,
  toCompanyBootcampRequest,
  toCompanyBootcampValues,
  toCreateCompanyBootcampRequest,
  type CompanyBootcampFormValues,
  type CompanyBootcampPassthrough,
} from '../model/values';
import { BootcampApplySettingsSection } from './BootcampApplySettingsSection';
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
 *
 * 하단 버튼 둘은 저장까지는 같고 그 뒤가 다르다 — `공고 등록` 만 이어서 모집 시작을
 * 요청한다. **부트캠프에는 `/publish` 가 없다**(v5 PRD 4 절): 새 공고는 언제나 `DRAFT` 로
 * 만들어지고, 공개는 `start-recruitment` 가 만든다(`lib/api.ts`).
 *
 * 저장에 성공하면 작성한 공고의 부트캠프 탭으로 간다. 방금 쓴 공고가 어떤 상태로 들어갔는지
 * (검수 대기인지 모집 중인지) 를 그 자리에서 보여 주는 화면이 거기뿐이다.
 */
export function CompanyBootcampForm({ bootcampId }: CompanyBootcampFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CompanyBootcampFormValues>(EMPTY_COMPANY_BOOTCAMP_VALUES);
  /** 화면이 그리지 않는 값들. 저장할 때 읽어 온 그대로 다시 싣는다. */
  const [passthrough, setPassthrough] = useState<CompanyBootcampPassthrough>(
    EMPTY_COMPANY_BOOTCAMP_PASSTHROUGH,
  );
  const [loading, setLoading] = useState(bootcampId !== undefined);
  const [pending, setPending] = useState(false);
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
          setPassthrough(toCompanyBootcampPassthrough(bootcamp));
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

  /**
   * 검사하는 것이 누른 버튼에 따라 다르다. 임시저장은 요청이 빈 값으로 받지 못하는 칸만
   * 보고, 등록은 목업의 별표 칸 전부를 본다(`model/validate.ts`).
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
    try {
      let savedId = bootcampId;
      if (savedId === undefined) {
        savedId = await createBootcamp(
          toCreateCompanyBootcampRequest(values, passthrough, 'DRAFT'),
        );
      } else {
        await replaceBootcamp(savedId, toCompanyBootcampRequest(values, passthrough));
      }
      if (publish && savedId !== undefined) {
        await startBootcampRecruitment(savedId);
      }
      router.push('/mypage/company/posts?tab=bootcamps');
    } catch {
      setFormError(
        publish
          ? '부트캠프 공고를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.'
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

      <FormSection
        name="company-bootcamp-form"
        step={3}
        title="모집 · 지원 설정"
        description="마감일과 지원 방법을 설정해 주세요"
        open={openSteps.includes(3)}
        onToggle={() => toggle(3)}
      >
        <BootcampApplySettingsSection values={values} onChange={change} />
      </FormSection>

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
