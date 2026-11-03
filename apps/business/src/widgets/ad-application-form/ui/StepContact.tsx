'use client';

import { useState } from 'react';
import { HttpError } from '@ogonggo/api';
import { Button, Field, Input, Textarea } from '@ogonggo/ui';
import { confirmCompanyEmailCode, sendCompanyEmailCode } from '@/entities/advertisement';
import { formatPhone } from '@/shared/lib/formatPhone';
import { uploadImage } from '@/shared/lib/uploadImage';
import type { AdApplicationFormValues } from '../model/form';
import { isFreeMail } from '../model/freeMail';

export interface StepContactProps {
  values: AdApplicationFormValues;
  patch: (next: Partial<AdApplicationFormValues>) => void;
  signedIn: boolean;
  /** 쿠폰만 쓰는 0원 신청이면 계약·세금계산서 칸을 감춘다. */
  couponOnly: boolean;
  /** 가입 비밀번호. 임시저장하지 않으려고 값 객체 밖에 둔다. */
  password: string;
  setPassword: (password: string) => void;
}

/**
 * 3단계 담당자 · 계약(시안 B-04). 비회원이면 맨 위에 기업회원 가입(회사 이메일 인증, 개인 메일이면 사업자등록증)이 있고,
 * 신청할 때 가입이 함께 된다. 로그인했으면 가입 칸이 없고 담당자 정보가 계정에서 미리 채워진다.
 */
