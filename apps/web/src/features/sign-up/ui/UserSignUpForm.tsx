'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button, CheckAllGroup, Input } from '@ogonggo/ui';
import { LetsCareerApiError, signUp } from '@/shared/api/letscareer';
import {
  pathAfterLetsCareerSignIn,
  signInWithLetsCareerEmail,
} from '@/shared/api/letsCareerSignIn';
import { recordSignInMethod } from '@/shared/lib/lastSignInMethod';
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

/**
 * 렛츠커리어 가입의 `inflowPath`(유입경로). 렛츠커리어가 오공고로 들어온 가입을 구분하도록 고정값을 보낸다
 * (PRD 결정 기록 2026-09-18). 렛츠커리어가 다른 표기를 원하면 이 값만 바꾼다.
 */
const INFLOW_PATH = '오늘의 공고';

/**
 * 렛츠커리어 가입 오류를 칸으로 옮긴다. `code` 는 `domain/user/error/UserErrorCode.java` 의 이름이고, `message` 는
 * 서버가 한국어로 준다. 칸에 붙일 수 없는 오류는 `null` 이다.
 */
function fieldErrorOf(error: LetsCareerApiError): Errors | null {
  switch (error.code) {
    case 'USER_EMAIL_CONFLICT':
      return { email: '이미 가입된 이메일입니다.' };
    case 'USER_PHONE_NUMBER_CONFLICT':
      return { phoneNum: error.message };
    case 'INVALID_EMAIL':
      return { email: error.message };
    case 'INVALID_PHONE_NUMBER':
      return { phoneNum: error.message };
    case 'INVALID_PASSWORD':
      return { password: error.message };
    default:
      return null;
  }
}

const TERMS_LINK_CLASS = 'shrink-0 text-sm text-gray-400 hover:text-gray-600';

/**
 * 일반 회원 가입 폼(`회원가입 유저.png`). 렛츠커리어 계정을 만든다.
 *
 * 디자인의 가입 목적은 두지 않는다. 렛츠커리어 가입의 `inflowPath` 는 뜻이 달라 고정값을 보낸다(PRD).
 *
 * 다섯 칸이 모두 차고 필수 동의 셋이 체크돼야 가입하기가 켜진다(렛츠커리어 가입 화면과 같다). 형식은 제출 때
 * 보고 칸마다 문구를 단다. 고치기 시작한 칸의 문구는 지운다.
 *
 * 제출(PRD "흐름 > 일반 회원 가입"): 렛츠커리어 `signup` 은 토큰을 주지 않으므로, 이어서 같은 이메일·비밀번호로
 * 이메일 로그인(SSO → 오공고 교환) 을 한다. 첫 교환이라 보통 커리어 정보 화면으로 간다. 계정은 만들어졌는데
 * 로그인만 실패하면 다시 가입하게 두지 않고(409 가 난다) "가입되었습니다" 와 함께 로그인 화면으로 보낸다.
 */
export function UserSignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || pending) {
      return;
    }
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      return;
    }

    const email = values.email.trim();
    setPending(true);
    try {
      await signUp({
        email,
        name: values.name.trim(),
        phoneNum: values.phoneNum,
        password: values.password,
        inflowPath: INFLOW_PATH,
        marketingAgree: agreements.includes('marketing'),
      });
    } catch (caught) {
      const fieldError = caught instanceof LetsCareerApiError ? fieldErrorOf(caught) : null;
      if (fieldError) {
        setErrors(fieldError);
      } else {
        setFormError('가입하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      setPending(false);
      return;
    }

    // 여기부터는 렛츠커리어 계정이 이미 있다. 무엇이 실패하든 가입 폼으로 되돌리지 않는다.
    try {
      const { isNewUser } = await signInWithLetsCareerEmail({ email, password: values.password });
      recordSignInMethod('email');
      router.replace(pathAfterLetsCareerSignIn(isNewUser, null));
    } catch {
      router.replace('/login?error=signed-up');
    }
    // 성공이든 로그인 화면이든 이 화면을 떠나므로 pending 을 풀지 않는다.
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
        {formError ? (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        ) : null}
        <Button type="submit" className={SIGN_UP_SUBMIT_CLASS} disabled={!canSubmit || pending}>
          {pending ? '가입하는 중...' : '가입하기'}
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
