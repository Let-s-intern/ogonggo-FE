import { SearchIcon } from '@/shared/ui/icons';

export interface NoticeSearchFormProps {
  /** 제출할 주소. 검색어는 `keyword` 쿼리로 붙는다. */
  action: string;
  defaultValue?: string;
}

/**
 * 공지 검색 상자. 자바스크립트 없는 `<form method="GET">` 이라 서버가 `?keyword=` 를 받아 다시 그린다.
 *
 * 시안 placeholder 는 `게시글 제목, 내용 및 공고명` 이지만 공고명을 검색할 새로운 공고 노트가 이번 범위에서 빠져
 * 제목·내용만 적는다(`.claude/tasks/memos/결정-광고시스템-web-공지사항-2026-11-03.md`).
 */
export function NoticeSearchForm({ action, defaultValue }: NoticeSearchFormProps) {
  return (
    <form action={action} method="GET" role="search" className="w-full">
      <label className="flex h-14 w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 focus-within:border-gray-300">
        <SearchIcon aria-hidden="true" className="h-6 w-6 shrink-0 text-gray-500" />
        <span className="sr-only">공지사항 검색</span>
        <input
          type="search"
          name="keyword"
          defaultValue={defaultValue}
          placeholder="게시글 제목, 내용"
          className="min-w-0 flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
        />
      </label>
    </form>
  );
}
