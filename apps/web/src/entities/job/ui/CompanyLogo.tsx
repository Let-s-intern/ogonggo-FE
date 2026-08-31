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
 *
 * `object-cover`를 쓴다(`object-contain`이 아니라) — 소스가 정식 로고 API가 아니라 구글
 * 이미지 캐시 썸네일이라 로고 마크 자체가 이미지 안에서 한쪽으로 치우쳐 있는 경우가 많다.
 * `contain`은 그 비대칭 여백까지 그대로 보존해 로고가 박스 안에서 안 가운데로 보였다 —
 * `cover`는 항상 이미지의 중심을 박스 중심에 맞추고 넘치는 부분만 잘라내므로 실제로
 * 가운데 정렬된 것처럼 보인다(사용자 실측 지적으로 바꿈).
 */
export function CompanyLogo({ companyName, className }: CompanyLogoProps) {
  const logoUrl = getCompanyLogoUrl(companyName);
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return (
      <div
        className={cn('shrink-0 rounded-m bg-gray-200 shadow-sm', className)}
        aria-hidden="true"
      />
    );
  }
  return (
    <img
      src={logoUrl}
      alt={`${companyName} 로고`}
      className={cn('shrink-0 rounded-m bg-white object-cover shadow-sm', className)}
      onError={() => setFailed(true)}
    />
  );
}
