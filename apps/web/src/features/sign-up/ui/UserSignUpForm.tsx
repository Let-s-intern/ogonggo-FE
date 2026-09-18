'use client';

import { type FormEvent, useState } from 'react';
import { Button, CheckAllGroup, Input } from '@ogonggo/ui';
import {
  formatPhoneNumber,
  isValidLetsCareerEmail,
  isValidLetsCareerPassword,
  isValidLetsCareerPhoneNumber,
} from '../lib/letsCareerSignUpRules';
import {
  LETSCAREER_TERMS_URL,
  LetsCareerMarketingModal,
  LetsCareerPrivacyModal,
} from './LetsCareerTermsModals';
import { SIGN_UP_INPUT_CLASS, SIGN_UP_SUBMIT_CLASS, SignUpField } from './SignUpField';

type FieldName = 'email' | 'name' | 'phoneNum' | 'password' | 'passwordConfirm';
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

type Agreement = 'age' | 'terms' | 'privacy' | 'marketing';

const INITIAL: Values = { email: '', name: '', phoneNum: '', password: '', passwordConfirm: '' };

/** 가입하기를 켜는 데 필요한 동의. 렛츠커리어 가입 화면(`useSignup.ts` 의 `hasUncheckedAgreement`) 과 같다. */
const REQUIRED_AGREEMENTS: readonly Agreement[] = ['age', 'terms', 'privacy'];

/**
 * 형식 검사. 렛츠커리어 가입 화면(`useSignup.ts` 의 `onSubmit`) 과 같은 네 가지를 보되, 첫 오류 하나만 띄우지
 * 않고 칸마다 단다. 규칙은 서버의 것이다(`lib/letsCareerSignUpRules.ts`).
 */
function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!isValidLetsCareerEmail(values.email.trim())) {
    errors.email = '이메일 형식이 올바르지 않습니다.';
  }
  if (!isValidLetsCareerPhoneNumber(values.phoneNum)) {
    errors.phoneNum = '휴대폰 번호 형식이 올바르지 않습니다. 010-0000-0000 형식으로 입력해 주세요.';
  }
  if (!isValidLetsCareerPassword(values.password)) {
    errors.password = '비밀번호는 특수문자를 포함해 8자 이상으로 입력해 주세요.';
  }
  if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
  }
  return errors;
}

const TERMS_LINK_CLASS = 'shrink-0 text-sm text-gray-400 hover:text-gray-600';

/**
 * 일반 회원 가입 폼(`회원가입 유저.png`). 렛츠커리어 계정을 만든다.
 *
 * 디자인의 가입 목적은 두지 않는다. 렛츠커리어 가입의 `inflowPath` 는 뜻이 달라 고정값을 보낸다(PRD).
 *
 * 다섯 칸이 모두 차고 필수 동의 셋이 체크돼야 가입하기가 켜진다(렛츠커리어 가입 화면과 같다). 형식은 제출 때
 * 보고 칸마다 문구를 단다. 고치기 시작한 칸의 문구는 지운다.
 */
export function UserSignUpForm() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [openModal, setOpenModal] = useState<'privacy' | 'marketing' | null>(null);

  const filled = Object.values(values).every((value) => value.trim() !== '');
  const agreed = REQUIRED_AGREEMENTS.every((agreement) => agreements.includes(agreement));
  const canSubmit = filled && agreed;

  const change = (name: FieldName, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    const found = validate(values);
    setErrors(found);
  };

  const input = (name: FieldName) => ({
    id: `user-signup-${name}`,
    name,
    value: values[name],
    onChange: (event: { target: { value: string } }) => change(name, event.target.value),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `user-signup-${name}-error` : undefined,
    required: true,
    className: SIGN_UP_INPUT_CLASS,
  });

  const agreementItems = [
    { value: 'age', label: '[필수] 만 14세 이상입니다.' },
    {
      value: 'terms',
      label: (
        <>
          [필수] <span className="text-blue-500">서비스 이용약관</span> 동의
        </>
      ),
      trailing: (
        <a
          href={LETSCAREER_TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TERMS_LINK_CLASS}
        >
          보기
        </a>
      ),
    },
    {
      value: 'privacy',
      label: (
        <>
          [필수] <span className="text-blue-500">개인정보 수집 및 이용</span> 동의
        </>
      ),
      trailing: (
        <button type="button" className={TERMS_LINK_CLASS} onClick={() => setOpenModal('privacy')}>
          보기
        </button>
      ),
    },
    {
      value: 'marketing',
      // 문구는 디자인 그대로다. 값은 렛츠커리어 마케팅 수신 동의(`marketingAgree`) 로 간다(PRD 결정 기록).
      label: '[선택] 오늘의 공고 채용 소식을 가장 먼저 받아볼래요!',
      trailing: (
        <button
          type="button"
          className={TERMS_LINK_CLASS}
          onClick={() => setOpenModal('marketing')}
        >
          보기
        </button>
      ),
    },
  ] as const;

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <SignUpField label="이메일" htmlFor="user-signup-email" error={errors.email}>
        <Input
          {...input('email')}
          type="email"
          autoComplete="email"
          placeholder="이메일을 입력해 주세요."
        />
      </SignUpField>
      <SignUpField label="이름" htmlFor="user-signup-name" error={errors.name}>
        <Input {...input('name')} autoComplete="name" placeholder="이름을 입력해 주세요." />
      </SignUpField>
      <SignUpField label="휴대폰 번호" htmlFor="user-signup-phoneNum" error={errors.phoneNum}>
        <Input
          {...input('phoneNum')}
          onChange={(event) => change('phoneNum', formatPhoneNumber(event.target.value))}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={13}
          placeholder="휴대폰 번호를 입력해 주세요."
        />
      </SignUpField>
      <SignUpField label="비밀번호" htmlFor="user-signup-password" error={errors.password}>
        <Input
          {...input('password')}
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 입력해 주세요."
        />
      </SignUpField>
      <SignUpField
        label="비밀번호 확인"
        htmlFor="user-signup-passwordConfirm"
        error={errors.passwordConfirm}
      >
        <Input
          {...input('passwordConfirm')}
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 다시 입력해 주세요."
        />
      </SignUpField>

      <CheckAllGroup
        allLabel="전체 동의"
        items={agreementItems}
        checked={agreements}
        onCheckedChange={setAgreements}
        className="pt-7"
      />

      <div className="flex flex-col gap-3 pt-10">
        <Button type="submit" className={SIGN_UP_SUBMIT_CLASS} disabled={!canSubmit}>
          가입하기
        </Button>
      </div>

      <LetsCareerPrivacyModal open={openModal === 'privacy'} onClose={() => setOpenModal(null)} />
      <LetsCareerMarketingModal
        open={openModal === 'marketing'}
        onClose={() => setOpenModal(null)}
      />
    </form>
  );
}
