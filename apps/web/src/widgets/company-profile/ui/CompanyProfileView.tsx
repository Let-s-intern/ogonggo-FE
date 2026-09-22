'use client';

import { useEffect, useState } from 'react';
import { Button, Callout, Checkbox, Input } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import {
  EMPTY_COMPANY_PROFILE_DRAFT,
  type CompanyProfileDraft,
  type CompanyProfileValues,
} from '../model/values';
import { CompanyProfileField } from './CompanyProfileField';
import { MarketingSection, PasswordSection, WithdrawAction } from './PreparingSections';

export interface CompanyProfileViewProps {
  /** 계정을 아직 못 읽었으면 `undefined`. 칸은 그대로 두고 값만 빈다. */
  values?: CompanyProfileValues;
  /** 두 칸을 저장한다. 실패하면 던진다 — 문구는 이 화면이 고른다. */
  onSave?: (draft: CompanyProfileDraft) => Promise<void>;
}

/** 저장 버튼 둘 중 어느 쪽을 눌렀는지. 누른 버튼 밑에만 결과를 띄운다. */
type SaveSection = 'basic' | 'manager';

interface SaveStatus {
  section: SaveSection;
  tone: 'success' | 'error';
  message: string;
}

function SaveMessage({ status }: { status: SaveStatus | null }) {
  if (!status) {
    return null;
  }
  return status.tone === 'error' ? (
    <p role="alert" className="text-sm text-error">
      {status.message}
    </p>
  ) : (
    <p role="status" className="text-sm text-gray-500">
      {status.message}
    </p>
  );
}

/**
 * 기업/기관 정보를 그린다(v5 PRD 5 절). **계정 응답을 모른다** — 읽는 쪽이
 * `toCompanyProfileValues` 로 뽑아 넘긴 값만 받는다.
 *
 * 고칠 수 있는 칸은 기업·기관명과 담당자 이름 **둘뿐이다.** 수정 API 가 그 둘만 받는다
 * (`model/values.ts` 의 `CompanyProfileDraft`). 가입한 이메일은 읽기 전용이다 — 로그인
 * 이메일은 이 API 로 바꿀 수 없다.
 *
 * **나머지 칸 셋은 목업대로 그리되 비활성이다**(v5 PRD 5 절). 기업·기관 로고는 프로필에 로고
 * 필드가 없고, 담당자 연락처와 수신용 이메일은 `MyCompanyProfileResponse` 에 대응 필드가
 * 없다. 감추지 않는 이유는 자리가 통째로 비면 "이 서비스에는 그런 값이 없다" 로 읽히기
 * 때문이다 — v4 `widgets/my-profile/ui/BasicInfoSection.tsx` 와 같은 판단이다.
 *
 * 비밀번호 변경·수신 동의·회원 탈퇴도 같은 이유로 목업대로 그리되 비활성이다.
 */
