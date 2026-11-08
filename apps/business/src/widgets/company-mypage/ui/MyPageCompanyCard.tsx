import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { LetsCareerMark } from '@/shared/ui/LetsCareerMark';

export interface MyPageCompanyCardProps {
  /** 계정을 아직 못 읽었으면 `undefined`. 회색 막대로 자리만 잡는다. */
  organizationName?: string;
  managerName?: string;
  logoUrl?: string;
  /** `기업 정보 수정` 버튼이 가는 곳. */
  editHref: string;
}

/**
 * 기업 회원 사이드바 첫 조각(B2 시안, `prd-company-mypage-posts.md`). 일반 회원 카드
 * (`MyPageProfileCard`)와 달리 기업이 주인공이다 — 로고와 기업명을 크게, 담당자를 그 아래 작게 둔다.
 * v5 카드는 담당자 이름이 크고 기업명이 라벨 한 줄이었다.
 *
 * 로고는 `companyProfile.logoUrl` 이다. 없으면 일반 회원 카드처럼 렛츠커리어 마크를 둔다.
 */
export function MyPageCompanyCard({
  organizationName,
  managerName,
  logoUrl,
  editHref,
}: MyPageCompanyCardProps) {
  return (
    <div className="rounded-md border border-gray-200 p-5">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-gray-100 bg-blue-50">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-full w-full bg-white object-contain" />
        ) : (
          <LetsCareerMark flat className="h-8 w-8 text-blue-200" />
        )}
      </div>

      {organizationName ? (
        <>
          <p className="mt-3.5 truncate text-lg font-bold text-gray-900">{organizationName}</p>
          <p className="mt-1 truncate text-sm text-gray-500">
            {managerName ? `담당자 ${managerName} 님` : '담당자 -'}
          </p>
        </>
      ) : (
        <div aria-hidden="true" className="mt-3.5 flex flex-col gap-2">
          <span className="h-5 w-32 rounded-xs bg-gray-100" />
          <span className="h-4 w-24 rounded-xs bg-gray-100" />
        </div>
      )}

      <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
        <Link href={editHref}>기업 정보 수정</Link>
      </Button>
    </div>
  );
}
