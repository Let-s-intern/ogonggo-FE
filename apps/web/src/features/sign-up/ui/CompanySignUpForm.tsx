'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { HttpError, signUpCompany, type SuccessResponseAuthTokenResponse } from '@ogonggo/api';
import { Button, Input } from '@ogonggo/ui';
import { saveTokens } from '@/shared/api/authTokens';
import { recordSignInMethod } from '@/shared/lib/lastSignInMethod';
import { SIGN_UP_INPUT_CLASS, SIGN_UP_SUBMIT_CLASS, SignUpField } from './SignUpField';

type FieldName = 'organizationName' | 'email' | 'managerName' | 'password' | 'passwordConfirm';
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const INITIAL: Values = {
  organizationName: '',
  email: '',
  managerName: '',
  password: '',
  passwordConfirm: '',
};

/**
 * 백엔드 `CompanySignUpRequest`(`ogonggo-api-user/.../auth/presentation/request/CompanyAuthRequests.kt`) 의
 * `@Size`. 입력칸 `maxLength` 로 막고, 비밀번호 최소 길이만 제출 때 본다.
 */
const MAX_LENGTH = { organizationName: 150, email: 255, managerName: 100, password: 64 } as const;
const PASSWORD_MIN = 8;

/**
 * 이메일 형식. 백엔드는 Hibernate `@Email` 이라 `a@b` 도 받는다 — 그보다 좁히면 서버가 받는 주소를 화면이
 * 막는다. 골뱅이 양쪽에 공백 없는 글자가 있는지만 본다. 나머지는 서버 400 이 말한다.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = '이메일 형식이 올바르지 않습니다.';
  }
  if (values.password.length < PASSWORD_MIN) {
    errors.password = `비밀번호는 ${PASSWORD_MIN}~${MAX_LENGTH.password}자로 입력해 주세요.`;
  }
  if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
  }
  return errors;
}

/**
 * 기업 회원 가입 폼(`회원가입 기업.png`). `signUpCompany` 가 201 로 토큰을 주므로 받는 대로 저장하고 홈으로 간다.
 *
 * 디자인의 연락처·가입 목적·약관 동의는 두지 않는다. 백엔드가 받지 않는다(PRD "하지 않는 것").
 *
 * 다섯 칸이 모두 차기 전에는 가입하기가 꺼져 있다(디자인의 회색 버튼). 형식은 제출 때 보고 칸마다 문구를 단다.
 */
export function CompanySignUpForm() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filled = Object.values(values).every((value) => value.trim() !== '');

  const change = (name: FieldName) => (value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    // 고치기 시작한 칸의 문구는 지운다. 다른 칸의 문구는 그대로 둔다.
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || !filled) {
      return;
    }
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      return;
    }

    setPending(true);
    try {
      // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다. 로그인과 같다.
      const body = (await signUpCompany({
        email: values.email.trim(),
        password: values.password,
        organizationName: values.organizationName.trim(),
        managerName: values.managerName.trim(),
      })) as unknown as SuccessResponseAuthTokenResponse;
      if (!body.data) {
        throw new Error('기업 가입 응답에 토큰이 없습니다.');
      }
      saveTokens(body.data);
      recordSignInMethod('email');
      // 성공하면 화면을 떠나므로 pending 을 풀지 않는다.
      router.replace('/');
    } catch (caught) {
      // 409 는 `EMAIL_ALREADY_EXISTS` 뿐이다. `HttpError` 가 본문 `code` 를 들고 있지 않아 상태 코드로 가른다.
      if (caught instanceof HttpError && caught.status === 409) {
        setErrors({ email: '이미 가입된 이메일입니다.' });
      } else if (caught instanceof HttpError && caught.status === 400) {
        setFormError('입력한 값의 형식이 올바르지 않습니다. 이메일과 비밀번호를 확인해 주세요.');
      } else {
        setFormError('가입하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      setPending(false);
    }
  };

  const input = (name: FieldName) => ({
    id: `company-signup-${name}`,
    name,
    value: values[name],
    onChange: (event: { target: { value: string } }) => change(name)(event.target.value),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `company-signup-${name}-error` : undefined,
    required: true,
    className: SIGN_UP_INPUT_CLASS,
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <SignUpField
        label="기업/기관명"
        htmlFor="company-signup-organizationName"
        required
        error={errors.organizationName}
      >
        <Input
          {...input('organizationName')}
          autoComplete="organization"
          maxLength={MAX_LENGTH.organizationName}
          placeholder="기업/기관명을 입력해 주세요."
        />
      </SignUpField>
      <SignUpField label="이메일" htmlFor="company-signup-email" required error={errors.email}>
        <Input
          {...input('email')}
          type="email"
          autoComplete="email"
          maxLength={MAX_LENGTH.email}
          placeholder="이메일을 입력해 주세요."
        />
      </SignUpField>
      <SignUpField
        label="담당자 이름"
        htmlFor="company-signup-managerName"
        required
        error={errors.managerName}
      >
        <Input
          {...input('managerName')}
          autoComplete="name"
          maxLength={MAX_LENGTH.managerName}
          placeholder="이름을 입력해 주세요."
        />
      </SignUpField>
      <SignUpField
        label="비밀번호"
        htmlFor="company-signup-password"
        required
        error={errors.password}
      >
        <Input
          {...input('password')}
          type="password"
          autoComplete="new-password"
          maxLength={MAX_LENGTH.password}
          placeholder="비밀번호를 입력해 주세요."
        />
      </SignUpField>
      <SignUpField
        label="비밀번호 확인"
        htmlFor="company-signup-passwordConfirm"
        required
        error={errors.passwordConfirm}
      >
        <Input
          {...input('passwordConfirm')}
          type="password"
          autoComplete="new-password"
          maxLength={MAX_LENGTH.password}
          placeholder="비밀번호를 다시 입력해 주세요."
        />
      </SignUpField>
      <div className="flex flex-col gap-3 pt-7">
        {formError ? (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        ) : null}
        <Button type="submit" className={SIGN_UP_SUBMIT_CLASS} disabled={!filled || pending}>
          {pending ? '가입하는 중...' : '가입하기'}
        </Button>
      </div>
    </form>
  );
}