export function CompanyProfileView({ values, onSave }: CompanyProfileViewProps) {
  const [draft, setDraft] = useState<CompanyProfileDraft>(EMPTY_COMPANY_PROFILE_DRAFT);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus | null>(null);

  /**
   * 읽어 온 값이 바뀌면 폼을 그 값으로 되맞춘다. 저장 뒤 읽는 쪽이 계정을 다시 읽으므로, 이
   * 되맞춤이 "방금 저장한 것이 서버에 그대로 들어갔는지" 를 화면에 보이는 자리이기도 하다.
   *
   * 객체가 아니라 문자열 둘을 의존성으로 두었다. `values` 는 읽는 쪽이 렌더마다 새로 만드는
   * 객체라 그대로 두면 이 효과가 매번 다시 돈다.
   */
  const loadedOrganizationName = values?.organizationName;
  const loadedManagerName = values?.managerName;
  useEffect(() => {
    setDraft({
      organizationName: loadedOrganizationName ?? '',
      managerName: loadedManagerName ?? '',
    });
  }, [loadedOrganizationName, loadedManagerName]);

  const change = (patch: Partial<CompanyProfileDraft>) =>
    setDraft((previous) => ({ ...previous, ...patch }));

  /**
   * 버튼 둘이 같은 저장을 한다. 수정 API 가 두 값을 **함께 교체하기** 때문이다 — 하나만 보낼
   * 수 없으므로 어느 버튼을 눌러도 화면에 있는 두 값이 같이 올라간다. 버튼을 하나로 합치지
   * 않는 이유는 목업의 칸 배치를 지키기 위해서다(`docs/asset/v5 기업회원 마이페이지/기업 기관
   * 정보.png`). 누른 버튼 밑에만 결과 문구가 붙어 어느 쪽을 눌렀는지는 드러난다.
   *
   * 빈 값은 보내지 않는다. 백엔드가 빈 문자열을 받아 주므로(`@minLength 0`) 막지 않으면
   * 기관명이 지워진 채로 저장된다.
   */
  const submit = async (section: SaveSection) => {
    const trimmed: CompanyProfileDraft = {
      organizationName: draft.organizationName.trim(),
      managerName: draft.managerName.trim(),
    };
    if (!trimmed.organizationName) {
      setStatus({ section, tone: 'error', message: '기업 · 기관명을 입력해 주세요.' });
      return;
    }
    if (!trimmed.managerName) {
      setStatus({ section, tone: 'error', message: '담당자 이름을 입력해 주세요.' });
      return;
    }
    if (!onSave) {
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await onSave(trimmed);
      setStatus({ section, tone: 'success', message: '저장했습니다.' });
    } catch {
      setStatus({
        section,
        tone: 'error',
        message: '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-bold text-gray-950">기업/기관 정보</h1>

      {/* 비활성 컨트롤마다 `title` 로도 같은 말을 달지만, 마우스를 올려야 보인다. 화면에
          드러나는 한 줄이 먼저 있어야 한다 — v4 개인 정보 화면과 같은 판단이다. */}
      <Callout
        tone="warning"
        className="flex items-start gap-2 border-transparent bg-orange-50 text-orange-800"
      >
        <span aria-hidden="true" className="icon-[lucide--info] mt-0.5 block h-4 w-4 shrink-0" />
        <span>
          <b className="font-semibold">{PLACEHOLDER_NOTICE}</b> 지금 고칠 수 있는 것은 기업 ·
          기관명과 담당자 이름뿐이에요. 로고, 연락처, 정보 수신용 이메일, 비밀번호 변경, 수신
          동의, 회원 탈퇴는 아직 준비 중이에요.
        </span>
      </Callout>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-gray-950">기본 정보</h2>

        <CompanyProfileField label="기업 · 기관 로고" htmlFor="company-logo">
          <button
            id="company-logo"
            type="button"
            disabled
            title={PLACEHOLDER_NOTICE}
            className="flex h-20 w-20 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-md border border-gray-300 bg-gray-50 text-[10px] leading-tight text-gray-400"
          >
            <span aria-hidden="true" className="icon-[lucide--upload] block h-4 w-4" />
            <span>로고 업로드</span>
            <span>1:1 비율 권장</span>
          </button>
        </CompanyProfileField>

        <CompanyProfileField label="기업 · 기관명" htmlFor="company-organization-name">
          <Input
            id="company-organization-name"
            value={draft.organizationName}
            maxLength={150}
            onChange={(event) => change({ organizationName: event.target.value })}
          />
        </CompanyProfileField>

        <Button
          variant="secondary"
          disabled={saving}
          onClick={() => void submit('basic')}
          className="w-full border-blue-500 text-blue-500"
        >
          기본 정보 수정하기
        </Button>
        <SaveMessage status={status?.section === 'basic' ? status : null} />
      </section>

      <hr className="border-gray-200" />

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-gray-950">담당자 정보</h2>

        <CompanyProfileField label="담당자 이름" htmlFor="company-manager-name">
          <Input
            id="company-manager-name"
            value={draft.managerName}
            maxLength={100}
            onChange={(event) => change({ managerName: event.target.value })}
            className="max-w-70"
          />
        </CompanyProfileField>

        <CompanyProfileField label="연락처" htmlFor="company-manager-phone">
          <Input
            id="company-manager-phone"
            value=""
            readOnly
            disabled
            title={PLACEHOLDER_NOTICE}
            placeholder={PLACEHOLDER_NOTICE}
            className="max-w-70"
          />
        </CompanyProfileField>

        <CompanyProfileField label="가입한 이메일" htmlFor="company-email">
          <Input id="company-email" value={values?.email ?? ''} readOnly disabled />
        </CompanyProfileField>

        <CompanyProfileField
          label="오늘의 공고 정보 수신용 이메일"
          htmlFor="company-notification-email"
          note="* 공고 관련 알림을 받아볼 담당자 이메일 주소를 입력해주세요."
        >
          <Input
            id="company-notification-email"
            value=""
            readOnly
            disabled
            title={PLACEHOLDER_NOTICE}
            placeholder={PLACEHOLDER_NOTICE}
          />
          <Checkbox checked={false} disabled onChange={() => {}} label="가입한 이메일과 동일" />
        </CompanyProfileField>

        <Button
          variant="secondary"
          disabled={saving}
          onClick={() => void submit('manager')}
          className="w-full border-blue-500 text-blue-500"
        >
          담당자 정보 수정하기
        </Button>
        <SaveMessage status={status?.section === 'manager' ? status : null} />
      </section>

      <hr className="border-gray-200" />

      <PasswordSection />
      <MarketingSection />
      <WithdrawAction />
    </div>
  );
}
