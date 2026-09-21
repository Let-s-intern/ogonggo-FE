'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CreateRecruitmentPostRequestSaveMode } from '@ogonggo/api';
import { Button } from '@ogonggo/ui';
import { createMyPost } from '@/entities/side-study/api/myRecruitmentPosts';
import { validateForDraft, validateForPublish } from '../model/validate';
import {
  EMPTY_FORM_VALUES,
  toCreateRequest,
  type RecruitmentPostFormValues,
} from '../model/values';
import { ApplySettingsSection } from './ApplySettingsSection';
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
 * `모집글 등록` 이 왜 막혔는지 알 수 있다.
 *
 * 저장에 성공하면 작성한 모집글 목록으로 간다. 방금 쓴 글이 목록에 어떻게 들어갔는지(게시됐는지,
 * 임시저장으로 남았는지) 를 그 자리에서 보여 주는 화면이 거기뿐이다.
 *
 * 하단 버튼 둘이 같은 호출을 `saveMode` 만 달리해서 한다 — `임시저장` 이 `DRAFT`,
 * `모집글 등록` 이 `PUBLISH` 다(PRD 5 절). 별도 발행 API(`/publish`) 도 있지만 생성 타입이
 * "레거시, PUT + saveMode 권장" 이라고 적고 있어 쓰지 않는다.
 */
export function RecruitmentPostForm() {
  const router = useRouter();
  const [values, setValues] = useState<RecruitmentPostFormValues>(EMPTY_FORM_VALUES);
  const [openSteps, setOpenSteps] = useState<readonly number[]>([1, 2, 3]);
  /** 모자란 칸의 이름, 또는 저장이 실패한 이유. 버튼 바로 위에 한 줄로 띄운다. */
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const change = (patch: Partial<RecruitmentPostFormValues>) =>
    setValues((previous) => ({ ...previous, ...patch }));

  const toggle = (step: number) =>
    setOpenSteps((previous) =>
      previous.includes(step) ? previous.filter((item) => item !== step) : [...previous, step],
    );

  /**
   * 검사하는 것이 `saveMode` 에 따라 다르다. `DRAFT` 는 제목만 보고, `PUBLISH` 는 게시 필수값
   * 전부와 정책 동의를 본다.
   */
  const save = async (saveMode: CreateRecruitmentPostRequestSaveMode) => {
    if (pending) {
      return;
    }
    const invalid =
      saveMode === 'DRAFT' ? validateForDraft(values) : validateForPublish(values);
    if (invalid) {
      setFormError(invalid);
      return;
    }
    setFormError(null);
    setPending(true);
    try {
      await createMyPost(toCreateRequest(values, saveMode));
      router.push('/mypage/posts');
    } catch {
      setFormError(
        saveMode === 'DRAFT'
          ? '임시저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
          : '모집글을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setPending(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save('PUBLISH');
      }}
    >
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

      <FormSection
        step={3}
        title="지원 설정"
        description="모집 기간과 지원 방법을 설정해 주세요"
        open={openSteps.includes(3)}
        onToggle={() => toggle(3)}
      >
        <ApplySettingsSection values={values} onChange={change} />
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
          onClick={() => void save('DRAFT')}
          className="w-full max-w-72"
        >
          임시저장
        </Button>
        <Button type="submit" disabled={pending} className="w-full max-w-80">
          모집글 등록
        </Button>
      </div>
    </form>
  );
}
