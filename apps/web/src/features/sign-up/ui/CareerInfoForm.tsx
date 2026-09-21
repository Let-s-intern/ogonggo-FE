'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import {
  HttpError,
  type MyProfileResponse,
  type ReplaceMyProfileRequestGrade,
  replaceMyProfile,
} from '@ogonggo/api';
import { Button, Checkbox, Input, cn } from '@ogonggo/ui';
import { takeReturnPath } from '@/shared/lib/returnPath';
import { ChevronIcon } from '@/shared/ui/icons';
import { GRADE_ENUM_TO_KOREAN, JOB_CONDITIONS, WISH_VALUE_SEPARATOR } from '../lib/careerOptions';
import { useCareerModals } from '../lib/useCareerModals';
import { CareerSelectModals } from './CareerSelectModals';
import { SIGN_UP_INPUT_CLASS, SIGN_UP_SUBMIT_CLASS, SignUpField } from './SignUpField';

/** 백엔드 `ReplaceMyProfileRequest` 의 `@Size`. 학교·전공 30 자, 나머지 1000 자. */
const MAX_SCHOOL_LENGTH = 30;
const MAX_WISH_LENGTH = 1000;

/** 쉼표로 이은 값을 나눈다. 렛츠커리어·오공고 모두 `,` 로 자르고 앞뒤 공백을 지운다. */
function splitWishValues(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isGrade(value: string | undefined): value is ReplaceMyProfileRequestGrade {
  return value !== undefined && Object.hasOwn(GRADE_ENUM_TO_KOREAN, value);
}

/** 빈 칸은 보내지 않는다. 보내지 않은 값은 백엔드가 비운다. */
const textOrUndefined = (value: string) => value.trim() || undefined;
const joinOrUndefined = (values: string[]) =>
  values.length > 0 ? values.join(WISH_VALUE_SEPARATOR) : undefined;

export interface CareerInfoFormProps {
  /**
   * 지금 저장된 값(`getMyAccount` 의 `profile`). 오공고는 첫 교환 때 렛츠커리어의 커리어 정보를 복사해 오므로
   * 새 회원도 값이 있을 수 있다. `replaceMyProfile` 은 보내지 않은 값을 비우므로, 채워 두지 않으면 복사해 온 값을
   * 빈 칸으로 덮어쓴다.
   */
  initialProfile: MyProfileResponse;
  /** 학교·학년·전공 세 칸 위의 소제목. 마이페이지는 구역 제목이 따로 있어 다른 말을 넘긴다. */
  heading?: string;
  /** 저장 버튼 문구. */
  submitLabel?: string;
  /**
   * 저장에 성공한 뒤 할 일. 기본은 로그인 전에 있던 화면으로 돌아가기 — 가입 흐름의 마지막 화면이라 그렇다.
   * 마이페이지는 같은 화면에 머물러야 해서 자기 것을 넘긴다.
   */
  onSaved?: () => void;
  /** 저장 버튼 아래 `다음에 하기`. 가입 흐름에만 뜻이 있다. */
  showSkip?: boolean;
}

/**
 * 커리어 정보 폼(`회원가입 유저 정보.png`). 모든 칸이 선택이다.
 *
 * "입력 완료" 는 여덟 값을 `replaceMyProfile` 로 보낸다. 직무·산업·구직 조건은 렛츠커리어와 같게 `', '` 로 잇고,
 * 구직 조건은 문구가 아니라 렛츠커리어의 `value`(`PUBLIC` 등) 를 보낸다(`lib/careerOptions.ts`).
 * "다음에 하기" 는 아무것도 보내지 않는다. 둘 다 로그인 전에 있던 화면(없으면 홈) 으로 간다.
 *
 * 칸이 모두 비면 "입력 완료" 가 꺼진다(디자인의 회색 버튼).
 *
 * **마이페이지 개인 정보(PRD 6 절) 도 이 폼을 쓴다.** 고치는 값이 같은 여덟이고, 저장하기 전에 지금 값으로
 * 채워야 한다는 제약도 같다. 두 화면의 차이는 소제목·버튼 문구·저장 뒤 행동 셋뿐이라 그것만 인자로 받는다.
 */
export function CareerInfoForm({
  initialProfile,
  heading = '기본 정보',
  submitLabel = '입력 완료',
  onSaved,
  showSkip = true,
}: CareerInfoFormProps) {
  const router = useRouter();
  const controls = useCareerModals({
    field: initialProfile.wishField || null,
    positions: splitWishValues(initialProfile.wishJob),
    industries: splitWishValues(initialProfile.wishIndustry),
  });
  const [university, setUniversity] = useState(initialProfile.university ?? '');
  const [major, setMajor] = useState(initialProfile.major ?? '');
  const [wishCompany, setWishCompany] = useState(initialProfile.wishCompany ?? '');
  const [grade, setGrade] = useState<ReplaceMyProfileRequestGrade | null>(
    isGrade(initialProfile.grade) ? initialProfile.grade : null,
  );
  // 목록에 없는 값(렛츠커리어가 나중에 더한 조건 등) 도 버리지 않고 다시 보낸다.
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(
    splitWishValues(initialProfile.wishEmploymentType),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const { selectedField, selectedPositions, selectedIndustries } = controls;
  const filled =
    [university, major, wishCompany].some((value) => value.trim() !== '') ||
    grade !== null ||
    !!selectedField ||
    selectedPositions.length > 0 ||
    selectedIndustries.length > 0 ||
    employmentTypes.length > 0;

  const leave = () => router.replace(takeReturnPath() ?? '/');

  const toggleEmploymentType = (value: string, checked: boolean) => {
    setEmploymentTypes((previous) =>
      checked ? [...previous, value] : previous.filter((item) => item !== value),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || !filled) {
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      await replaceMyProfile({
        university: textOrUndefined(university),
        major: textOrUndefined(major),
        grade: grade ?? undefined,
        wishField: selectedField || undefined,
        wishJob: joinOrUndefined(selectedPositions),
        wishIndustry: joinOrUndefined(selectedIndustries),
        wishEmploymentType: joinOrUndefined(employmentTypes),
        wishCompany: textOrUndefined(wishCompany),
      });
      if (onSaved) {
        // 같은 화면에 머무는 쪽(마이페이지). 다시 저장할 수 있어야 하므로 pending 을 푼다.
        setPending(false);
        onSaved();
        return;
      }
      // 성공하면 화면을 떠나므로 pending 을 풀지 않는다.
      leave();
    } catch (caught) {
      setFormError(
        caught instanceof HttpError && caught.status === 400
          ? '입력한 값을 저장하지 못했습니다. 입력한 내용을 확인해 주세요.'
          : '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setPending(false);
    }
  };

  return (
    <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
      <h2 className="pb-8 text-lg font-semibold text-gray-900">{heading}</h2>
      <div className="flex flex-col gap-5">
        <SignUpField label="학교" htmlFor="career-university">
          <Input
            id="career-university"
            value={university}
            onChange={(event) => setUniversity(event.target.value)}
            maxLength={MAX_SCHOOL_LENGTH}
            placeholder="학교 이름을 입력해 주세요."
            className={SIGN_UP_INPUT_CLASS}
          />
        </SignUpField>
        <SelectField
          id="career-grade"
          label="학년"
          value={grade ? GRADE_ENUM_TO_KOREAN[grade] : null}
          placeholder="학년을 선택해 주세요."
          onClick={() => controls.setModalStep('grade')}
        />
        <SignUpField label="전공" htmlFor="career-major">
          <Input
            id="career-major"
            value={major}
            onChange={(event) => setMajor(event.target.value)}
            maxLength={MAX_SCHOOL_LENGTH}
            placeholder="전공을 입력해 주세요."
            className={SIGN_UP_INPUT_CLASS}
          />
        </SignUpField>
      </div>

      <div className="flex flex-col gap-5 pt-12">
        <SelectField
          id="career-wishField"
          label="희망 직군"
          value={controls.fieldText}
          placeholder="희망 직군을 선택해 주세요."
          onClick={() => controls.setModalStep('field')}
        />
        <SelectField
          id="career-wishJob"
          label="희망 직무 (최대 3개)"
          value={controls.positionText}
          placeholder="희망 직무를 선택해 주세요."
          onClick={controls.openPositionModal}
        />
        <SelectField
          id="career-wishIndustry"
          label="희망 산업 (최대 3개)"
          value={controls.industryText}
          placeholder="희망 산업을 선택해 주세요."
          onClick={() => controls.setModalStep('industry')}
        />
        <SignUpField label="희망 기업" htmlFor="career-wishCompany">
          <Input
            id="career-wishCompany"
            value={wishCompany}
            onChange={(event) => setWishCompany(event.target.value)}
            maxLength={MAX_WISH_LENGTH}
            placeholder="기업 이름을 입력해 주세요."
            className={SIGN_UP_INPUT_CLASS}
          />
        </SignUpField>
      </div>

      {/* fieldset 의 legend 는 padding 위에 붙어 위 칸과 겹친다. 같은 뜻을 role 로 준다. */}
      <div role="group" aria-labelledby="career-conditions" className="flex flex-col gap-3 pt-12">
        <p id="career-conditions" className="pb-1 text-base font-medium text-gray-900">
          희망 구직 조건
        </p>
        {JOB_CONDITIONS.map(({ value, label }) => (
          <Checkbox
            key={value}
            checked={employmentTypes.includes(value)}
            onChange={(checked) => toggleEmploymentType(value, checked)}
            label={label}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-14">
        {formError ? (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        ) : null}
        <Button type="submit" className={SIGN_UP_SUBMIT_CLASS} disabled={!filled || pending}>
          {pending ? '저장하는 중...' : submitLabel}
        </Button>
        {showSkip ? (
          <button
            type="button"
            onClick={leave}
            disabled={pending}
            className="self-center py-2 text-base text-gray-500 hover:text-gray-700"
          >
            다음에 하기
          </button>
        ) : null}
      </div>

      <CareerSelectModals
        controls={controls}
        grade={grade}
        onGradeComplete={(next) => {
          setGrade(next);
          controls.closeModal();
        }}
      />
    </form>
  );
}

/** 누르면 선택 모달을 여는 칸(디자인의 오른쪽 화살표 칸). 고르기 전에는 안내 문구를 회색으로 보인다. */
function SelectField({
  id,
  label,
  value,
  placeholder,
  onClick,
}: {
  id: string;
  label: string;
  value: string | null;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <SignUpField label={label} htmlFor={id}>
      <button
        id={id}
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        className={cn(
          'flex w-full items-center justify-between gap-3 border border-gray-300 bg-white px-4 text-left text-base',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none',
          SIGN_UP_INPUT_CLASS,
        )}
      >
        <span className={cn('truncate', value ? 'text-gray-900' : 'text-gray-400')}>
          {value ?? placeholder}
        </span>
        <ChevronIcon direction="right" className="size-5 shrink-0 text-gray-500" />
      </button>
    </SignUpField>
  );
}
