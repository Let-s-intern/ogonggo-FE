'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useState } from 'react';
import { HttpError, signUpCompany, type SuccessResponseAuthTokenResponse } from '@ogonggo/api';
import { Button, Checkbox, Input, cn } from '@ogonggo/ui';
import { track } from '@/shared/analytics/dataLayer';
import { saveTokens } from '@/shared/api/authTokens';
import { formatPhone } from '@/shared/lib/formatPhone';
import { recordSignInMethod } from '@/shared/lib/lastSignInMethod';
import { CompanyNameCombobox } from '@/shared/ui/CompanyNameCombobox';
import { FormRadioGroup } from '@/shared/ui/FormRadioGroup';
import { ChevronIcon } from '@/shared/ui/icons';
import {
  BUSINESS_NUMBER_DIGITS,
  BUSINESS_NUMBER_TYPE_OPTIONS,
  COMPANY_INDUSTRIES,
  COMPANY_SIGN_UP_MAX_LENGTH as MAX_LENGTH,
  COMPANY_TYPE_OPTIONS,
  type CompanySignUpErrors,
  type CompanySignUpField,
  type CompanySignUpValues,
  type DomesticNumberType,
  EMPLOYEE_COUNT_OPTIONS,
  EMPTY_COMPANY_SIGN_UP,
  MANAGER_DUTY_OPTIONS,
  formatBusinessNumber,
  isStepFilled,
  toCompanySignUpRequest,
  validateStep,
} from '../lib/companySignUp';
import { SIGN_UP_INPUT_CLASS, SIGN_UP_SUBMIT_CLASS, SignUpField } from './SignUpField';

type Step = 1 | 2;

const STEP_TITLES: Record<Step, string> = { 1: '기업 정보', 2: '담당자·계정 정보' };

const ID = (field: CompanySignUpField) => `company-signup-${field}`;

/**
 * 기업 회원 가입 폼. 두 단계다(PRD `prd-company-signup-info.md` "가입 화면"): 1단계 기업 정보, 2단계 담당자·계정.
 * `signUpCompany` 가 201 로 토큰을 주므로 받는 대로 저장하고 홈으로 간다.
 *
 * 단계마다 필수 칸이 모두 차기 전에는 `다음`·`가입하기` 가 꺼져 있다(디자인의 회색 버튼). 형식은 버튼을 누를 때
 * 보고 칸마다 문구를 단다. 이전으로 돌아가도 입력한 값은 남는다.
 */
export interface CompanySignUpFormProps {
  /**
   * 처음 채워 둘 기관명·이메일. `/biz` 신청 완료 화면의 가입 버튼이 쿼리로 넘긴다. 검증하지 않고 초기값으로만
   * 쓴다 — 제출 때 다른 값과 똑같이 검사한다.
   */
  initialOrganizationName?: string;
  initialEmail?: string;
}

