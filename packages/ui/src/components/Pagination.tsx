import { cn } from '../lib/cn';

export interface PaginationProps {
  /** 1부터 센다. 백엔드 `PageInfo.pageNum` 과 같은 기준이다. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

/** 현재 페이지 양옆으로 보여줄 번호 개수. 앞뒤 2개씩이면 최대 5개가 늘어선다. */
const SIBLING_COUNT = 2;

/**
 * 목록 아래 페이지 번호.
 *
 * 번호를 전부 늘어놓지 않는다. 공고가 수천 건이면 번호가 화면을 덮는다. 현재 페이지 주변만
 * 보이고 처음·끝은 항상 눌러 갈 수 있다.
 *
 * 링크가 아니라 버튼이다. 페이지 상태는 쓰는 쪽의 쿼리스트링에 있고, 이 패키지는 라우터를
 * 모른다 — `onChange` 를 받아 쓰는 쪽이 주소를 바꾼다.
 */
export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = visiblePages(page, totalPages);

  return (
    <nav
      className={cn('flex items-center justify-center gap-1 py-4', className)}
      aria-label="페이지"
    >
      <PageButton onClick={() => onChange(page - 1)} disabled={page <= 1}>
        이전
      </PageButton>

      {pages.map((entry, index) =>
        entry === null ? (
          // 생략 구간. 키에 index 를 쓰는 유일한 자리다 — 값이 없어 구분할 것이 없다.
          <span key={`gap-${index}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <PageButton
            key={entry}
            onClick={() => onChange(entry)}
            aria-current={entry === page ? 'page' : undefined}
            active={entry === page}
          >
            {entry}
          </PageButton>
        ),
      )}

      <PageButton onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
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

/** 보여줄 번호 목록. `null` 은 생략 표시 자리다. */
function visiblePages(page: number, totalPages: number): (number | null)[] {
  const first = 1;
  const last = totalPages;
  const from = Math.max(first, page - SIBLING_COUNT);
  const to = Math.min(last, page + SIBLING_COUNT);

  const middle = Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const result: (number | null)[] = [];

  if (from > first) {
    result.push(first);
    // 바로 옆이면 생략 표시 대신 그 번호를 그대로 보여준다. `1 … 2` 는 이상하다.
    if (from > first + 1) {
      result.push(null);
    }
  }

  result.push(...middle);

  if (to < last) {
    if (to < last - 1) {
      result.push(null);
    }
    result.push(last);
  }

  return result;
}
