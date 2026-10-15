'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Input } from '@ogonggo/ui';
import { SignOutButton } from '@/features/sign-out';
import { LogoUploadField } from '@/shared/ui/LogoUploadField';
import {
  EMPTY_COMPANY_BASIC_INFO_DRAFT,
  EMPTY_COMPANY_MANAGER_INFO_DRAFT,
  type CompanyBasicInfoDraft,
  type CompanyManagerInfoDraft,
  type CompanyProfileValues,
} from '../model/values';
import { CompanyProfileField } from './CompanyProfileField';
import { PasswordSection } from './PasswordSection';
import { MarketingSection, WithdrawAction } from './PreparingSections';
import { SaveMessage, type SaveStatus } from './SaveMessage';

export interface CompanyProfileViewProps {
  /** 계정을 아직 못 읽었으면 `undefined`. 칸은 그대로 두고 값만 빈다. */
  values?: CompanyProfileValues;
  /** 기본 정보(기관명·로고)를 저장한다. 실패하면 던진다 — 문구는 이 화면이 고른다. */
  onSaveBasicInfo?: (draft: CompanyBasicInfoDraft) => Promise<void>;
  /** 담당자 정보(이름·연락처·수신용 이메일)를 저장한다. 실패하면 던진다. */
  onSaveManagerInfo?: (draft: CompanyManagerInfoDraft) => Promise<void>;
}

/** 저장 버튼 둘 중 어느 쪽을 눌렀는지. 누른 버튼 밑에만 결과를 띄운다. */
type SaveSection = 'basic' | 'manager';

