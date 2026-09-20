import { cn } from '../lib/cn';
import { computePageBlock } from '../lib/pageBlock';

export interface PaginationProps {
  /** 1부터 센다. 백엔드 `PageInfo.pageNum` 과 같은 기준이다. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

/**
 * 목록 아래 페이지 번호.
 *
 * 번호를 전부 늘어놓지 않는다. 공고가 수천 건이면 번호가 화면을 덮는다. 10개씩 묶어
 * `1~10`, `11~20` 으로 보여주고 `이전`·`다음` 이 묶음 단위로 움직인다. 계산은
 * `lib/pageBlock.ts` 한 곳에 있고 `apps/web` 의 링크판 페이지네이션도 같은 함수를 쓴다 —
 * 예전에는 양쪽이 접는 칸 수를 따로 정해 두 앱의 페이징이 다르게 생겼다.
 *
 * 링크가 아니라 버튼이다. 페이지 상태는 쓰는 쪽의 쿼리스트링에 있고, 이 패키지는 라우터를
 * 모른다 — `onChange` 를 받아 쓰는 쪽이 주소를 바꾼다.
 */
export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const { pages, previousBlockPage, nextBlockPage } = computePageBlock(page, totalPages);

  return (
    <nav
      className={cn('flex items-center justify-center gap-1 py-4', className)}
      aria-label="페이지"
    >
      <PageButton
        onClick={() => previousBlockPage !== null && onChange(previousBlockPage)}
        disabled={previousBlockPage === null}
      >
        이전
      </PageButton>

      {pages.map((entry) => (
        <PageButton
          key={entry}
          onClick={() => onChange(entry)}
          aria-current={entry === page ? 'page' : undefined}
          active={entry === page}
        >
          {entry}
        </PageButton>
      ))}

      <PageButton
        onClick={() => nextBlockPage !== null && onChange(nextBlockPage)}
        disabled={nextBlockPage === null}
      >
        다음
      </PageButton>
    </nav>
  );
}

interface PageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function PageButton({ active = false, className, ...props }: PageButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'min-w-9 rounded-sm px-2 py-1.5 text-sm transition-colors',
        'disabled:cursor-not-allowed disabled:text-gray-300',
        active ? 'bg-blue-500 font-semibold text-white' : 'text-gray-700 enabled:hover:bg-gray-100',
        className,
      )}
      {...props}
    />
  );
}
