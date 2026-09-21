import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { LetsCareerMark } from '@/shared/ui/LetsCareerMark';

/** 이름 아래 한 줄. 일반 회원은 희망직무·희망기업 두 줄, 기업 회원(v5)은 기업/기관 명 한 줄이다. */
export interface MyPageProfileDetail {
  label: string;
  value?: string;
}

export interface MyPageProfileCardProps {
  /** 계정을 아직 못 읽었으면 `undefined`. 회색 막대로 자리만 잡는다. */
  name?: string;
  profileImageUrl?: string;
  details: readonly MyPageProfileDetail[];
  /** `프로필 수정` 버튼이 가는 곳. */
  editHref: string;
}

/**
 * 사이드바 첫 조각(PRD 1 절). 목업 실측값 — 카드 254x222, 테두리 `gray-200`, 안쪽 여백 16px,
 * 아바타 48px 원에 렛츠커리어 마크, 이름 16px `gray-900`, 라벨 14px `gray-500`, 값 `blue-500`.
 *
 * 희망직무·희망기업은 쉼표로 이은 한 문자열이라 카드 폭을 넘긴다. 목업도 줄임표로 자른다
 * — `truncate` 가 먹으려면 부모가 `min-w-0` 이어야 한다(`flex` 자식의 기본 최소 폭은 내용
 * 크기다).
 */
export function MyPageProfileCard({
  name,
  profileImageUrl,
  details,
  editHref,
}: MyPageProfileCardProps) {
  return (
    <div className="rounded-sm border border-gray-200 p-4">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-50">
        {profileImageUrl ? (
          <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <LetsCareerMark flat className="h-7 w-7 text-blue-200" />
        )}
      </div>

      {name ? (
        <p className="mt-3 text-base font-bold text-gray-900">{name} 님</p>
      ) : (
        <p className="mt-3 flex h-6 items-center" aria-hidden="true">
          <span className="h-4 w-24 rounded-xs bg-gray-100" />
        </p>
      )}

      <dl className="mt-1.5 flex flex-col gap-1.5">
        {details.map((detail) => (
          <div key={detail.label} className="flex min-w-0 gap-2 text-sm">
            <dt className="shrink-0 text-gray-500">{detail.label}</dt>
            {name ? (
              <dd className="truncate text-blue-500">{detail.value || '-'}</dd>
            ) : (
              <dd className="flex h-5 flex-1 items-center" aria-hidden="true">
                <span className="h-3 w-full rounded-xs bg-gray-100" />
              </dd>
            )}
          </div>
        ))}
      </dl>

      <Button asChild variant="secondary" size="sm" className="mt-5 w-full">
        <Link href={editHref}>프로필 수정</Link>
      </Button>
    </div>
  );
}
