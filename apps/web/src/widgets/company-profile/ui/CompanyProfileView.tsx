import { Input } from '@ogonggo/ui';
import type { CompanyProfileValues } from '../model/values';
import { CompanyProfileField } from './CompanyProfileField';

export interface CompanyProfileViewProps {
  /** 계정을 아직 못 읽었으면 `undefined`. 칸은 그대로 두고 값만 빈다. */
  values?: CompanyProfileValues;
}

/**
 * 기업/기관 정보를 그린다(v5 PRD 5 절). **계정 응답을 모른다** — 읽는 쪽이
 * `toCompanyProfileValues` 로 뽑아 넘긴 값만 받는다.
 *
 * 세 칸 모두 읽기 전용이다. 기업 프로필 수정 API 가 없어서다
 * (`PUT /api/v1/users/me/profile` 은 개인 회원의 여덟 값만 받는다).
 */
export function CompanyProfileView({ values }: CompanyProfileViewProps) {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-bold text-gray-950">기업/기관 정보</h1>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-gray-950">기본 정보</h2>

        <CompanyProfileField label="기업 · 기관명" htmlFor="company-organization-name">
          <Input
            id="company-organization-name"
            value={values?.organizationName ?? ''}
            readOnly
            disabled
          />
        </CompanyProfileField>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-gray-950">담당자 정보</h2>

        <CompanyProfileField label="담당자 이름" htmlFor="company-manager-name">
          <Input id="company-manager-name" value={values?.managerName ?? ''} readOnly disabled />
        </CompanyProfileField>

        <CompanyProfileField label="가입한 이메일" htmlFor="company-email">
          <Input id="company-email" value={values?.email ?? ''} readOnly disabled />
        </CompanyProfileField>
      </section>
    </div>
  );
}
