'use client';

import { useId, useState } from 'react';
import {
  CHANNELS,
  formatPhone,
  hasErrors,
  validateApply,
  type ApplyErrors,
  type ApplyMode,
  type ApplyPayload,
} from '@/lib/apply';

/** 제출 결과에 따라 보여 줄 것이 달라진다. `done` 이면 폼 대신 감사 문구가 뜬다. */
type Status = 'editing' | 'sending' | 'done';

const DONE_COPY: Record<ApplyMode, { title: string; body: string; next: string }> = {
  promo: {
    title: '무료 홍보 신청이 접수되었습니다',
    body: '보내주신 공고를 확인한 뒤, 담당자가 이틀 안에 소재와 집행 일정을 안내드리겠습니다.',
    next: '이틀 안에 연락드립니다',
  },
  alert: {
    title: '출시 알림 신청이 접수되었습니다',
    body: '입력하신 메일로 채널 소개서를 보냈습니다. 9월 23일 런칭 전에 담당자가 직접 연락드리겠습니다.',
    next: '9월 23일 런칭 전에 연락드립니다',
  },
};

/**
 * 출시 알림 · 무료 홍보 신청서.
 *
 * 한 화면에 두 번 그려진다 — 페이지 아래 `#apply` 섹션과 플로팅 버튼이 여는 모달이다.
 * 그래서 `id` 를 문자열로 박지 않고 `useId()` 로 만든다. 박아 두면 두 벌이 같은 `id` 를 갖게
 * 되어 `label` 이 어느 입력을 가리키는지 브라우저가 정하지 못하고, 클릭이 엉뚱한 자리로 간다.
 *
 * 검증은 `lib/apply` 가 하고 서버가 같은 함수를 다시 부른다. 여기서 막는 것은 사용자가 바로
 * 알아차리게 하기 위한 것이지 보안이 아니다.
 */
export interface ApplyFormProps {
  /**
   * 접수가 끝나면 한 번 불린다. 모달이 자기 머리글("1분이면 끝납니다")을 내리는 데 쓴다 —
   * 접수된 화면 위에 그대로 남으면 아직 뭔가 더 해야 하는 것처럼 읽힌다.
   */
  onDone?: () => void;
}

