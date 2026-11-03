import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { formatDraftSavedAt } from '@/shared/lib/companyPostDraft';
import { CONTINUE_DRAFT_QUERY } from '@/shared/lib/useCompanyPostDraft';
import { companyPostNewHref } from '../lib/routes';
import type { CompanyPostTab } from '../lib/query';

export interface CompanyPostDraftCardProps {
  tab: CompanyPostTab;
  /** 초안에 적힌 공고 제목. 비어 있을 수 있다. */
  title?: string;
  savedAt: string;
  onDiscard: () => void;
}

/**
 * 작성한 공고 목록 맨 위의 이어쓰기 카드. 새 공고의 임시저장은 이 브라우저에만 있어
 * (`shared/lib/companyPostDraft.ts`) 목록 응답에 나오지 않는다 — 여기서 따로 보여 주지 않으면 쓰다
 * 만 공고가 있다는 것을 폼을 다시 열기 전까지 알 수 없다.
 *
 * 링크에 `?draft=continue` 를 붙여 폼이 다시 묻지 않고 바로 불러오게 한다.
 */
export function CompanyPostDraftCard({
  tab,
  title,
  savedAt,
  onDiscard,
}: CompanyPostDraftCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-dashed border-blue-200 bg-blue-50/40 p-4 md:flex-row md:items-center md:justify-between md:px-6 md:py-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-blue-500">작성 중</p>
        <p className="truncate text-base font-bold text-gray-900">
          {title?.trim() || '제목 없는 공고'}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {formatDraftSavedAt(savedAt)} 이 브라우저에 임시저장
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-md px-4 whitespace-nowrap"
          onClick={onDiscard}
        >
          삭제하기
        </Button>
        <Button asChild size="sm" className="rounded-md px-4 whitespace-nowrap">
          <Link href={`${companyPostNewHref(tab)}?${CONTINUE_DRAFT_QUERY}`}>이어서 작성하기</Link>
        </Button>
      </div>
    </div>
  );
}
