'use client';

import { useState } from 'react';
import { cn } from '@ogonggo/ui';
import { getCompanyLogoUrl } from '../model/company-logo';

export interface CompanyLogoProps {
  companyName: string;
  className?: string;
}

/**
 * `getCompanyLogoUrl`이 아는 회사면 실제 로고 이미지, 모르면(또는 로고 서비스가 그 도메인에
 * 이미지를 못 주면) 기존 회색 placeholder 박스 — 확신 없는 도메인을 지어내지 않는다
 * (`company-logo.ts` 참고). 로드 실패를 `useState`로 잡아 깨진 이미지 아이콘 대신 항상 같은
 * 회색 박스로 떨어지게 한다.
 */
export function CompanyLogo({ companyName, className }: CompanyLogoProps) {
  const logoUrl = getCompanyLogoUrl(companyName);
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return <div className={cn('shrink-0 rounded-m bg-gray-200', className)} aria-hidden="true" />;
  }
  return (
    <img
      src={logoUrl}
      alt={`${companyName} 로고`}
      className={cn('shrink-0 rounded-m bg-gray-100 object-contain', className)}
      onError={() => setFailed(true)}
    />
  );
}
