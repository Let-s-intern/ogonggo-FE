import { letsCareerMentoringUrl } from '@/shared/api/letsCareerHandoff';

/**
 * 채용공고 상세 사이드바의 `멘토한테 마지막 검토받기`. 지원하기 전에 렛츠커리어 멘토링 목록을 새 탭으로
 * 연다. 반짝임 아이콘은 시안 이미지 그대로다(`public/job-detail/mentor-review-sparkle.png`, 40px 이라 20px 로 그린다).
 */
export function MentorReviewButton() {
  return (
    <a
      href={letsCareerMentoringUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#f4f5fc] text-sm text-gray-700 transition-colors hover:bg-[#eceefa]"
    >
      <img
        src="/job-detail/mentor-review-sparkle.png"
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 shrink-0"
      />
      멘토한테 마지막 검토받기
    </a>
  );
}
