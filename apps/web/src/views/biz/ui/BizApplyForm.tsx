'use client';

import { useState } from 'react';
import { createAdvertisementInquiry } from '@ogonggo/api';
import { Button, Checkbox, Field, Input, Textarea } from '@ogonggo/ui';
import {
  type ApplyErrors,
  type ApplyValues,
  EMPTY_VALUES,
  FIELD_ORDER,
  formatPhone,
  hasErrors,
  toRequest,
  validateApply,
} from '../model/apply';
import { BizApplyDone } from './BizApplyDone';
import { BizChannelPicker } from './BizChannelPicker';

type SubmitState = 'idle' | 'sending' | 'error';

/**
 * 무료 홍보 신청서(PRD 5절, 시안 `.formcard`). 생성된 클라이언트(`createAdvertisementInquiry`)로 보낸다.
 * 로그인했으면 `httpClient` 가 토큰을 실어 서버가 회원 구분과 회원 ID 를 정한다.
 *
 * 오류는 제출을 누른 뒤에 보인다. 그 뒤로는 고칠 때마다 다시 검사해 고친 칸의 문구가 바로 사라진다.
 */
export function BizApplyForm() {
  const [values, setValues] = useState<ApplyValues>(EMPTY_VALUES);
  const [submitted, setSubmitted] = useState(false);
  const [state, setState] = useState<SubmitState>('idle');
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  const errors: ApplyErrors = submitted ? validateApply(values) : {};

  const set = <K extends keyof ApplyValues>(key: K, value: ApplyValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setSubmitted(true);
    const found = validateApply(values);
    if (hasErrors(found)) {
      const first = FIELD_ORDER.find((key) => found[key]);
      document.getElementById(`biz-${first}`)?.focus();
      return;
    }
    // 허니팟이 채워졌으면 봇이다. 보내지 않고 접수된 것처럼 보인다 — 실패를 보이면 봇이 다른 값으로 다시 온다.
    if (values.website.trim() !== '') {
      setDoneEmail(values.email.trim());
      return;
    }
    setState('sending');
    try {
      await createAdvertisementInquiry(toRequest(values, {}));
      setDoneEmail(values.email.trim());
    } catch {
      setState('error');
    }
  };

  if (doneEmail !== null) {
    return <BizApplyDone email={doneEmail} />;
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (state !== 'sending') void submit();
      }}
      className="relative rounded-3xl bg-white p-5 shadow-[0_1px_0_rgba(17,24,39,0.04),0_0_0_1px_var(--color-gray-150)] md:p-9"
    >
      <p className="mb-3.5 text-sm font-bold text-gray-900">담당자 정보</p>
      <div className="grid gap-x-3 md:grid-cols-2">
        <Field label="회사명" htmlFor="biz-company" required error={errors.company}>
          <Input
            id="biz-company"
            value={values.company}
            maxLength={100}
            autoComplete="organization"
            onChange={(event) => {
              set('company', event.target.value);
              set('companyNameSource', 'MANUAL');
            }}
          />
        </Field>
        <Field label="담당자 이름" htmlFor="biz-name" required error={errors.name}>
          <Input
            id="biz-name"
            value={values.name}
            maxLength={50}
            autoComplete="name"
            placeholder="이름"
            onChange={(event) => set('name', event.target.value)}
          />
        </Field>
        <Field label="직함" htmlFor="biz-title" required error={errors.title}>
          <Input
            id="biz-title"
            value={values.title}
            maxLength={50}
            autoComplete="organization-title"
            placeholder="예) 인사팀 매니저"
            onChange={(event) => set('title', event.target.value)}
          />
        </Field>
        <Field label="연락처" htmlFor="biz-phone" required error={errors.phone}>
          <Input
            id="biz-phone"
            type="tel"
            inputMode="tel"
            value={values.phone}
            maxLength={20}
            autoComplete="tel"
            placeholder="010-0000-0000"
            onChange={(event) => set('phone', formatPhone(event.target.value))}
          />
        </Field>
      </div>
      <Field label="이메일" htmlFor="biz-email" required error={errors.email}>
        <Input
          id="biz-email"
          type="email"
          inputMode="email"
          value={values.email}
          maxLength={255}
          autoComplete="email"
          placeholder="recruit@company.com"
          onChange={(event) => set('email', event.target.value)}
        />
      </Field>

      <div className="mt-3 border-t border-gray-150 pt-7">
        <p className="mb-3.5 text-sm font-bold text-gray-900">홍보 정보</p>
        <BizChannelPicker
          group={values.channelGroup}
          room={values.openChatRoom}
          error={errors.channel}
          onGroupChange={(group) => set('channelGroup', group)}
          onRoomChange={(room) => set('openChatRoom', room)}
        />
        <div className="grid gap-x-3 md:grid-cols-2">
          <Field label="채용 직무명" htmlFor="biz-role" required error={errors.role}>
            <Input
              id="biz-role"
              value={values.role}
              maxLength={100}
              placeholder="예) B2B 영업 인턴"
              onChange={(event) => set('role', event.target.value)}
            />
          </Field>
          <Field label="채용공고 링크" htmlFor="biz-link" required error={errors.link}>
            <Input
              id="biz-link"
              type="url"
              inputMode="url"
              value={values.link}
              maxLength={500}
              placeholder="https://"
              onChange={(event) => set('link', event.target.value)}
            />
          </Field>
        </div>
        <Field
          label="현재 사용 중인 채용 홍보 채널과 어려운 점"
          htmlFor="biz-survey"
          required
          error={errors.survey}
        >
          <Textarea
            id="biz-survey"
            rows={4}
            value={values.survey}
            maxLength={2000}
            placeholder="자유롭게 적어주세요"
            onChange={(event) => set('survey', event.target.value)}
          />
        </Field>
      </div>

      {/* 허니팟. 사람에게는 보이지 않고 스크린 리더도 건너뛴다. 봇은 이름을 보고 채운다. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="biz-website">웹사이트</label>
        <input
          id="biz-website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => set('website', event.target.value)}
        />
      </div>

      <div className="mt-2 flex flex-col gap-2.5">
        <div id="biz-agree" tabIndex={-1} className="outline-none">
          <Checkbox
            checked={values.agree}
            onChange={(checked) => set('agree', checked)}
            label="[필수] 개인정보 수집·이용에 동의합니다"
          />
          {errors.agree ? <p className="pt-1.5 text-sm text-error">{errors.agree}</p> : null}
        </div>
        <Checkbox
          checked={values.marketing}
          onChange={(checked) => set('marketing', checked)}
          label="[선택] 마케팅 정보 수신에 동의합니다"
        />
      </div>

      <Button
        type="submit"
        disabled={state === 'sending'}
        className="mt-7 h-14 w-full rounded-xl text-[17px] font-bold"
      >
        {state === 'sending' ? '보내는 중…' : '무료 홍보 신청하기'}
      </Button>
      {state === 'error' ? (
        <p role="alert" className="mt-3 text-center text-sm text-error">
          신청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      ) : (
        <p className="mt-3 text-center text-[13px] text-gray-500">
          제출 후 2일 안에 담당자가 일정을 안내드립니다.
        </p>
      )}
    </form>
  );
}
