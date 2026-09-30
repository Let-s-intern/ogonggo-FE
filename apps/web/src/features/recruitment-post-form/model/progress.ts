import type { RecruitmentPostFormValues } from './values';

/**
 * 단계(1 기본 정보, 2 모집 내용, 3 지원 설정)마다 게시에 필요한 칸 중 채운 비율, 0~100.
 * 단계 머리 오른쪽 원형 진행률로 보인다(`FormSection`).
 *
 * 칸 목록은 `validateForPublish` 와 같다 — 셋 다 100% 인데 등록이 막히면 숫자를 믿을 수 없다.
 * 날짜 순서처럼 값끼리 맞춰 보는 검사는 칸을 채웠는지가 아니라 세지 않는다.
 */
export function stepPercents(values: RecruitmentPostFormValues): [number, number, number] {
  const percent = (filled: unknown[]) =>
    Math.round((filled.filter(Boolean).length / filled.length) * 100);
  return [
    percent([
      values.title.trim(),
      values.recruitmentType,
      values.capacity,
      values.progressMethod,
      values.activityDurationMonths,
    ]),
    percent([values.summary.trim(), values.contentText.trim()]),
    percent([
      values.recruitmentStartDate,
      values.recruitmentEndDate,
      values.positions.length > 0,
      values.contactMethod,
      values.contactValue.trim(),
      values.agreedToPolicy,
    ]),
  ];
}