export function StepContact({
  values,
  patch,
  signedIn,
  couponOnly,
  password,
  setPassword,
}: StepContactProps) {
  const [code, setCode] = useState('');
  const [codeMessage, setCodeMessage] = useState<{
    tone: 'ok' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { signUp, contact, billing } = values;
  const verified = signUp.verifiedEmail !== '' && signUp.verifiedEmail === signUp.email.trim();
  const freeMail = isFreeMail(signUp.email);

  const setSignUp = (next: Partial<AdApplicationFormValues['signUp']>) =>
    patch({ signUp: { ...signUp, ...next } });
  const setContact = (next: Partial<AdApplicationFormValues['contact']>) =>
    patch({ contact: { ...contact, ...next } });
  const setBilling = (next: Partial<AdApplicationFormValues['billing']>) =>
    patch({ billing: { ...billing, ...next } });

  const sendCode = async () => {
    setPending(true);
    try {
      await sendCompanyEmailCode(signUp.email.trim());
      setSignUp({ codeSent: true, verifiedEmail: '' });
      setCode('');
      setCodeMessage({ tone: 'info', text: '인증번호를 보냈어요. 메일함을 확인해 주세요.' });
    } catch (error) {
      setCodeMessage({
        tone: 'error',
        text:
          error instanceof HttpError && error.status === 409
            ? '이미 가입된 이메일이에요. 로그인한 뒤 신청해 주세요.'
            : '인증번호를 보내지 못했어요. 이메일을 확인해 주세요.',
      });
    } finally {
      setPending(false);
    }
  };

  const confirmCode = async (value: string) => {
    setPending(true);
    try {
      await confirmCompanyEmailCode(signUp.email.trim(), value);
      setSignUp({ verifiedEmail: signUp.email.trim() });
      setCodeMessage({ tone: 'ok', text: '인증 완료' });
      // 담당자 이메일이 비어 있으면 인증한 주소로 채운다.
      if (!contact.email) setContact({ email: signUp.email.trim() });
    } catch {
      setCodeMessage({ tone: 'error', text: '인증번호가 올바르지 않아요.' });
    } finally {
      setPending(false);
    }
  };

  const uploadLicense = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) setSignUp({ businessLicenseUrl: url });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {!signedIn ? (
        <section className="flex flex-col gap-4 rounded-md border border-blue-200 bg-blue-00 p-4 md:p-5">
          <div>
            <p className="text-sm font-bold text-gray-900">기업회원 가입이 함께 진행돼요</p>
            <p className="pt-1 text-xs text-gray-600">
              아래 정보로 계정이 만들어지고, 신청 내역·소재 확인·리포트는 마이페이지에서 볼 수
              있어요.
            </p>
          </div>
          <Field
            label="회사 이메일 (ID)"
            htmlFor="ad-signup-email"
            required
            hint={freeMail ? '개인 메일은 사업자등록증 제출이 필요해요.' : undefined}
          >
            <div className="flex gap-2">
              <Input
                id="ad-signup-email"
                type="email"
                autoComplete="email"
                value={signUp.email}
                onChange={(event) =>
                  setSignUp({ email: event.target.value, codeSent: false, verifiedEmail: '' })
                }
                placeholder="name@company.com"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                disabled={pending || !signUp.email.includes('@')}
                onClick={() => void sendCode()}
              >
                {signUp.codeSent ? '재전송' : '인증번호 받기'}
              </Button>
            </div>
          </Field>
          {signUp.codeSent || verified ? (
            <Field label="인증번호" htmlFor="ad-signup-code" required>
              <div className="flex items-center gap-3">
                <Input
                  id="ad-signup-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verified ? '••••••' : code}
                  disabled={verified}
                  onChange={(event) => {
                    const next = event.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(next);
                    if (next.length === 6) void confirmCode(next);
                  }}
                  placeholder="숫자 6자리"
                  className="w-40"
                />
                {codeMessage ? (
                  <span
                    role={codeMessage.tone === 'error' ? 'alert' : 'status'}
                    className={
                      codeMessage.tone === 'ok'
                        ? 'text-sm font-semibold text-blue-500'
                        : codeMessage.tone === 'error'
                          ? 'text-sm text-error'
                          : 'text-sm text-gray-500'
                    }
                  >
                    {codeMessage.text}
                  </span>
                ) : null}
              </div>
            </Field>
          ) : codeMessage?.tone === 'error' ? (
            <p role="alert" className="text-sm text-error">
              {codeMessage.text}
            </p>
          ) : null}
          <Field label="비밀번호" htmlFor="ad-signup-password" required hint="8자 이상">
            <Input
              id="ad-signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              maxLength={64}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {freeMail ? (
            <Field label="사업자등록증" htmlFor="ad-signup-license" required hint="JPG · PNG">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="ad-signup-license"
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={uploading}
                  onChange={(event) => void uploadLicense(event.target.files?.[0])}
                  className="text-sm"
                />
                {signUp.businessLicenseUrl ? (
                  <span className="text-sm font-semibold text-blue-500">사업자등록증 제출됨</span>
                ) : uploading ? (
                  <span className="text-sm text-gray-500">올리는 중...</span>
                ) : null}
              </div>
            </Field>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="담당자 이름" htmlFor="ad-contact-name" required>
          <Input
            id="ad-contact-name"
            value={contact.name}
            maxLength={100}
            onChange={(event) => setContact({ name: event.target.value })}
          />
        </Field>
        <Field label="직함" htmlFor="ad-contact-title">
          <Input
            id="ad-contact-title"
            value={contact.title}
            maxLength={50}
            onChange={(event) => setContact({ title: event.target.value })}
          />
        </Field>
        <Field label="이메일" htmlFor="ad-contact-email" required>
          <Input
            id="ad-contact-email"
            type="email"
            value={contact.email}
            onChange={(event) => setContact({ email: event.target.value })}
          />
        </Field>
        <Field label="전화" htmlFor="ad-contact-phone" required hint="집행 완료 후 삭제돼요.">
          <Input
            id="ad-contact-phone"
            type="tel"
            inputMode="tel"
            value={contact.phone}
            onChange={(event) => setContact({ phone: formatPhone(event.target.value) })}
            placeholder="010-0000-0000"
          />
        </Field>
        <Field label="참조 이메일" htmlFor="ad-contact-cc">
          <Input
            id="ad-contact-cc"
            type="email"
            value={contact.ccEmail}
            onChange={(event) => setContact({ ccEmail: event.target.value })}
          />
        </Field>
        <Field label="회사명 (사업자등록증 표기)" htmlFor="ad-contact-company" required>
          <Input
            id="ad-contact-company"
            value={contact.companyName}
            maxLength={150}
            onChange={(event) => setContact({ companyName: event.target.value })}
          />
        </Field>
      </div>

      {couponOnly ? (
        <p className="rounded-md bg-blue-00 px-4 py-3 text-sm text-blue-700">
          쿠폰만 사용하는 0원 신청이라 계약·세금계산서 단계는 건너뛰어요.
        </p>
      ) : (
        <section className="flex flex-col gap-4">
          <p className="text-sm font-bold text-gray-900">계약 · 세금계산서</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="계약서 수신 이메일"
              htmlFor="ad-contract-email"
              hint="모두싸인으로 전자계약서를 보내드려요. 비우면 담당자 이메일로 보내요."
            >
              <Input
                id="ad-contract-email"
                type="email"
                value={billing.contractEmail}
                placeholder={contact.email}
                onChange={(event) => setBilling({ contractEmail: event.target.value })}
              />
            </Field>
            <Field
              label="세금계산서 수신 이메일"
              htmlFor="ad-tax-email"
              hint="비우면 담당자 이메일로 보내요."
            >
              <Input
                id="ad-tax-email"
                type="email"
                value={billing.taxInvoiceEmail}
                placeholder={contact.email}
                onChange={(event) => setBilling({ taxInvoiceEmail: event.target.value })}
              />
            </Field>
          </div>
          <fieldset className="flex items-center gap-4 text-sm text-gray-700">
            <legend className="sr-only">세금계산서 종류</legend>
            <span className="font-semibold text-gray-900">종류</span>
            {(
              [
                ['CLAIM', '청구'],
                ['RECEIPT', '영수'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="tax-invoice-type"
                  checked={billing.taxInvoiceType === value}
                  onChange={() => setBilling({ taxInvoiceType: value })}
                  className="accent-blue-500"
                />
                {label}
              </label>
            ))}
          </fieldset>
        </section>
      )}

      <Field label="현재 홍보 중인 플랫폼과 어려웠던 점 (선택)" htmlFor="ad-memo">
        <Textarea
          id="ad-memo"
          rows={3}
          value={values.memo}
          maxLength={1000}
          onChange={(event) => patch({ memo: event.target.value })}
        />
      </Field>
    </>
  );
}