export function CompanySignUpForm({
  initialOrganizationName = '',
  initialEmail = '',
}: CompanySignUpFormProps = {}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<CompanySignUpValues>(() => ({
    ...EMPTY_COMPANY_SIGN_UP,
    organizationName: initialOrganizationName.slice(0, MAX_LENGTH.organizationName),
    email: initialEmail.slice(0, MAX_LENGTH.email),
  }));
  const [errors, setErrors] = useState<CompanySignUpErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filled = isStepFilled(step, values);

  const set = <K extends CompanySignUpField>(field: K, value: CompanySignUpValues[K]) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    // 고치기 시작한 칸의 문구는 지운다. 다른 칸의 문구는 그대로 둔다.
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  /** 첫 오류 칸으로 초점을 옮긴다. 1단계 사업자 번호처럼 화면 아래에 있으면 보이지 않을 수 있다. */
  const focusFirstError = (found: CompanySignUpErrors) => {
    const first = Object.keys(found)[0] as CompanySignUpField | undefined;
    if (first) {
      window.requestAnimationFrame(() => document.getElementById(ID(first))?.focus());
    }
  };

  const goTo = (next: Step) => {
    setStep(next);
    setFormError(null);
    window.scrollTo({ top: 0 });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || !filled) {
      return;
    }
    const found = validateStep(step, values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }
    if (step === 1) {
      goTo(2);
      return;
    }

    setPending(true);
    try {
      // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다. 로그인과 같다.
      const body = (await signUpCompany(
        toCompanySignUpRequest(values),
      )) as unknown as SuccessResponseAuthTokenResponse;
      if (!body.data) {
        throw new Error('기업 가입 응답에 토큰이 없습니다.');
      }
      saveTokens(body.data);
      recordSignInMethod('email');
      // 가입 응답이 토큰까지 준다. 로그인 API 를 따로 부르지 않으므로 `login` 은 보내지 않는다.
      track('sign_up', { method: 'email' });
      // 성공하면 화면을 떠나므로 pending 을 풀지 않는다.
      router.replace('/');
    } catch (caught) {
      // 409 는 `EMAIL_ALREADY_EXISTS` 뿐이다. `HttpError` 가 본문 `code` 를 들고 있지 않아 상태 코드로 가른다.
      if (caught instanceof HttpError && caught.status === 409) {
        setErrors({ email: '이미 가입된 이메일입니다.' });
      } else if (caught instanceof HttpError && caught.status === 400) {
        setFormError('입력한 값의 형식이 올바르지 않습니다. 두 단계의 입력값을 확인해 주세요.');
      } else {
        setFormError('가입하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      setPending(false);
    }
  };

  const text = (field: CompanySignUpField & keyof typeof MAX_LENGTH) => ({
    id: ID(field),
    name: field,
    value: values[field] as string,
    onChange: (event: { target: { value: string } }) => set(field, event.target.value),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${ID(field)}-error` : undefined,
    maxLength: MAX_LENGTH[field],
    className: SIGN_UP_INPUT_CLASS,
  });

  const numberType = values.businessNumberType;
  const numberDigits = BUSINESS_NUMBER_DIGITS[numberType];

  return (
    <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
      <StepProgress step={step} />

      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <SignUpField
            label="기업명"
            htmlFor={ID('organizationName')}
            required
            error={errors.organizationName}
            hint="오공고에 등록된 기업이면 목록에서 골라 주세요. 없으면 그대로 입력하셔도 돼요."
          >
            <CompanyNameCombobox
              id={ID('organizationName')}
              value={values.organizationName}
              onChange={(name) => set('organizationName', name)}
              maxLength={MAX_LENGTH.organizationName}
              placeholder="기업명을 검색해 주세요."
              className={SIGN_UP_INPUT_CLASS}
              invalid={Boolean(errors.organizationName)}
            />
          </SignUpField>

          <SignUpField
            label="사업자 번호"
            htmlFor={ID('businessNumber')}
            required={!values.overseas}
            error={errors.businessNumber}
            labelAside={
              <Checkbox
                checked={values.overseas}
                onChange={(checked) => set('overseas', checked)}
                label="해외 기업"
              />
            }
          >
            {values.overseas ? (
              <p id={ID('businessNumber')} className="text-sm text-gray-500">
                해외 기업은 사업자 번호 없이 가입합니다.
              </p>
            ) : (
              <>
                <FormRadioGroup
                  name="businessNumberType"
                  options={BUSINESS_NUMBER_TYPE_OPTIONS}
                  value={numberType}
                  onChange={(next) => {
                    const type = next as DomesticNumberType;
                    // 자릿수와 하이픈 자리가 달라 지금 친 숫자를 새 종류에 맞게 다시 끊는다.
                    setValues((previous) => ({
                      ...previous,
                      businessNumberType: type,
                      businessNumber: formatBusinessNumber(type, previous.businessNumber),
                    }));
                    setErrors((previous) => ({ ...previous, businessNumber: undefined }));
                  }}
                />
                <Input
                  id={ID('businessNumber')}
                  name="businessNumber"
                  inputMode="numeric"
                  autoComplete="off"
                  value={values.businessNumber}
                  onChange={(event) =>
                    set('businessNumber', formatBusinessNumber(numberType, event.target.value))
                  }
                  aria-invalid={errors.businessNumber ? true : undefined}
                  aria-describedby={
                    errors.businessNumber ? `${ID('businessNumber')}-error` : undefined
                  }
                  placeholder={`숫자 ${numberDigits}자리`}
                  className={SIGN_UP_INPUT_CLASS}
                />
              </>
            )}
          </SignUpField>

          <SignUpSelect
            id={ID('companyType')}
            label="기업 형태"
            placeholder="기업 형태를 선택해 주세요."
            value={values.companyType}
            options={COMPANY_TYPE_OPTIONS}
            onChange={(value) => set('companyType', value as CompanySignUpValues['companyType'])}
          />
          <SignUpSelect
            id={ID('employeeCountRange')}
            label="직원 수"
            placeholder="직원 수를 선택해 주세요."
            value={values.employeeCountRange}
            options={EMPLOYEE_COUNT_OPTIONS}
            onChange={(value) =>
              set('employeeCountRange', value as CompanySignUpValues['employeeCountRange'])
            }
          />
          <SignUpSelect
            id={ID('industry')}
            label="산업"
            placeholder="산업을 선택해 주세요."
            value={values.industry}
            options={COMPANY_INDUSTRIES.map((industry) => ({ value: industry, label: industry }))}
            onChange={(value) => set('industry', value)}
          />
          <SignUpField label="주소" htmlFor={ID('address')} required error={errors.address}>
            <Input
              {...text('address')}
              autoComplete="street-address"
              placeholder="회사 주소를 입력해 주세요."
            />
          </SignUpField>
          <SignUpField label="홈페이지" htmlFor={ID('homepageUrl')} error={errors.homepageUrl}>
            <Input
              {...text('homepageUrl')}
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com"
            />
          </SignUpField>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <SignUpField
            label="담당자 이름"
            htmlFor={ID('managerName')}
            required
            error={errors.managerName}
          >
            <Input
              {...text('managerName')}
              autoComplete="name"
              placeholder="이름을 입력해 주세요."
            />
          </SignUpField>
          <SignUpField
            label="직책"
            htmlFor={ID('managerTitle')}
            required
            error={errors.managerTitle}
          >
            <Input
              {...text('managerTitle')}
              autoComplete="organization-title"
              placeholder="예) 인사팀 매니저"
            />
          </SignUpField>
          <SignUpSelect
            id={ID('managerDuty')}
            label="담당 업무"
            placeholder="담당 업무를 선택해 주세요."
            value={values.managerDuty}
            options={MANAGER_DUTY_OPTIONS}
            onChange={(value) => set('managerDuty', value as CompanySignUpValues['managerDuty'])}
          />
          <SignUpField
            label="연락처"
            htmlFor={ID('managerPhone')}
            required
            error={errors.managerPhone}
          >
            <Input
              {...text('managerPhone')}
              onChange={(event) => set('managerPhone', formatPhone(event.target.value))}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="010-0000-0000"
            />
          </SignUpField>
          <SignUpField label="업무용 이메일" htmlFor={ID('email')} required error={errors.email}>
            <Input
              {...text('email')}
              type="email"
              autoComplete="email"
              placeholder="업무용 이메일을 입력해 주세요."
            />
          </SignUpField>
          <SignUpField label="비밀번호" htmlFor={ID('password')} required error={errors.password}>
            <Input
              {...text('password')}
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호를 입력해 주세요."
            />
          </SignUpField>
          <SignUpField
            label="비밀번호 확인"
            htmlFor={ID('passwordConfirm')}
            required
            error={errors.passwordConfirm}
          >
            <Input
              {...text('passwordConfirm')}
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력해 주세요."
            />
          </SignUpField>
          <SignUpField label="추천인" htmlFor={ID('recommender')} error={errors.recommender}>
            <Input {...text('recommender')} placeholder="추천인이 있으면 입력해 주세요." />
          </SignUpField>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-12">
        {formError ? (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        ) : null}
        <div className="flex gap-3">
          {step === 2 ? (
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-28 shrink-0 rounded-xs"
              disabled={pending}
              onClick={() => goTo(1)}
            >
              이전
            </Button>
          ) : null}
          <Button type="submit" className={SIGN_UP_SUBMIT_CLASS} disabled={!filled || pending}>
            {step === 1 ? '다음' : pending ? '가입하는 중...' : '가입하기'}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** 위쪽 진행 막대와 단계 이름. 두 칸 중 지난 칸까지 칠한다. */
function StepProgress({ step }: { step: Step }) {
  return (
    <div className="flex flex-col gap-3 pb-8">
      <div
        role="progressbar"
        aria-label="가입 단계"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={step}
        aria-valuetext={`2단계 중 ${step}단계, ${STEP_TITLES[step]}`}
        className="flex gap-1.5"
      >
        {([1, 2] as const).map((index) => (
          <span
            key={index}
            className={cn('h-1 flex-1 rounded-full', index <= step ? 'bg-blue-500' : 'bg-gray-150')}
          />
        ))}
      </div>
      <p className="text-lg font-semibold text-gray-900">
        <span className="pr-2 text-blue-500">{step}/2</span>
        {STEP_TITLES[step]}
      </p>
    </div>
  );
}

/**
 * 가입 화면의 드롭다운. 네이티브 `select` 라 키보드와 모바일 피커를 브라우저가 해 준다. 사이트 공통 규칙대로
 * 고르기 전에는 회색 안내 문구, 고른 뒤에는 값을 파랗게 보인다. 모두 필수 칸이다.
 */
function SignUpSelect({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}): ReactNode {
  const chosen = value !== '';
  return (
    <SignUpField label={label} htmlFor={id} required>
      <div className="relative">
        <select
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'w-full cursor-pointer appearance-none border border-gray-300 bg-white pr-11 pl-4 text-base',
            'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none',
            chosen ? 'font-semibold text-blue-500' : 'text-gray-400',
            SIGN_UP_INPUT_CLASS,
          )}
        >
          <option value="" disabled className="text-gray-400">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="font-normal text-gray-900">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronIcon
          direction="down"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-gray-500"
        />
      </div>
    </SignUpField>
  );
}
