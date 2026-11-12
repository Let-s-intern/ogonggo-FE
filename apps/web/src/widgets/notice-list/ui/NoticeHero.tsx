/**
 * 공지사항 위쪽 — `오공고 공지사항` 알약, 제목, 검색 상자(공지사항 시안). 검색은 폼 GET 이라 자바스크립트 없이도
 * `/notices?keyword=` 로 간다. 첫 화면과 목록 화면이 같이 쓴다.
 *
 * 시안의 제목 자리(`공고가 올라오는 ~~`)는 문구가 정해지지 않은 자리표시라 지금 문구를 넣었다.
 */
export function NoticeHero({ keyword }: { keyword?: string }) {
  return (
    <section className="flex w-full flex-col items-center gap-5 pt-6 text-center md:gap-6 md:pt-10">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-500">
        <span aria-hidden="true" className="icon-[lucide--search] block h-3.5 w-3.5" />
        오공고 공지사항
      </span>
      <h1 className="text-2xl font-bold break-keep text-gray-900 md:text-4xl">
        오공고의 새 소식을 가장 먼저 알려드려요
      </h1>
      <form action="/notices" method="get" role="search" className="w-full max-w-[800px]">
        <label className="flex h-14 items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-5 focus-within:border-blue-300">
          <span
            aria-hidden="true"
            className="icon-[lucide--search] block h-5 w-5 shrink-0 text-gray-500"
          />
          <span className="sr-only">공지사항 검색</span>
          <input
            type="search"
            name="keyword"
            defaultValue={keyword}
            maxLength={100}
            placeholder="게시글 제목, 내용 및 공고명"
            className="min-w-0 flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </label>
      </form>
    </section>
  );
}
