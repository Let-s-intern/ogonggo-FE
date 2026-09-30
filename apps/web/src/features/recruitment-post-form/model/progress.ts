import type { RecruitmentPostFormValues } from './values';

/**
 * 게시에 필요한 칸(`validateForPublish`) 중 채운 비율, 0~100. 폼 위에 `N% 완료` 로 보인다.
 * 칸 목록은 그 검사와 같다 — 100% 인데 등록이 막히면 숫자를 믿을 수 없다. 날짜 순서처럼 값끼리
 * 맞춰 보는 검사는 칸을 채웠는지가 아니라 세지 않는다.
 */
export function completionPercent(values: RecruitmentPostFormValues): number {
  const filled = [
    values.title.trim(),
    values.recruitmentType,
    values.capacity,
    values.progressMethod,
    values.activityDurationMonths,
    values.summary.trim(),
    values.contentText.trim(),
    values.recruitmentStartDate,
    values.recruitmentEndDate,
    values.positions.length > 0,
    values.contactMethod,
    values.contactValue.trim(),
    values.agreedToPolicy,
  ];
  return Math.round((filled.filter(Boolean).length / filled.length) * 100);
}
