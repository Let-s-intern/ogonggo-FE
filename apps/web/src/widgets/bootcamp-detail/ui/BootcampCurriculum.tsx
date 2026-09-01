import type { BootcampDetail } from '@/entities/bootcamp/model/types';

export interface BootcampCurriculumProps {
  curriculums: BootcampDetail['curriculums'];
}

/** `1-4주` / 한 주짜리는 `5주`. 목업의 주차 라벨 표기 그대로다. */
function formatWeekRange(startWeek: number, endWeek: number): string {
  return startWeek === endWeek ? `${startWeek}주` : `${startWeek}-${endWeek}주`;
}

/**
 * `교육부트캠프 상세페이지.png`의 `커리큘럼` — 왼쪽 세로선에 점이 찍히고 주차 라벨(파랑)과
 * 소제목이 한 줄로 붙는 타임라인이다. 순서는 `displayOrder`다(응답 배열 순서가 아니다).
 *
 * 값이 없으면 이 섹션을 통째로 그리지 않는다 — 제목만 남은 빈 섹션이 목업에 없다.
 * 픽스처에서는 24번이 그 경우다(`BOOTCAMP_SCENARIO_IDS.emptyDetailSections`).
 */
export function BootcampCurriculum({ curriculums }: BootcampCurriculumProps) {
  if (curriculums.length === 0) {
    return null;
  }

  const ordered = [...curriculums].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900">커리큘럼</h2>
      <ol className="mt-4 flex flex-col gap-4 border-l border-gray-200 pl-6">
        {ordered.map((curriculum) => (
          <li key={curriculum.displayOrder} className="relative flex gap-4 text-sm">
            <span
              className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-blue-600"
              aria-hidden="true"
            />
            <span className="w-16 shrink-0 font-bold text-blue-600">
              {formatWeekRange(curriculum.startWeek, curriculum.endWeek)}
            </span>
            <span className="text-gray-700">{curriculum.subtitle}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
