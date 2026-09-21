import { parseLocalDate } from '@/shared/lib/localDate';
import type { RecruitmentType } from '@/shared/lib/dday';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 시각이 붙지 않은 `YYYY-MM-DD`. 사이드·스터디의 `recruitmentEndDate` 가 이 모양이다. */
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 표의 마감일 칸 문구. 목업(`지원 신청내역/사이드 스터디.png`) 은 `2026.00.00(토) 23:59` 다.
 *
 * **시각이 없는 값에는 시각을 그리지 않는다.** 모집글의 마감일은 날짜뿐이라 목업의 `23:59` 을
 * 그대로 붙이면 백엔드가 주지 않은 값을 화면이 지어내는 것이 된다. 채용공고·부트캠프의
 * `recruitmentEndAt` 은 시각이 있어 목업 그대로 나온다.
 *
 * 상세 헤더의 같은 문구(`widgets/job-detail/ui/JobDetailHeaderCard.tsx`) 와 형식이 다르다 —
 * 그쪽은 `7/25(토) 23:59 마감` 이고 이쪽은 표 칸이라 연도까지 적고 `마감` 을 붙이지 않는다.
 * 그 자리는 옆의 배지가 말한다.
 */
export function formatDeadline(
  recruitmentType: RecruitmentType,
  recruitmentEndAt?: string,
): string {
  if (recruitmentType === 'ALWAYS_OPEN') {
    return '상시 모집';
  }
  if (!recruitmentEndAt) {
    return '마감일 미정';
  }

  const end = parseLocalDate(recruitmentEndAt);
  const year = end.getFullYear();
  const month = String(end.getMonth() + 1).padStart(2, '0');
  const day = String(end.getDate()).padStart(2, '0');
  const weekday = WEEKDAY_LABELS[end.getDay()];
  const date = `${year}.${month}.${day}(${weekday})`;

  if (DATE_ONLY_PATTERN.test(recruitmentEndAt)) {
    return date;
  }

  const hours = String(end.getHours()).padStart(2, '0');
  const minutes = String(end.getMinutes()).padStart(2, '0');
  return `${date} ${hours}:${minutes}`;
}
