import { letsCareerMentoringUrl } from '@/shared/api/letsCareerHandoff';

/**
 * 채용공고 상세 사이드바의 `멘토한테 마지막 검토받기`. 지원하기 전에 렛츠커리어 멘토링 목록을 새 탭으로
 * 연다. 반짝임 아이콘은 몇 초마다 살짝 돌았다 돌아온다(`globals.css` 의 `ogonggo-sparkle`).
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
  // 시안의 반짝임 이미지와 같은 네 꼭짓점 별이다. 꼭짓점은 같은 색 테두리로 둥글린다.
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="ogonggo-sparkle h-5 w-5 shrink-0 text-gray-500"
    >
      <path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M12 2.5c.7 5.6 3.9 8.8 9.5 9.5-5.6.7-8.8 3.9-9.5 9.5-.7-5.6-3.9-8.8-9.5-9.5 5.6-.7 8.8-3.9 9.5-9.5Z"
      />
    </svg>
  );
}