/** `ReplaceMyCompanyManagerInfoRequest.managerPhone` 의 `@pattern`. */
const PHONE_PATTERN = /^[0-9-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 기업/기관 정보를 그린다(v5 PRD 5 절). **계정 응답을 모른다** — 읽는 쪽이
 * `toCompanyProfileValues` 로 뽑아 넘긴 값만 받는다.
 *
 * 기본 정보(기관명·로고)와 담당자 정보(이름·연락처·수신용 이메일)는 수정 API 가 따로라 저장
 * 버튼도 각자 자기 구역만 보낸다. 담당자 정보는 세 값이 한 번에 교체되므로 이름만 고쳐도 화면에
 * 있는 세 값을 모두 보낸다(`model/values.ts` 의 `CompanyManagerInfoDraft`).
 *
 * 값을 읽기 전에는 저장 버튼을 잠근다. 빈 폼 값으로 저장하면 서버에 있던 연락처와 이메일이
 * 비워진다.
 *
 * 가입한 이메일은 읽기 전용이다 — 로그인 이메일은 이 API 로 바꿀 수 없다. 마케팅 수신 동의와
 * 회원 탈퇴는 백엔드에 받을 곳이 없어 목업대로 그리되 비활성이다(`PreparingSections.tsx`).
 */
export function CompanyProfileView({
  values,
  onSaveBasicInfo,
  onSaveManagerInfo,
}: CompanyProfileViewProps) {
  const [basic, setBasic] = useState<CompanyBasicInfoDraft>(EMPTY_COMPANY_BASIC_INFO_DRAFT);
  const [manager, setManager] = useState<CompanyManagerInfoDraft>(EMPTY_COMPANY_MANAGER_INFO_DRAFT);
  const [sameAsEmail, setSameAsEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<(SaveStatus & { section: SaveSection }) | null>(null);

  const loaded = values !== undefined;
  const email = values?.email ?? '';

  /**
   * 읽어 온 값이 바뀌면 그 구역의 폼을 값으로 되맞춘다. 저장 뒤 읽는 쪽이 계정을 다시 읽으므로,
   * 이 되맞춤이 "방금 저장한 것이 서버에 그대로 들어갔는지" 를 화면에 보이는 자리이기도 하다.
   *
   * 구역마다 효과를 따로 둔다. 하나로 묶으면 기본 정보를 저장한 뒤 다시 읽을 때, 아직 저장하지
   * 않은 담당자 칸의 입력까지 읽어 온 값으로 덮인다.
   *
   * 객체가 아니라 문자열을 의존성으로 둔다. `values` 는 읽는 쪽이 렌더마다 새로 만드는
   * 객체라 그대로 두면 이 효과가 매번 다시 돈다.
   */
  const loadedOrganizationName = values?.organizationName;
  const loadedLogoImageId = values?.logoImageId;
  const loadedLogoUrl = values?.logoUrl;
  useEffect(() => {
    setBasic({
      organizationName: loadedOrganizationName ?? '',
      logoImageId: loadedLogoImageId ?? '',
      logoUrl: loadedLogoUrl ?? '',
    });
  }, [loadedOrganizationName, loadedLogoImageId, loadedLogoUrl]);

  const loadedManagerName = values?.managerName;
  const loadedManagerPhone = values?.managerPhone;
  const loadedNotificationEmail = values?.notificationEmail;
  useEffect(() => {
    // 서버는 "비어 있음" 과 "가입한 이메일과 같음" 을 따로 저장하지 않는다. 두 값이 같으면 다시
    // 열 때 체크된 채로 보인다(v4 `BasicInfoSection` 과 같다).
    const same = Boolean(email) && loadedNotificationEmail === email;
    setSameAsEmail(same);
    setManager({
      managerName: loadedManagerName ?? '',
      managerPhone: loadedManagerPhone ?? '',
      notificationEmail: same ? '' : (loadedNotificationEmail ?? ''),
    });
  }, [loadedManagerName, loadedManagerPhone, loadedNotificationEmail, email]);

  const notificationEmailValue = sameAsEmail ? email : manager.notificationEmail;

  const run = async (section: SaveSection, save: () => Promise<void>) => {
    setSaving(true);
    setStatus(null);
    try {
      await save();
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

  /**
   * 빈 기관명은 보내지 않는다. 백엔드가 빈 문자열을 받아 주므로(`@minLength 0`) 막지 않으면
   * 기관명이 지워진 채로 저장된다.
   */
  const submitBasic = async () => {
    const organizationName = basic.organizationName.trim();
    if (!organizationName) {
      setStatus({
        section: 'basic',
        tone: 'error',
        message: '기업 · 기관명을 입력해 주세요.',
      });
      return;
    }
    if (!onSaveBasicInfo) {
      return;
    }
    await run('basic', () => onSaveBasicInfo({ ...basic, organizationName }));
  };

  const submitManager = async () => {
    const managerName = manager.managerName.trim();
    const managerPhone = manager.managerPhone.trim();
    const notificationEmail = notificationEmailValue.trim();
    const invalid = (message: string) => setStatus({ section: 'manager', tone: 'error', message });
    if (!managerName) {
      invalid('담당자 이름을 입력해 주세요.');
      return;
    }
    if (managerPhone && !PHONE_PATTERN.test(managerPhone)) {
      invalid('연락처는 숫자와 하이픈(-)만 입력할 수 있습니다.');
      return;
    }
    if (notificationEmail && !EMAIL_PATTERN.test(notificationEmail)) {
      invalid('이메일 주소 형식을 확인해 주세요.');
      return;
    }
    if (!onSaveManagerInfo) {
      return;
    }
    await run('manager', () => onSaveManagerInfo({ managerName, managerPhone, notificationEmail }));
  };

  return (
    <div className="flex flex-col gap-10">
      <h1 className="hidden text-3xl font-bold text-gray-950 md:block">기업/기관 정보</h1>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-gray-950">기본 정보</h2>

        <CompanyProfileField label="기업 · 기관 로고" htmlFor="company-logo">
          <LogoUploadField
            id="company-logo"
            url={basic.logoUrl}
            disabled={!loaded}
            className="h-20 w-20"
            onUploaded={(image) => setBasic((previous) => ({ ...previous, ...logoOf(image) }))}
            onClear={() => setBasic((previous) => ({ ...previous, logoImageId: '', logoUrl: '' }))}
          />
        </CompanyProfileField>

        <CompanyProfileField label="기업 · 기관명" htmlFor="company-organization-name">
          <Input
            id="company-organization-name"
            value={basic.organizationName}
            maxLength={150}
            onChange={(event) =>
              setBasic((previous) => ({ ...previous, organizationName: event.target.value }))
            }
          />
        </CompanyProfileField>

        <Button
          variant="secondary"
          disabled={!loaded || saving}
          onClick={() => void submitBasic()}
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
            value={manager.managerName}
            maxLength={100}
            onChange={(event) =>
              setManager((previous) => ({ ...previous, managerName: event.target.value }))
            }
            className="max-w-70"
          />
        </CompanyProfileField>

        <CompanyProfileField label="연락처" htmlFor="company-manager-phone">
          <Input
            id="company-manager-phone"
            type="tel"
            inputMode="tel"
            value={manager.managerPhone}
            maxLength={20}
            placeholder="010-0000-0000"
            onChange={(event) =>
              setManager((previous) => ({ ...previous, managerPhone: event.target.value }))
            }
            className="max-w-70"
          />
        </CompanyProfileField>

        <CompanyProfileField label="가입한 이메일" htmlFor="company-email">
          <Input id="company-email" value={email} readOnly disabled />
        </CompanyProfileField>

        <CompanyProfileField
          label="오늘의 공고 정보 수신용 이메일"
          htmlFor="company-notification-email"
          note="* 공고 관련 알림을 받아볼 담당자 이메일 주소를 입력해주세요."
        >
          <Input
            id="company-notification-email"
            type="email"
            value={notificationEmailValue}
            maxLength={320}
            disabled={!loaded || sameAsEmail}
            placeholder="이메일 주소를 입력해 주세요."
            onChange={(event) =>
              setManager((previous) => ({ ...previous, notificationEmail: event.target.value }))
            }
          />
          <Checkbox
            checked={sameAsEmail}
            disabled={!loaded || !email}
            onChange={setSameAsEmail}
            label="가입한 이메일과 동일"
          />
        </CompanyProfileField>

        <Button
          variant="secondary"
          disabled={!loaded || saving}
          onClick={() => void submitManager()}
          className="w-full border-blue-500 text-blue-500"
        >
          담당자 정보 수정하기
        </Button>
        <SaveMessage status={status?.section === 'manager' ? status : null} />
      </section>

      <hr className="border-gray-200" />

      {/* 비밀번호가 없는 계정에는 그리지 않는다. 계정을 읽기 전에도 그리지 않는다. */}
      {values?.passwordChangeable ? <PasswordSection /> : null}
      <MarketingSection />
      <div className="flex justify-center">
        <SignOutButton redirectTo="/" />
      </div>
      <WithdrawAction />
    </div>
  );
}

/** 올린 이미지를 기본 정보 폼 값의 로고 두 칸으로. */
function logoOf(image: { id: string; url: string }) {
  return { logoImageId: image.id, logoUrl: image.url };
}