export function ApplyForm({ onDone }: ApplyFormProps = {}) {
  const uid = useId();
  const field = (name: string) => `${uid}-${name}`;

  const [mode, setMode] = useState<ApplyMode>('promo');
  const [status, setStatus] = useState<Status>('editing');
  const [errors, setErrors] = useState<ApplyErrors>({});
  const [failure, setFailure] = useState<string | undefined>();
  // 제출을 한 번이라도 눌렀는지. 누르기 전에는 빨간 문구를 띄우지 않는다 — 아직 채우는
  // 중인 자리를 틀렸다고 하면 성가시다.
  const [submitted, setSubmitted] = useState(false);
  // 연락처만 값을 붙들고 있는다. 치는 대로 하이픈을 넣어 되돌려줘야 해서다
  // (`formatPhone`). 나머지 칸은 브라우저가 갖고 제출 때 `FormData` 로 한 번에 읽는다.
  const [phone, setPhone] = useState('');

  const isPromo = mode === 'promo';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setFailure(undefined);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: ApplyPayload = {
      mode,
      company: String(data.get('company') ?? ''),
      name: String(data.get('name') ?? ''),
      title: String(data.get('title') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      survey: String(data.get('survey') ?? ''),
      agree: data.get('agree') === 'on',
      marketing: data.get('marketing') === 'on',
      website: String(data.get('website') ?? ''),
      ...(isPromo
        ? {
            channel: String(data.get('channel') ?? ''),
            role: String(data.get('role') ?? ''),
            link: String(data.get('link') ?? ''),
          }
        : {}),
    };

    const found = validateApply(payload);
    setErrors(found);
    if (hasErrors(found)) {
      // 틀린 칸으로 데려간다. 폼이 길어서 제출 버튼과 첫 오류가 화면 하나만큼 떨어져 있고,
      // 그냥 두면 버튼을 눌러도 아무 일도 안 일어난 것처럼 보인다(2026-09-05 실측: 버튼
      // y=1472, 오류 y=561, 화면 높이 802).
      const first = Object.keys(found)[0];
      const field = form.querySelector<HTMLElement>(`[name="${first}"]`);
      field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      field?.focus({ preventScroll: true });
      return;
    }

    setStatus('sending');
    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        setStatus('editing');
        setFailure(body.message ?? '접수에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
    } catch {
      setStatus('editing');
      setFailure('네트워크가 불안정합니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setStatus('done');
    onDone?.();
  }

  if (status === 'done') {
    return (
      // `role="status"` 를 두면 스크린 리더가 화면이 바뀐 것을 읽어 준다. 폼이 통째로
      // 사라지는 자리라 알려 주지 않으면 무슨 일이 일어났는지 알 수 없다.
      <div className="done" role="status">
        {/* 체크 표시가 먼저 눈에 들어와야 "됐다"가 읽힌다. 원이 그려진 뒤 체크가 그어진다. */}
        <span className="done-mark" aria-hidden="true">
          <svg viewBox="0 0 52 52" fill="none">
            <circle
              className="done-circle"
              cx="26"
              cy="26"
              r="23"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="done-check"
              d="M16 27l7 7 13-14"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h3>{DONE_COPY[mode].title}</h3>
        <p>{DONE_COPY[mode].body}</p>
        {/* 다음에 무슨 일이 있는지 한 줄로 굵게. 본문을 다 읽지 않아도 이건 눈에 남는다. */}
        <p className="done-next">{DONE_COPY[mode].next}</p>
      </div>
    );
  }

  /** 제출을 누른 뒤에만 문구를 띄운다. */
  const error = (key: keyof ApplyPayload) => (submitted ? errors[key] : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="modes" role="group" aria-label="신청 유형 선택">
        <button
          type="button"
          className="mode"
          aria-pressed={isPromo}
          onClick={() => setMode('promo')}
        >
          지금 바로 무료 홍보 할래요
          <small>진행 중인 공고를 바로 태워드립니다</small>
        </button>
        <button
          type="button"
          className="mode"
          aria-pressed={!isPromo}
          onClick={() => setMode('alert')}
        >
          지금은 출시 알림만 받을래요
          <small>런칭하면 담당자가 연락드립니다</small>
        </button>
      </div>

      {/*
        허니팟. 사람 눈에도 스크린 리더에도 안 보이고 탭 순서에서도 빠진다. 자동 입력 도구는
        `name` 만 보고 채우므로 값이 들어오면 봇으로 본다(`api/apply/route.ts`).
      */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />

      <div className="field">
        <label htmlFor={field('company')}>
          회사명<span className="req">*</span>
        </label>
        <input
          type="text"
          id={field('company')}
          name="company"
          autoComplete="organization"
          placeholder="예: 렛츠커리어"
        />
        {error('company') ? <p className="err-shown">{error('company')}</p> : null}
      </div>

      <div className="two">
        <div className="field">
          <label htmlFor={field('name')}>
            담당자 이름<span className="req">*</span>
          </label>
          <input type="text" id={field('name')} name="name" autoComplete="name" />
          {error('name') ? <p className="err-shown">{error('name')}</p> : null}
        </div>
        <div className="field">
          <label htmlFor={field('title')}>
            직함<span className="req">*</span>
          </label>
          <input type="text" id={field('title')} name="title" placeholder="예: 인사팀 매니저" />
          {error('title') ? <p className="err-shown">{error('title')}</p> : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor={field('email')}>
          이메일<span className="req">*</span>
        </label>
        <input
          type="email"
          id={field('email')}
          name="email"
          autoComplete="email"
          placeholder="name@company.co.kr"
        />
        {error('email') ? <p className="err-shown">{error('email')}</p> : null}
      </div>

      <div className="field">
        <label htmlFor={field('phone')}>
          연락처<span className="req">*</span>
        </label>
        <input
          type="tel"
          id={field('phone')}
          name="phone"
          autoComplete="tel"
          placeholder="010-0000-0000"
          inputMode="numeric"
          value={phone}
          onChange={(event) => setPhone(formatPhone(event.target.value))}
        />
        {error('phone') ? <p className="err-shown">{error('phone')}</p> : null}
      </div>

      {/*
        홍보 모드에서만 나오는 자리. `display:none` 이 아니라 아예 렌더하지 않는다 — 숨긴 채로
        두면 `FormData` 에 값이 남아 "알림만 받겠다"고 한 사람의 신청에 채널이 딸려 간다.
      */}
      {isPromo ? (
        <div className="promoblock">
          <p className="blabel">무료 홍보에 필요한 정보</p>

          <div className="field">
            <label htmlFor={field('channel')}>
              무료 홍보를 원하는 채널<span className="req">*</span>
            </label>
            <select id={field('channel')} name="channel" defaultValue="">
              <option value="">한 곳만 선택해주세요</option>
              {CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
            <p className="hint">기업당 한 채널, 1회 집행입니다.</p>
            {error('channel') ? <p className="err-shown">{error('channel')}</p> : null}
          </div>

          <div className="field">
            <label htmlFor={field('role')}>
              채용 직무명<span className="req">*</span>
            </label>
            <input
              type="text"
              id={field('role')}
              name="role"
              placeholder="예: 콘텐츠 마케팅 인턴"
            />
            {error('role') ? <p className="err-shown">{error('role')}</p> : null}
          </div>

          <div className="field">
            <label htmlFor={field('link')}>
              채용공고 링크<span className="req">*</span>
            </label>
            <input
              type="text"
              id={field('link')}
              name="link"
              inputMode="url"
              placeholder="https://"
            />
            <p className="hint">
              이미 올려두신 공고 페이지 주소면 됩니다. 소재는 렛츠커리어가 제작합니다.
            </p>
            {error('link') ? <p className="err-shown">{error('link')}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor={field('survey')}>
          인턴·신입 채용 시 현재 어떤 플랫폼에 홍보하고 계신가요? 홍보하시면서 어떤 점이
          어려우셨는지도 알려주세요<span className="req">*</span>
        </label>
        <textarea
          id={field('survey')}
          name="survey"
          rows={4}
          placeholder="예: 사람인과 잡코리아에 올리고 있는데, 신입 지원자 수가 매년 줄어드는 것이 고민입니다."
        />
        {error('survey') ? <p className="err-shown">{error('survey')}</p> : null}
      </div>

      <label className="consent">
        <input type="checkbox" name="agree" />
        <span>
          서비스 안내를 위한 개인정보 수집·이용에 동의합니다. 수집 항목은 회사명, 담당자
          이름·직함·연락처, 홍보 희망 채널, 설문 답변이며 서비스 오픈 후 6개월간 보관 뒤 파기합니다.
          <span className="req">*</span>
        </span>
      </label>
      {error('agree') ? <p className="err-shown">{error('agree')}</p> : null}
      <label className="consent">
        <input type="checkbox" name="marketing" />
        <span>
          채용공고 프로모션 정보를 받아보겠습니다. 선택 사항이며 언제든 해지할 수 있습니다.
        </span>
      </label>

      <button type="submit" className="submit" disabled={status === 'sending'}>
        {status === 'sending'
          ? '보내는 중…'
          : isPromo
            ? '무료 홍보 신청하기'
            : '출시 알림 신청하기'}
      </button>
      {failure ? (
        <p className="err-shown" role="alert" style={{ textAlign: 'center' }}>
          {failure}
        </p>
      ) : null}
      {/*
        버튼 바로 아래에도 알린다. 위로 데려가긴 하지만 스크롤이 끝나기 전에는 버튼 근처가
        여전히 조용해서, 눌렀는데 반응이 없다고 읽힌다.
      */}
      {submitted && hasErrors(errors) ? (
        <p className="err-shown" role="alert" style={{ textAlign: 'center' }}>
          입력을 다시 확인해주세요.
        </p>
      ) : null}
      <p className="fineprint">
        {isPromo
          ? '확인 후 담당자가 이틀 안에 집행 일정을 안내드립니다.'
          : '신청 즉시 채널 소개서를 메일로 보내드립니다.'}
      </p>
    </form>
  );
}
