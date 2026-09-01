import { OPERATION_TYPE_LABELS, TUITION_TYPE_LABELS } from '@/entities/bootcamp/model/labels';
import type { BootcampDetail } from '@/entities/bootcamp/model/types';

export interface BootcampInfoGridProps {
  bootcamp: BootcampDetail;
}

const NO_VALUE = '정보 없음';
const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * API 없음: 목업의 `기간: 12주 과정`에 대응하는 필드가 응답에 없다. `curriculums`의 최대
 * `endWeek`(= 마지막 주차)로 만들고, 커리큘럼이 비어 있으면 `programStartDate`~
 * `programEndDate`의 주 수로 계산한다 — **둘 다 계산해서 만든 값이지 응답에 있는 값이 아니다**
 * (PRD 4.2 표). 실제 API로 전환할 때 총 주차(또는 총 교육시간) 필드가 있으면 그것으로 바꾼다.
 *
 * 날짜로 계산하는 쪽은 올림이다 — 2026-09-09~2027-01-22(135일)는 20주로 나온다. 두 날짜가
 * 같은 날이어도 "0주 과정"이 되지 않게 최소 1주로 둔다.
 */
function formatDuration(bootcamp: BootcampDetail): string {
  const lastWeek = bootcamp.curriculums.reduce((max, curriculum) => Math.max(max, curriculum.endWeek), 0);
  if (lastWeek > 0) {
    return `${lastWeek}주 과정`;
  }

  const start = new Date(bootcamp.programStartDate).getTime();
  const end = new Date(bootcamp.programEndDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return NO_VALUE;
  }

  const weeks = Math.max(1, Math.ceil((end - start) / MILLISECONDS_PER_WEEK));
  return `${weeks}주 과정`;
}

/** `수강료` 칸 — 구분 라벨이 먼저, 금액이 있으면 뒤에 붙인다(픽스처 24건은 전부 금액이 없다). */
function formatTuition(bootcamp: BootcampDetail): string {
  const label = TUITION_TYPE_LABELS[bootcamp.tuitionType];
  if (bootcamp.tuitionAmount === undefined) {
    return label;
  }
  return `${label} ${bootcamp.tuitionAmount.toLocaleString('ko-KR')}원`;
}

/** `수료 후 파트너사` 칸 — `displayOrder` 순으로 이름만 나열한다(PRD 10절 1번 결정). */
function formatPartners(bootcamp: BootcampDetail): string {
  if (bootcamp.partners.length === 0) {
    return NO_VALUE;
  }
  return [...bootcamp.partners]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((partner) => partner.name)
    .join(', ');
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * `교육부트캠프 상세페이지.png`의 정보 그리드 6칸(2열 3행) — 프로그램 유형 / 진행 방식 / 기간 /
 * 모집 인원 / 수강료 / 수료 후 파트너사. 칸 모양·여백은 채용공고 상세의 `JobInfoGrid`(4칸)와
 * 같은 값이다 — 두 상세 화면의 같은 자리가 다르게 보일 이유가 없다.
 *
 * 값이 없는 선택 필드는 빈 칸으로 새지 않고 "정보 없음"이 들어간다(PRD 9절 2번).
 */
export function BootcampInfoGrid({ bootcamp }: BootcampInfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <InfoCell label="프로그램 유형" value={bootcamp.programType} />
      <InfoCell label="진행 방식" value={OPERATION_TYPE_LABELS[bootcamp.operationType]} />
      <InfoCell label="기간" value={formatDuration(bootcamp)} />
      <InfoCell
        label="모집 인원"
        value={bootcamp.capacity === undefined ? NO_VALUE : `${bootcamp.capacity}명`}
      />
      <InfoCell label="수강료" value={formatTuition(bootcamp)} />
      <InfoCell label="수료 후 파트너사" value={formatPartners(bootcamp)} />
    </div>
  );
}
