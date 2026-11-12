import { letsCareerMentoringUrl } from '@/shared/api/letsCareerHandoff';

/**
 * 채용공고 상세 사이드바의 `멘토한테 마지막 검토받기`. 지원하기 전에 렛츠커리어 멘토링 목록을 새 탭으로
 * 연다. 반짝임 아이콘은 큰 별과 작은 십자가 따로 움직인다(`globals.css` 의 `ogonggo-sparkle-*`).
 */
export function MentorReviewButton() {
  return (
    <a
      href={letsCareerMentoringUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#f4f5fc] text-sm text-gray-700 transition-colors hover:bg-[#eceefa]"
    >
      <SparkleIcon />
      멘토한테 마지막 검토받기
    </a>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gray-500">
      <path
        className="ogonggo-sparkle-star"
        fill="currentColor"
        d="M10 5.5c.5 4.6 2.4 7 8 8.5-5.6 1.5-7.5 3.9-8 8.5-.5-4.6-2.4-7-8-8.5 5.6-1.5 7.5-3.9 8-8.5Z"
      />
      <path
        className="ogonggo-sparkle-plus"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M19 2.5v5M16.5 5h5"
      />
    </svg>
  );
}
