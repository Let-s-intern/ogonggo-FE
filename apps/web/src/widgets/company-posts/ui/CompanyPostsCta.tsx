import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { companyPostNewHref } from '../lib/routes';
import type { CompanyPostTab } from '../lib/query';

/**
 * 표 아래 CTA 배너(목업 `docs/asset/v5 기업회원 마이페이지/작성한 공고.png` 하단).
 *
 * 문구는 목업 그대로다 — 이 배너에는 v4 잔재가 없다. 버튼이 가는 곳만 지금 보고 있는 탭을
 * 따른다. 채용공고 탭에서 누른 사람에게 부트캠프 폼을 열어 줄 이유가 없다.
 */
export function CompanyPostsCta({ tab }: { tab: CompanyPostTab }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-blue-50 px-8 py-7">
      <div>
        <p className="text-lg font-bold text-gray-900">새로운 공고를 등록해 보세요.</p>
        <p className="pt-1 text-sm text-gray-500">기업 · 교육 공고는 무료로 등록할 수 있어요.</p>
      </div>
      <Button asChild>
        <Link href={companyPostNewHref(tab)}>공고 등록하기</Link>
      </Button>
    </div>
  );
}
